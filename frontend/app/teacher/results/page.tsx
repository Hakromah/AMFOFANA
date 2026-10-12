/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Edit3, FileSpreadsheet, LayoutGrid,
  ListFilter, Lock, Save, Search, Send, TrendingUp, X, Plus,
  CheckCircle2, BookOpen, Award, Clock
} from 'lucide-react';
import {
  CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

// ─── National Guinea Scale Helper (/20) ─────────────────────────────────────────
function resolveGrade20(marks: number | string, maxScore = 20): { letter: string; remark: string; isPass: boolean } {
  const num = typeof marks === 'string' ? parseFloat(marks) : marks;
  if (isNaN(num) || num === null || num === undefined) {
    return { letter: '-', remark: '-', isPass: false };
  }
  const s20 = maxScore > 0 && maxScore !== 20 ? (num / maxScore) * 20 : num;

  if (s20 >= 18) return { letter: 'A+', remark: 'Excellent', isPass: true };
  if (s20 >= 16) return { letter: 'A',  remark: 'Very Good', isPass: true };
  if (s20 >= 14) return { letter: 'B+', remark: 'Good', isPass: true };
  if (s20 >= 12) return { letter: 'B',  remark: 'Above Average', isPass: true };
  if (s20 >= 10) return { letter: 'C',  remark: 'Passable (Pass)', isPass: true };
  if (s20 >= 8)  return { letter: 'D',  remark: 'Below Average', isPass: false };
  return { letter: 'F',  remark: 'Fail', isPass: false };
}

// ─── Normalizer ───────────────────────────────────────────────────────────────
function normalizeArray<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) {
    return data.data.map((item: any) => {
      if (item && typeof item === 'object' && item.attributes) {
        return { id: item.id, documentId: item.documentId, ...item.attributes };
      }
      return item;
    });
  }
  return [];
}

// ─── A4 Landscape Gradebook PDF Export ────────────────────────────────────────
const exportGradebookPDF = (
  reportData: any[],
  exams: any[],
  className: string,
  schoolName = 'AMFOFANA ACADEMY'
) => {
  if (reportData.length === 0) {
    toast.error('No gradebook data to export.');
    return;
  }
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as any;
    const pageW = doc.internal.pageSize.getWidth();
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Header banner
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(schoolName.toUpperCase(), 14, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text('Official Gradebook (Guinean National Scale /20) • Academic Performance Sheet', 14, 18);
    doc.text(`Document generated on: ${date}`, 14, 23);

    // Class badge
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(pageW - 65, 6, 51, 16, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`CLASS: ${className}`, pageW - 39.5, 16, { align: 'center' });

    // Section title
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ACADEMIC PERFORMANCE MATRIX (SCALE /20)', 14, 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Students: ${reportData.length}   |   Total Assessments: ${exams.length}   |   Passing Mark: 10.00 / 20`, 14, 44);

    // Columns
    const head = [[
      '#',
      'Student ID',
      'Student Name',
      ...exams.map((e: any) => `${e?.name || 'Assessment'}\n(Coef: ${e?.weight ?? 1})`),
      'Average (/20)',
      'Grade',
      'Decision',
    ]];

    const body = reportData.map((student: any, idx: number) => {
      let totalWeighted = 0;
      let totalWeight = 0;

      const scores = exams.map((e: any) => {
        const cell = student.marks[e.id];
        const val = cell?.val !== undefined && cell?.val !== null && cell?.val !== '--' ? Number(cell.val) : null;
        if (val !== null && !isNaN(val)) {
          const maxS = Number(e.maxScore || 20);
          const score20 = maxS > 0 && maxS !== 20 ? (val / maxS) * 20 : val;
          const w = Number(e.weight || 1);
          totalWeighted += score20 * w;
          totalWeight += w;
          return score20.toFixed(2);
        }
        return '-';
      });

      const weightedAvg = totalWeight > 0 ? (totalWeighted / totalWeight) : null;
      const avgStr = weightedAvg !== null ? `${weightedAvg.toFixed(2)}` : '-';
      const gi = weightedAvg !== null ? resolveGrade20(weightedAvg) : { letter: '-', remark: '-', isPass: false };

      return [
        String(idx + 1),
        student.userId || 'N/A',
        student.name || 'Student',
        ...scores,
        avgStr,
        gi.letter,
        weightedAvg !== null ? (gi.isPass ? 'Pass' : 'Fail') : '-',
      ];
    });

    autoTable(doc, {
      startY: 48,
      head,
      body,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59] as any,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
        valign: 'middle',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] as any },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 26, fontSize: 7.5 },
        2: { cellWidth: 42, fontStyle: 'bold' },
        [exams.length + 3]: { halign: 'center', cellWidth: 24, fontStyle: 'bold', textColor: [37, 99, 235] as any },
        [exams.length + 4]: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        [exams.length + 5]: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          const colIdx = data.column.index;
          // Exam score cells
          if (colIdx >= 3 && colIdx < exams.length + 3) {
            const raw = parseFloat(data.cell.raw as string);
            if (!isNaN(raw)) {
              if (raw < 10) {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
              } else if (raw >= 14) {
                data.cell.styles.textColor = [5, 150, 105];
              }
              data.cell.styles.halign = 'center';
            }
          }
          // Decision cell
          if (colIdx === exams.length + 5) {
            const dec = data.cell.raw as string;
            if (dec === 'Pass') data.cell.styles.textColor = [5, 150, 105];
            else if (dec === 'Fail') data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.halign = 'center';
          }
        }
      },
    });

    // Footer
    const finalY = doc.lastAutoTable?.finalY ?? 180;
    const footerY = Math.max(finalY + 12, 185);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, footerY, pageW - 14, footerY);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${schoolName}  |  Official Class Gradebook: ${className}  |  ${date}  |  Confidential`,
      pageW / 2, footerY + 5, { align: 'center' }
    );

    doc.save(`Gradebook_${className.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
    toast.success('Gradebook PDF report exported successfully!');
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    toast.error('Failed to export PDF.');
  }
};

