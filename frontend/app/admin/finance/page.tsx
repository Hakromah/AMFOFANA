'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, DollarSign, ArrowUpRight, TrendingUp, ShieldAlert,
  Percent, CreditCard, Landmark, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function FinanceDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school-finance/stats');
      setStats(res.data);
    } catch (e: any) {
      toast.error('Failed to sync financial analytics ledger');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Synchronizing Accounting Ledger...</p>
      </div>
    );
  }

  const paidRatio = stats?.totalStudents > 0 
    ? Math.round((stats.paidStudents / stats.totalStudents) * 100) 
    : 0;

  const kpis = [
    {
      title: 'Monthly Revenue',
      value: `${(stats?.monthlyRevenue || 0).toLocaleString()} GNF`,
      desc: 'All approved payment entries',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    },
    {
      title: 'Outstanding Debt',
      value: `${(stats?.outstandingDebt || 0).toLocaleString()} GNF`,
      desc: 'Remaining unpaid invoice balances',
      icon: ShieldAlert,
      color: 'text-rose-600 bg-rose-50 border-rose-100'
    },
    {
      title: 'Salary Expenses',
      value: `${(stats?.salaryExpenses || 0).toLocaleString()} GNF`,
      desc: 'Disbursed payroll payments',
      icon: CreditCard,
      color: 'text-blue-600 bg-blue-50 border-blue-100'
    },
    {
      title: 'Payment Completion Ratio',
      value: `${paidRatio}%`,
      desc: `${stats?.paidStudents || 0} of ${stats?.totalStudents || 0} students fully paid`,
      icon: Percent,
      color: 'text-amber-600 bg-amber-50 border-amber-100'
    }
  ];

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none italic uppercase">Finance Command Center</h1>
          <p className="text-sm text-slate-500 font-medium">Real-time ledger audit totals and payment completion analytics</p>
        </div>
        <button 
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 h-11 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-300 shadow-sm text-xs font-black uppercase tracking-wider text-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Ledger
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="border-0 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black tracking-wider text-slate-400 uppercase">{kpi.title}</span>
                  <div className={`p-2.5 rounded-2xl border ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{kpi.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Line Chart */}
        <Card className="border-0 shadow-xl shadow-slate-100/50 rounded-3xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-6 py-5">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Revenue & Debt Dynamics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.yearlyTrends || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                  <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                    labelClassName="font-black text-xs text-slate-400 uppercase tracking-widest"
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue GNF" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="debt" name="Unpaid Debt GNF" stroke="#f43f5e" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="border-0 shadow-xl shadow-slate-100/50 rounded-3xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-6 py-5">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" /> Revenue Allocations (GNF)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Tuition', value: stats?.tuitionRevenue || 0, fill: '#3b82f6' },
                  { name: 'Transport', value: stats?.transportationRevenue || 0, fill: '#10b981' },
                  { name: 'Salary Expenses', value: stats?.salaryExpenses || 0, fill: '#f59e0b' }
                ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                  <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="value" name="Amount GNF" radius={[10, 10, 0, 0]}>
                    {(stats ? [
                      { name: 'Tuition', value: stats?.tuitionRevenue || 0, fill: '#3b82f6' },
                      { name: 'Transport', value: stats?.transportationRevenue || 0, fill: '#10b981' },
                      { name: 'Salary Expenses', value: stats?.salaryExpenses || 0, fill: '#f43f5e' }
                    ] : []).map((entry, index) => (
                      <Line key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
