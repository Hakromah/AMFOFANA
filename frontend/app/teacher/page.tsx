/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen, Users, FileText, Globe, GraduationCap,
  Calendar, Clock, ArrowRight, CheckCircle2, AlertCircle, BarChart3, Search, User, X, Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function TeacherDashboard() {
  const [stats, setStats] = useState({ classes: 0, students: 0, exams: 0, teacherName: '' });
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Global Search States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- 1. DATA CALCULATION (Weighted Class Averages) ---
  const classPerformance = useMemo(() => {
    const performanceMap: Record<string, { total: number; count: number }> = {};
    resultsData.forEach((r: any) => {
      const className = r.exam?.classe?.name || 'Unknown';
      if (!performanceMap[className]) performanceMap[className] = { total: 0, count: 0 };
      performanceMap[className].total += r.marks;
      performanceMap[className].count += 1;
    });

    return Object.entries(performanceMap).map(([name, data]) => ({
      name,
      avg: parseFloat((data.total / data.count).toFixed(1))
    }));
  }, [resultsData]);

  // --- 2. KEYBOARD SHORTCUT (Ctrl + K) ---
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // --- 3. API FETCHING ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [classesRes, examsRes, resultsRes, userRes] = await Promise.all([
          api.get('/teacher/classes'),
          api.get('/teacher/exams'),
          api.get('/teacher/results/filter'),
          api.get('/auth/me')
        ]);

        const totalStudents = classesRes.data.reduce((acc: number, curr: any) => acc + (curr.students?.length || 0), 0);

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcoming = examsRes.data
          .filter((ex: any) => new Date(ex.date) >= now)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3);

        setStats({
          classes: classesRes.data.length,
          students: totalStudents,
          exams: examsRes.data.length,
          teacherName: userRes.data.name
        });
        setResultsData(resultsRes.data);
        setRecentResults(resultsRes.data.slice(0, 5));
        setUpcomingExams(upcoming);
      } catch (error) {
        console.error("Dashboard Sync Error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) return setSearchResults([]);
    setIsSearching(true);
    try {
      const res = await api.get(`/teacher/results/filter?studentId=${query}`);
      const uniqueStudents = Array.from(new Map(res.data.map((item: any) => [item.student.userId, item.student])).values());
      setSearchResults(uniqueStudents);
    } catch (e) { console.error(e); } finally { setIsSearching(false); }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">

      {/* --- HERO SECTION WITH GLOBAL MAP ANIMATION --- */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 text-white min-h-[320px] flex items-center shadow-2xl">
        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Registry Live
            </div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">Welcome back,</h1>
            <h2 className="text-5xl text-blue-400 font-extrabold mb-4">{stats.teacherName || 'Educator'}</h2>
            <p className="text-slate-400 text-lg max-w-md">System synchronized. You have {stats.classes} classes active this semester.</p>
          </motion.div>

          {/* QUICK SEARCH TRIGGER */}
          <Button
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center gap-4 bg-white/10 hover:bg-white/20 border-white/10 rounded-2xl h-16 px-6 backdrop-blur-md transition-all group"
          >
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-blue-400">Quick Finder</p>
              <p className="text-sm font-bold text-white">Search Students...</p>
            </div>
            <div className="bg-white/10 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <Search className="w-5 h-5" />
            </div>
          </Button>
        </div>

        {/* 180 DEGREE ROTATING GLOBE */}
        <motion.div
          className="absolute right-[-5%] top-[-10%] opacity-20 pointer-events-none"
          animate={{ rotateY: 180 }}
          transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        >
          <Globe size={550} className="text-blue-500" strokeWidth={0.5} />
        </motion.div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent z-0" />
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Assigned Classes', val: stats.classes, icon: BookOpen, color: 'bg-blue-600' },
          { label: 'Total Students', val: stats.students, icon: Users, color: 'bg-emerald-500' },
          { label: 'Active Evaluations', val: stats.exams, icon: GraduationCap, color: 'bg-amber-500' }
        ].map((item, i) => (
          <motion.div key={i} whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-none shadow-sm bg-white relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${item.color}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</CardTitle>
                <item.icon className="h-4 w-4 text-slate-300" />
              </CardHeader>
              <CardContent><div className="text-4xl font-black text-slate-800">{loading ? "..." : item.val}</div></CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* --- CLASS PERFORMANCE CHART --- */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <CardTitle className="text-lg font-bold text-slate-700">Class Performance Matrix</CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={45}>
                    {classPerformance.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* --- UPCOMING TIMELINE --- */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2 border-b border-slate-50">
              <CardTitle className="text-sm font-black uppercase text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" /> Upcoming Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {upcomingExams.length > 0 ? upcomingExams.map((ex, i) => (
                <div key={i} className={`p-3 rounded-xl border transition-all ${i === 0 ? 'bg-blue-600 text-white shadow-lg border-blue-700' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                  <p className={`text-[10px] font-black uppercase ${i === 0 ? 'text-blue-100' : 'text-slate-400'}`}>{ex.term}</p>
                  <p className="text-sm font-bold truncate">{ex.name}</p>
                  <div className="flex justify-between mt-2 text-[10px] font-medium">
                    <span className={i === 0 ? 'text-blue-200' : 'text-slate-500'}>{ex.classe.name}</span>
                    <span className={i === 0 ? 'text-white' : 'font-black text-slate-700'}>{ex.startTime}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground italic text-xs">No upcoming assessments.</div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button className="h-14 flex flex-col gap-1 bg-slate-800 hover:bg-slate-900" asChild>
              <a href="/teacher/results"><GraduationCap size={16} /><span className="text-[10px] font-bold">REGISTRY</span></a>
            </Button>
            <Button className="h-14 flex flex-col gap-1" asChild>
              <a href="/teacher/exams"><Calendar size={16} /><span className="text-[10px] font-bold">SCHEDULE</span></a>
            </Button>
          </div>
        </div>
      </div>

      {/* --- GLOBAL SEARCH DIALOG (Fixed for accessibility) --- */}
      <AnimatePresence>
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-white rounded-3xl shadow-2xl">
            <DialogHeader className="p-6 bg-slate-50 border-b">
              {/* Mandatory Accessibility Title */}
              <DialogTitle className="sr-only">Student Global Search</DialogTitle>

              <div className="flex items-center gap-4">
                <Search className="w-6 h-6 text-blue-600" />
                <Input
                  autoFocus
                  placeholder="Search student by Name or ID (Ctrl+K)..."
                  className="text-xl border-none focus-visible:ring-0 bg-transparent p-0 font-medium"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {isSearching && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}><X size={20} /></Button>
              </div>
            </DialogHeader>

            <div className="max-h-[400px] overflow-y-auto p-4">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((s: any) => (
                    <button
                      key={s.userId}
                      onClick={() => {
                        setIsSearchOpen(false);
                        window.location.href = `/teacher/results?studentId=${s.userId}`;
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <User size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-700">{s.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{s.userId}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              ) : searchQuery.length > 1 ? (
                <div className="py-12 text-center text-slate-400 italic">No matches found for {searchQuery}</div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">Enter student details to search the registry...</div>
              )}
            </div>

            <div className="p-3 bg-slate-900 flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              <span>AMF Registry Central Intelligence</span>
              <span className="flex gap-4"><span>↵ Select</span><span>ESC Close</span></span>
            </div>
          </DialogContent>
        </Dialog>
      </AnimatePresence>
    </div>
  );
}

// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';

// import { useEffect, useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { BookOpen, Users, FileText, Globe, GraduationCap, Calendar } from 'lucide-react';
// import { motion } from 'framer-motion';
// import api from '@/lib/api';

// export default function TeacherDashboard() {
//   const [stats, setStats] = useState({
//     classes: 0,
//     students: 0,
//     exams: 0,
//     teacherName: ''
//   });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       try {
//         const [classesRes, examsRes, userRes] = await Promise.all([
//           api.get('/teacher/classes'),
//           api.get('/teacher/exams'),
//           api.get('/auth/me')
//         ]);

//         // Calculate unique students across all assigned classes
//         const totalStudents = classesRes.data.reduce((acc: number, curr: any) => {
//           return acc + (curr.students?.length || 0);
//         }, 0);

//         setStats({
//           classes: classesRes.data.length,
//           students: totalStudents,
//           exams: examsRes.data.length,
//           teacherName: userRes.data.name
//         });
//       } catch (error) {
//         console.error("Failed to load dashboard data", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchDashboardData();
//   }, []);

//   return (
//     <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
//       {/* LANDING ANIMATION SECTION */}
//       <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 mb-8 text-white min-h-[300px] flex items-center shadow-2xl">
//         <div className="relative z-10 max-w-lg">
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.8 }}
//           >
//             <h1 className="text-4xl font-black mb-2">Welcome Back,</h1>
//             <h2 className="text-5xl text-blue-400 font-extrabold mb-4">
//               {stats.teacherName || 'Educator'}
//             </h2>
//             <p className="text-slate-400 text-lg">
//               The global academic registry is synced. You have {stats.classes} classes to manage today.
//             </p>
//           </motion.div>
//         </div>

//         {/* ROTATING GLOBAL MAP ANIMATION */}
//         <motion.div
//           className="absolute right-[-10%] top-[-20%] opacity-20 pointer-events-none"
//           initial={{ rotateY: 0 }}
//           animate={{ rotateY: 180 }}
//           transition={{
//             duration: 20,
//             repeat: Infinity,
//             repeatType: "reverse",
//             ease: "easeInOut"
//           }}
//           style={{ perspective: 1000 }}
//         >
//           <Globe size={500} className="text-blue-500" strokeWidth={0.5} />
//         </motion.div>

//         {/* Decorative elements */}
//         <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent z-0" />
//       </div>

//       {/* STATS GRID */}
//       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//         <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
//           <Card className="border-none shadow-sm bg-white overflow-hidden relative">
//             <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider">Assigned Classes</CardTitle>
//               <div className="p-2 bg-blue-50 rounded-lg">
//                 <BookOpen className="h-5 w-5 text-blue-600" />
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="text-4xl font-black text-slate-800">
//                 {loading ? "..." : stats.classes}
//               </div>
//               <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
//                 <CheckCircle2 className="w-3 h-3 text-green-500" /> Active curriculum
//               </p>
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
//           <Card className="border-none shadow-sm bg-white overflow-hidden relative">
//             <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider">Total Students</CardTitle>
//               <div className="p-2 bg-emerald-50 rounded-lg">
//                 <Users className="h-5 w-5 text-emerald-600" />
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="text-4xl font-black text-slate-800">
//                 {loading ? "..." : stats.students}
//               </div>
//               <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
//                 <GraduationCap className="w-3 h-3 text-emerald-500" /> Across all departments
//               </p>
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
//           <Card className="border-none shadow-sm bg-white overflow-hidden relative">
//             <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider">Active Assessments</CardTitle>
//               <div className="p-2 bg-amber-50 rounded-lg">
//                 <FileText className="h-5 w-5 text-amber-600" />
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="text-4xl font-black text-slate-800">
//                 {loading ? "..." : stats.exams}
//               </div>
//               <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
//                 <Calendar className="w-3 h-3 text-amber-500" /> Scheduled evaluations
//               </p>
//             </CardContent>
//           </Card>
//         </motion.div>
//       </div>

//       {/* QUICK ACTIONS SECTION */}
//       <div className="grid lg:grid-cols-2 gap-8 mt-8">
//         <Card className="border-none shadow-sm">
//           <CardHeader>
//             <CardTitle className="text-xl">Quick Links</CardTitle>
//           </CardHeader>
//           <CardContent className="grid grid-cols-2 gap-4">
//             <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
//                 <a href="/teacher/results">
//                     <GraduationCap className="w-6 h-6" />
//                     Enter Marks
//                 </a>
//             </Button>
//             <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
//                 <a href="/teacher/exams">
//                     <Calendar className="w-6 h-6" />
//                     Schedule Exam
//                 </a>
//             </Button>
//           </CardContent>
//         </Card>

//         {/* INFORMATIVE DIAGRAM AREA */}
//         <Card className="border-none shadow-sm flex items-center justify-center p-6 bg-blue-900 text-white">
//             <div className="text-center">
//                 <Globe className="w-12 h-12 mx-auto mb-4 text-blue-300 animate-pulse" />
//                 <h3 className="font-bold text-lg">Central Academic Ledger</h3>
//                 <p className="text-blue-200 text-sm max-w-xs mx-auto">
//                     Your results are automatically synced with the administrator and student portals in real-time.
//                 </p>
//             </div>
//         </Card>
//       </div>
//     </div>
//   );
// }

// // Helper imports needed for Lucide
// import { CheckCircle2 } from 'lucide-react';
// import { Button } from '@/components/ui/button';

