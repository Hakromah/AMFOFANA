'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  FileText,
  TrendingUp,
  Clock,
  Award,
  Calendar as CalendarIcon,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer
} from 'recharts';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock data for the chart if backend doesn't provide weekly progress yet
const attendanceData = [
  { day: 'Mon', value: 100 },
  { day: 'Tue', value: 80 },
  { day: 'Wed', value: 95 },
  { day: 'Thu', value: 90 },
  { day: 'Fri', value: 100 },
];

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    courseCount: 0,
    attendance: 0,
    materials: 0,
    averageGrade: 'N/A'
  });
  const [studentName, setStudentName] = useState('Student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, userRes] = await Promise.all([
          api.get('/student/dashboard-stats'),
          api.get('/auth/me') // Assuming you have an endpoint for user profile
        ]);
        setStats(statsRes.data);
        setStudentName(userRes.data.name);
      } catch (error) {
        console.error("Dashboard sync error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 lg:p-10 space-y-8">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter sm:text-5xl">
            Welcome back, <span className="text-blue-600">{(studentName || 'Student').split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">
            System Status: <span className="text-emerald-500">Active</span> • Term 2 Year 2026
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl px-6 h-12 font-bold shadow-sm">
            <CalendarIcon size={18} className="mr-2 text-blue-600" />
            Schedule
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Courses', value: stats.courseCount, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Attendance', value: `${stats.attendance}%`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Resources', value: stats.materials, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Avg. Grade', value: stats.averageGrade, icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm rounded-4 overflow-hidden bg-white group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                    <item.icon size={24} />
                  </div>
                  <Badge variant="outline" className="text-[10px] border-slate-100 uppercase font-black text-slate-400">Live</Badge>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{item.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart Section */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Attendance Pulse</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Weekly consistency track</p>
            </div>
            <TrendingUp className="text-emerald-500" />
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                />
                <YAxis hide domain={[0, 100]} />
                <ReTooltip
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 text-white p-8 overflow-hidden relative group">
            <div className="relative z-10">
              <h2 className="text-lg font-black uppercase tracking-widest mb-4">Exam Reminder</h2>
              <div className="flex items-center gap-4 bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/10">
                <div className="bg-blue-500 p-3 rounded-2xl">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Calculus Finals</p>
                  <p className="text-sm font-medium">In 2 days • 09:00 AM</p>
                </div>
              </div>
              <Button className="w-full mt-6 bg-white text-slate-900 hover:bg-blue-500 hover:text-white rounded-2xl h-12 font-black uppercase text-[10px] tracking-widest transition-all">
                Study Guide
              </Button>
            </div>
            <BookOpen className="absolute -right-8 -bottom-8 text-white/5" size={180} />
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Recent Activity</h2>
            <div className="space-y-6">
              {[
                { title: 'New Grade Released', time: '1h ago', type: 'grade' },
                { title: 'English Material Uploaded', time: '3h ago', type: 'file' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 tracking-tight">{activity.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{activity.time}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


// 'use client';

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { BookOpen, CheckCircle, FileText } from 'lucide-react';

// export default function StudentDashboard() {
//   return (
//     <div className="p-8">
//       <h1 className="text-3xl font-bold mb-8">Student Dashboard</h1>
//       <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Enrolled Courses
//             </CardTitle>
//             <BookOpen className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">6</div>
//             <p className="text-xs text-muted-foreground">
//               courses this semester
//             </p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Overall Attendance
//             </CardTitle>
//             <CheckCircle className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">95%</div>
//             <p className="text-xs text-muted-foreground">
//               Great work!
//             </p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Downloaded Materials
//             </CardTitle>
//             <FileText className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">15</div>
//             <p className="text-xs text-muted-foreground">
//               files downloaded
//             </p>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
