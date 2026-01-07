/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import {
   Database, Trash2, ShieldAlert, BarChart3,
   HardDrive, Users2, FileSearch, Loader2,
   Filter, DownloadCloud, AlertCircle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminMaterialsMonitoring() {
   const [materials, setMaterials] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");

   const fetchGlobalData = async () => {
      try {
         const res = await api.get('/admin/materials/all');
         setMaterials(res.data);
      } catch (e) {
         toast.error("Security sync failed: Global data unreachable");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => { fetchGlobalData(); }, []);

   const handleForceDelete = async (id: number) => {
      if (!confirm("ADMIN ALERT: This will permanently purge this resource from the server. Proceed?")) return;
      const tid = toast.loading("Executing administrative purge...");
      try {
         await api.delete(`/admin/materials/${id}`);
         toast.success("Resource Purged", { id: tid });
         fetchGlobalData();
      } catch (e) {
         toast.error("Purge command failed", { id: tid });
      }
   };

   // Analytics Logic
   const totalStorage = materials.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
   const formattedStorage = (totalStorage / (1024 * 1024)).toFixed(2); // MB

   const filteredMaterials = materials.filter(m =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.uploadedBy.name.toLowerCase().includes(searchTerm.toLowerCase())
   );

   if (loading) return <div className="h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

   return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 space-y-10">
         {/* Admin Header */}
         <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
               <div className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase tracking-[0.4em]">
                  <ShieldAlert size={14} /> Administrative Oversight
               </div>
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter sm:text-7xl italic uppercase leading-none">
                  Global <span className="text-rose-600">Archive.</span>
               </h1>
            </div>
            <div className="flex gap-3">
               <Button variant="outline" className="rounded-2xl h-12 border-slate-200 font-bold px-6 bg-white">
                  <DownloadCloud size={18} className="mr-2" /> DATA EXPORT
               </Button>
            </div>
         </header>

         {/* Analytics Bento Grid */}
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 space-y-4">
               <div className="flex items-center gap-3 text-blue-600">
                  <HardDrive size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Storage Consumption</span>
               </div>
               <p className="text-5xl font-black text-slate-900 italic tracking-tighter">{formattedStorage} <span className="text-xl font-bold not-italic text-slate-300">MB</span></p>
               <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '45%' }} />
               </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 space-y-4">
               <div className="flex items-center gap-3 text-emerald-600">
                  <Database size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Asset Count</span>
               </div>
               <p className="text-5xl font-black text-slate-900 italic tracking-tighter">{materials.length} <span className="text-xl font-bold not-italic text-slate-300">FILES</span></p>
               <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                  <CheckCircle2 size={12} /> Registry Healthy
               </p>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 p-8 space-y-4 text-white">
               <div className="flex items-center gap-3 text-rose-400">
                  <BarChart3 size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">System Integrity</span>
               </div>
               <p className="text-2xl font-black italic tracking-tighter uppercase leading-tight">Institutional Compliance Active</p>
               <p className="text-[10px] font-bold opacity-40 leading-relaxed uppercase tracking-tighter">Monitoring all 2026 academic data deployments</p>
            </Card>
         </div>

         {/* Global Material Table */}
         <Card className="max-w-7xl mx-auto rounded-[3rem] border-none shadow-sm bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-1 bg-rose-600 rounded-full" />
                  <h2 className="text-2xl font-black italic uppercase tracking-tight text-slate-900">Resource Master List</h2>
               </div>
               <div className="relative w-full md:w-80 group">
                  <FileSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-600 transition-colors" size={18} />
                  <Input
                     placeholder="Search by title or faculty..."
                     className="h-12 pl-12 rounded-2xl bg-slate-50 border-none font-bold"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            <Table>
               <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none">
                     <TableHead className="pl-10 font-black text-[10px] uppercase tracking-widest text-slate-400 py-6">Material Description</TableHead>
                     <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Faculty Member</TableHead>
                     <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Target Units</TableHead>
                     <TableHead className="text-right pr-10 font-black text-[10px] uppercase tracking-widest text-slate-400">Action</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {filteredMaterials.map((mat) => (
                     <TableRow key={mat.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                        <TableCell className="pl-10 py-6">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                 <HardDrive size={20} />
                              </div>
                              <div>
                                 <p className="font-black text-slate-900 uppercase italic text-sm leading-tight">{mat.title}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{mat.fileType} • {(mat.fileSize / 1024).toFixed(0)} KB</p>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2 font-bold text-xs text-slate-600">
                              <Users2 size={14} className="text-rose-600" /> {mat.uploadedBy.name}
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-wrap gap-1">
                              {mat.targetClasses.map((c: any) => (
                                 <Badge key={c.id} className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none rounded-md text-[8px] font-black uppercase px-2">{c.name}</Badge>
                              ))}
                           </div>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                           <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleForceDelete(mat.id)}
                              className="h-10 w-10 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                           >
                              <Trash2 size={18} />
                           </Button>
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
            {filteredMaterials.length === 0 && (
               <div className="p-20 text-center flex flex-col items-center gap-3">
                  <AlertCircle size={40} className="text-slate-100" />
                  <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No matching archival data found</p>
               </div>
            )}
         </Card>
      </div>
   );
}
