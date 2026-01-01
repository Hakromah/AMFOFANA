/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
   Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
   Search, UserPlus, MoreVertical, UserCog, Trash2, ShieldCheck,
   User, Mail, Fingerprint, Calendar as CalendarIcon, MapPin,
   Phone, Globe, Info, Loader2, Edit, FileUp, Download,
   AlertCircle, Home, LayoutDashboard, PieChart, Activity
} from 'lucide-react';
import {
   DropdownMenu, DropdownMenuContent, DropdownMenuItem,
   DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';
import api from '@/lib/api';
import { toast } from 'sonner';
import Papa from 'papaparse';

// External Components
import EditUserForm from '@/components/forms/EditUserForm';
import DeleteUserAlert from '@/components/forms/DeleteUserAlert';

const userFormSchema = z.object({
   name: z.string().min(1, 'Name is required'),
   email: z.string().email('Invalid email'),
   password: z.string().min(6, 'Min 6 characters'),
   role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
   birthDate: z.string().optional(),
   birthCountry: z.string().optional(),
   birthCity: z.string().optional(),
   address: z.string().optional(),
   gender: z.string().optional(),
   phoneNumber: z.string().optional(),
});

export default function UserManagement() {
   const [users, setUsers] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState('');
   const [roleFilter, setRoleFilter] = useState('ALL');

   // Dialog States
   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [isImportOpen, setIsImportOpen] = useState(false);
   const [importing, setImporting] = useState(false);
   const [selectedUser, setSelectedUser] = useState<any>(null);

   // Inspector States
   const [selectedStudentId, setSelectedStudentId] = useState<string>('');
   const [studentClasses, setStudentClasses] = useState<any[]>([]);
   const [isLoadingClasses, setIsLoadingClasses] = useState(false);

   const [csvPreview, setCsvPreview] = useState<any[]>([]);
   const [importSummary, setImportSummary] = useState<{ imported: number, skipped: number } | null>(null);

   const form = useForm<z.infer<typeof userFormSchema>>({
      resolver: zodResolver(userFormSchema),
      defaultValues: {
         role: 'STUDENT', name: '', email: '', password: '',
         birthDate: '', birthCountry: '', birthCity: '', address: '', gender: '', phoneNumber: ''
      },
   });

   // --- DATA CALCULATIONS (The "Command Center" Logic) ---
   const statsData = useMemo(() => {
      const counts = { STUDENT: 0, TEACHER: 0, ADMIN: 0 };
      users.forEach(u => { if (counts[u.role as keyof typeof counts] !== undefined) counts[u.role as keyof typeof counts]++; });
      return [
         { name: 'Students', value: counts.STUDENT, color: '#10b981' },
         { name: 'Teachers', value: counts.TEACHER, color: '#3b82f6' },
         { name: 'Admins', value: counts.ADMIN, color: '#f59e0b' },
      ];
   }, [users]);

   const fetchUsers = async () => {
      setLoading(true);
      try {
         const response = await api.get('/admin/users');
         setUsers(response.data);
      } catch (error) {
         toast.error('Registry sync failed');
         console.log(error)

      } finally {
         setLoading(false);
      }
   };

   useEffect(() => { fetchUsers(); }, []);

   // --- HANDLERS ---
   const handleCreateSubmit = async (values: z.infer<typeof userFormSchema>) => {
      try {
         await api.post('/admin/users', values);
         toast.success('Identity generated and stored in ledger');
         setIsCreateOpen(false);
         form.reset();
         fetchUsers();
      } catch (error) { toast.error('Generation failed'); console.log(error) }
   };

   // 1. Logic for parsing and cleaning
   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      Papa.parse(file, {
         header: true,
         skipEmptyLines: true,
         transformHeader: (header) => header.replace(/^\ufeff/, "").trim(),
         complete: (results) => {
            // THE CLEANING LAYER
            const cleanedData = results.data.map((row: any) => {
               // --- 1. Date Transformation (01/01/2000 -> 2000-01-01) ---
               let formattedDate = row.birthDate || row.birthdate; // Support both cases
               if (formattedDate && formattedDate.includes('/')) {
                  const parts = formattedDate.split('/');
                  if (parts.length === 3) {
                     // Reorder to YYYY-MM-DD
                     // Assumes MM/DD/YYYY. Switch parts[0] and parts[1] if CSV is DD/MM/YYYY
                     formattedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                  }
               }

               return {
                  ...row,
                  // Normalizes role to UPPERCASE for the Java Enum
                  role: row.role?.toUpperCase().trim(),
                  // Normalizes the date for Spring's LocalDate
                  birthDate: formattedDate && formattedDate !== "" ? formattedDate : null,
                  // Trims potential whitespace from emails/names
                  name: row.name?.trim(),
                  email: row.email?.trim(),
               };
            });

            setCsvPreview(cleanedData);
            setImportSummary(null);
         }
      });
   };

   // 2. Logic for sending to Spring Boot
   const processImport = async () => {
      if (csvPreview.length === 0) return;

      const tid = toast.loading("Processing registry injection...");
      setImporting(true);

      try {
         const response = await api.post('/admin/users/bulk', csvPreview);
         setImportSummary(response.data); // Receives {imported, skipped, totalProcessed}
         toast.success("Injection successful", { id: tid });
         fetchUsers();
      } catch (error: any) {
         console.error("Import Error Detail:", error.response?.data);
         const errorMsg = error.response?.data?.message || "Check CSV headers and date formats";
         toast.error(`Registry mismatch: ${errorMsg}`, { id: tid });
      } finally {
         setImporting(false);
      }
   };

   // const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
   //    const file = e.target.files?.[0];
   //    if (!file) return;

   //    Papa.parse(file, {
   //       header: true,
   //       skipEmptyLines: true,
   //       complete: (results) => {
   //          // Set preview so the Admin can verify before hitting the backend
   //          setCsvPreview(results.data);
   //          setImportSummary(null); // Clear previous reports
   //       }
   //    });
   // };

   // const processImport = async () => {
   //    if (csvPreview.length === 0) return;

   //    const tid = toast.loading("Processing registry injection...");
   //    setImporting(true);

   //    try {
   //       const response = await api.post('/admin/users/bulk', csvPreview);
   //       setImportSummary(response.data);
   //       toast.success("Injection successful", { id: tid });
   //       fetchUsers(); // Refresh the main table
   //    } catch (error) {
   //       toast.error("Registry mismatch: Check CSV headers", { id: tid });
   //       console.log(error)
   //    } finally {
   //       setImporting(false);
   //    }
   // };

   const downloadTemplate = () => {
      const csv = "name,email,password,role,birthDate,birthCountry,birthCity,address,gender,phoneNumber\nJohn Doe,john@amf.edu,pass123,STUDENT,2005-12-01,USA,New York,123 Broadway,Male,+123456";
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'amf_template.csv'; a.click();
   };

   const handleStudentSelect = async (studentId: string) => {
      setSelectedStudentId(studentId);
      if (!studentId) return;
      setIsLoadingClasses(true);
      try {
         const res = await api.get(`/admin/students/${studentId}/classes`);
         setStudentClasses(res.data);
      } catch (e) { toast.error('Retrieval failed'); console.log(e) }
      finally { setIsLoadingClasses(false); }
   };

   // const filteredUsers = users.filter(u => {
   //    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.userId.toLowerCase().includes(search.toLowerCase());
   //    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
   //    return matchesSearch && matchesRole;
   // });

   const filteredUsers = users.filter(u => {
      // Use optional chaining (?.) and provide a fallback empty string ('')
      // This prevents the crash if name or userId is missing from the database
      const name = u.name?.toLowerCase() || '';
      const id = u.userId?.toLowerCase() || '';
      const searchLower = search.toLowerCase();

      const matchesSearch = name.includes(searchLower) || id.includes(searchLower);

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesRole;
   });

   // --- ANIMATION VARIANTS ---
   const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
   const itemVars = { hidden: { y: 15, opacity: 0 }, show: { y: 0, opacity: 1 } };

   const getRoleBadge = (role: string) => {
      const styles: any = {
         ADMIN: "bg-amber-500 hover:bg-amber-600",
         TEACHER: "bg-blue-600 hover:bg-blue-700",
         STUDENT: "bg-emerald-500 hover:bg-emerald-600"
      };

      return (
         <Badge className={`${styles[role] || 'bg-slate-500'} border-none px-3 py-1 flex w-fit items-center gap-1 uppercase text-[10px] font-black tracking-widest text-white`}>
            {role === 'ADMIN' && <ShieldCheck size={10} />}
            {role === 'TEACHER' && <UserCog size={10} />}
            {role === 'STUDENT' && <User size={10} />}
            {role}
         </Badge>
      );
   };

   return (
      <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">

         {/* 1. TOP COMMAND HEADER */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 italic">
                  REGISTRY COMMAND <Activity className="text-blue-500 animate-pulse" size={24} />
               </h1>
               <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Identity & Access Management</p>
            </motion.div>
            <div className="flex gap-3">
               <Button onClick={() => setIsImportOpen(true)} variant="outline" className="rounded-2xl h-12 border-slate-200 hover:bg-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm">
                  <FileUp size={16} /> Bulk Import
               </Button>
               <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-12 px-6 font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95">
                  <UserPlus size={16} /> New Identity
               </Button>
            </div>
         </div>

         {/* 2. ANALYTICS ROW (The Design Upgrade) */}
         <div className="grid lg:grid-cols-3 gap-8">
            {/* User Distribution Chart */}
            <Card className="lg:col-span-1 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
               <CardHeader className="bg-slate-900 text-white py-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                     <PieChart size={14} className="text-blue-400" /> User Matrix
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="h-[180px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <RePie>
                           <Pie data={statsData} innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value" stroke="none">
                              {statsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                           </Pie>
                           <ReTooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                        </RePie>
                     </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                     {statsData.map(s => (
                        <div key={s.name} className="text-center p-2 rounded-2xl bg-slate-50 border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{s.name}</p>
                           <p className="text-lg font-black text-slate-800 leading-none mt-1">{s.value}</p>
                        </div>
                     ))}
                  </div>
               </CardContent>
            </Card>

            {/* Enrollment Inspector (Selective Lookup) */}
            <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-3xl overflow-hidden">
               <CardHeader className="bg-slate-900 text-white py-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                     <Search size={14} className="text-blue-400" /> Enrollment Inspector
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-6 h-full flex flex-col gap-6">
                  <Select onValueChange={handleStudentSelect}>
                     <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50 font-bold">
                        <SelectValue placeholder="Identify student record..." />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl shadow-2xl border-slate-100">
                        {users.filter(u => u.role === 'STUDENT').map(s => (
                           <SelectItem key={s.id} value={String(s.id)} className="rounded-lg font-medium">{s.name} ({s.userId})</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                  <div className="flex-1 overflow-y-auto">
                     <AnimatePresence mode="wait">
                        {isLoadingClasses ? (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase"><Loader2 className="animate-spin size-4" /> Fetching ledger...</motion.div>
                        ) : selectedStudentId && studentClasses.length > 0 ? (
                           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {studentClasses.map(c => (
                                 <div key={c.id} className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center">
                                    <div>
                                       <p className="text-xs font-black text-indigo-700 uppercase">{c.name}</p>
                                       <p className="text-[10px] text-indigo-500 font-bold">Lvl: {c.grade}</p>
                                    </div>
                                    <Badge className="bg-indigo-200 text-indigo-700 hover:bg-indigo-200 text-[9px] font-black px-2 uppercase">{c.teacher?.name || 'Tutor'}</Badge>
                                 </div>
                              ))}
                           </motion.div>
                        ) : selectedStudentId && (
                           <p className="text-slate-400 italic text-sm font-medium">No active class enrollments detected.</p>
                        )}
                     </AnimatePresence>
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* 3. SEARCH & ROLE FILTERS */}
         <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="border-none shadow-sm bg-white overflow-hidden p-4">
               <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                     <Input placeholder="Search registry by name, email, or fingerprint ID..." className="pl-12 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-600 font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                     {['ALL', 'ADMIN', 'TEACHER', 'STUDENT'].map((role) => (
                        <Button key={role} variant="ghost" size="sm" onClick={() => setRoleFilter(role)} className={`rounded-xl h-10 px-5 font-black uppercase text-[10px] tracking-widest transition-all ${roleFilter === role ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{role}</Button>
                     ))}
                  </div>
               </div>
            </Card>
         </motion.div>

         {/* 4. MAIN REGISTRY TABLE (Staggered Entrance) */}
         <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
            <Table>
               <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                     <TableHead className="w-12"></TableHead>
                     <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Identity Profile</TableHead>
                     <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Fingerprint ID</TableHead>
                     <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Access Tier</TableHead>
                     <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Gender</TableHead>
                     <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Actions</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  <AnimatePresence mode="popLayout">
                     {loading ? (
                        <TableRow key="loading">
                           <TableCell colSpan={6} className="text-center py-24 text-slate-400 font-black animate-pulse uppercase tracking-widest">
                              Synchronizing Encrypted Ledger...
                           </TableCell>
                        </TableRow>
                     ) : (
                        filteredUsers.map((user) => (
                           <motion.tr key={user.id} variants={itemVars} className="group hover:bg-slate-50/80 transition-colors border-slate-50">
                              <TableCell>
                                 <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><Fingerprint size={20} /></div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 tracking-tight">{user.name}</span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium"><Mail size={12} /> {user.email}</span>
                                 </div>
                              </TableCell>
                              <TableCell><code className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-600 uppercase tracking-tighter">{user.userId}</code></TableCell>
                              <TableCell>{getRoleBadge(user.role)}</TableCell>
                              <TableCell className="text-xs font-bold text-slate-500 uppercase">{user.gender || '—'}</TableCell>
                              <TableCell className="text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <Popover>
                                       <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50"><Info size={18} /></Button></PopoverTrigger>
                                       <PopoverContent className="w-80 rounded-3xl p-5 shadow-2xl border-slate-100">
                                          <div className="space-y-4">
                                             <div className="flex items-center justify-between border-b pb-2">
                                                <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Metadata</h4>
                                                <Badge variant="outline" className="text-[10px] font-mono">{user.userId}</Badge>
                                             </div>
                                             <div className="grid grid-cols-2 gap-4">
                                                <InfoBox icon={<CalendarIcon size={12} />} label="Birth Date" value={user.birthDate} />
                                                <InfoBox icon={<MapPin size={12} />} label="Birth City" value={user.birthCity} />
                                                <InfoBox icon={<Globe size={12} />} label="Country" value={user.birthCountry} />
                                                <InfoBox icon={<Phone size={12} />} label="Contact" value={user.phoneNumber} />
                                             </div>
                                             <div className="pt-3 border-t">
                                                <InfoBox icon={<Home size={12} />} label="Residential Address" value={user.address} />
                                             </div>
                                          </div>
                                       </PopoverContent>
                                    </Popover>
                                    <DropdownMenu>
                                       <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={18} /></Button></DropdownMenuTrigger>
                                       <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl">
                                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsEditOpen(true); }} className="rounded-xl flex gap-2 py-2 cursor-pointer focus:bg-blue-50">
                                             <Edit size={16} className="text-blue-500" /> Edit Credentials
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsDeleteOpen(true); }} className="rounded-xl flex gap-2 py-2 text-rose-600 font-black uppercase text-[10px] tracking-widest focus:bg-rose-50">
                                             <Trash2 size={16} /> Purge Identity
                                          </DropdownMenuItem>
                                       </DropdownMenuContent>
                                    </DropdownMenu>
                                 </div>
                              </TableCell>
                           </motion.tr>
                        ))
                     )}
                  </AnimatePresence>
               </TableBody>
            </Table>
         </Card>

         {/* 5. DIALOGS (Integrated User Registration Forms) */}

         {/* Create Identity */}
         <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
               <DialogHeader className="p-6 bg-blue-600 text-white">
                  <DialogTitle className="text-xl font-black tracking-tighter uppercase">Initialize New Identity</DialogTitle>
               </DialogHeader>
               <div className="p-8">
                  <Form {...form}>
                     <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                           <FormField control={form.control} name="name" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Legal Name</FormLabel><FormControl><Input placeholder="Full Name" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                           <FormField control={form.control} name="email" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Institutional Email</FormLabel><FormControl><Input placeholder="email@amf.edu" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                        </div>
                        <div className="grid grid-cols-2 gap-6 border-t pt-6">
                           <FormField control={form.control} name="password" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Access Key</FormLabel><FormControl><Input type="password" placeholder="••••••••" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                           <FormField control={form.control} name="role" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Permission Tier</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-none h-11"><SelectValue placeholder="Role" /></SelectTrigger></FormControl>
                                    <SelectContent className="rounded-xl shadow-xl"><SelectItem value="STUDENT">Student</SelectItem><SelectItem value="TEACHER">Teacher</SelectItem><SelectItem value="ADMIN">Admin</SelectItem></SelectContent>
                                 </Select>
                              </FormItem>
                           )} />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <FormField control={form.control} name="birthDate" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Date of Birth</FormLabel><FormControl><Input type="date" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl></FormItem>
                           )} />
                           <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Contact Number</FormLabel><FormControl><Input placeholder="+..." className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl></FormItem>
                           )} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                           <FormField control={form.control} name="birthCountry" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Country</FormLabel><FormControl><Input placeholder="Country" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl></FormItem>
                           )} />
                           <FormField control={form.control} name="birthCity" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">City</FormLabel><FormControl><Input placeholder="City" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl></FormItem>
                           )} />
                           <FormField control={form.control} name="gender" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Gender</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-none h-11"><SelectValue placeholder="Gender" /></SelectTrigger></FormControl>
                                    <SelectContent className="rounded-xl shadow-xl"><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                                 </Select>
                              </FormItem>
                           )} />
                        </div>
                        <FormField control={form.control} name="address" render={({ field }) => (
                           <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Address</FormLabel><FormControl><Input placeholder="Full Residential Address" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl></FormItem>
                        )} />
                        <Button type="submit" className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black font-black tracking-[0.3em] text-[10px] uppercase shadow-lg transition-all active:scale-[0.98] mt-4">Authorize Storage</Button>
                     </form>
                  </Form>
               </div>
            </DialogContent>
         </Dialog>

         {/* Bulk Import */}
         <Dialog open={isImportOpen} onOpenChange={(open) => {
            setIsImportOpen(open);
            if (!open) { setCsvPreview([]); setImportSummary(null); }
         }}>
            <DialogContent className="max-w-2xl rounded-3xl border-none p-0 shadow-2xl overflow-hidden bg-white">
               <DialogHeader className="p-6 bg-slate-900 text-white">
                  <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                     <FileUp className="text-blue-400" /> Registry Bulk Injection
                  </DialogTitle>
               </DialogHeader>

               <div className="p-8 space-y-6">
                  <AnimatePresence mode="wait">
                     {!csvPreview.length && !importSummary ? (
                        /* PHASE 1: FILE SELECTION */
                        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                           <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                              <AlertCircle className="text-amber-600 shrink-0" size={20} />
                              <div className="space-y-1">
                                 <p className="text-[10px] text-amber-800 leading-relaxed font-black uppercase tracking-widest">Format Requirement</p>
                                 <p className="text-[11px] text-amber-700 font-medium">Dates must be YYYY-MM-DD or MM/DD/YYYY. Roles must be STUDENT, TEACHER, or ADMIN.</p>
                              </div>
                           </div>

                           <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-12 hover:border-blue-400 transition-all bg-slate-50/50 relative group overflow-hidden">
                              <Input
                                 type="file"
                                 accept=".csv"
                                 className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                                 onChange={handleFileUpload}
                              />
                              <div className="w-20 h-20 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                 <Download className="text-blue-600" size={32} />
                              </div>
                              <p className="font-black text-slate-700 uppercase text-xs tracking-widest">Select CSV Registry</p>
                           </div>
                        </motion.div>

                     ) : csvPreview.length > 0 && !importSummary ? (
                        /* PHASE 2: DATA PREVIEW */
                        <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                           <div className="flex justify-between items-center">
                              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Scanner: {csvPreview.length} Records Detected</h3>
                              <Button variant="ghost" size="sm" onClick={() => setCsvPreview([])} className="text-rose-500 font-black text-[10px] uppercase h-7 px-2">Clear</Button>
                           </div>
                           <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50">
                              <Table>
                                 <TableHeader className="sticky top-0 bg-white shadow-sm">
                                    <TableRow className="text-[9px] uppercase font-black tracking-widest border-none">
                                       <TableHead>Profile</TableHead>
                                       <TableHead>Registry Email</TableHead>
                                       <TableHead>Tier</TableHead>
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {csvPreview.slice(0, 5).map((row, i) => (
                                       <TableRow key={i} className="text-[11px] font-bold text-slate-600 border-slate-100">
                                          <TableCell>{row.name}</TableCell>
                                          <TableCell className="lowercase text-slate-400">{row.email}</TableCell>
                                          <TableCell><Badge className="bg-slate-200 text-slate-700 text-[9px] font-black border-none">{row.role}</Badge></TableCell>
                                       </TableRow>
                                    ))}
                                 </TableBody>
                              </Table>
                              {csvPreview.length > 5 && (
                                 <div className="p-4 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] bg-white border-t border-slate-100">
                                    + {csvPreview.length - 5} additional identities in buffer
                                 </div>
                              )}
                           </div>
                           <Button onClick={processImport} disabled={importing} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95">
                              {importing ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" size={18} />}
                              Authorize Registry Injection
                           </Button>
                        </motion.div>

                     ) : (
                        /* PHASE 3: SUMMARY REPORT */
                        <motion.div key="report" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-6">
                           <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner shadow-emerald-200">
                              <ShieldCheck size={48} />
                           </div>
                           <div>
                              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Injection Success</h2>
                              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Registry ledger has been updated</p>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100">
                                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Injected</p>
                                 <p className="text-3xl font-black text-emerald-700 leading-none">{importSummary?.imported}</p>
                              </div>
                              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Skipped</p>
                                 <p className="text-3xl font-black text-slate-600 leading-none">{importSummary?.skipped}</p>
                              </div>
                           </div>
                           <Button onClick={() => setIsImportOpen(false)} className="w-full h-14 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl">Return to Command Center</Button>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  {!importSummary && (
                     <div className="pt-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={downloadTemplate} className="w-full text-blue-600 hover:bg-blue-50 font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl gap-2 transition-colors">
                           <Download size={16} /> Download CSV Sample
                        </Button>
                     </div>
                  )}
               </div>
            </DialogContent>
         </Dialog>


         {/* <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent className="max-w-md rounded-3xl border-none p-0 shadow-2xl overflow-hidden">
               <DialogHeader className="p-6 bg-slate-900 text-white">
                  <DialogTitle className="text-xl font-black uppercase tracking-tighter">Bulk Identity Upload</DialogTitle>
               </DialogHeader>
               <div className="p-8 space-y-6 text-center">
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-left">
                     <AlertCircle className="text-amber-600 shrink-0" size={20} />
                     <p className="text-[10px] text-amber-800 leading-relaxed font-bold uppercase">Schema check: headers must include name, email, password, and role.</p>
                  </div>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-10 hover:border-blue-400 transition-colors bg-slate-50/50 relative group">
                     <Input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={importing} />
                     <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        {importing ? <Loader2 className="animate-spin text-blue-600" /> : <FileUp className="text-blue-600" size={32} />}
                     </div>
                     <p className="font-black text-slate-700 uppercase text-[10px] tracking-widest">Drop CSV Registry</p>
                  </div>
                  <Button variant="ghost" onClick={downloadTemplate} className="w-full text-blue-600 hover:bg-blue-50 font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl">
                     <Download size={16} /> Download Template
                  </Button>
               </div>
            </DialogContent>
         </Dialog> */}

         {/* Edit & Delete Wrappers */}
         {
            selectedUser && (
               <>
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                     <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
                        <DialogHeader className="p-6 bg-amber-500 text-white"><DialogTitle className="text-xl font-black uppercase">Edit Identity: {selectedUser.name}</DialogTitle></DialogHeader>
                        <div className="p-6"><EditUserForm user={selectedUser} onFinished={async () => { setIsEditOpen(false); await fetchUsers(); }} /></div>
                     </DialogContent>
                  </Dialog>
                  <DeleteUserAlert userId={selectedUser.id} open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onFinished={async () => { setIsDeleteOpen(false); await fetchUsers(); }} />
               </>
            )
         }
      </div >
   );
}

function InfoBox({ icon, label, value }: any) {
   return (
      <div>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1 mb-0.5">{icon} {label}</p>
         <p className="text-[11px] font-black text-slate-700 truncate uppercase tracking-tight">{value || 'UNSET'}</p>
      </div>
   );
}


//==============================================================================
// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   Table, TableBody, TableCell, TableHead, TableHeader, TableRow
// } from '@/components/ui/table';
// import {
//   Card, CardContent, CardHeader, CardTitle
// } from '@/components/ui/card';
// import {
//   Search, UserPlus, Filter, MoreVertical, UserCog, Trash2,
//   ShieldCheck, User, Mail, Fingerprint, Calendar as CalendarIcon,
//   MapPin, Phone, Globe, Info, Loader2, Edit, FileUp, Download, AlertCircle
// } from 'lucide-react';
// import {
//   DropdownMenu, DropdownMenuContent, DropdownMenuItem,
//   DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
// } from '@/components/ui/dropdown-menu';
// import {
//   Dialog, DialogContent, DialogHeader, DialogTitle
// } from '@/components/ui/dialog';
// import {
//   Select, SelectContent, SelectItem, SelectTrigger, SelectValue
// } from '@/components/ui/select';
// import {
//   Form, FormControl, FormField, FormItem, FormLabel, FormMessage
// } from '@/components/ui/form';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { motion, AnimatePresence } from 'framer-motion';
// import api from '@/lib/api';
// import { toast } from 'sonner';
// import Papa from 'papaparse';

// // External Components (Ensure these exist in your components/forms folder)
// import EditUserForm from '@/components/forms/EditUserForm';
// import DeleteUserAlert from '@/components/forms/DeleteUserAlert';

// const createFormSchema = z.object({
//   name: z.string().min(1, 'Name is required'),
//   email: z.string().email('Invalid email'),
//   password: z.string().min(6, 'Min 6 characters'),
//   role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
//   birthDate: z.string().optional(),
//   birthCountry: z.string().optional(),
//   birthCity: z.string().optional(),
//   address: z.string().optional(),
//   gender: z.string().optional(),
//   phoneNumber: z.string().optional(),
// });

// export default function UserManagement() {
//   const [users, setUsers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState('');
//   const [roleFilter, setRoleFilter] = useState('ALL');

//   // Dialog States
//   const [isCreateOpen, setIsCreateOpen] = useState(false);
//   const [isEditOpen, setIsEditOpen] = useState(false);
//   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
//   const [isImportOpen, setIsImportOpen] = useState(false);
//   const [importing, setImporting] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<any>(null);

//   // Student Lookup States
//   const [selectedStudentId, setSelectedStudentId] = useState<string>('');
//   const [studentClasses, setStudentClasses] = useState<any[]>([]);
//   const [isLoadingClasses, setIsLoadingClasses] = useState(false);

//   const form = useForm<z.infer<typeof createFormSchema>>({
//     resolver: zodResolver(createFormSchema),
//     defaultValues: { role: 'STUDENT', name: '', email: '', password: '' },
//   });

//   const fetchUsers = async () => {
//     setLoading(true);
//     try {
//       const response = await api.get('/admin/users');
//       setUsers(response.data);
//     } catch (error) {
//       toast.error('Registry sync failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchUsers(); }, []);

//   // --- ACTIONS ---
//   const handleCreateSubmit = async (values: z.infer<typeof createFormSchema>) => {
//     try {
//       await api.post('/admin/users', values);
//       toast.success('New user initialized');
//       setIsCreateOpen(false);
//       form.reset();
//       fetchUsers();
//     } catch (error) {
//       toast.error('Creation failed');
//       console.log(error)
//     }
//   };

//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setImporting(true);
//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       complete: async (results) => {
//         try {
//           await api.post('/admin/users/bulk', results.data);
//           toast.success(`Imported ${results.data.length} records successfully`);
//           setIsImportOpen(false);
//           fetchUsers();
//         } catch (error) {
//           toast.error('Bulk import failed. Please check CSV formatting.');
//           console.log(error)
//         } finally {
//           setImporting(false);
//         }
//       }
//     });
//   };

//   const downloadTemplate = () => {
//     const csvContent = "name,email,password,role,gender,phoneNumber\nJohn Doe,john@amf.com,password123,STUDENT,Male,+123456789";
//     const blob = new Blob([csvContent], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'amf_user_template.csv';
//     a.click();
//   };

//   const handleStudentSelect = async (studentId: string) => {
//     setSelectedStudentId(studentId);
//     if (!studentId) return;
//     setIsLoadingClasses(true);
//     try {
//       const res = await api.get(`/admin/students/${studentId}/classes`);
//       setStudentClasses(res.data);
//     } catch (e) {
//       toast.error('Could not fetch classes');
//       console.log(e)
//     } finally {
//       setIsLoadingClasses(false);
//     }
//   };

//   const filteredUsers = users.filter(u => {
//     const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.userId.toLowerCase().includes(search.toLowerCase());
//     const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
//     return matchesSearch && matchesRole;
//   });

//   const getRoleBadge = (role: string) => {
//     const styles: any = {
//       ADMIN: "bg-amber-500 hover:bg-amber-600",
//       TEACHER: "bg-blue-600 hover:bg-blue-700",
//       STUDENT: "bg-emerald-500 hover:bg-emerald-600"
//     };
//     return (
//       <Badge className={`${styles[role] || 'bg-slate-500'} border-none px-3 py-1 flex w-fit items-center gap-1`}>
//         {role === 'ADMIN' && <ShieldCheck size={12} />}
//         {role === 'TEACHER' && <UserCog size={12} />}
//         {role === 'STUDENT' && <User size={12} />}
//         {role}
//       </Badge>
//     );
//   };

//   return (
//     <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">

//       {/* 1. TOP COMMAND BAR */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-4xl font-black text-slate-900 tracking-tight">User Registry</h1>
//           <p className="text-slate-500 font-medium">Manage faculty, staff, and student access</p>
//         </div>
//         <div className="flex gap-3">
//           <Button
//             onClick={() => setIsImportOpen(true)}
//             variant="outline"
//             className="rounded-2xl h-12 px-6 gap-2 border-slate-200 hover:bg-white font-bold text-slate-600 transition-all shadow-sm"
//           >
//             <FileUp size={18} /> Bulk Import
//           </Button>
//           <Button
//             onClick={() => setIsCreateOpen(true)}
//             className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-12 px-6 gap-2 shadow-lg shadow-blue-100 transition-all"
//           >
//             <UserPlus size={18} /> Create New User
//           </Button>
//         </div>
//       </div>

//       {/* 2. STUDENT CLASS FINDER SECTION */}
//       <Card className="border-none shadow-sm bg-white overflow-hidden">
//         <CardHeader className="bg-slate-900 text-white py-4 flex flex-row items-center justify-between">
//           <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
//             <Search size={14} className="text-blue-400" /> Enrollment Inspector
//           </CardTitle>
//           <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
//         </CardHeader>
//         <CardContent className="p-6">
//           <div className="flex flex-col md:flex-row gap-6">
//             <div className="w-full md:w-80">
//               <Select onValueChange={handleStudentSelect}>
//                 <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50">
//                   <SelectValue placeholder="Identify student by name..." />
//                 </SelectTrigger>
//                 <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
//                   {users.filter(u => u.role === 'STUDENT').map(s => (
//                     <SelectItem key={s.id} value={String(s.id)} className="rounded-lg">{s.name} ({s.userId})</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="flex-1 min-h-11">
//               <AnimatePresence mode="wait">
//                 {isLoadingClasses ? (
//                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin size-4" /> Fetching student records...</motion.div>
//                 ) : selectedStudentId && studentClasses.length > 0 ? (
//                   <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
//                     {studentClasses.map(c => (
//                       <div key={c.id} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
//                         <p className="text-xs font-black text-indigo-700 uppercase leading-none mb-1">{c.name}</p>
//                         <p className="text-[10px] text-indigo-500 font-bold">Grade: {c.grade} • {c.teacher?.name || 'Assigned'}</p>
//                       </div>
//                     ))}
//                   </motion.div>
//                 ) : selectedStudentId && (
//                   <p className="text-slate-400 italic text-sm">No active class enrollments found for this identifier.</p>
//                 )}
//               </AnimatePresence>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* 3. SEARCH & ROLE FILTERS */}
//       <Card className="border-none shadow-sm bg-white overflow-hidden p-4">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="relative flex-1">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
//             <Input
//               placeholder="Search registry by name, email, or fingerprint ID..."
//               className="pl-12 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-600 transition-all"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>
//           <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
//             {['ALL', 'ADMIN', 'TEACHER', 'STUDENT'].map((role) => (
//               <Button
//                 key={role}
//                 variant="ghost"
//                 size="sm"
//                 onClick={() => setRoleFilter(role)}
//                 className={`rounded-xl h-10 px-5 font-bold transition-all ${roleFilter === role ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
//                   }`}
//               >
//                 {role}
//               </Button>
//             ))}
//           </div>
//         </div>
//       </Card>

//       {/* 4. DATA TABLE */}
//       <Card className="border-none shadow-sm bg-white overflow-hidden">
//         <Table>
//           <TableHeader className="bg-slate-50/50">
//             <TableRow className="hover:bg-transparent border-slate-100">
//               <TableHead className="w-12"></TableHead>
//               <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">User Profile</TableHead>
//               <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Fingerprint ID</TableHead>
//               <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Access Tier</TableHead>
//               <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Gender</TableHead>
//               <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Operations</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             <AnimatePresence mode="popLayout">
//               {loading ? (
//                 <TableRow><TableCell colSpan={6} className="text-center py-24 text-slate-400 font-bold animate-pulse">Synchronizing Security Ledger...</TableCell></TableRow>
//               ) : filteredUsers.map((user, idx) => (
//                 <motion.tr
//                   key={user.id}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: idx * 0.03 }}
//                   className="group hover:bg-slate-50/80 transition-colors border-slate-50"
//                 >
//                   <TableCell>
//                     <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
//                       <Fingerprint size={20} />
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex flex-col">
//                       <span className="font-bold text-slate-800 tracking-tight">{user.name}</span>
//                       <span className="text-xs text-slate-400 flex items-center gap-1"><Mail size={12} /> {user.email}</span>
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <code className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-600 uppercase tracking-tighter">
//                       {user.userId}
//                     </code>
//                   </TableCell>
//                   <TableCell>{getRoleBadge(user.role)}</TableCell>
//                   <TableCell className="text-xs font-bold text-slate-500 uppercase">{user.gender || '—'}</TableCell>
//                   <TableCell className="text-right">
//                     <div className="flex items-center justify-end gap-2">
//                       <Popover>
//                         <PopoverTrigger asChild>
//                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50"><Info size={18} /></Button>
//                         </PopoverTrigger>
//                         <PopoverContent className="w-80 rounded-2xl p-4 shadow-2xl border-slate-100">
//                           <div className="space-y-4">
//                             <div className="flex items-center justify-between border-b pb-2">
//                               <h4 className="font-black text-xs uppercase text-slate-400 tracking-widest">User Metadata</h4>
//                               <Badge variant="outline" className="text-[10px] font-mono">{user.userId}</Badge>
//                             </div>
//                             <div className="grid grid-cols-2 gap-4">
//                               <InfoBox icon={<CalendarIcon size={12} />} label="Birth Date" value={user.birthDate} />
//                               <InfoBox icon={<MapPin size={12} />} label="Birth City" value={user.birthCity} />
//                               <InfoBox icon={<Globe size={12} />} label="Country" value={user.birthCountry} />
//                               <InfoBox icon={<Phone size={12} />} label="Contact" value={user.phoneNumber} />
//                             </div>
//                             <div className="pt-2 border-t">
//                               <p className="font-bold uppercase text-[9px] text-slate-400 mb-1">Residential Address</p>
//                               <p className="text-[11px] text-slate-600 italic leading-relaxed">{user.address || 'No physical address registered'}</p>
//                             </div>
//                           </div>
//                         </PopoverContent>
//                       </Popover>

//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreVertical size={18} /></Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl border-slate-100">
//                           <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 px-2 py-1">Identity Operations</DropdownMenuLabel>
//                           <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsEditOpen(true); }} className="rounded-xl flex items-center gap-2 py-2 cursor-pointer">
//                             <Edit size={16} className="text-blue-500" /> Edit Credentials
//                           </DropdownMenuItem>
//                           <DropdownMenuSeparator />
//                           <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsDeleteOpen(true); }} className="rounded-xl flex items-center gap-2 py-2 cursor-pointer focus:bg-rose-50 text-rose-600 font-bold">
//                             <Trash2 size={16} /> Deactivate Account
//                           </DropdownMenuItem>
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </div>
//                   </TableCell>
//                 </motion.tr>
//               ))}
//             </AnimatePresence>
//           </TableBody>
//         </Table>
//       </Card>

//       {/* --- BULK IMPORT DIALOG --- */}
//       <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
//         <DialogContent className="max-w-md rounded-3xl border-none p-0 shadow-2xl overflow-hidden">
//           <DialogHeader className="p-6 bg-slate-900 text-white">
//             <DialogTitle className="text-xl font-black tracking-tight">Bulk Identity Upload</DialogTitle>
//           </DialogHeader>
//           <div className="p-8 space-y-6">
//             <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
//               <AlertCircle className="text-amber-600 shrink-0" size={20} />
//               <p className="text-xs text-amber-800 leading-relaxed font-medium">
//                 Records must follow the standard schema. Values for <strong>role</strong> must be uppercase: STUDENT, TEACHER, or ADMIN.
//               </p>
//             </div>
//             <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-10 hover:border-blue-400 transition-colors bg-slate-50/50 group relative">
//               <Input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" id="csv-upload" onChange={handleFileUpload} disabled={importing} />
//               <div className="flex flex-col items-center pointer-events-none">
//                 <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
//                   {importing ? <Loader2 className="animate-spin text-blue-600" /> : <FileUp className="text-blue-600" size={32} />}
//                 </div>
//                 <p className="font-bold text-slate-700 uppercase text-xs tracking-widest">Upload CSV Registry</p>
//               </div>
//             </div>
//             <Button variant="ghost" onClick={downloadTemplate} className="w-full text-blue-600 hover:bg-blue-50 font-bold gap-2 rounded-xl h-12">
//               <Download size={16} /> Download CSV Template
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* --- CREATE IDENTITY DIALOG --- */}
//       <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
//         <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-none p-0 shadow-2xl">
//           <DialogHeader className="p-6 bg-blue-600 text-white">
//             <DialogTitle className="text-xl font-black tracking-tight">Generate New Identity</DialogTitle>
//           </DialogHeader>
//           <div className="p-6">
//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
//                 <FormField control={form.control} name="name" render={({ field }) => (
//                   <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Legal Name</FormLabel><FormControl><Input placeholder="Full Name" className="rounded-xl h-11 bg-slate-50 border-none" {...field} /></FormControl><FormMessage /></FormItem>
//                 )} />
//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField control={form.control} name="email" render={({ field }) => (
//                     <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Institutional Email</FormLabel><FormControl><Input placeholder="user@amf.edu" className="rounded-xl h-11 bg-slate-50 border-none" {...field} /></FormControl><FormMessage /></FormItem>
//                   )} />
//                   <FormField control={form.control} name="password" render={({ field }) => (
//                     <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Security Key</FormLabel><FormControl><Input type="password" placeholder="••••••••" className="rounded-xl h-11 bg-slate-50 border-none" {...field} /></FormControl><FormMessage /></FormItem>
//                   )} />
//                 </div>
//                 <FormField control={form.control} name="role" render={({ field }) => (
//                   <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Registry Permission</FormLabel>
//                     <Select onValueChange={field.onChange} defaultValue={field.value}>
//                       <FormControl><SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none"><SelectValue placeholder="Access Level" /></SelectTrigger></FormControl>
//                       <SelectContent className="rounded-xl shadow-2xl border-slate-100">
//                         <SelectItem value="STUDENT">Student</SelectItem>
//                         <SelectItem value="TEACHER">Teacher</SelectItem>
//                         <SelectItem value="ADMIN">Admin</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </FormItem>
//                 )} />
//                 <Button type="submit" className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black font-bold shadow-lg mt-4 uppercase text-xs tracking-widest transition-all active:scale-[0.98]">Authorize Entry</Button>
//               </form>
//             </Form>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* --- EDIT & DELETE WRAPPERS --- */}
//       {selectedUser && (
//         <>
//           <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
//             <DialogContent className="rounded-3xl shadow-2xl border-none">
//               <DialogHeader><DialogTitle className="text-xl font-black">Refine Identity: {selectedUser.name}</DialogTitle></DialogHeader>
//               <EditUserForm user={selectedUser} onFinished={() => { setIsEditOpen(false); fetchUsers(); }} />
//             </DialogContent>
//           </Dialog>
//           <DeleteUserAlert
//             userId={selectedUser.id}
//             open={isDeleteOpen}
//             onOpenChange={setIsDeleteOpen}
//             onFinished={async () => {
//               setIsDeleteOpen(false);
//               fetchUsers();
//             }}
//           />
//         </>
//       )}
//     </div>
//   );
// }

// // Sub-component for Popover
// function InfoBox({ icon, label, value }: any) {
//   return (
//     <div>
//       <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1 mb-0.5">{icon} {label}</p>
//       <p className="text-[11px] font-bold text-slate-700 truncate">{value || 'N/A'}</p>
//     </div>
//   );
// }


// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import { Input } from '@/components/ui/input';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { toast } from 'sonner';
// import api from '@/lib/api';
// import EditUserForm from '@/components/forms/EditUserForm';
// import DeleteUserAlert from '@/components/forms/DeleteUserAlert';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// const createFormSchema = z.object({
//   name: z.string().min(1, { message: 'Name is required' }),
//   email: z.string().email({ message: 'Invalid email address' }),
//   password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
//   role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
//   birthDate: z.string().optional(),
//   birthCountry: z.string().optional(),
//   birthCity: z.string().optional(),
//   address: z.string().optional(),
//   gender: z.string().optional(),
//   phoneNumber: z.string().optional(),
// });

// interface User {
//   id: number;
//   userId: string;
//   name: string;
//   email: string;
//   role: string;
//   birthDate?: string;
//   birthCountry?: string;
//   birthCity?: string;
//   address?: string;
//   gender?: string;
//   phoneNumber?: string;
// }

// interface Classe {
//   id: number;
//   name: string;
//   grade: string;
//   teacher: User | null;
// }

// export default function UsersPage() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);
//   const [selectedStudentId, setSelectedStudentId] = useState<string>('');
//   const [studentClasses, setStudentClasses] = useState<Classe[]>([]);
//   const [isLoadingClasses, setIsLoadingClasses] = useState(false);

//   const form = useForm<z.infer<typeof createFormSchema>>({
//     resolver: zodResolver(createFormSchema),
//     defaultValues: {
//       name: '',
//       email: '',
//       password: '',
//       role: 'STUDENT',
//       birthDate: '',
//       birthCountry: '',
//       birthCity: '',
//       address: '',
//       gender: '',
//       phoneNumber: '',
//     },
//   });

//   const fetchUsers = async () => {
//     try {
//       const response = await api.get('/admin/users');
//       setUsers(response.data);
//     } catch (error) {
//       toast.error('Failed to fetch users');
//       console.log(error);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const handleCreateSubmit = async (values: z.infer<typeof createFormSchema>) => {
//     try {
//       await api.post('/admin/users', values);
//       toast.success('User created successfully');
//       fetchUsers();
//       setIsCreateDialogOpen(false);
//       form.reset();
//     } catch (error) {
//       toast.error('Failed to create user');
//       console.log(error);
//     }
//   };

//   const openEditDialog = (user: User) => {
//     setSelectedUser(user);
//     setIsEditDialogOpen(true);
//   };

//   const openDeleteDialog = (user: User) => {
//     setSelectedUser(user);
//     setIsDeleteDialogOpen(true);
//   };

//   const handleStudentSelect = async (studentId: string) => {
//     setSelectedStudentId(studentId);
//     if (studentId) {
//       setIsLoadingClasses(true);
//       try {
//         const response = await api.get(`/admin/students/${studentId}/classes`);
//         setStudentClasses(response.data);
//       } catch (error) {
//         toast.error("Failed to fetch student's classes");
//         console.log(error);
//       } finally {
//         setIsLoadingClasses(false);
//       }
//     } else {
//       setStudentClasses([]);
//     }
//   };

//   return (
//     <div className="p-8">
//       <Card className="mb-8">
//         <CardHeader>
//           <CardTitle>Student Class Lookup</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="flex gap-4">
//             <Select onValueChange={handleStudentSelect}>
//               <SelectTrigger className="w-[280px]">
//                 <SelectValue placeholder="Select a student" />
//               </SelectTrigger>
//               <SelectContent>
//                 {users
//                   .filter((user) => user.role === 'STUDENT')
//                   .map((student) => (
//                     <SelectItem key={student.id} value={String(student.id)}>
//                       {student.name}
//                     </SelectItem>
//                   ))}
//               </SelectContent>
//             </Select>
//           </div>
//           {isLoadingClasses ? (
//             <p className="mt-4">Loading classes...</p>
//           ) : (
//             selectedStudentId && (
//               <div className="mt-4">
//                 <h3 className="font-bold mb-2">Classes for Selected Student:</h3>
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Class Name</TableHead>
//                       <TableHead>Grade</TableHead>
//                       <TableHead>Teacher</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {studentClasses.map((classe) => (
//                       <TableRow key={classe.id}>
//                         <TableCell>{classe.name}</TableCell>
//                         <TableCell>{classe.grade}</TableCell>
//                         <TableCell>{classe.teacher?.name || 'N/A'}</TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             )
//           )}
//         </CardContent>
//       </Card>

//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold">Users Management</h1>
//         <Button onClick={() => setIsCreateDialogOpen(true)}>Create User</Button>
//       </div>

//       <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
//         <DialogContent className="max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Create New User</DialogTitle>
//           </DialogHeader>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
//               <FormField control={form.control} name="name" render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Name</FormLabel>
//                   <FormControl>
//                     <Input placeholder="Name" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )} />

//               <FormField control={form.control} name="email" render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Email</FormLabel>
//                   <FormControl>
//                     <Input placeholder="Email" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )} />

//               <FormField control={form.control} name="password" render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Password</FormLabel>
//                   <FormControl>
//                     <Input type="password" placeholder="Password" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )} />

//               <FormField control={form.control} name="role" render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Role</FormLabel>
//                   <Select onValueChange={field.onChange} defaultValue={field.value}>
//                     <FormControl>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select a role" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       <SelectItem value="STUDENT">Student</SelectItem>
//                       <SelectItem value="TEACHER">Teacher</SelectItem>
//                       <SelectItem value="ADMIN">Admin</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )} />

//               <FormField control={form.control} name="birthDate" render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Birth Date</FormLabel>
//                   <FormControl>
//                     <Input type="date" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )} />

//               <FormField control={form.control} name="birthCountry" render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Birth Country</FormLabel>
//                   <FormControl>
//                     <Input placeholder="Country" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )} />

//               <FormField control={form.control} name="birthCity" render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Birth City</FormLabel>
//                   <FormControl>
//                     <Input placeholder="City" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )} />

//               <FormField control={form.control} name="address" render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Address</FormLabel>
//                   <FormControl>
//                     <Input placeholder="Address" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )} />

//               <FormField control={form.control} name="gender" render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Gender</FormLabel>
//                   <Select onValueChange={field.onChange} defaultValue={field.value}>
//                     <FormControl>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select gender" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       <SelectItem value="Male">Male</SelectItem>
//                       <SelectItem value="Female">Female</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )} />

//               <FormField control={form.control} name="phoneNumber" render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Phone Number</FormLabel>
//                   <FormControl>
//                     <Input placeholder="Phone Number" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )} />

//               <Button type="submit" className="w-full">Create User</Button>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>

//       {selectedUser && (
//         <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Edit User</DialogTitle>
//             </DialogHeader>
//             <EditUserForm
//               user={selectedUser}
//               onFinished={() => {
//                 setIsEditDialogOpen(false);
//                 fetchUsers();
//               }}
//             />
//           </DialogContent>
//         </Dialog>
//       )}

//       {selectedUser && (
//         <DeleteUserAlert
//           userId={selectedUser.id}
//           open={isDeleteDialogOpen}
//           onOpenChange={setIsDeleteDialogOpen}
//           onFinished={async () => {
//             setIsDeleteDialogOpen(false);
//             await fetchUsers();
//           }}
//         />
//       )}

//       <div className="rounded-md border w-[90%]">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>User ID</TableHead>
//               <TableHead>Name</TableHead>
//               <TableHead>Email</TableHead>
//               <TableHead>Phone</TableHead>
//               <TableHead>Role</TableHead>
//               <TableHead>Gender</TableHead>
//               <TableHead>More Info</TableHead>
//               {/* <TableHead>Birth Date</TableHead>
//               <TableHead>Birth City</TableHead>
//               <TableHead>Birth Country</TableHead>
//               <TableHead>Address</TableHead> */}
//               <TableHead className="text-right">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {users.map((user) => (
//               <TableRow key={user.id}>
//                 <TableCell className="font-medium text-fuchsia-950">{user.userId}</TableCell>
//                 <TableCell>{user.name}</TableCell>
//                 <TableCell>{user.email}</TableCell>
//                 <TableCell>{user.phoneNumber || '-'}</TableCell>
//                 <TableCell>{user.role}</TableCell>
//                 <TableCell>{user.gender || '-'}</TableCell>

//                 {/* Popover Column */}
//                 <TableCell>
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="ghost"
//                         className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
//                       >
//                         More...
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-80 p-4 shadow-lg">
//                       <div className="space-y-4">
//                         <div className="flex items-center justify-between border-b pb-2">
//                           <h4 className="font-semibold text-sm tracking-tight text-foreground">
//                             Additional Details
//                           </h4>
//                           <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
//                             ID: {user.userId}
//                           </span>
//                         </div>

//                         <div className="grid gap-3">
//                           {/* Birth Date & City (Side by Side) */}
//                           <div className="grid grid-cols-2 gap-2">
//                             <div>
//                               <p className="text-[11px] font-medium text-muted-foreground uppercase">Birth Date</p>
//                               <p className="text-sm">{user.birthDate || '-'}</p>
//                             </div>
//                             <div>
//                               <p className="text-[11px] font-medium text-muted-foreground uppercase">Birth City</p>
//                               <p className="text-sm truncate" title={user.birthCity}>{user.birthCity || '-'}</p>
//                             </div>
//                           </div>

//                           {/* Birth Country */}
//                           <div>
//                             <p className="text-[11px] font-medium text-muted-foreground uppercase">Birth Country</p>
//                             <p className="text-sm">{user.birthCountry || '-'}</p>
//                           </div>

//                           {/* Address - The fix for text overflow */}
//                           <div className="pt-2 border-t">
//                             <p className="text-[11px] font-medium text-muted-foreground uppercase mb-1">Residential Address</p>
//                             <p className="text-sm leading-relaxed text-pretty wrap-break-word italic text-foreground/80">
//                               {user.address || 'No address provided'}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </PopoverContent>
//                   </Popover>
//                 </TableCell>

//                 <TableCell className="text-right">
//                   <Button variant="outline" size="sm" className="mr-2" onClick={() => openEditDialog(user)}>Edit</Button>
//                   <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(user)}>Delete</Button>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// }
