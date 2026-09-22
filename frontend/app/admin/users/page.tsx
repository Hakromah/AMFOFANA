/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
   Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
   Search, UserPlus, MoreVertical, UserCog, Trash2, ShieldCheck,
   User, Users, Mail, Fingerprint, Calendar as CalendarIcon, MapPin,
   Phone, Globe, Info, Loader2, Edit, FileUp, Download,
   AlertCircle, Home, LayoutDashboard, PieChart, Activity,
   Bus, Briefcase, Landmark
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
   firstName: z.string().min(1, 'First name is required'),
   lastName: z.string().min(1, 'Last name is required'),
   email: z.string().email('Invalid email address'),
   password: z.string().min(6, 'Minimum 6 characters'),
   role: z.enum(['STUDENT', 'TEACHER', 'ADMIN', 'ACCOUNTANT', 'ACCOUNTLEAD', 'DRIVER', 'WORKER', 'PARENT']),
   birthDate: z.string().optional(),
   birthCountry: z.string().optional(),
   birthCity: z.string().optional(),
   address: z.string().optional(),
   gender: z.string().optional(),
   phoneNumber: z.string().optional(),
});

interface UserRecord {
   id: number;
   name: string;
   email: string;
   lastName?: string;
   firstName?: string;
   userId?: string;
   role?: string;
   schoolRole?: string;
   gender?: string;
   birthDate?: string;
   birthCity?: string;
   birthCountry?: string;
   phoneNumber?: string;
   address?: string;
}

