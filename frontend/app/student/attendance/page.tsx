/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
   Calendar,
   CheckCircle2,
   Clock,
   Filter,
   Loader2,
   Download
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

interface AttendanceRecord {
   id: number;
   present: boolean;
}

interface AttendanceSession {
   id: number;
   date: string;
   classe: {
      name: string;
   };
   records: AttendanceRecord[];
}

export default function StudentAttendancePage() {
   const [sessions, setSessions] = useState<AttendanceSession[]>([]);
   const [loading, setLoading] = useState(true);
   const [monthFilter, setMonthFilter] = useState<string>('all');

   useEffect(() => {
      const fetchAttendance = async () => {
         try {
            const response = await api.get('/student/attendance');
            // Defense: Ensure we handle non-array responses
            setSessions(Array.isArray(response.data) ? response.data : []);
         } catch (error: any) {
            console.error("Fetch error:", error);
            toast.error('Registry Sync Failed', {
               description: error.response?.data?.message || 'Please check your connection.'
            });
         } finally {
            setLoading(false);
         }
      };
      fetchAttendance();
   }, []);

   // --- Filter Logic ---
   const filteredSessions = sessions.filter(session => {
      if (monthFilter === 'all') return true;
      const date = new Date(session.date);
      return date.getMonth().toString() === monthFilter;
   });

   // --- Stats Calculation ---
   const total = filteredSessions.length;
   const present = filteredSessions.filter(s => s.records?.[0]?.present).length;
   const rate = total > 0 ? Math.round((present / total) * 100) : 0;

   if (loading) {
      return (
         <div className="h-[80vh] w-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Decrypting Registry...</p>
         </div>
      );
   }

   return (
      <div className="p-6 lg:p-10 bg-[#f8fafc] min-h-screen space-y-8">
         {/* Header Section */}
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <h1 className="text-[clamp(1.2rem,2.5vw+1rem,3rem)] font-black text-slate-900 tracking-tighter">
                  Registry <span className="text-primary">Pulse</span>
               </h1>
               <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
                  Academic Tracking • Term 2 Year 2026
               </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
               <Select onValueChange={setMonthFilter} defaultValue="all">
                  <SelectTrigger className="w-full md:w-[200px] h-12 rounded-xl border-none bg-white shadow-sm font-bold text-primary border md:hover:border-primary duration-500 transition-colors  px-5">
                     <div className="flex items-center gap-2">
                        <Filter size={14} className="text-primary" />
                        <SelectValue placeholder="Filter by Month" />
                     </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                     <SelectItem value="all" className="font-bold">All Months</SelectItem>
                     <SelectItem value="0" className="font-bold">January</SelectItem>
                     <SelectItem value="1" className="font-bold">February</SelectItem>
                     <SelectItem value="2" className="font-bold">March</SelectItem>
                     <SelectItem value="3" className="font-bold">April</SelectItem>
                  </SelectContent>
               </Select>

               <Button className="group/download p-3 bg-white  border border-primary/10 rounded-xl text-white shadow-sm md:hover:border-primary duration-500 transition-colors">
                  <Download size={20} className='text-primary  duration-500 transition-colors' />
               </Button>
            </div>
         </header>

         {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-none shadow-xl rounded-3xl bg-slate-900 text-white p-8 relative overflow-hidden">
               <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Attendance Rate</p>
                        <h2 className="text-6xl font-black italic tracking-tighter">{rate}%</h2>
                     </div>
                     <Badge className="bg-primary/20 text-blue-400 border-none font-black px-4 py-1 uppercase text-[9px]">Live Data</Badge>
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Consistency Track</span>
                        <span className={rate > 75 ? 'text-emerald-400' : 'text-rose-400'}>{present} / {total} Sessions</span>
                     </div>
                     <Progress value={rate} className="h-3 bg-white/5" style={{ ['--progress-foreground' as any]: '#3b82f6' }} />
                  </div>
               </div>
               <CheckCircle2 className="absolute -right-12 -bottom-12 text-white/5" size={240} />
            </Card>

            <Card className="border md:hover:border-primary duration-500 shadow-sm rounded-3xl bg-white p-8 flex flex-col justify-center gap-4 border-slate-100">
               <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white">
                  <Clock size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Last Entry</p>
                  <h4 className="text-xl font-black text-slate-900 italic">
                     {sessions[0] ? new Date(sessions[0].date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'N/A'}
                  </h4>
               </div>
               <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">The registry is updated by teachers at the end of every session.</p>
            </Card>
         </div>

         {/* Registry Table */}
         <Card className="border md:hover:border-primary duration-500 shadow-sm rounded-3xl bg-white overflow-hidden border-slate-100">
            <Table>
               <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-none">
                     <TableHead className="pl-10 py-6 font-black uppercase text-[10px] tracking-widest text-primary">Registry Date</TableHead>
                     <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary">Class Session</TableHead>
                     <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-widest text-primary">Status</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {filteredSessions.length > 0 ? filteredSessions.map((session) => {
                     const isPresent = session.records?.[0]?.present;
                     return (
                        <TableRow key={session.id} className="border-slate-50 hover:bg-blue-50/10 transition-all duration-300">
                           <TableCell className="pl-10 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-primary rounded-lg text-white border border-slate-100">
                                    <Calendar size={14} />
                                 </div>
                                 <span className="font-black text-slate-700 tracking-tight">
                                    {new Date(session.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                 </span>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="flex flex-col">
                                 <span className="font-black text-slate-900 uppercase text-xs tracking-tight italic">{session.classe?.name}</span>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Academic Curriculum</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-right pr-10">
                              <Badge className={`rounded-xl px-5 py-1.5 font-black uppercase text-[9px] tracking-tighter border-none shadow-sm ${isPresent ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                 }`}>
                                 {isPresent ? 'Verified Present' : 'Marked Absent'}
                              </Badge>
                           </TableCell>
                        </TableRow>
                     );
                  }) : (
                     <TableRow>
                        <TableCell colSpan={3} className="h-64 text-center">
                           <div className="flex flex-col items-center justify-center gap-2">
                              <Calendar className="text-primary mb-2" size={40} />
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Registry Data Found</p>
                           </div>
                        </TableCell>
                     </TableRow>
                  )}
               </TableBody>
            </Table>
         </Card>
      </div>
   );
}
