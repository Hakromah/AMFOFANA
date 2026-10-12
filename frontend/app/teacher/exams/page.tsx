/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, BookOpen, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, MoreHorizontal, Power, Loader2, Plus,
  Search, Filter, GraduationCap, Award, FileText, Download, Check,
  RefreshCw, Users, Edit2, Trash2, ShieldCheck, Sparkles, SlidersHorizontal,
  FileCheck, ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

// ─── Types & Interfaces ────────────────────────────────────────────────────────
interface AcademicYear {
  id: number;
  name: string;
  isCurrent?: boolean;
}

interface Semester {
  id: number;
  name: string;
  academicYear?: { id: number; name: string };
}

interface AssessmentCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

interface SchoolClass {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  code?: string;
}

interface ExamItem {
  id: number;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  weight: number;
  maxScore: number;
  closed: boolean;
  locked?: boolean;
  examStatus?: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  classe: { id: number; name: string };
  subject: { id: number; name: string; code?: string };
  academicYear?: { id: number; name: string };
  semesterRel?: { id: number; name: string };
  assessmentCategory?: { id: number; name: string; code: string };
  blueprint?: { id: number; name: string };
}

interface StudentGradeRow {
  studentId: number;
  studentName: string;
  userId?: string;
  marks: string | number;
  rawScore?: number;
  letterGrade?: string;
  remarks?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'GRADED';
  resultId?: number;
}

// ─── Normalizer Helper ─────────────────────────────────────────────────────────
function normalizeArray<T>(resData: any): T[] {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData.data)) {
    return resData.data.map((item: any) => {
      if (item && typeof item === 'object' && item.attributes) {
        return { id: item.id, documentId: item.documentId, ...item.attributes };
      }
      return item;
    });
  }
  return [];
}

// ─── Grade Calculation Helper (National Guinea Scale /20) ──────────────────────
function computeGrade20(marks: number | string, maxScore = 20): { letter: string; remark: string } {
  const num = typeof marks === 'string' ? parseFloat(marks) : marks;
  if (isNaN(num) || num === null) return { letter: '-', remark: '-' };
  const s20 = maxScore > 0 && maxScore !== 20 ? (num / maxScore) * 20 : num;

  if (s20 >= 18) return { letter: 'A+', remark: 'Excellent' };
  if (s20 >= 16) return { letter: 'A', remark: 'Very Good' };
  if (s20 >= 14) return { letter: 'B+', remark: 'Good' };
  if (s20 >= 12) return { letter: 'B', remark: 'Above Average' };
  if (s20 >= 10) return { letter: 'C', remark: 'Satisfactory (Pass)' };
  if (s20 >= 8)  return { letter: 'D', remark: 'Below Average' };
  return { letter: 'F', remark: 'Fail' };
}

