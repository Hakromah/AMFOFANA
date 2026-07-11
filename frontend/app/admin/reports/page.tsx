/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import api from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Activity,
  BookOpen,
  Briefcase,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  PieChart as LucidePieChart,
  RefreshCcw,
  School,
  ShieldCheck,
  TrendingUp,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SCHOOL_CONFIG } from '@/lib/school-config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

interface ReportDTO {
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalClasses: number;
  totalExams: number;
  totalSubjects: number;
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<number | string>('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/reports/summary');
      setReport(response.data);
    } catch (error) {
      toast.error('Intelligence synchronization failed.');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const exportPDF = () => {
    if (!report) return;
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageW, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(SCHOOL_CONFIG.name, 15, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(SCHOOL_CONFIG.address || '', 15, 22);
      doc.text(`Contact: ${SCHOOL_CONFIG.contact || ''}`, 15, 28);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('INSTITUTIONAL INTELLIGENCE REPORT', pageW - 15, 16, { align: 'right' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageW - 15, 22, { align: 'right' });

      // Blue divider
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 40, pageW, 1.5, 'F');

      // Title
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Executive Summary and Indicator Overview', 15, 55);

      // Info Table
      autoTable(doc, {
        startY: 62,
        head: [['Measurement Indicator', 'Count / Value', 'Classification']],
        body: [
          ['Total Active Students', report.totalStudents.toLocaleString(), 'Human Capital - Learners'],
          ['Teaching Staff / Instructors', report.totalTeachers.toLocaleString(), 'Human Capital - Educators'],
          ['System Administrators', report.totalAdmins.toLocaleString(), 'Governance and Operations'],
          ['Active Classes / Groups', report.totalClasses.toLocaleString(), 'Structural Capacity'],
          ['Academic Exams / Assessments', report.totalExams.toLocaleString(), 'Quality Assurance'],
          ['Course Catalog / Subjects', report.totalSubjects.toLocaleString(), 'Educational Assets'],
          ['Total Managed System Accounts', (report.totalStudents + report.totalTeachers + report.totalAdmins).toLocaleString(), 'Total Staff Base'],
        ],
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      // Signature section
      const finalY = (doc as any).lastAutoTable.finalY + 25;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, finalY, 75, finalY);
      doc.line(pageW - 75, finalY, pageW - 15, finalY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Office of the Registrar', 15, finalY + 5);
      doc.text('Head of System Operations', pageW - 15, finalY + 5, { align: 'right' });

      // Footer
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageH - 12, pageW, 12, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`${SCHOOL_CONFIG.name} — Confidential Internal Document`, pageW / 2, pageH - 5, { align: 'center' });

      doc.save(`institutional-intelligence-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF report exported successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export PDF');
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center leading-relaxed">
        Aggregating Institutional <br /> Intelligence...
      </p>
    </div>
  );

  const humanCapitalData = [
    { name: 'Students', value: report?.totalStudents || 0, color: '#3b82f6' },
    { name: 'Teachers', value: report?.totalTeachers || 0, color: '#f59e0b' },
    { name: 'Admins', value: report?.totalAdmins || 0, color: '#f43f5e' },
  ];

  const structuralData = [
    { name: 'Classes', count: report?.totalClasses || 0 },
    { name: 'Exams', count: report?.totalExams || 0 },
    { name: 'Subjects', count: report?.totalSubjects || 0 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-[clamp(1.2rem,2vw+1rem,2rem)] lg:p-[clamp(1.2rem,2vw+1rem,2rem)] space-y-[clamp(1rem,2vw+1rem,2rem)]">
      {/* Header Section */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Live Analysis Hall</span>
          </div>
          <h1 className="text-[clamp(1.4rem,3.5vw,4rem)] font-black text-slate-900 tracking-tighter sm:text-[clamp(1.4rem,3.5vw,4rem)] italic uppercase">
            School <span className="text-primary">Reports.</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchReport}
            variant="outline"
            className="rounded-[clamp(1.2rem,2vw+1rem,2rem)] h-14 w-14 p-0 border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RefreshCcw size={20} className="text-slate-600" />
          </Button>
          <Button onClick={exportPDF} className="bg-slate-900 hover:bg-blue-600 text-white rounded-[clamp(1.2rem,2vw+1rem,2rem)] h-14 px-8 font-black transition-all shadow-xl shadow-slate-200 cursor-pointer">
            <Download size={20} className="mr-2" /> EXPORT REPORTS
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-[clamp(0rem,2vw+1rem,2rem)]">

        {/* Section 1: Human Capital */}
        <div className="space-y-[clamp(0rem,2vw+1rem,2rem)]">
          <div className="flex items-center gap-3 px-2">
            <LucidePieChart className="text-slate-400" size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Human Capital Index</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Student Enrollment"
              value={report?.totalStudents}
              icon={GraduationCap}
              color="blue"
              sub="Active learners in registry"
            />
            <StatCard
              label="Teaching Staff"
              value={report?.totalTeachers}
              icon={Briefcase}
              color="amber"
              sub="Certified instructors"
            />
            <StatCard
              label="System Authority"
              value={report?.totalAdmins}
              icon={ShieldCheck}
              color="rose"
              sub="Administrative controllers"
            />
          </div>
        </div>

        {/* Section 2: Recharts Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Human Capital Distribution */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Staffing Ratio</h3>
              <p className="text-xs font-bold text-slate-400">Proportional school membership distribution</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={humanCapitalData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {humanCapitalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Accounts']} />
                  <Legend verticalAlign="bottom" height={36} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Academic & Structural Assets */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Academic Asset Load</h3>
              <p className="text-xs font-bold text-slate-400">Inventory comparison of classes, exams, and subjects</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={structuralData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                    <Cell fill="#6366f1" />
                    <Cell fill="#3b82f6" />
                    <Cell fill="#10b981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Section 3: Structural Capacity */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Activity className="text-slate-400" size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Structural Capacity</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-[clamp(1.2rem,2vw+1rem,2rem)] p-10 text-white shadow-2xl relative overflow-hidden group col-span-1 md:col-span-1">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <School size={120} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-4">Functional Units</p>
              <h3 className="text-6xl font-black italic tracking-tighter mb-2">{report?.totalClasses}</h3>
              <p className="text-sm font-bold opacity-60">Total active classes</p>
            </div>

            <div className="bg-white rounded-[clamp(1.2rem,2vw+1rem,2rem)] p-10 shadow-sm border border-slate-100 md:hover:border-primary duration-500 transition-colors flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 bg-blue-50 rounded-[clamp(1.2rem,2vw+1rem,2rem)] flex items-center justify-center text-primary mb-6">
                  <BookOpen size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Academic Assessments</p>
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">{report?.totalExams}</h3>
              </div>
              <Badge className="w-fit bg-blue-100 text-primary border-none mt-6 font-black text-[9px] tracking-widest">ACTIVE SESSION {currentYear || '2026'}</Badge>
            </div>

            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 md:hover:border-primary duration-500 transition-colors flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                  <FileText size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Course Catalog</p>
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">{report?.totalSubjects}</h3>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-6">Defined academic subjects</p>
            </div>
          </div>
        </div>

        {/* Intelligence Footer */}
        <div className="bg-blue-600 rounded-[clamp(1.2rem,2vw+1rem,2rem)] p-[clamp(1.2rem,2vw+1rem,2rem)] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-blue-200">
          <div className="flex items-center gap-6 text-center md:text-left">
            <div className="p-4 bg-white/10 rounded-[clamp(1.2rem,2vw+1rem,2rem)]">
              <Users size={32} />
            </div>
            <div>
              <p className="text-2xl font-black italic tracking-tighter leading-none">Platform Accounts Database</p>
              <p className="text-sm font-bold opacity-80 mt-1">Total set of accounts managed by the platform</p>
            </div>
          </div>
          <div className="text-6xl font-black italic tracking-tighter">
            {(report?.totalStudents || 0) + (report?.totalTeachers || 0) + (report?.totalAdmins || 0)}
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-component for individual statistics
function StatCard({ label, value, icon: Icon, color, sub }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-primary",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 md:hover:border-primary duration-500 transition-colors"
    >
      <div className={`h-14 w-14 ${colorMap[color]} rounded-2xl flex items-center justify-center mb-6`}>
        <Icon size={28} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
      <div className="flex items-end gap-2 mb-2">
        <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">{value}</h3>
        <TrendingUp size={20} className="text-emerald-500 mb-1" />
      </div>
      <p className="text-xs font-bold text-slate-400">{sub}</p>
    </motion.div>
  );
}