export default function UserManagement() {
   const [users, setUsers] = useState<UserRecord[]>([]);
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
   const [emailDuplicate, setEmailDuplicate] = useState<any | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Inspector States
   const [selectedStudentId, setSelectedStudentId] = useState<string>('');
   const [studentClasses, setStudentClasses] = useState<any[]>([]);
   const [isLoadingClasses, setIsLoadingClasses] = useState(false);

   const [csvPreview, setCsvPreview] = useState<any[]>([]);
   const [importSummary, setImportSummary] = useState<{ imported: number, skipped: number, errors?: string[] } | null>(null);

   const form = useForm<z.infer<typeof userFormSchema>>({
      resolver: zodResolver(userFormSchema),
      defaultValues: {
         role: 'STUDENT', firstName: '', lastName: '', email: '', password: '',
         birthDate: '', birthCountry: '', birthCity: '', address: '', gender: '', phoneNumber: ''
      },
   });

   // --- DATA CALCULATIONS (Analytics) ---
   const statsData = useMemo(() => {
      const counts: Record<string, number> = {
         STUDENT: 0, TEACHER: 0, ADMIN: 0, ACCOUNTANT: 0, ACCOUNTLEAD: 0, DRIVER: 0, WORKER: 0, PARENT: 0
      };
      users.forEach(u => {
         const r = (u.role || u.schoolRole || '').toUpperCase();
         if (counts[r] !== undefined) counts[r]++;
      });
      return [
         { name: 'Students', value: counts.STUDENT, color: '#10b981' },
         { name: 'Teachers', value: counts.TEACHER, color: '#3b82f6' },
         { name: 'Admins', value: counts.ADMIN, color: '#f59e0b' },
         { name: 'Accountants', value: (counts.ACCOUNTANT || 0) + (counts.ACCOUNTLEAD || 0), color: '#8b5cf6' },
         { name: 'Staff / Drivers', value: (counts.DRIVER || 0) + (counts.WORKER || 0), color: '#6366f1' },
         { name: 'Parents', value: counts.PARENT || 0, color: '#f43f5e' }
      ];
   }, [users]);

   const fetchUsers = async () => {
      setLoading(true);
      try {
         const response = await api.get('/admin/users');
         const mappedUsers = (response.data || []).map((u: any) => {
            const firstName = u.firstName || '';
            const lastName = u.lastName || '';
            const fullName = (firstName && lastName)
               ? `${firstName} ${lastName}`
               : (firstName || lastName || u.username || u.name || '');

            return {
               ...u,
               firstName,
               lastName,
               role: u.schoolRole || u.role,
               name: fullName,
            };
         });
         setUsers(mappedUsers);
      } catch (error) {
         toast.error('Failed to sync user registry');
         console.log(error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => { fetchUsers(); }, []);

   // --- HANDLERS ---
   const handleCreateSubmit = async (values: z.infer<typeof userFormSchema>) => {
      if (emailDuplicate) {
         toast.error(`Cannot create user: Email "${values.email}" is already registered.`);
         return;
      }
      setIsSubmitting(true);
      try {
         await api.post('/admin/users', values);
         toast.success('Identity generated and registered in ledger');
         setIsCreateOpen(false);
         form.reset();
         setEmailDuplicate(null);
         fetchUsers();
      } catch (error: any) {
         const msg = error?.response?.data?.error?.message
            || error?.response?.data?.message
            || 'Generation failed — verify email address';
         toast.error(msg);
      } finally {
         setIsSubmitting(false);
      }
   };

   // Live email duplicate check
   const checkEmailDuplicate = (email: string) => {
      if (!email || !email.includes('@')) { setEmailDuplicate(null); return; }
      const match = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
      setEmailDuplicate(match || null);
   };

   // CSV Parsing and normalization
   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      Papa.parse(file, {
         header: true,
         skipEmptyLines: true,
         transformHeader: (header) => header.replace(/^\ufeff/, "").trim(),
         complete: (results) => {
            const cleanedData = results.data.map((row: any) => {
               let formattedDate = row.birthDate || row.birthdate;
               if (formattedDate && formattedDate.includes('/')) {
                  const parts = formattedDate.split('/');
                  if (parts.length === 3) {
                     formattedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                  }
               }

               let firstName = row.firstName || row.firstname;
               let lastName = row.lastName || row.lastname;
               if (!firstName && row.name) {
                  const nameParts = row.name.trim().split(' ');
                  firstName = nameParts[0];
                  lastName = nameParts.slice(1).join(' ') || 'X';
               }

               return {
                  ...row,
                  firstName: firstName?.trim(),
                  lastName: lastName?.trim(),
                  role: row.role?.toUpperCase().trim() || 'STUDENT',
                  birthDate: formattedDate && formattedDate !== "" ? formattedDate : null,
                  email: row.email?.trim(),
               };
            });

            setCsvPreview(cleanedData);
            setImportSummary(null);
         }
      });
   };

   const processImport = async () => {
      if (csvPreview.length === 0) return;

      const tid = toast.loading("Processing ledger injection...");
      setImporting(true);

      try {
         const response = await api.post('/admin/users/bulk', csvPreview);
         setImportSummary(response.data);
         toast.success("Bulk import completed successfully", { id: tid });
         fetchUsers();
      } catch (error: any) {
         console.error("Import Error Detail:", error.response?.data);
         const errorMsg = error.response?.data?.message || "Check CSV headers and format";
         toast.error(`Registry Error: ${errorMsg}`, { id: tid });
      } finally {
         setImporting(false);
      }
   };

   const downloadTemplate = () => {
      const csv = "firstName,lastName,email,password,role,birthDate,birthCountry,birthCity,address,gender,phoneNumber\nJohn,Doe,john@amfofana.edu,pass123,STUDENT,2005-12-01,Liberia,Monrovia,123 Tubman Blvd,Male,+23177000000";
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AMFOFANA_users_template.csv';
      a.click();
   };

   const handleStudentSelect = async (studentId: string) => {
      setSelectedStudentId(studentId);
      if (!studentId) return;
      setIsLoadingClasses(true);
      try {
         const res = await api.get(`/admin/students/${studentId}/classes`);
         setStudentClasses(res.data || []);
      } catch (e) {
         toast.error('Failed to retrieve student classes');
         console.log(e);
      } finally {
         setIsLoadingClasses(false);
      }
   };

   const filteredUsers = users.filter(u => {
      const name = u.name?.toLowerCase() || '';
      const firstName = u.firstName?.toLowerCase() || '';
      const lastName = u.lastName?.toLowerCase() || '';
      const id = u.userId?.toLowerCase() || '';
      const email = u.email?.toLowerCase() || '';
      const searchLower = search.toLowerCase();

      const matchesSearch = (
         name.includes(searchLower) ||
         firstName.includes(searchLower) ||
         lastName.includes(searchLower) ||
         id.includes(searchLower) ||
         email.includes(searchLower)
      );
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesRole;
   });

   // Animation Variants
   const itemVars = { hidden: { y: 15, opacity: 0 }, show: { y: 0, opacity: 1 } };

   const getRoleBadge = (role: string) => {
      const styles: Record<string, string> = {
         ADMIN: "bg-amber-500 hover:bg-amber-600",
         TEACHER: "bg-blue-600 hover:bg-blue-700",
         STUDENT: "bg-emerald-500 hover:bg-emerald-600",
         ACCOUNTANT: "bg-purple-600 hover:bg-purple-700",
         ACCOUNTLEAD: "bg-violet-600 hover:bg-violet-700",
         DRIVER: "bg-indigo-600 hover:bg-indigo-700",
         WORKER: "bg-slate-700 hover:bg-slate-800",
         PARENT: "bg-rose-500 hover:bg-rose-600"
      };

      const roleLabels: Record<string, string> = {
         ADMIN: 'Admin',
         TEACHER: 'Teacher',
         STUDENT: 'Student',
         ACCOUNTANT: 'Accountant',
         ACCOUNTLEAD: 'Account Lead',
         DRIVER: 'Driver',
         WORKER: 'Worker',
         PARENT: 'Parent',
      };

      return (
         <Badge className={`${styles[role] || 'bg-slate-500'} border-none px-3 py-1 flex w-fit items-center gap-1 uppercase text-[10px] font-black tracking-widest text-white`}>
            {role === 'ADMIN' && <ShieldCheck size={10} />}
            {role === 'TEACHER' && <UserCog size={10} />}
            {role === 'STUDENT' && <User size={10} />}
            {role === 'PARENT' && <Users size={10} />}
            {(role === 'ACCOUNTANT' || role === 'ACCOUNTLEAD') && <Landmark size={10} />}
            {role === 'DRIVER' && <Bus size={10} />}
            {role === 'WORKER' && <Briefcase size={10} />}
            {roleLabels[role] || role}
         </Badge>
      );
   };

   return (
      <div className="p-[clamp(1rem,2vw+1rem,2rem)] space-y-[clamp(1rem,2vw+1rem,2rem)] bg-slate-50/50 min-h-screen">

         {/* 1. TOP COMMAND HEADER */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
               <h1 className="text-[clamp(1.2rem,2vw+1rem,2rem)] font-black text-slate-900 tracking-tighter flex items-center gap-3 italic uppercase">
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

         {/* 2. ANALYTICS ROW */}
         <div className="grid lg:grid-cols-3 gap-8">
            {/* User Distribution Chart */}
            <Card className="lg:col-span-1 border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm rounded-3xl bg-white overflow-hidden">
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
                     {statsData.map((s) => (
                        <div
                           key={s.name}
                           className="text-center p-3 rounded-2xl border transition-all hover:scale-105"
                           style={{
                              backgroundColor: `${s.color}20`,
                              borderColor: `${s.color}35`,
                           }}
                        >
                           <p
                              className="text-[9px] font-black uppercase tracking-tighter"
                              style={{ color: s.color }}
                           >
                              {s.name}
                           </p>
                           <p className="text-xl font-black text-slate-800 leading-none mt-1">
                              {s.value}
                           </p>
                        </div>
                     ))}
                  </div>
               </CardContent>
            </Card>

            {/* Enrollment Inspector */}
            <Card className="lg:col-span-2 border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm bg-white rounded-3xl overflow-hidden">
               <CardHeader className="bg-slate-900 text-white py-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                     <Search size={14} className="text-blue-400" /> Enrollment Inspector
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-6 h-full flex flex-col gap-6">
                  <Select onValueChange={handleStudentSelect}>
                     <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50 font-bold">
                        <SelectValue placeholder="Identify student registry record..." />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl shadow-2xl border-slate-100 max-h-64 overflow-y-auto">
                        {users.filter(u => (u.role || u.schoolRole) === 'STUDENT').map(s => (
                           <SelectItem key={s.id} value={String(s.id)} className="rounded-lg font-medium">
                              {s.name} {s.userId ? `(${s.userId})` : ''}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                  <div className="flex-1 overflow-y-auto">
                     <AnimatePresence mode="wait">
                        {isLoadingClasses ? (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase">
                              <Loader2 className="animate-spin size-4" /> Loading class registry...
                           </motion.div>
                        ) : selectedStudentId && studentClasses.length > 0 ? (
                           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {studentClasses.map(c => (
                                 <div key={c.id} className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center">
                                    <div>
                                       <p className="text-xs font-black text-indigo-700 uppercase">{c.name}</p>
                                       <p className="text-[10px] text-indigo-500 font-bold">Level: {c.grade || c.level || '—'}</p>
                                    </div>

                                    <Badge className="bg-indigo-200 text-indigo-700 hover:bg-indigo-200 text-[9px] font-black px-2 uppercase">
                                       {c.teachers && c.teachers.length > 0
                                          ? (c.teachers.length > 1
                                             ? `${c.teachers[0].username || c.teachers[0].name} +${c.teachers.length - 1}`
                                             : (c.teachers[0].username || c.teachers[0].name))
                                          : 'Tutor'}
                                    </Badge>
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
            <Card className="border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm bg-white overflow-hidden p-4">
               <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                     <Input
                        placeholder="Search registry by name, email, or User ID..."
                        className="pl-12 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-600 font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                     />
                  </div>
                  <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 overflow-x-auto max-w-full">
                     {[
                        { val: 'ALL', label: 'ALL' },
                        { val: 'ADMIN', label: 'ADMIN' },
                        { val: 'TEACHER', label: 'TEACHER' },
                        { val: 'STUDENT', label: 'STUDENT' },
                        { val: 'PARENT', label: 'PARENT' },
                        { val: 'ACCOUNTANT', label: 'ACCOUNTANT' },
                        { val: 'ACCOUNTLEAD', label: 'ACCOUNT LEAD' },
                        { val: 'DRIVER', label: 'DRIVER' },
                        { val: 'WORKER', label: 'WORKER' },
                     ].map(({ val, label }) => (
                        <Button
                           key={val}
                           variant="ghost"
                           size="sm"
                           onClick={() => setRoleFilter(val)}
                           className={`rounded-xl h-10 px-5 font-black uppercase text-[10px] tracking-widest transition-all shrink-0 ${roleFilter === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                           {label}
                        </Button>
                     ))}
                  </div>
               </div>
            </Card>
         </motion.div>

         {/* 4. MAIN REGISTRY TABLE */}
         <Card className="border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm bg-white overflow-hidden rounded-3xl">
            <div className="max-h-[620px] overflow-y-auto pr-1">
               <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                     <TableRow className="border-slate-100 hover:bg-transparent bg-slate-50">
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Identity Profile</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Structured User ID</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Access Level</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Gender</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     <AnimatePresence mode="popLayout">
                        {loading ? (
                           <TableRow key="loading">
                              <TableCell colSpan={6} className="text-center py-24 text-slate-400 font-black animate-pulse uppercase tracking-widest">
                                 Syncing Encrypted Ledger...
                              </TableCell>
                           </TableRow>
                        ) : (
                           filteredUsers.map((user) => (
                              <motion.tr key={user.id} variants={itemVars} className="group hover:bg-slate-50/80 transition-colors border-slate-50">
                                 <TableCell>
                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                       <Fingerprint size={20} />
                                    </div>
                                 </TableCell>
                                 <TableCell>
                                    <div className="flex flex-col">
                                       <span className="font-bold text-slate-800 tracking-tight">
                                          {user.firstName && user.lastName
                                             ? `${user.firstName} ${user.lastName}`
                                             : (user.name || user.firstName || user.lastName || '—')}
                                       </span>
                                       <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                          <Mail size={12} /> {user.email}
                                       </span>
                                    </div>
                                 </TableCell>
                                 <TableCell>
                                    <code className="text-[10px] font-black bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-mono tracking-wider border border-slate-200">
                                       {user.userId || '—'}
                                    </code>
                                 </TableCell>
                                 <TableCell>{getRoleBadge(user.role || user.schoolRole || '')}</TableCell>
                                 <TableCell className="text-xs font-bold text-slate-500 uppercase">{user.gender || '—'}</TableCell>
                                 <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                       <Popover>
                                          <PopoverTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-blue-50">
                                                <Info size={18} />
                                             </Button>
                                          </PopoverTrigger>
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
                                          <DropdownMenuTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical size={18} />
                                             </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl">
                                             <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsEditOpen(true); }} className="rounded-xl flex gap-2 py-2 cursor-pointer focus:bg-blue-50">
                                                <Edit size={16} className="text-blue-500" /> Edit Credentials
                                             </DropdownMenuItem>
                                             <DropdownMenuSeparator />
                                             <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsDeleteOpen(true); }} className="rounded-xl flex gap-2 py-2 text-rose-600 font-black uppercase text-[10px] tracking-widest focus:bg-rose-50 cursor-pointer">
                                                <Trash2 size={16} /> Delete Identity
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
            </div>
         </Card>

         {/* ── CREATE USER MODAL ── */}
         <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) { setEmailDuplicate(null); form.reset(); } }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
               <DialogHeader className="p-6 bg-blue-600 text-white">
                  <DialogTitle className="text-xl font-black tracking-tighter uppercase">Initialize New Identity</DialogTitle>
               </DialogHeader>
               <div className="p-8">
                  <Form {...form}>
                     <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-6">

                        {/* ── Row 1: First Name + Last Name ── */}
                        <div className="grid grid-cols-2 gap-6">
                           <FormField control={form.control} name="firstName" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                    First Name
                                 </FormLabel>
                                 <FormControl>
                                    <Input
                                       placeholder="e.g. Amara"
                                       className="rounded-xl bg-slate-50 border border-transparent h-11 px-4 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-300 transition-colors"
                                       {...field}
                                    />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )} />
                           <FormField control={form.control} name="lastName" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                    Last Name
                                 </FormLabel>
                                 <FormControl>
                                    <Input
                                       placeholder="e.g. Camara"
                                       className="rounded-xl bg-slate-50 border border-transparent h-11 px-4 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-300 transition-colors"
                                       {...field}
                                    />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )} />
                        </div>

                        {/* ── Row 2: Institutional Email (full width) ── */}
                        <FormField control={form.control} name="email" render={({ field }) => (
                           <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase text-slate-400">Institutional Email Address</FormLabel>
                              <FormControl>
                                 <div className="relative">
                                    <Input
                                       placeholder="email@amfofana.edu"
                                       className={`rounded-xl bg-slate-50 border h-11 px-4 transition-colors ${emailDuplicate ? 'border-rose-400 bg-rose-50 focus-visible:ring-rose-300' : 'border-transparent'}`}
                                       {...field}
                                       onChange={(e) => {
                                          field.onChange(e);
                                          checkEmailDuplicate(e.target.value);
                                       }}
                                    />
                                    {emailDuplicate && (
                                       <AlertCircle size={15} className="absolute right-3 top-3.5 text-rose-500" />
                                    )}
                                 </div>
                              </FormControl>
                              <FormMessage />
                              {emailDuplicate && (
                                 <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mt-1">
                                    <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] font-bold text-rose-700 leading-snug">
                                       This email address is already registered for{' '}
                                       <span className="font-black">{emailDuplicate.name}</span>{' '}
                                       <span className="bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-black text-[9px] uppercase">{emailDuplicate.role}</span>
                                    </p>
                                 </div>
                              )}
                           </FormItem>
                        )} />

                        {/* ── Row 3: Password + Access Role ── */}
                        <div className="grid grid-cols-2 gap-6 border-t pt-6">
                           <FormField control={form.control} name="password" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="text-[10px] font-black uppercase text-slate-400">Initial Password</FormLabel>
                                 <FormControl>
                                    <Input type="password" placeholder="••••••••" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )} />
                           <FormField control={form.control} name="role" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="text-[10px] font-black uppercase text-slate-400">Access Level</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                       <SelectTrigger className="rounded-xl bg-slate-50 border-none h-11">
                                          <SelectValue placeholder="Role" />
                                       </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-xl shadow-xl">
                                       <SelectItem value="STUDENT">Student</SelectItem>
                                       <SelectItem value="TEACHER">Teacher</SelectItem>
                                       <SelectItem value="ADMIN">Admin</SelectItem>
                                       <SelectItem value="PARENT">Parent</SelectItem>
                                       <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                                       <SelectItem value="ACCOUNTLEAD">Account Lead</SelectItem>
                                       <SelectItem value="DRIVER">Driver</SelectItem>
                                       <SelectItem value="WORKER">Worker</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </FormItem>
                           )} />
                        </div>

                        {/* ── Row 4: Birth Date + Phone ── */}
                        <div className="grid grid-cols-2 gap-6">
                           <FormField control={form.control} name="birthDate" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="text-[10px] font-black uppercase text-slate-400">Birth Date</FormLabel>
                                 <FormControl>
                                    <Input type="date" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} />
                                 </FormControl>
                              </FormItem>
                           )} />
                           <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="text-[10px] font-black uppercase text-slate-400">Phone Number</FormLabel>
                                 <FormControl>
                                    <Input placeholder="+..." className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} />
                                 </FormControl>
                              </FormItem>
                           )} />
                        </div>

                        {/* ── Row 5: Country + City + Gender ── */}
                        <div className="grid grid-cols-3 gap-4">
                           <FormField control={form.control} name="birthCountry" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="text-[10px] font-black uppercase text-slate-400">Country</FormLabel>
                                 <FormControl>
                                    <Input placeholder="Country" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} />
                                 </FormControl>
                              </FormItem>
                           )} />
                           <FormField control={form.control} name="birthCity" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="text-[10px] font-black uppercase text-slate-400">City</FormLabel>
                                 <FormControl>
                                    <Input placeholder="City" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} />
                                 </FormControl>
                              </FormItem>
                           )} />
                           <FormField control={form.control} name="gender" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="text-[10px] font-black uppercase text-slate-400">Gender</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                       <SelectTrigger className="rounded-xl bg-slate-50 border-none h-11">
                                          <SelectValue placeholder="Gender" />
                                       </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-xl shadow-xl">
                                       <SelectItem value="Male">Male</SelectItem>
                                       <SelectItem value="Female">Female</SelectItem>
                                       <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </FormItem>
                           )} />
                        </div>

                        {/* ── Row 6: Address ── */}
                        <FormField control={form.control} name="address" render={({ field }) => (
                           <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase text-slate-400">Residential Address</FormLabel>
                              <FormControl>
                                 <Input placeholder="Street address..." className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} />
                              </FormControl>
                           </FormItem>
                        )} />

                        <Button
                           type="submit"
                           disabled={isSubmitting || !!emailDuplicate}
                           className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-100 uppercase text-[11px] tracking-[0.2em] disabled:opacity-50"
                        >
                           {isSubmitting ? (
                              <><Loader2 className="animate-spin mr-2" size={16} /> Generating Structured ID...</>
                           ) : (
                              'Generate Identity & Register'
                           )}
                        </Button>
                     </form>
                  </Form>
               </div>
            </DialogContent>
         </Dialog>

         {/* ── BULK IMPORT MODAL ── */}
         <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent className="max-w-2xl rounded-3xl p-0 border-none shadow-2xl overflow-hidden">
               <DialogHeader className="p-6 bg-slate-900 text-white">
                  <DialogTitle className="text-xl font-black tracking-tighter uppercase flex items-center justify-between">
                     <span>Bulk Ledger Injection</span>
                     <Button onClick={downloadTemplate} size="sm" variant="ghost" className="text-blue-400 hover:text-white hover:bg-slate-800 text-[10px] uppercase font-black tracking-widest gap-1.5">
                        <Download size={14} /> Download Template
                     </Button>
                  </DialogTitle>
               </DialogHeader>

               <div className="p-8 space-y-6">
                  <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                     <FileUp className="mx-auto text-blue-500 mb-3" size={32} />
                     <p className="font-black text-slate-800 text-sm uppercase tracking-tight">Upload CSV File</p>
                     <p className="text-[11px] text-slate-400 font-medium mt-1">Structured IDs will be auto-generated according to initial & sequence rules.</p>
                     <input type="file" accept=".csv" onChange={handleFileUpload} className="mt-4 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
                  </div>

                  {csvPreview.length > 0 && (
                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                           <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                              Preview: {csvPreview.length} records ready
                           </span>
                           <Button onClick={processImport} disabled={importing} className="bg-emerald-600 hover:bg-emerald-700 font-black text-[10px] uppercase tracking-widest rounded-xl h-10 px-5">
                              {importing ? <Loader2 className="animate-spin size-4" /> : 'Confirm Import'}
                           </Button>
                        </div>
                     </div>
                  )}

                  {importSummary && (
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                        <p className="font-black text-slate-800 uppercase">Import Summary:</p>
                        <div className="flex gap-4 font-bold text-slate-600">
                           <span className="text-emerald-600">Imported: {importSummary.imported}</span>
                           <span className="text-amber-600">Skipped (Duplicates): {importSummary.skipped}</span>
                        </div>
                     </div>
                  )}
               </div>
            </DialogContent>
         </Dialog>

         {/* ── EDIT MODAL ── */}
         <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-md rounded-3xl p-6 shadow-2xl">
               <DialogHeader>
                  <DialogTitle className="text-lg font-black uppercase">Edit User Credentials</DialogTitle>
               </DialogHeader>
               {selectedUser && (
                  <EditUserForm user={selectedUser} onFinished={() => { setIsEditOpen(false); fetchUsers(); }} />
               )}
            </DialogContent>
         </Dialog>

         {/* ── DELETE MODAL ── */}
         {selectedUser && (
            <DeleteUserAlert
               userId={selectedUser.id}
               open={isDeleteOpen}
               onOpenChange={setIsDeleteOpen}
               onFinished={async () => { fetchUsers(); }}
            />
         )}
      </div>
   );
}

function InfoBox({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) {
   return (
      <div className="space-y-0.5">
         <p className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">{icon} {label}</p>
         <p className="text-xs font-bold text-slate-700">{value || '—'}</p>
      </div>
   );
}