export default function TeacherExamsPage() {
  // ─── States ──────────────────────────────────────────────────────────────────
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialog State: Create / Edit
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    classId: '',
    subjectId: '',
    academicYearId: '',
    semesterId: '',
    date: '',
    startTime: '08:00',
    endTime: '10:00',
    maxScore: '20',
    weight: '1',
    examStatus: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'CLOSED',
  });

  // Dialog State: Inline Quick Grading Modal
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedExamForGrading, setSelectedExamForGrading] = useState<ExamItem | null>(null);
  const [studentsGradeData, setStudentsGradeData] = useState<StudentGradeRow[]>([]);
  const [loadingGradingData, setLoadingGradingData] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);

  // ─── Load Initial Data ───────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [examsRes, classesRes, subjectsRes, yearsRes, semestersRes, catsRes] = await Promise.all([
        api.get('/teacher/exams').catch(() => ({ data: [] })),
        api.get('/teacher/classes').catch(() => api.get('/school-classes?pagination[pageSize]=100').catch(() => ({ data: [] }))),
        api.get('/teacher/subjects').catch(() => api.get('/subjects?pagination[pageSize]=100').catch(() => ({ data: [] }))),
        api.get('/admin/academic-years').catch(() => api.get('/academic-years?pagination[pageSize]=100').catch(() => ({ data: [] }))),
        api.get('/admin/academic-periods').catch(() => api.get('/semesters?pagination[pageSize]=100&populate=*').catch(() => ({ data: [] }))),
        api.get('/teacher/assessment-categories').catch(() => api.get('/assessment-categories?pagination[pageSize]=100').catch(() => ({ data: [] }))),
      ]);

      const normExams = normalizeArray<ExamItem>(examsRes.data);
      const normClasses = normalizeArray<SchoolClass>(classesRes.data);
      const normSubjects = normalizeArray<Subject>(subjectsRes.data);
      const normYears = normalizeArray<AcademicYear>(yearsRes.data);
      const normSemesters = normalizeArray<Semester>(semestersRes.data);
      const normCats = normalizeArray<AssessmentCategory>(catsRes.data);

      setExams(normExams);
      setClasses(normClasses);
      setSubjects(normSubjects);
      setAcademicYears(normYears);
      setSemesters(normSemesters);
      setCategories(normCats);

      // Set default academic year & semester if empty
      const activeYear = normYears.find(y => y.isCurrent) || normYears[0];
      if (activeYear) {
        setFormData(prev => ({
          ...prev,
          academicYearId: prev.academicYearId || String(activeYear.id),
        }));
      }
    } catch (err: any) {
      console.error('Error loading teacher exams data:', err);
      toast.error('Failed to load assessment registry');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ─── Open Create Modal ───────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingExam(null);
    const activeYear = academicYears.find(y => y.isCurrent) || academicYears[0];
    const defaultSemester = semesters.find(s => activeYear && String(s.academicYear?.id) === String(activeYear.id)) || semesters[0];
    const defaultCat = categories[0];
    const defaultClass = classes[0];
    const defaultSub = subjects[0];

    const todayStr = new Date().toISOString().split('T')[0];

    setFormData({
      name: 'Continuous Assessment #1',
      categoryId: defaultCat ? String(defaultCat.id) : '',
      classId: defaultClass ? String(defaultClass.id) : '',
      subjectId: defaultSub ? String(defaultSub.id) : '',
      academicYearId: activeYear ? String(activeYear.id) : '',
      semesterId: defaultSemester ? String(defaultSemester.id) : '',
      date: todayStr,
      startTime: '08:00',
      endTime: '10:00',
      maxScore: '20',
      weight: '1',
      examStatus: 'PUBLISHED',
    });
    setIsDialogOpen(true);
  };

  // ─── Open Edit Modal ─────────────────────────────────────────────────────────
  const handleOpenEdit = (exam: ExamItem) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name || '',
      categoryId: exam.assessmentCategory?.id ? String(exam.assessmentCategory.id) : '',
      classId: exam.classe?.id ? String(exam.classe.id) : '',
      subjectId: exam.subject?.id ? String(exam.subject.id) : '',
      academicYearId: exam.academicYear?.id ? String(exam.academicYear.id) : '',
      semesterId: exam.semesterRel?.id ? String(exam.semesterRel.id) : '',
      date: exam.date || '',
      startTime: exam.startTime ? exam.startTime.substring(0, 5) : '08:00',
      endTime: exam.endTime ? exam.endTime.substring(0, 5) : '10:00',
      maxScore: String(exam.maxScore || 20),
      weight: String(exam.weight || 1),
      examStatus: (exam.examStatus || (exam.closed ? 'CLOSED' : 'PUBLISHED')) as any,
    });
    setIsDialogOpen(true);
  };

  // ─── Quick Preset Fillers ───────────────────────────────────────────────────
  const applyPreset = (title: string, catCode?: string) => {
    let matchedCatId = formData.categoryId;
    if (catCode) {
      const found = categories.find(c => c.code.toUpperCase().includes(catCode.toUpperCase()));
      if (found) matchedCatId = String(found.id);
    }
    setFormData(prev => ({
      ...prev,
      name: title,
      categoryId: matchedCatId,
    }));
  };

  // ─── Submit Form (Create / Edit) ─────────────────────────────────────────────
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.classId || !formData.subjectId || !formData.date) {
      toast.error('Please fill in all required fields (Title, Class, Subject, Date)');
      return;
    }

    setSubmitting(true);
    const formatTime = (t: string) => (t.length === 5 ? `${t}:00.000` : t);
    const selectedSem = semesters.find(s => String(s.id) === formData.semesterId);

    const payload = {
      name: formData.name.trim(),
      classe: Number(formData.classId),
      subject: Number(formData.subjectId),
      date: formData.date,
      startTime: formatTime(formData.startTime),
      endTime: formatTime(formData.endTime),
      academicYear: formData.academicYearId ? Number(formData.academicYearId) : null,
      semesterRel: formData.semesterId ? Number(formData.semesterId) : null,
      semester: selectedSem?.name || 'Semester 1',
      assessmentCategory: formData.categoryId ? Number(formData.categoryId) : null,
      maxScore: Number(formData.maxScore) || 20,
      weight: Number(formData.weight) || 1,
      closed: formData.examStatus === 'CLOSED',
      examStatus: formData.examStatus,
    };

    try {
      if (editingExam) {
        await api.put(`/teacher/exams/${editingExam.id}`, payload);
        toast.success('Assessment updated successfully');
      } else {
        await api.post('/teacher/exams', payload);
        toast.success('New assessment created successfully');
      }
      setIsDialogOpen(false);
      loadAllData();
    } catch (err: any) {
      console.error('Error saving exam:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to save assessment');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Exam ─────────────────────────────────────────────────────────────
  const handleDeleteExam = async (exam: ExamItem) => {
    if (!confirm(`Are you sure you want to delete "${exam.name}"? Associated grades will be removed.`)) return;
    try {
      await api.delete(`/teacher/exams/${exam.id}`);
      toast.success('Assessment deleted successfully');
      loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete assessment');
    }
  };

  // ─── Toggle Open / Closed ────────────────────────────────────────────────────
  const handleToggleStatus = async (exam: ExamItem) => {
    const nextClosed = !exam.closed;
    try {
      await api.patch(`/teacher/exams/${exam.id}/toggle-status`, { closed: nextClosed });
      toast.success(nextClosed ? 'Assessment closed (grading locked)' : 'Assessment reopened for grade entry');
      setExams(prev => prev.map(e => (e.id === exam.id ? { ...e, closed: nextClosed, examStatus: nextClosed ? 'CLOSED' : 'PUBLISHED' } : e)));
    } catch (err: any) {
      toast.error('Failed to update assessment status');
    }
  };

  // ─── Open Quick Grading Modal ────────────────────────────────────────────────
  const handleOpenGradingModal = async (exam: ExamItem) => {
    setSelectedExamForGrading(exam);
    setGradingModalOpen(true);
    setLoadingGradingData(true);

    try {
      // 1. Fetch enrolled students in this class
      const studentsRes = await api.get(`/teacher/classes/${exam.classe.id}/students`).catch(() => ({ data: [] }));
      const enrolled = normalizeArray<any>(studentsRes.data);

      // 2. Fetch existing results for this exam
      const resultsRes = await api.get(`/teacher/results/filter?classId=${exam.classe.id}`).catch(() => ({ data: [] }));
      const classResults = normalizeArray<any>(resultsRes.data);
      const examResults = classResults.filter((r: any) => r.exam?.id === exam.id || r.examId === exam.id);

      // 3. Map students with their existing scores
      const mappedRows: StudentGradeRow[] = enrolled.map((st: any) => {
        const foundResult = examResults.find((r: any) => r.student?.id === st.id || r.studentId === st.id);
        const marksVal = foundResult ? (foundResult.marks ?? foundResult.rawScore ?? '') : '';
        const gradeInfo = marksVal !== '' ? computeGrade20(marksVal, exam.maxScore || 20) : { letter: '-', remark: '-' };

        return {
          studentId: st.id,
          studentName: st.username || `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student',
          userId: st.userId || `MAT-${st.id}`,
          marks: marksVal,
          letterGrade: gradeInfo.letter,
          remarks: foundResult?.remarks || gradeInfo.remark,
          status: foundResult?.status || 'DRAFT',
          resultId: foundResult?.id,
        };
      });

      setStudentsGradeData(mappedRows);
    } catch (err: any) {
      console.error('Error loading grading data:', err);
      toast.error('Failed to load class roster');
    } finally {
      setLoadingGradingData(false);
    }
  };

  // ─── Update Score for Student in Grading Modal ───────────────────────────────
  const handleScoreChange = (studentId: number, val: string) => {
    const maxS = selectedExamForGrading?.maxScore || 20;
    const num = parseFloat(val);

    if (!isNaN(num) && num > maxS) {
      toast.warning(`Maximum allowable score is ${maxS}`);
    }

    setStudentsGradeData(prev =>
      prev.map(row => {
        if (row.studentId === studentId) {
          const gi = val !== '' ? computeGrade20(val, maxS) : { letter: '-', remark: '-' };
          return {
            ...row,
            marks: val,
            letterGrade: gi.letter,
            remarks: gi.remark,
          };
        }
        return row;
      })
    );
  };

  // ─── Save All Grades in Bulk ─────────────────────────────────────────────────
  const handleSaveBulkGrades = async (finalSubmit = false) => {
    if (!selectedExamForGrading) return;
    setSavingGrades(true);

    try {
      const validRows = studentsGradeData.filter(r => r.marks !== '' && !isNaN(Number(r.marks)));
      if (validRows.length === 0) {
        toast.info('No entered marks to save');
        setSavingGrades(false);
        return;
      }

      const payload = validRows.map(row => ({
        id: row.resultId,
        exam: selectedExamForGrading.id,
        student: row.studentId,
        marks: Number(row.marks),
        rawScore: Number(row.marks),
        maxScore: selectedExamForGrading.maxScore || 20,
        remarks: row.remarks,
        status: finalSubmit ? 'SUBMITTED' : 'DRAFT',
      }));

      await api.post('/teacher/results/bulk', payload);
      toast.success(finalSubmit ? 'Marks submitted and recorded successfully' : 'Draft marks saved successfully');
      setGradingModalOpen(false);
      loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save marks');
    } finally {
      setSavingGrades(false);
    }
  };

  // ─── Export Attendance / Blank Grading Sheet PDF ─────────────────────────────
  const exportRosterPDF = async (exam: ExamItem) => {
    try {
      const tid = toast.loading('Generating PDF evaluation sheet...');
      const studentsRes = await api.get(`/teacher/classes/${exam.classe.id}/students`).catch(() => ({ data: [] }));
      const students = normalizeArray<any>(studentsRes.data);

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageW, 26, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('AMF REGISTRY • OFFICIAL ASSESSMENT ROSTER', 14, 11);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(`Guinean National Grading System (Scale /${exam.maxScore || 20}) • Exam Registry`, 14, 18);

      // Exam Details Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 32, pageW - 28, 26, 2, 2, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Assessment: ${exam.name}`, 18, 40);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Class: ${exam.classe.name}   |   Subject: ${exam.subject.name}   |   Coefficient: ${exam.weight || 1}`, 18, 47);
      doc.text(`Date: ${exam.date}   |   Time: ${exam.startTime || '08:00'} - ${exam.endTime || '10:00'}   |   Maximum Score: ${exam.maxScore || 20} pts`, 18, 53);

      // Students Table
      const tableRows = students.map((s, idx) => [
        idx + 1,
        s.userId || `MAT-${s.id}`,
        s.username || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
        `      / ${exam.maxScore || 20}`,
        '',
        '',
      ]);

      autoTable(doc, {
        startY: 64,
        head: [['#', 'Student ID', 'Student Name', `Score (/ ${exam.maxScore || 20})`, 'Remark', 'Signature']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [43, 76, 126], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 32 },
          2: { cellWidth: 60, fontStyle: 'bold' },
          3: { cellWidth: 28, halign: 'center' },
          4: { cellWidth: 30 },
          5: { cellWidth: 25 },
        },
      });

      doc.save(`Assessment_Sheet_${exam.classe.name}_${exam.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      toast.success('Evaluation sheet downloaded', { id: tid });
    } catch (e: any) {
      toast.error('Failed to generate PDF sheet');
    }
  };

  // ─── Filtered Exams List ─────────────────────────────────────────────────────
  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      const matchesSearch =
        (e.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.classe?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.subject?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = filterClass === 'ALL' || String(e.classe?.id) === filterClass;
      const matchesSubject = filterSubject === 'ALL' || String(e.subject?.id) === filterSubject;
      const matchesCategory = filterCategory === 'ALL' || String(e.assessmentCategory?.id) === filterCategory;
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && !e.closed) ||
        (filterStatus === 'CLOSED' && e.closed) ||
        (filterStatus === 'DRAFT' && e.examStatus === 'DRAFT');

      return matchesSearch && matchesClass && matchesSubject && matchesCategory && matchesStatus;
    });
  }, [exams, searchQuery, filterClass, filterSubject, filterCategory, filterStatus]);

  const totalPages = Math.ceil(filteredExams.length / itemsPerPage) || 1;
  const currentExams = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredExams.slice(start, start + itemsPerPage);
  }, [filteredExams, currentPage]);

  // Quick stats
  const totalExamsCount = exams.length;
  const activeExamsCount = exams.filter(e => !e.closed).length;
  const closedExamsCount = exams.filter(e => e.closed).length;
  const activeYear = academicYears.find(y => y.isCurrent) || academicYears[0];

  // ─── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold tracking-widest uppercase text-slate-500">
          Loading assessment center...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ─── Top Header & Stats Strip ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Assessment & Exam Center
                </h1>
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold border-blue-200">
                  National Scale /20
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage quizzes, continuous assessments, midterms, and semester examinations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAllData}
              className="gap-1.5 h-10 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-100"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              Refresh
            </Button>
            <Button
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 text-xs font-bold gap-2 shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              New Assessment
            </Button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Total Assessments</span>
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalExamsCount}
            </div>
            <div className="text-[11px] text-blue-600 font-bold mt-0.5">
              {activeYear ? `Year: ${activeYear.name}` : 'Active Session'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Active Exams</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {activeExamsCount}
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Open for grading</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Closed Exams</span>
              <ShieldCheck className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {closedExamsCount}
            </div>
            <div className="text-[11px] text-slate-500 font-bold mt-0.5">Records finalized</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Grade Standard</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              20.00 <span className="text-sm font-bold text-slate-400">pts</span>
            </div>
            <div className="text-[11px] text-amber-600 font-bold mt-0.5">Pass mark: 10/20</div>
          </div>
        </div>
      </div>

      {/* ─── Search & Multi-Filters Toolbar ──────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by assessment name, subject, or class..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Filter by Class */}
            <Select value={filterClass} onValueChange={v => { setFilterClass(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-38 h-10 rounded-xl text-xs font-semibold">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All classes</SelectItem>
                {classes.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter by Subject */}
            <Select value={filterSubject} onValueChange={v => { setFilterSubject(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-38 h-10 rounded-xl text-xs font-semibold">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All subjects</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter by Category */}
            <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-36 h-10 rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter by Status */}
            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-32 h-10 rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All status</SelectItem>
                <SelectItem value="ACTIVE">Active (Open)</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ─── Table View of Exams ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/75 dark:bg-slate-800/50">
            <TableRow className="border-b border-slate-100 dark:border-slate-800">
              <TableHead className="py-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assessment Details
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Category
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Scale & Coef.
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Schedule
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Status
              </TableHead>
              <TableHead className="text-right pr-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {currentExams.map(exam => {
              const catName = exam.assessmentCategory?.name || 'Standard Assessment';
              const catCode = exam.assessmentCategory?.code || 'CC';

              return (
                <TableRow key={exam.id} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Name & Class / Subject */}
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300 font-bold text-sm">
                        {exam.subject?.name?.substring(0, 2).toUpperCase() || 'EX'}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{exam.name}</span>
                          {exam.blueprint && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-300 text-amber-700 dark:text-amber-400">
                              Weighted
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{exam.classe?.name || 'Class N/A'}</span>
                          <span>•</span>
                          <span>{exam.subject?.name || 'Subject'}</span>
                          {exam.semesterRel && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400">{exam.semesterRel.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="text-center">
                    <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 text-xs font-bold py-0.5 px-2.5">
                      {catCode} • {catName}
                    </Badge>
                  </TableCell>

                  {/* Max Score & Weight */}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white rounded-lg font-black text-xs">
                        / {exam.maxScore || 20} pts
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Coef: <strong>{exam.weight || 1}</strong>
                      </span>
                    </div>
                  </TableCell>

                  {/* Date & Time */}
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        {exam.date ? new Date(exam.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No date set'}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        {exam.startTime?.substring(0, 5) || '08:00'} → {exam.endTime?.substring(0, 5) || '10:00'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center">
                    <Badge
                      className={`text-[10px] font-bold py-1 px-3 border-none ${
                        exam.closed
                          ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {exam.closed ? 'CLOSED' : 'ACTIVE (OPEN)'}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Direct Grade Button */}
                      <Button
                        size="sm"
                        onClick={() => handleOpenGradingModal(exam)}
                        className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 shadow-xs"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Grade</span>
                      </Button>

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl border-slate-100 dark:border-slate-800">
                          <DropdownMenuItem
                            onClick={() => handleOpenGradingModal(exam)}
                            className="rounded-xl font-bold text-xs p-2.5 text-emerald-700 dark:text-emerald-400 cursor-pointer"
                          >
                            <FileCheck className="w-4 h-4 mr-2" /> Enter Student Marks
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => exportRosterPDF(exam)}
                            className="rounded-xl font-bold text-xs p-2.5 text-blue-700 dark:text-blue-400 cursor-pointer"
                          >
                            <Download className="w-4 h-4 mr-2" /> Download Exam Sheet PDF
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(exam)}
                            className="rounded-xl font-bold text-xs p-2.5 cursor-pointer"
                          >
                            <Power className="w-4 h-4 mr-2 text-slate-500" />
                            {exam.closed ? 'Reopen Assessment' : 'Close Assessment'}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(exam)}
                            className="rounded-xl font-bold text-xs p-2.5 text-amber-600 dark:text-amber-400 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleDeleteExam(exam)}
                            className="rounded-xl font-bold text-xs p-2.5 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredExams.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="max-w-sm mx-auto space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      No assessments found
                    </h3>
                    <p className="text-xs text-slate-500">
                      Adjust your filters or create a new assessment to begin recording student marks.
                    </p>
                    <Button onClick={handleOpenCreate} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
                      <Plus className="w-4 h-4 mr-1.5" /> Create Assessment
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/75 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Showing <strong>{currentExams.length}</strong> of <strong>{filteredExams.length}</strong> assessments
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── CREATE / EDIT EXAM MODAL ────────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              {editingExam ? 'Edit Assessment' : 'Create New Assessment'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure assessment title, category, /20 grading scale, coefficient, and schedule.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Presets Bar */}
          {!editingExam && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Quick assessment templates:
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('Continuous Assessment #1', 'QUIZ')}
                  className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-white dark:bg-slate-800 border hover:border-blue-500 transition-colors"
                >
                  Continuous Assessment #1
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('Midterm Exam', 'DEVOIR')}
                  className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-white dark:bg-slate-800 border hover:border-blue-500 transition-colors"
                >
                  Midterm Exam
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('Final Semester Examination', 'EXAM')}
                  className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-white dark:bg-slate-800 border hover:border-blue-500 transition-colors"
                >
                  Final Examination
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('Pop Quiz #1', 'QUIZ')}
                  className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-white dark:bg-slate-800 border hover:border-blue-500 transition-colors"
                >
                  Pop Quiz #1
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="space-y-4 mt-2">
            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Assessment Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Midterm Examination - Mathematics"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Assessment Category
                </Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={v => setFormData({ ...formData, categoryId: v })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Initial Status
                </Label>
                <Select
                  value={formData.examStatus}
                  onValueChange={(v: any) => setFormData({ ...formData, examStatus: v })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLISHED">Published (Open for grading)</SelectItem>
                    <SelectItem value="DRAFT">Draft (Hidden)</SelectItem>
                    <SelectItem value="CLOSED">Closed (Finalized)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Class & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Class <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.classId}
                  onValueChange={v => setFormData({ ...formData, classId: v })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={v => setFormData({ ...formData, subjectId: v })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Academic Session */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Academic Year
                </Label>
                <Select
                  value={formData.academicYearId}
                  onValueChange={v => setFormData({ ...formData, academicYearId: v })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select year..." />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map(y => (
                      <SelectItem key={y.id} value={String(y.id)}>
                        {y.name} {y.isCurrent && '★'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Semester / Period
                </Label>
                <Select
                  value={formData.semesterId}
                  onValueChange={v => setFormData({ ...formData, semesterId: v })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select semester..." />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grading Scale & Weight (Guinea /20) */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-blue-950 dark:text-blue-300">
                  Maximum Grade Scale
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    step="any"
                    min="1"
                    max="100"
                    value={formData.maxScore}
                    onChange={e => setFormData({ ...formData, maxScore: e.target.value })}
                    className="rounded-xl bg-white dark:bg-slate-900 font-bold"
                  />
                  <span className="text-xs font-bold text-blue-600">pts (/20)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-blue-950 dark:text-blue-300">
                  Weight / Coefficient
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    step="any"
                    min="0.1"
                    placeholder="e.g. 1, 2, 3..."
                    value={formData.weight}
                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                    className="rounded-xl bg-white dark:bg-slate-900 font-bold"
                  />
                  <span className="text-xs font-bold text-slate-500">Coef</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Weighting factor for averages (e.g. 1, 2, 3...)
                </p>
              </div>
            </div>

            {/* Schedule (Date & Time) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Exam Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Start Time
                </Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  End Time
                </Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                {submitting ? 'Saving...' : editingExam ? 'Update Assessment' : 'Confirm Assessment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── INLINE QUICK GRADING MODAL ──────────────────────────────────────── */}
      <Dialog open={gradingModalOpen} onOpenChange={setGradingModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-6 h-6 text-emerald-600" />
                  Grade Entry • {selectedExamForGrading?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  Class: <strong className="text-slate-800 dark:text-slate-200">{selectedExamForGrading?.classe?.name}</strong> • Subject:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{selectedExamForGrading?.subject?.name}</strong> • Scale out of{' '}
                  <strong className="text-blue-600 font-bold">{selectedExamForGrading?.maxScore || 20} pts</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {loadingGradingData ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs text-slate-400">Loading student roster...</p>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              {/* Quick Class Stats Banner */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Students</span>
                  <strong className="text-sm font-black text-slate-800 dark:text-slate-200">
                    {studentsGradeData.length}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Graded Students</span>
                  <strong className="text-sm font-black text-emerald-600">
                    {studentsGradeData.filter(s => s.marks !== '').length} / {studentsGradeData.length}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Class Average</span>
                  <strong className="text-sm font-black text-blue-600">
                    {(() => {
                      const scored = studentsGradeData.filter(s => s.marks !== '' && !isNaN(Number(s.marks)));
                      if (scored.length === 0) return '-';
                      const avg = scored.reduce((acc, r) => acc + Number(r.marks), 0) / scored.length;
                      return `${avg.toFixed(2)} / ${selectedExamForGrading?.maxScore || 20}`;
                    })()}
                  </strong>
                </div>
              </div>

              {/* Table of Students & Marks */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50/75 dark:bg-slate-800/75 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-slate-500 pl-4">Student & ID</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 w-36 text-center">Score (/ {selectedExamForGrading?.maxScore || 20})</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 w-24 text-center">Grade</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 pr-4">Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentsGradeData.map((row, idx) => (
                      <TableRow key={row.studentId} className="hover:bg-slate-50/50">
                        <TableCell className="pl-4 py-2.5">
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {row.studentName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {row.userId}
                          </div>
                        </TableCell>

                        <TableCell className="text-center py-2.5">
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            max={selectedExamForGrading?.maxScore || 20}
                            placeholder="e.g. 15.5"
                            value={row.marks}
                            onChange={e => handleScoreChange(row.studentId, e.target.value)}
                            className="h-8 text-center font-bold text-xs rounded-lg"
                          />
                        </TableCell>

                        <TableCell className="text-center py-2.5">
                          <span
                            className={`inline-block font-black text-xs px-2 py-0.5 rounded ${
                              row.letterGrade?.startsWith('A')
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.letterGrade?.startsWith('B')
                                ? 'bg-blue-100 text-blue-800'
                                : row.letterGrade?.startsWith('C')
                                ? 'bg-amber-100 text-amber-800'
                                : row.letterGrade === '-'
                                ? 'text-slate-300'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {row.letterGrade || '-'}
                          </span>
                        </TableCell>

                        <TableCell className="pr-4 py-2.5 text-xs text-slate-500">
                          {row.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter className="pt-2 gap-2 flex-col sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGradingModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Close without saving
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={savingGrades}
                  onClick={() => handleSaveBulkGrades(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  {savingGrades ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  type="button"
                  disabled={savingGrades}
                  onClick={() => handleSaveBulkGrades(true)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6"
                >
                  {savingGrades ? 'Submitting...' : 'Submit Final Grades'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
