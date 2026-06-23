'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Users, School, BookOpen, FileText, UserCog,
  BarChart3, ShieldCheck, Activity, ArrowUpRight,
  TrendingUp, Globe, Database, Bell, Radio, Bus,
  Calendar as CalendarIcon, UserCheck, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  PieChart as RePie, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface ReportDTO {
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalClasses: number;
  totalExams: number;
  totalSubjects: number;
}

export default function AdminDashboard() {
  const [report, setReport] = useState<ReportDTO | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [reportRes, unreadRes, logsRes] = await Promise.all([
          api.get('/admin/reports/summary'),
          api.get('/notifications/unread-count').catch(() => ({ data: { count: 0 } })),
          api.get('/school-finance/audit-logs').catch(() => ({ data: [] }))
        ]);
        setReport(reportRes.data);
        setUnreadCount(unreadRes.data?.count || 0);
        
        // Take last 5 logs sorted by date
        const sortedLogs = (logsRes.data || []).sort((a: any, b: any) =>
          new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime()
        ).slice(0, 5);
        setRecentLogs(sortedLogs);
      } catch (error) {
        toast.error('Failed to synchronize administrative dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const userData = report ? [
    { name: 'Students', value: report.totalStudents, color: '#3b82f6' },
    { name: 'Teachers', value: report.totalTeachers, color: '#10b981' },
    { name: 'Admins', value: report.totalAdmins, color: '#f59e0b' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-slate-500 animate-pulse">Synchronizing Global Registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6 md:space-y-8 bg-[#fcfcfd] min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Admin Console <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-slate-500 font-medium mt-1">Global School ERP Control Board</p>
        </motion.div>

        <div className="flex items-center gap-4">
          <a href="/admin/notifications" className="relative p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm text-slate-700 transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-bounce">
                {unreadCount}
              </span>
            )}
          </a>
          <div className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-2xl border border-slate-200 shadow-sm font-bold text-sm">
            <Globe className="w-4 h-4 text-blue-500" /> System: Online
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Root Verified
          </div>
        </div>
      </div>

      {/* PRIMARY STATS GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Enrollment" value={report?.totalStudents} icon={Users} color="blue" sub="Active Students" />
        <StatCard title="Faculty" value={report?.totalTeachers} icon={UserCog} color="emerald" sub="Teaching Staff" />
        <StatCard title="Classrooms" value={report?.totalClasses} icon={School} color="amber" sub="Active Classes" />
        <StatCard title="Assessments" value={report?.totalExams} icon={BookOpen} color="rose" sub="Total Exams" />
      </div>

      {/* QUICK LINKS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <QuickDashboardLink href="/admin/families" label="Families" icon={Users} color="blue" />
        <QuickDashboardLink href="/admin/parents" label="Parents" icon={UserCheck} color="emerald" />
        <QuickDashboardLink href="/admin/transport" label="Transport" icon={Bus} color="indigo" />
        <QuickDashboardLink href="/admin/calendar" label="Calendar" icon={CalendarIcon} color="amber" />
        <QuickDashboardLink href="/admin/notifications" label="Alerts" icon={Bell} color="rose" />
        <QuickDashboardLink href="/admin/audit" label="Audit Trail" icon={Activity} color="violet" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* CHARTS SECTION */}
        <Card className="lg:col-span-2 border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 p-6">
            <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-850">Infrastructure Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Subjects', val: report?.totalSubjects },
                  { name: 'Classes', val: report?.totalClasses },
                  { name: 'Exams', val: report?.totalExams },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="val" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PIE CHART */}
        <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 p-6">
            <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-850">User Segment Matrix</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePie>
                  <Pie
                    data={userData}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                  >
                    {userData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                </RePie>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {userData.map((u) => (
                <div key={u.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: u.color }} />
                    <span className="text-xs font-black text-slate-655 uppercase tracking-wider">{u.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{u.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* LIVE SYSTEM AUDIT TRAIL */}
        <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-850">Live Audit Trail Feed</CardTitle>
              <CardDescription className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">State mutation logger</CardDescription>
            </div>
            <Activity className="text-slate-400" size={20} />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-2xl hover:bg-slate-100/60 duration-300 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-wider py-0 ${log.actionType?.includes('CREATE') ? 'text-emerald-600 border-emerald-100 bg-emerald-50/50' : 'text-amber-600 border-amber-100 bg-amber-50/50'}`}>
                          {log.actionType}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(log.timestamp || log.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">{log.notes || `${log.entityName} mutation`}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                      {log.performedBy?.username || 'System'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">No recent activity logged</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SYSTEM INTEGRITY BANNER */}
        <motion.div
          whileHover={{ scale: 1.005 }}
          className="rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-800 p-8 text-white relative overflow-hidden shadow-lg flex flex-col justify-between"
        >
          <div className="absolute right-[-20px] top-[-20px] w-48 h-48 opacity-10 rotate-12 bg-white rounded-full blur-2xl" />
          <div>
            <Badge className="bg-white/15 text-white border border-white/20 uppercase font-black tracking-widest text-[9px] py-1 px-3 mb-6">
              Network Guard active
            </Badge>
            <h3 className="text-2xl font-black tracking-tight mb-2">School ERP Integrity Shield</h3>
            <p className="text-blue-100 text-xs leading-relaxed max-w-sm">
              All financial mutations, student profiles, parent links, and attendance entries are securely cryptographic-hashed and mapped in compliance with school ledger guidelines.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <span className="px-4 py-2 bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-sm">
              TLS 1.3 Encryption
            </span>
            <span className="px-4 py-2 bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-sm">
              RBAC Enabled
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, icon: Icon, color, sub }: any) {
  const colorMap: any = {
    blue: "bg-blue-600 text-primary",
    emerald: "bg-emerald-500 text-emerald-500",
    amber: "bg-amber-500 text-amber-500",
    rose: "bg-rose-500 text-rose-500"
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className="border border-slate-100 shadow-sm relative overflow-hidden bg-white rounded-3xl py-4">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${colorMap[color].split(' ')[0]}`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</CardTitle>
          <div className="p-2 rounded-xl bg-slate-50">
            <Icon className={`w-5 h-5 ${colorMap[color].split(' ')[1]}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{value?.toLocaleString() ?? 0}</div>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" /> {sub}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickDashboardLink({ href, label, icon: Icon, color }: { href: string, label: string, icon: any, color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-50 border-blue-100 hover:border-blue-300',
    emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100 hover:border-emerald-300',
    indigo: 'text-indigo-500 bg-indigo-50 border-indigo-100 hover:border-indigo-300',
    amber: 'text-amber-500 bg-amber-50 border-amber-100 hover:border-amber-300',
    rose: 'text-rose-500 bg-rose-50 border-rose-100 hover:border-rose-300',
    violet: 'text-violet-500 bg-violet-50 border-violet-100 hover:border-violet-300',
  };

  return (
    <a href={href} className={`p-4 border rounded-3xl flex flex-col items-center justify-center gap-2 transition-all duration-300 shadow-sm ${colors[color] || 'border-slate-200 hover:bg-slate-50'}`}>
      <Icon size={24} />
      <span className="text-xs font-black uppercase tracking-wider text-slate-700">{label}</span>
    </a>
  );
}