export default function TeacherResultsPage() {
  // ─── Datasets ────────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [results, setResults] = useState<any[]>([]);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExamId, setFilterExamId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Dialog & Inline Edit States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>({});
  const [savingBulk, setSavingBulk] = useState(false);
  const [submittingDrafts, setSubmittingDrafts] = useState(false);
  const [selectedStudentForChart, setSelectedStudentForChart] = useState<any | null>(null);

  // Dialog Form State
  const [formClassId, setFormClassId] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formExamId, setFormExamId] = useState('');
  const [formMarks, setFormMarks] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formStudentsList, setFormStudentsList] = useState<any[]>([]);
  const [formExamsList, setFormExamsList] = useState<any[]>([]);
  const [savingResult, setSavingResult] = useState(false);

  // ─── Fetch Classes ───────────────────────────────────────────────────────────
  const fetchClasses = async () => {
    try {
      const response = await api.get('/teacher/classes');
      const cls = normalizeArray<any>(response.data);
      setClasses(cls);
      if (cls.length > 0 && selectedClassId === 'all') {
        setSelectedClassId(String(cls[0].id));
      }
    } catch (error) {
      toast.error('Failed to fetch class roster');
    }
  };

  // ─── Fetch Filtered Results List ─────────────────────────────────────────────
  const fetchResultsList = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedClassId !== 'all') params.append('classId', selectedClassId);
    try {
      const response = await api.get(`/teacher/results/filter?${params.toString()}`);
      setResults(normalizeArray<any>(response.data));
    } catch (error) {
      setResults([]);
    }
  }, [selectedClassId]);

  // ─── Fetch Gradebook Matrix Data ─────────────────────────────────────────────
  const fetchGradebookData = useCallback(async () => {
    try {
      const examsRes = await api.get('/teacher/exams').catch(() => ({ data: [] }));
      const allExamsList = normalizeArray<any>(examsRes.data);
      setAllExams(allExamsList);

      if (selectedClassId === 'all') {
        setExams(allExamsList);
        setReportData([]);
        return;
      }

      const classExams = allExamsList.filter((e: any) => {
        const cId = e?.classe?.id ?? e?.classe;
        return cId && String(cId) === String(selectedClassId);
      });
      setExams(classExams);

      const resultsRes = await api.get(`/teacher/classes/${selectedClassId}/gradebook`).catch(() => ({ data: [] }));
      const gradebookRows = normalizeArray<any>(resultsRes.data);
      const studentMap: Record<string, any> = {};

      gradebookRows.forEach((r: any) => {
        const sId = r?.student?.id;
        if (!sId) return;
        const examId = r?.exam?.id;
        if (!examId) return;

        if (!studentMap[sId]) {
          studentMap[sId] = {
            id: sId,
            name: r.student?.username || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || 'Student',
            userId: r.student?.userId || `MAT-${sId}`,
            marks: {},
          };
        }

        studentMap[sId].marks[examId] = {
          val: r?.marks ?? r?.rawScore ?? null,
          resultId: r.id,
          isLocked: r.exam?.locked || false,
          letterGrade: r.letterGrade,
        };
      });

      setReportData(Object.values(studentMap));
    } catch (error) {
      toast.error('Failed to load gradebook matrix');
    }
  }, [selectedClassId]);

  // ─── Initial Load ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchClasses();
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchResultsList();
      fetchGradebookData();
    }
  }, [selectedClassId, fetchResultsList, fetchGradebookData]);

  // ─── Load students & exams for form class ────────────────────────────────────
  useEffect(() => {
    if (formClassId) {
      // 1. Fetch students for the form class
      api.get(`/teacher/classes/${formClassId}/students`)
        .then(res => {
          const list = normalizeArray<any>(res.data);
          setFormStudentsList(list);
          setFormStudentId(prev => {
            if (list.some(s => String(s.id) === String(prev))) return prev;
            return list[0]?.id ? String(list[0].id) : '';
          });
        })
        .catch(() => {
          setFormStudentsList([]);
          setFormStudentId('');
        });

      // 2. Fetch/filter exams for the form class
      api.get('/teacher/exams')
        .then(res => {
          const freshExams = normalizeArray<any>(res.data);
          setAllExams(freshExams);
          const classExams = freshExams.filter((e: any) => {
            const cId = e?.classe?.id ?? e?.classe;
            return cId && String(cId) === String(formClassId);
          });
          setFormExamsList(classExams);
          setFormExamId(prev => {
            if (classExams.some(e => String(e.id) === String(prev))) return prev;
            return classExams[0]?.id ? String(classExams[0].id) : '';
          });
        })
        .catch(() => {
          setFormExamsList([]);
          setFormExamId('');
        });
    } else {
      setFormStudentsList([]);
      setFormExamsList([]);
      setFormStudentId('');
      setFormExamId('');
    }
  }, [formClassId]);

  // ─── Publish All Draft Results ───────────────────────────────────────────────
  const handleSubmitResults = async () => {
    const draftIds = results.filter(r => r.status === 'DRAFT' && r?.exam && !r.exam.locked).map(r => r.id);
    if (draftIds.length === 0) {
      toast.info('No draft results to submit.');
      return;
    }
    setSubmittingDrafts(true);
    const tid = toast.loading('Publishing results in progress...');
    try {
      await api.post('/teacher/results/submit', draftIds);
      toast.success(`${draftIds.length} result(s) successfully published!`, { id: tid });
      fetchResultsList();
      fetchGradebookData();
    } catch (error) {
      toast.error('Failed to publish results', { id: tid });
    } finally {
      setSubmittingDrafts(false);
    }
  };

  // ─── Save Bulk Marks from Matrix ─────────────────────────────────────────────
  const saveBulk = async () => {
    const payload = Object.entries(pendingChanges).map(([key, val]) => {
      const [studentId, examId] = key.split('-');
      const numVal = parseFloat(val as string);
      return {
        student: { id: parseInt(studentId) },
        exam: { id: parseInt(examId) },
        marks: isNaN(numVal) ? 0 : numVal,
        rawScore: isNaN(numVal) ? 0 : numVal,
        maxScore: 20,
      };
    });

    if (payload.length === 0) {
      setIsEditMode(false);
      return;
    }

    setSavingBulk(true);
    const tid = toast.loading('Saving grades...');
    try {
      await api.post('/teacher/results/bulk', payload);
      toast.success('All modifications saved successfully', { id: tid });
      setIsEditMode(false);
      setPendingChanges({});
      fetchResultsList();
      fetchGradebookData();
    } catch (error) {
      toast.error('Failed to save bulk grades', { id: tid });
    } finally {
      setSavingBulk(false);
    }
  };

  // ─── Open Single Result Form Modal ───────────────────────────────────────────
  const handleOpenAddModal = () => {
    setEditingResult(null);
    const initialClassId = selectedClassId !== 'all' ? selectedClassId : (classes[0]?.id ? String(classes[0].id) : '');
    const matchingExams = allExams.filter((e: any) => {
      const cId = e?.classe?.id ?? e?.classe;
      return cId && String(cId) === String(initialClassId);
    });
    setFormClassId(initialClassId);
    setFormStudentId('');
    setFormExamsList(matchingExams);
    setFormExamId(matchingExams[0]?.id ? String(matchingExams[0].id) : '');
    setFormMarks('');
    setFormRemarks('');
    setIsDialogOpen(true);
  };

  const handleOpenEditModal = (r: any) => {
    setEditingResult(r);
    const rClassId = r.exam?.classe?.id ? String(r.exam.classe.id) : (classes[0]?.id ? String(classes[0].id) : '');
    const matchingExams = allExams.filter((e: any) => {
      const cId = e?.classe?.id ?? e?.classe;
      return cId && String(cId) === String(rClassId);
    });
    setFormClassId(rClassId);
    setFormStudentId(r.student?.id ? String(r.student.id) : '');
    setFormExamsList(matchingExams);
    setFormExamId(r.exam?.id ? String(r.exam.id) : (matchingExams[0]?.id ? String(matchingExams[0].id) : ''));
    const m = r.marks ?? r.rawScore ?? '';
    setFormMarks(m !== '' ? String(m) : '');
    setFormRemarks(r.remarks || '');
    setIsDialogOpen(true);
  };

  const handleSaveSingleResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formExamId || formMarks === '') {
      toast.error('Please fill in all required fields (Student, Assessment, Score)');
      return;
    }

    const marksNum = parseFloat(formMarks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 20) {
      toast.error('The score must be between 0 and 20');
      return;
    }

    setSavingResult(true);
    try {
      const payload = {
        student: Number(formStudentId),
        exam: Number(formExamId),
        marks: marksNum,
        rawScore: marksNum,
        maxScore: 20,
        remarks: formRemarks.trim() || undefined,
      };

      if (editingResult) {
        await api.put(`/teacher/results/${editingResult.id}`, payload);
        toast.success('Grade updated successfully');
      } else {
        await api.post('/teacher/results', payload);
        toast.success('Grade recorded successfully');
      }

      setIsDialogOpen(false);
      fetchResultsList();
      fetchGradebookData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error saving grade');
    } finally {
      setSavingResult(false);
    }
  };

  // ─── Filtered Results List ───────────────────────────────────────────────────
  const displayedResults = useMemo(() => {
    return results.filter(r => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (r?.student?.userId || '').toLowerCase().includes(q) ||
        (r?.student?.username || r?.student?.name || '').toLowerCase().includes(q) ||
        (r?.exam?.name || '').toLowerCase().includes(q);

      const matchExam = filterExamId === 'ALL' || String(r?.exam?.id) === filterExamId;
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'DRAFT' && r.status === 'DRAFT') ||
        (filterStatus === 'SUBMITTED' && r.status === 'SUBMITTED') ||
        (filterStatus === 'LOCKED' && r.exam?.locked);

      return matchSearch && matchExam && matchStatus;
    });
  }, [results, searchQuery, filterExamId, filterStatus]);

  // ─── Performance Chart Data for Selected Student ─────────────────────────────
  const chartData = useMemo(() => {
    if (!selectedStudentForChart) return [];
    return exams.map(exam => {
      const allClassScores = reportData
        .map(s => {
          const raw = s.marks[exam.id]?.val;
          if (raw === null || raw === undefined) return null;
          const num = Number(raw);
          const maxS = Number(exam.maxScore || 20);
          return maxS > 0 && maxS !== 20 ? (num / maxS) * 20 : num;
        })
        .filter(v => v !== null) as number[];

      const classAvg = allClassScores.length > 0
        ? allClassScores.reduce((a, b) => a + b, 0) / allClassScores.length
        : 0;

      const rawStudent = selectedStudentForChart.marks[exam.id]?.val;
      const studentScore20 = rawStudent !== null && rawStudent !== undefined
        ? (Number(exam.maxScore || 20) !== 20 ? (Number(rawStudent) / Number(exam.maxScore || 20)) * 20 : Number(rawStudent))
        : null;

      return {
        name: exam.name,
        studentScore: studentScore20 !== null ? parseFloat(studentScore20.toFixed(2)) : null,
        classAverage: parseFloat(classAvg.toFixed(2)),
      };
    });
  }, [selectedStudentForChart, exams, reportData]);

  // ─── Quick Stats Calculation ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const validScores = results.map(r => {
      const val = r.marks ?? r.rawScore;
      if (val === null || val === undefined) return null;
      const num = Number(val);
      const maxS = Number(r.exam?.maxScore || 20);
      return maxS > 0 && maxS !== 20 ? (num / maxS) * 20 : num;
    }).filter(v => v !== null) as number[];

    const count = validScores.length;
    const avg = count > 0 ? validScores.reduce((a, b) => a + b, 0) / count : 0;
    const passingCount = validScores.filter(v => v >= 10.0).length;
    const passRate = count > 0 ? (passingCount / count) * 100 : 0;
    const draftsCount = results.filter(r => r.status === 'DRAFT' && !r.exam?.locked).length;

    return {
      total: count,
      avg: avg.toFixed(2),
      passRate: passRate.toFixed(1),
      draftsCount,
    };
  }, [results]);

  const selectedClassName = classes.find(c => String(c.id) === selectedClassId)?.name || 'Class';

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ─── Top Header & Controls Strip ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Gradebook & Results Management
                </h1>
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold border-blue-200">
                  National Scale /20
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Mark entry, performance matrix analytics, and official grade publishing by class.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Class Selector */}
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-48 h-10 rounded-xl text-xs font-bold bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="Select a class..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Add single entry */}
            <Button
              onClick={handleOpenAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4 text-xs font-bold gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Record Grade
            </Button>

            {/* Publish drafts button */}
            {stats.draftsCount > 0 && (
              <Button
                variant="secondary"
                onClick={handleSubmitResults}
                disabled={submittingDrafts}
                className="bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 rounded-xl h-10 px-4 text-xs font-bold gap-1.5 border border-amber-200"
              >
                <Send className="w-3.5 h-3.5" />
                Publish {stats.draftsCount} Draft(s)
              </Button>
            )}

            {/* PDF export button for current class */}
            {selectedClassId !== 'all' && reportData.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportGradebookPDF(reportData, exams, selectedClassName)}
                className="h-10 rounded-xl text-xs font-bold gap-1.5 border-slate-200"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Export PDF
              </Button>
            )}
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Recorded Grades</span>
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.total}
            </div>
            <div className="text-[11px] text-blue-600 font-bold mt-0.5">
              Class: {selectedClassName}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Class Average</span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.avg} <span className="text-xs font-bold text-slate-400">/ 20</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
              Standard Guinean Scale
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Pass Rate</span>
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.passRate}%
            </div>
            <div className="text-[11px] text-indigo-600 font-bold mt-0.5">
              Scores &ge; 10.00 / 20
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Pending Drafts</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.draftsCount}
            </div>
            <div className="text-[11px] text-amber-600 font-bold mt-0.5">
              Unpublished entries
            </div>
          </div>
        </div>
      </div>

      {/* ─── Performance Analysis Chart Drawer (If Student Selected) ────────── */}
      {selectedStudentForChart && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Card className="border border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10 rounded-3xl shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white/60 dark:bg-slate-900/60 border-b border-blue-100 dark:border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                    Performance Progression Curve: {selectedStudentForChart.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Student ID: <strong className="text-blue-600">{selectedStudentForChart.userId}</strong> • Comparing student scores with class average (/20)
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStudentForChart(null)}
                className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="h-72 p-6 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any, name?: string) => [
                      `${value} / 20`,
                      name === 'Student Score' ? 'Student Score' : 'Class Average',
                    ]}
                  />
                  <Legend
                    formatter={value => (value === 'Student Score' ? 'Student Score (/20)' : 'Class Average (/20)')}
                  />
                  <Line
                    name="Student Score"
                    type="monotone"
                    dataKey="studentScore"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb' }}
                  />
                  <Line
                    name="Class Average"
                    type="monotone"
                    dataKey="classAverage"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── 3 Primary Views (Tabs) ──────────────────────────────────────────── */}
      <Tabs defaultValue="matrix" className="w-full space-y-4">
        <TabsList className="bg-slate-200/70 dark:bg-slate-900/80 p-1 rounded-2xl grid grid-cols-3 max-w-lg border border-slate-200 dark:border-slate-800">
          <TabsTrigger value="matrix" className="gap-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
            <LayoutGrid className="w-4 h-4 text-blue-600" /> Grade Matrix
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
            <ListFilter className="w-4 h-4 text-indigo-600" /> Detailed Registry
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Quick Grade Entry
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: GRADEBOOK MATRIX ────────────────────────────────────────── */}
        <TabsContent value="matrix" className="space-y-4">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="py-4 px-6 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                  Academic Performance Matrix • {selectedClassName}
                </CardTitle>
                <CardDescription className="text-xs">
                  Summary grid with real-time weighted average calculation (/20) and official honor determination.
                </CardDescription>
              </div>
              <div className="text-xs font-medium text-slate-500">
                {reportData.length} student(s) • {exams.length} assessment(s)
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {selectedClassId === 'all' ? (
                <div className="py-20 text-center space-y-2">
                  <LayoutGrid className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 italic">
                    Please select a specific class from the dropdown above to load the performance matrix.
                  </p>
                </div>
              ) : reportData.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 italic">
                    No grades recorded for this class yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-800/60">
                      <TableRow>
                        <TableHead className="pl-6 text-xs font-bold text-slate-500 min-w-44">
                          Student & ID
                        </TableHead>
                        {exams.map(e => (
                          <TableHead key={e.id} className="text-center text-xs font-bold text-slate-500 min-w-28">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200">{e.name}</div>
                            <div className="text-[10px] text-blue-600 font-semibold">Coef: {e.weight || 1}</div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center text-xs font-black text-slate-900 dark:text-white min-w-32">
                          Average (/20)
                        </TableHead>
                        <TableHead className="text-center text-xs font-black text-slate-900 dark:text-white min-w-24">
                          Grade
                        </TableHead>
                        <TableHead className="text-right pr-6 text-xs font-black text-slate-900 dark:text-white min-w-24">
                          Decision
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reportData.map(s => {
                        let totalWeighted = 0;
                        let totalWeight = 0;

                        exams.forEach(e => {
                          const raw = s.marks[e.id]?.val;
                          if (raw !== undefined && raw !== null && raw !== '--') {
                            const val = Number(raw);
                            const maxS = Number(e.maxScore || 20);
                            const s20 = maxS > 0 && maxS !== 20 ? (val / maxS) * 20 : val;
                            const w = Number(e.weight || 1);
                            totalWeighted += s20 * w;
                            totalWeight += w;
                          }
                        });

                        const weightedAvg = totalWeight > 0 ? totalWeighted / totalWeight : null;
                        const gi = weightedAvg !== null ? resolveGrade20(weightedAvg) : { letter: '-', remark: '-', isPass: false };

                        return (
                          <TableRow key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            {/* Student Info (Clickable for trend chart) */}
                            <TableCell
                              className="pl-6 py-3 cursor-pointer group"
                              onClick={() => setSelectedStudentForChart(s)}
                            >
                              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                <span>{s.name}</span>
                                <TrendingUp className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {s.userId}
                              </div>
                            </TableCell>

                            {/* Exam Scores */}
                            {exams.map(e => {
                              const cell = s.marks[e.id];
                              const raw = cell?.val;
                              const valNum = raw !== undefined && raw !== null && raw !== '--' ? Number(raw) : null;
                              const maxS = Number(e.maxScore || 20);
                              const s20 = valNum !== null ? (maxS > 0 && maxS !== 20 ? (valNum / maxS) * 20 : valNum) : null;

                              return (
                                <TableCell key={e.id} className="text-center py-3">
                                  {s20 !== null ? (
                                    <div>
                                      <span className={`font-bold text-xs ${s20 < 10 ? 'text-red-600' : s20 >= 14 ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {s20.toFixed(2)}
                                      </span>
                                      <div className="text-[9px] text-slate-400">
                                        {resolveGrade20(s20).letter}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 font-bold">-</span>
                                  )}
                                </TableCell>
                              );
                            })}

                            {/* Average out of 20 */}
                            <TableCell className="text-center py-3">
                              {weightedAvg !== null ? (
                                <span className={`inline-block px-2.5 py-0.5 rounded-lg font-black text-xs ${
                                  weightedAvg >= 10
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                                }`}>
                                  {weightedAvg.toFixed(2)} / 20
                                </span>
                              ) : (
                                <span className="text-slate-300 font-bold">-</span>
                              )}
                            </TableCell>

                            {/* Grade Letter */}
                            <TableCell className="text-center py-3">
                              <span className={`inline-block font-black text-xs px-2 py-0.5 rounded ${
                                gi.letter.startsWith('A')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : gi.letter.startsWith('B')
                                  ? 'bg-blue-100 text-blue-800'
                                  : gi.letter.startsWith('C')
                                  ? 'bg-amber-100 text-amber-800'
                                  : gi.letter === '-'
                                  ? 'text-slate-300'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {gi.letter}
                              </span>
                            </TableCell>

                            {/* Academic Decision */}
                            <TableCell className="text-right pr-6 py-3">
                              {weightedAvg !== null ? (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold py-0 px-2 border-none ${
                                    gi.isPass
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  }`}
                                >
                                  {gi.isPass ? 'Pass' : 'Fail'}
                                </Badge>
                              ) : (
                                <span className="text-slate-300 text-xs">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: DETAILED RESULTS LIST ───────────────────────────────────── */}
        <TabsContent value="list" className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search student by name, student ID, or assessment..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={filterExamId} onValueChange={setFilterExamId}>
                  <SelectTrigger className="w-44 h-10 rounded-xl text-xs font-semibold">
                    <SelectValue placeholder="All Assessments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Assessments</SelectItem>
                    {(selectedClassId === 'all' ? allExams : exams).map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32 h-10 rounded-xl text-xs font-semibold">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SUBMITTED">Published</SelectItem>
                    <SelectItem value="LOCKED">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/75 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="pl-6 text-xs font-bold text-slate-500">Student & ID</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500">Assessment & Subject</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500">Coef</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500">Score (/20)</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500">Grade</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500">Status</TableHead>
                  <TableHead className="text-right pr-6 text-xs font-bold text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedResults.map(r => {
                  const val = r.marks ?? r.rawScore;
                  const num = val !== null && val !== undefined ? Number(val) : null;
                  const maxS = Number(r.exam?.maxScore || 20);
                  const s20 = num !== null ? (maxS > 0 && maxS !== 20 ? (num / maxS) * 20 : num) : 0;
                  const gi = resolveGrade20(s20);

                  return (
                    <TableRow key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="pl-6 py-3.5">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {r.student?.username || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || 'Student'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {r.student?.userId || `MAT-${r.student?.id}`}
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {r.exam?.name || 'Assessment'}
                        </div>
                        <div className="text-[10px] text-blue-600 font-semibold">
                          {r.exam?.classe?.name} • {r.exam?.subject?.name}
                        </div>
                      </TableCell>

                      <TableCell className="text-center py-3.5 text-xs font-bold text-slate-500">
                        {r.exam?.weight || 1}
                      </TableCell>

                      <TableCell className="text-center py-3.5">
                        <span className={`font-black text-sm ${s20 < 10 ? 'text-red-600' : s20 >= 14 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                          {s20.toFixed(2)} / 20
                        </span>
                      </TableCell>

                      <TableCell className="text-center py-3.5">
                        <span className={`inline-block font-black text-xs px-2 py-0.5 rounded ${
                          gi.letter.startsWith('A')
                            ? 'bg-emerald-100 text-emerald-800'
                            : gi.letter.startsWith('B')
                            ? 'bg-blue-100 text-blue-800'
                            : gi.letter.startsWith('C')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {gi.letter}
                        </span>
                      </TableCell>

                      <TableCell className="text-center py-3.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold py-0.5 px-2.5 border-none ${
                            r.status === 'SUBMITTED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {r.status === 'SUBMITTED' ? 'PUBLISHED' : 'DRAFT'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-6 py-3.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(r)}
                          disabled={r.exam?.locked}
                          className="h-8 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {displayedResults.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-slate-400 text-xs italic">
                      No results match the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ─── TAB 3: BULK GRADE ENTRY ────────────────────────────────────────── */}
        <TabsContent value="bulk" className="space-y-4">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="py-4 px-6 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                  Quick Grade Entry Sheet • {selectedClassName}
                </CardTitle>
                <CardDescription className="text-xs">
                  Directly edit marks in the cells and save all modifications with one click.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setIsEditMode(false); setPendingChanges({}); }}
                      className="rounded-xl text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveBulk}
                      disabled={savingBulk}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {savingBulk ? 'Saving...' : 'Save Grades'}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                    disabled={selectedClassId === 'all' || reportData.length === 0}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5"
                  >
                    <Edit3 className="w-4 h-4" />
                    Enable Editing
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {selectedClassId === 'all' ? (
                <div className="py-20 text-center text-slate-400 text-xs italic">
                  Please select a specific class to enable quick grade entry.
                </div>
              ) : reportData.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs italic">
                  No students found in this class.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-800/60">
                      <TableRow>
                        <TableHead className="pl-6 text-xs font-bold text-slate-500">Student & ID</TableHead>
                        {exams.map(e => (
                          <TableHead key={e.id} className="text-center text-xs font-bold text-slate-500 min-w-28">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200">{e.name}</div>
                            <div className="text-[10px] text-slate-400">/ 20 pts</div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reportData.map(s => (
                        <TableRow key={s.id} className="hover:bg-slate-50/50">
                          <TableCell className="pl-6 py-3 font-semibold text-xs text-slate-800 dark:text-slate-200">
                            <div>{s.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{s.userId}</div>
                          </TableCell>

                          {exams.map(e => {
                            const currentVal = pendingChanges[`${s.id}-${e.id}`] !== undefined
                              ? pendingChanges[`${s.id}-${e.id}`]
                              : (s.marks[e.id]?.val ?? '');

                            return (
                              <TableCell key={e.id} className="text-center py-2.5">
                                {isEditMode && !e.locked ? (
                                  <Input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="20"
                                    value={currentVal}
                                    placeholder="—"
                                    onChange={el => {
                                      const val = el.target.value;
                                      setPendingChanges((prev: any) => ({
                                        ...prev,
                                        [`${s.id}-${e.id}`]: val,
                                      }));
                                    }}
                                    className="w-20 mx-auto h-8 text-center font-bold text-xs rounded-lg"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center gap-1 font-bold text-xs text-slate-700 dark:text-slate-300">
                                    <span>{currentVal !== '' ? currentVal : '—'}</span>
                                    {e.locked && <Lock className="w-3 h-3 text-slate-300" />}
                                  </div>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── SINGLE RESULT ENTRY / EDIT MODAL ────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              {editingResult ? 'Edit Grade' : 'New Grade Entry'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record an individual mark on the national 20-point scale.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSingleResult} className="space-y-4 mt-2">
            {/* Class selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Class <span className="text-red-500">*</span>
              </Label>
              <Select value={formClassId} onValueChange={setFormClassId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Student <span className="text-red-500">*</span>
              </Label>
              <Select value={formStudentId} onValueChange={setFormStudentId} disabled={formStudentsList.length === 0}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={formStudentsList.length === 0 ? "No students in this class" : "Select student..."} />
                </SelectTrigger>
                <SelectContent>
                  {formStudentsList.map(st => (
                    <SelectItem key={st.id} value={String(st.id)}>
                      {st.username || `${st.firstName || ''} ${st.lastName || ''}`.trim()} ({st.userId || `MAT-${st.id}`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formStudentsList.length === 0 && formClassId && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  No students currently enrolled in this class.
                </p>
              )}
            </div>

            {/* Exam selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Assessment / Exam <span className="text-red-500">*</span>
              </Label>
              <Select value={formExamId} onValueChange={setFormExamId} disabled={formExamsList.length === 0}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={formExamsList.length === 0 ? "No assessments found for this class" : "Choose assessment..."} />
                </SelectTrigger>
                <SelectContent>
                  {formExamsList.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name} (Weight: {e.weight || 1})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formExamsList.length === 0 && formClassId && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  No assessments found for this class. Please create an exam in the Exams tab first.
                </p>
              )}
            </div>

            {/* Score input with instant preview */}
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-2">
              <Label className="text-xs font-bold text-blue-950 dark:text-blue-300">
                Score Obtained (out of 20) <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="20"
                  placeholder="e.g. 15.5"
                  value={formMarks}
                  onChange={e => setFormMarks(e.target.value)}
                  className="rounded-xl bg-white dark:bg-slate-900 font-extrabold text-base text-center"
                  required
                />
                <span className="text-xs font-black text-blue-600">/ 20</span>
              </div>

              {formMarks !== '' && !isNaN(parseFloat(formMarks)) && (
                <div className="text-xs flex items-center justify-between pt-1 text-slate-600 dark:text-slate-300">
                  <span>Estimated Grade:</span>
                  <span className="font-bold text-blue-600">
                    {resolveGrade20(formMarks).letter} ({resolveGrade20(formMarks).remark})
                  </span>
                </div>
              )}
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Teacher Remarks (optional)
              </Label>
              <Input
                placeholder="e.g. Good work, keep improving"
                value={formRemarks}
                onChange={e => setFormRemarks(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={savingResult} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6">
                {savingResult ? 'Saving...' : editingResult ? 'Update Grade' : 'Save Grade'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
