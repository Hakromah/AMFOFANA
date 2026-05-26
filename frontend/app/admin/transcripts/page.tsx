/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  FileText, Search, Printer, Download,
  RefreshCcw, Loader2, Calendar, BookOpen,
  Award, GraduationCap, CheckSquare, Square,
  Building2, Phone, Mail, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function AdminTranscriptsPage() {
  // --- STATE ---
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedYearId, setSelectedYearId] = useState<string>('all');
  const [selectedSemesterIds, setSelectedSemesterIds] = useState<number[]>([]);
  const [selectedTermIds, setSelectedTermIds] = useState<number[]>([]);

  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [transcriptData, setTranscriptData] = useState<any | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (transcriptData) {
      const qrData = {
        name: transcriptData.student.name,
        studentId: transcriptData.student.userId || String(transcriptData.student.id),
        academicYear: transcriptData.metadata.academicYears.join(', '),
        status: 'Verified by Administration',
        referenceNumber: transcriptData.metadata.referenceNumber
      };
      
      const qrString = `AMF ACADEMY OFFICIAL TRANSCRIPT\n` +
        `Ref: ${qrData.referenceNumber}\n` +
        `Student: ${qrData.name}\n` +
        `Student ID: ${qrData.studentId}\n` +
        `Academic Year: ${qrData.academicYear}\n` +
        `Status: ${qrData.status}`;

      QRCode.toDataURL(qrString, { margin: 2, scale: 4 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR code generation failed', err));
    } else {
      setQrCodeUrl('');
    }
  }, [transcriptData]);

  // --- INITIAL DATA SYNC ---
  const loadFilterData = async () => {
    setLoading(true);
    try {
      const [usersRes, classesRes, yearsRes, semestersRes, termsRes] = await Promise.all([
        api.get('/admin/users?role=STUDENT'),
        api.get('/admin/classes'),
        api.get('/academic-years?pagination[pageSize]=100'),
        api.get('/semesters?pagination[pageSize]=100&populate=academicYear'),
        api.get('/terms?pagination[pageSize]=100&populate=semester')
      ]);

      setStudents(usersRes.data || []);
      setClasses(classesRes.data || []);
      setAcademicYears(yearsRes.data.data || []);
      setSemesters(semestersRes.data.data || []);
      setTerms(termsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to synchronize registry databases');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  // --- FILTERED ARRAYS ---
  // Filter students by selected Class
  const classFilteredStudents = useMemo(() => {
    if (selectedClassId === 'all') return students;
    const selectedClass = classes.find(c => String(c.id) === selectedClassId);
    if (!selectedClass || !selectedClass.students) return [];
    const studentIdsInClass = selectedClass.students.map((s: any) => s.id);
    return students.filter(s => studentIdsInClass.includes(s.id));
  }, [students, classes, selectedClassId]);

  // Search filtered student list
  const searchedStudents = useMemo(() => {
    const query = studentSearchQuery.toLowerCase().trim();
    if (!query) return classFilteredStudents;
    return classFilteredStudents.filter(s =>
      s.username?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.userId?.toLowerCase().includes(query)
    );
  }, [classFilteredStudents, studentSearchQuery]);

  // Semesters filtered by academic year
  const filteredSemesters = useMemo(() => {
    if (selectedYearId === 'all') return semesters;
    return semesters.filter(s => String(s.academicYear?.id) === selectedYearId);
  }, [semesters, selectedYearId]);

  // Terms filtered by selected semesters
  const filteredTerms = useMemo(() => {
    if (selectedSemesterIds.length === 0) return terms;
    return terms.filter(t => selectedSemesterIds.includes(t.semester?.id));
  }, [terms, selectedSemesterIds]);

  // --- SELECT / TOGGLE HANDLERS ---
  const toggleSemester = (id: number) => {
    setSelectedSemesterIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleTerm = (id: number) => {
    setSelectedTermIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setSelectedClassId('all');
    setSelectedStudentId('');
    setSelectedYearId('all');
    setSelectedSemesterIds([]);
    setSelectedTermIds([]);
    setStudentSearchQuery('');
    setTranscriptData(null);
    toast.success('Filters reset successfully');
  };

  // --- TRANSCRIPT GENERATION ---
  const handleGenerate = async () => {
    if (!selectedStudentId) {
      toast.error('Please select a student first');
      return;
    }
    setGenerating(true);
    try {
      const params = new URLSearchParams();
      params.append('studentId', selectedStudentId);
      if (selectedYearId !== 'all') params.append('academicYearId', selectedYearId);
      if (selectedClassId !== 'all') params.append('classId', selectedClassId);
      if (selectedSemesterIds.length > 0) params.append('semesterIds', selectedSemesterIds.join(','));
      if (selectedTermIds.length > 0) params.append('termIds', selectedTermIds.join(','));

      const response = await api.get(`/admin/transcripts/generate?${params.toString()}`);
      setTranscriptData(response.data);
      toast.success('Transcript calculated successfully');
    } catch (error) {
      toast.error('Compilation failed');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  // --- PDF EXPORT ---
  const handleDownloadPDF = () => {
    if (!transcriptData) return;
    const doc = new jsPDF() as any;
    const s = transcriptData.student;
    const sch = transcriptData.school;
    const sum = transcriptData.summary;
    const meta = transcriptData.metadata;

    // Header Branding
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(sch.name.toUpperCase(), 14, 18);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text(`Official Academic Transcript • Registries System`, 14, 25);
    doc.text(`Address: ${sch.address} | Email: ${sch.email} | Phone: ${sch.phone}`, 14, 32);

    // Document Title
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text("OFFICIAL STUDENT TRANSCRIPT", 14, 55);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, 58, 196, 58);

    // Student Information Grid
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text("STUDENT PROFILE", 14, 66);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Name: ${s.name}`, 14, 72);
    doc.text(`ID: ${s.userId || 'N/A'}`, 14, 78);
    doc.text(`Email: ${s.email}`, 14, 84);

    doc.text(`Class: ${s.classes.join(', ') || 'N/A'}`, 120, 72);
    const bDate = s.birthDate ? new Date(s.birthDate).toLocaleDateString() : 'N/A';
    doc.text(`Birth Date: ${bDate}`, 120, 78);
    doc.text(`Phone: ${s.phoneNumber || 'N/A'}`, 120, 84);

    // Metadata Grid (Reference Number, Date of Issue, Semesters, Terms)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(14, 90, 182, 18, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, 90, 182, 18, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("REFERENCE NUMBER", 18, 95);
    doc.text("DATE OF ISSUE", 70, 95);
    doc.text("SEMESTERS", 110, 95);
    doc.text("TERMS", 155, 95);

    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(meta.referenceNumber, 18, 101);
    doc.text(meta.generationDate, 70, 101);
    
    const semsText = doc.splitTextToSize(meta.semesters.join(', ') || 'N/A', 40);
    const termsText = doc.splitTextToSize(meta.terms.join(', ') || 'N/A', 35);
    doc.text(semsText, 110, 101);
    doc.text(termsText, 155, 101);

    // Results Table
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text("ACADEMIC PERFORMANCE SUMMARY", 14, 116);

    const tableBody = transcriptData.results.map((r: any) => [
      r.subjectName,
      r.className,
      r.examName || '—',
      `${r.semester} (${r.term})`,
      `${r.marks}%`,
      r.letterGrade,
      r.remarks || '—'
    ]);

    doc.autoTable({
      startY: 120,
      head: [['Subject Name', 'Class', 'Exam', 'Semester (Term)', 'Score', 'Grade', 'Remarks']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 8.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 15 },
        2: { cellWidth: 25 },
        3: { cellWidth: 35 },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 42 }
      }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 12;

    // Check if summary + signature block will overflow the page (needs around 75mm)
    if (currentY + 75 > 280) {
      doc.addPage();
      currentY = 20; // reset Y coordinate on the new page
    }

    // Summary Index Card
    doc.setFillColor(15, 23, 42); // slate-900 (dark card like in UI)
    doc.rect(14, currentY, 182, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text("ROSTER INDEX", 20, currentY + 8);
    doc.text("AVERAGE PERFORMANCE", 70, currentY + 8);
    doc.text("CUMULATIVE GPA", 135, currentY + 8);

    doc.setFontSize(18);
    doc.text(String(sum.totalSubjectsCount), 20, currentY + 18);
    doc.text(`${sum.weightedAverageScore}%`, 70, currentY + 18);
    doc.text(sum.gpa.toFixed(2), 135, currentY + 18);

    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text("Evaluated Fields", 20, currentY + 24);
    doc.text("Weighted Average Score", 70, currentY + 24);
    doc.text("Out of 4.00 max", 135, currentY + 24);

    // Signatures and QR Code Block
    const sigY = currentY + 42;
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    
    // Draw signature lines
    doc.setDrawColor(226, 232, 240);
    doc.line(14, sigY + 14, 74, sigY + 14);
    doc.text("OFFICE OF THE REGISTRAR", 14, sigY + 19);

    doc.line(136, sigY + 14, 196, sigY + 14);
    doc.text("PRINCIPAL / DEAN SIGNATURE", 136, sigY + 19);

    // Draw QR Code in the middle
    if (qrCodeUrl) {
      doc.addImage(qrCodeUrl, 'PNG', 93, sigY - 2, 24, 24);
      doc.setFontSize(6.5);
      doc.text("VERIFY AUTHENTICITY", 105, sigY + 26, { align: 'center' });
    }

    // Save
    doc.save(`transcript_${s.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    toast.success('Official PDF Downloaded');
  };

  // --- PRINT WINDOW ---
  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center leading-relaxed">
        Syncing Registry Databases...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-[clamp(1.2rem,2vw+1rem,2rem)] lg:p-[clamp(1.2rem,2vw+1rem,2rem)] space-y-[clamp(1rem,2vw+1rem,2rem)] print:p-0 print:bg-white">
      {/* Header Section */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Official Records Center</span>
          </div>
          <h1 className="text-[clamp(1.4rem,3.5vw,4rem)] font-black text-slate-900 tracking-tighter italic uppercase">
            Academic <span className="text-primary">Transcript.</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={loadFilterData}
            variant="outline"
            className="rounded-2xl h-14 w-14 p-0 border-slate-200 bg-white hover:bg-slate-50 transition-all"
          >
            <RefreshCcw size={20} className="text-slate-600" />
          </Button>
          <Button
            onClick={resetFilters}
            variant="outline"
            className="rounded-2xl h-14 px-6 border-slate-200 bg-white hover:bg-slate-50 transition-all font-black text-[10px] tracking-widest uppercase"
          >
            Clear Filters
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Filters Panel (Left 4 cols) */}
        <section className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6 print:hidden">
          <div className="space-y-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Transcript Filters</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure student evaluation limits</p>
          </div>

          <div className="space-y-4">
            {/* Class Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Filter Classroom</label>
              <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSelectedStudentId(''); }}>
                <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold h-12">
                  <SelectValue placeholder="Select Classroom" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="all">All Classrooms</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Academic Year</label>
              <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold h-12">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="all">All Academic Years</SelectItem>
                  {academicYears.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Searchable Student Dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Student</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <Input
                  placeholder="Filter student name/ID..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="h-12 pl-11 rounded-xl bg-slate-50 border-none font-bold placeholder-slate-300"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-50 rounded-xl mt-2 p-1.5 space-y-1 bg-slate-50/50">
                {searchedStudents.length > 0 ? (
                  searchedStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudentId(String(student.id))}
                      className={`w-full text-left p-3 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                        selectedStudentId === String(student.id)
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-950/10'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div>
                        <div>{student.username || student.name}</div>
                        <div className={`text-[9px] uppercase mt-0.5 ${
                          selectedStudentId === String(student.id) ? 'text-slate-400' : 'text-slate-400'
                        }`}>{student.userId || 'No ID'}</div>
                      </div>
                      {selectedStudentId === String(student.id) && <UserCheck size={14} className="text-blue-400 animate-pulse" />}
                    </button>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-400 font-medium italic text-[11px]">No students found</p>
                )}
              </div>
            </div>

            {/* Semesters Multi-Select Popover */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Selected Semesters</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-bold h-12 bg-slate-50 border-slate-100 rounded-xl px-4">
                    <span className="truncate text-xs">
                      {selectedSemesterIds.length === 0
                        ? 'All Semesters'
                        : `${selectedSemesterIds.length} Semesters Selected`}
                    </span>
                    <BookOpen size={16} className="text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 rounded-2xl border-slate-100 shadow-2xl bg-white space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest p-1">Filter Semesters</p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredSemesters.map(sem => {
                      const isChecked = selectedSemesterIds.includes(sem.id);
                      return (
                        <button
                          key={sem.id}
                          onClick={() => toggleSemester(sem.id)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 text-left transition-colors"
                        >
                          {isChecked ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-slate-300" />}
                          <span>{sem.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Terms Multi-Select Popover */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Selected Terms</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-bold h-12 bg-slate-50 border-slate-100 rounded-xl px-4">
                    <span className="truncate text-xs">
                      {selectedTermIds.length === 0
                        ? 'All Terms'
                        : `${selectedTermIds.length} Terms Selected`}
                    </span>
                    <Award size={16} className="text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 rounded-2xl border-slate-100 shadow-2xl bg-white space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest p-1">Filter Terms</p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredTerms.map(term => {
                      const isChecked = selectedTermIds.includes(term.id);
                      return (
                        <button
                          key={term.id}
                          onClick={() => toggleTerm(term.id)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 text-left transition-colors"
                        >
                          {isChecked ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-slate-300" />}
                          <span>{term.name} ({term.semester?.name})</span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || !selectedStudentId}
            className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-slate-200 transition-all"
          >
            {generating ? <Loader2 className="animate-spin mr-2" size={16} /> : <FileText className="mr-2" size={16} />}
            Generate Transcript
          </Button>
        </section>

        {/* Transcript Preview (Right 8 cols) */}
        <section className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {transcriptData ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Print/Download Toolbar */}
                <div className="flex gap-3 justify-end print:hidden">
                  <Button onClick={handlePrint} variant="outline" className="rounded-2xl h-14 px-6 border-slate-200 bg-white hover:bg-slate-50 font-black text-[10px] tracking-widest uppercase">
                    <Printer size={16} className="mr-2 text-slate-600" /> Print
                  </Button>
                  <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-slate-900 text-white rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/10">
                    <Download size={16} className="mr-2" /> Download PDF
                  </Button>
                </div>

                {/* Printable Transcript Document */}
                <Card className="printable-transcript rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
                  {/* Premium Brand Header */}
                  <div className="bg-slate-900 p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                      <Building2 size={240} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black italic tracking-tighter uppercase">{transcriptData.school.name}</h2>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.3em] mt-1">Official Academic Registry</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400 mt-4">
                        <span className="flex items-center gap-1"><Building2 size={12} /> {transcriptData.school.address}</span>
                        <span className="flex items-center gap-1"><Phone size={12} /> {transcriptData.school.phone}</span>
                        <span className="flex items-center gap-1"><Mail size={12} /> {transcriptData.school.email}</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-10 space-y-8">
                    {/* Document Title Header */}
                    <div className="text-center md:text-left">
                      <h3 className="text-lg font-black text-slate-900 tracking-wider uppercase">Official Student Transcript</h3>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Cumulated Performance Ledger</p>
                    </div>

                    {/* Student Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Student Profile</p>
                        <div>
                          <p className="text-sm font-black text-slate-800">{transcriptData.student.name}</p>
                          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-0.5">ID: {transcriptData.student.userId || 'N/A'}</p>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">Email: {transcriptData.student.email}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Enrolled Record</p>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Class: {transcriptData.student.classes.join(', ') || 'N/A'}</p>
                          <p className="text-xs font-semibold text-slate-500 mt-1">
                            Birth Date: {transcriptData.student.birthDate ? new Date(transcriptData.student.birthDate).toLocaleDateString() : 'N/A'}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">Phone: {transcriptData.student.phoneNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Transcript Metadata & Scope */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50/30 rounded-3xl border border-slate-100/80 text-xs text-slate-600">
                      <div>
                        <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Reference Number</span>
                        <span className="font-mono font-bold text-slate-800 tracking-wide select-all">{transcriptData.metadata.referenceNumber}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Date of Issue</span>
                        <span className="font-bold text-slate-800">{transcriptData.metadata.generationDate}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Target Semesters</span>
                        <span className="font-semibold text-slate-700">{transcriptData.metadata.semesters.join(', ') || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Target Terms</span>
                        <span className="font-semibold text-slate-700">{transcriptData.metadata.terms.join(', ') || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Performance Table */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Academic Scoreboard</h4>
                      <div className="rounded-2xl border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-900 text-white">
                            <TableRow className="border-none hover:bg-slate-900">
                              <TableHead className="text-white font-black text-[9px] uppercase tracking-wider py-4 pl-6">Subject / Class</TableHead>
                              <TableHead className="text-white font-black text-[9px] uppercase tracking-wider">Exam / Session</TableHead>
                              <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">Score</TableHead>
                              <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">Grade</TableHead>
                              <TableHead className="text-white font-black text-[9px] uppercase tracking-wider py-4 pr-6">Teacher Remarks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transcriptData.results.map((res: any) => (
                              <TableRow key={res.id} className="hover:bg-slate-50/50 border-slate-100">
                                <TableCell className="py-4 pl-6 font-bold text-slate-900">
                                  <div>{res.subjectName}</div>
                                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{res.className}</div>
                                </TableCell>
                                <TableCell className="font-semibold text-slate-600 text-xs">
                                  <div className="font-bold text-slate-800">{res.examName}</div>
                                  <div className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">{res.semester} • {res.term}</div>
                                </TableCell>
                                <TableCell className="text-center font-black text-slate-900 text-sm py-4">
                                  {res.marks}%
                                </TableCell>
                                <TableCell className="text-center py-4">
                                  <Badge className="bg-slate-900 text-white font-black text-[10px] px-2 py-0.5 rounded-md border-none">
                                    {res.letterGrade}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4 pr-6 text-xs text-slate-500 font-semibold max-w-[200px] truncate" title={res.remarks}>
                                  {res.remarks || <span className="text-slate-300 italic">—</span>}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Summary Metric Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Roster Index</p>
                        <h4 className="text-4xl font-black italic tracking-tighter">{transcriptData.summary.totalSubjectsCount}</h4>
                        <p className="text-[10px] font-bold opacity-60">Evaluated Fields</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Average Performance</p>
                        <h4 className="text-4xl font-black italic tracking-tighter">{transcriptData.summary.weightedAverageScore}%</h4>
                        <p className="text-[10px] font-bold opacity-60">Weighted Average Score</p>
                      </div>
                      <div className="space-y-1 bg-blue-600 rounded-2xl p-6 shadow-lg shadow-blue-900/10">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-100">Cumulative GPA</p>
                        <h4 className="text-4xl font-black italic tracking-tighter">{transcriptData.summary.gpa.toFixed(2)}</h4>
                        <p className="text-[10px] font-bold text-blue-100">Out of 4.00 max</p>
                      </div>
                    </div>

                    {/* Footer Authority Signatures & QR Verification */}
                    <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                      <div className="space-y-2">
                        <div className="border-b border-slate-200 h-16"></div>
                        <p className="font-bold text-slate-500">Office of the Registrar</p>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center space-y-1.5 p-2 bg-slate-50 border border-slate-100 rounded-2xl print:bg-white print:border-none">
                        {qrCodeUrl ? (
                          <>
                            <img src={qrCodeUrl} alt="Transcript Verification QR" className="w-20 h-20 object-contain mix-blend-multiply" />
                            <p className="text-[8px] font-black tracking-widest text-slate-500">VERIFY AUTHENTICITY</p>
                            <p className="text-[7px] font-mono text-slate-400 select-all">{transcriptData.metadata.referenceNumber}</p>
                          </>
                        ) : (
                          <div className="w-20 h-20 bg-slate-200 animate-pulse rounded-lg" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="border-b border-slate-200 h-16"></div>
                        <p className="font-bold text-slate-500">Principal / Dean Signature</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50 backdrop-blur-sm p-10"
              >
                <div className="p-5 bg-white border border-slate-100 shadow-xl rounded-3xl mb-6 text-slate-400">
                  <FileText size={40} className="animate-bounce" />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Active Query</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider text-center mt-2 max-w-sm">
                  Select a student from the sidebar filter registry and click generate.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
