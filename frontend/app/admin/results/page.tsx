/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Search,
  UserCircle,
  GraduationCap,
  Loader2,
  Lock,
  FileCheck,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- SHARED HELPERS ---
const calculateLetterGrade = (marks: number | string): string => {
  const score = typeof marks === 'string' ? parseFloat(marks) : marks;
  if (isNaN(score)) return '-';
  if (score >= 90) return 'AA';
  if (score >= 85) return 'BA';
  if (score >= 80) return 'BB';
  if (score >= 75) return 'CB';
  if (score >= 70) return 'CC';
  if (score >= 60) return 'DC';
  if (score >= 50) return 'DD';
  return 'FF';
};

export default function AdminResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  // Selection State
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // --- DYNAMIC DATA DERIVATION ---
  const uniqueSemesters = useMemo(() => {
    const sems = results.map(r => r.exam?.semester).filter(Boolean);
    return Array.from(new Set(sems));
  }, [results]);

  const filteredResults = useMemo(() => {
    if (selectedSemester === 'all') return results;
    return results.filter(r => r.exam?.semester === selectedSemester);
  }, [results, selectedSemester]);

  // --- API ACTIONS ---
  const fetchResults = useCallback(async () => {
    setLoading(true);
    setSelectedRows(new Set());
    const params = new URLSearchParams();
    if (studentQuery.trim()) params.append('studentQuery', studentQuery.trim());
    if (selectedClassId && selectedClassId !== 'all') params.append('classId', selectedClassId);

    try {
      const response = await api.get(`/admin/results/filter?${params.toString()}`);
      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error(`Search failed. Check server logs.`);
    } finally {
      setLoading(false);
    }
  }, [studentQuery, selectedClassId]);

  useEffect(() => {
    const init = async () => {
      try {
        const classRes = await api.get('/admin/classes');
        setClasses(classRes.data);
      } catch (e) { console.error("Init error:", e); }
    };
    init();
    fetchResults();
  }, [fetchResults]);

  // --- SELECTION HANDLERS ---
  const toggleRow = (id: number) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const toggleAllVisible = () => {
    if (selectedRows.size === filteredResults.length && filteredResults.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredResults.map(r => r.id)));
    }
  };

  // --- CONSISTENT TRANSCRIPT GENERATOR ---
  const generateTranscriptPDF = () => {
    const dataToExport = selectedRows.size > 0
      ? results.filter(r => selectedRows.has(r.id))
      : filteredResults;

    if (dataToExport.length === 0) {
      toast.error("No results available for transcript generation.");
      return;
    }

    const firstResult = dataToExport[0];
    const student = firstResult.student;
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    const schoolFullName = "AMF INTERNATIONAL EXCELLENCE SCHOOL";

    // Stats Calculation for selected subset
    const totalScore = dataToExport.reduce((acc, curr) => acc + (curr.marks || 0), 0);
    const averageScore = (totalScore / dataToExport.length).toFixed(1);
    const isPassingOverall = parseFloat(averageScore) >= 50;

    // 1. Header & Branding (Sync with Student Portal)
    doc.setFillColor(37, 99, 235); // Primary Blue
    doc.rect(14, 12, 25, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("AMF", 21, 22);
    doc.text("ACADEMIC", 16, 28);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(schoolFullName, 45, 20);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Official Academic Transcript | Administrative Record", 45, 26);
    doc.text(`Generated on: ${date}`, 45, 31);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 42, 196, 42);

    // 2. Student Info Section
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL STUDENT TRANSCRIPT", 14, 52);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Full Name:`, 14, 62);
    doc.setFont("helvetica", "bold");
    doc.text(student.name?.toUpperCase() || 'N/A', 45, 62);

    doc.setFont("helvetica", "normal");
    doc.text(`Student ID:`, 14, 68);
    doc.setFont("helvetica", "bold");
    doc.text(String(student.userId || 'N/A'), 45, 68);

    doc.setFont("helvetica", "normal");
    doc.text(`GPA Equivalent:`, 130, 62);
    doc.text(`${averageScore}%`, 165, 62);
    doc.text(`Academic Status:`, 130, 68);

    doc.setTextColor(isPassingOverall ? 22 : 220, isPassingOverall ? 163 : 38, 74);
    doc.text(isPassingOverall ? 'GOOD STANDING' : 'PROBATION', 165, 68);

    // 3. Performance Summary Table
    autoTable(doc, {
      startY: 78,
      head: [["Selected Evaluations", "Average Score", "Final Letter Grade"]],
      body: [[dataToExport.length, `${averageScore}%`, calculateLetterGrade(averageScore)]],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { halign: 'center', fontSize: 11 }
    });

    // 4. Detailed Results Record
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Examination Detailed Record", 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Semester", "Subject", "Term", "Weight", "Score", "Grade"]],
      body: dataToExport.map(r => [
        r.exam?.semester || 'N/A',
        r.exam?.name || 'N/A',
        r.exam?.term || 'N/A',
        `${r.exam?.weight || 0}%`,
        `${r.marks}%`,
        r.grade || calculateLetterGrade(r.marks)
      ]),
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9 }
    });

    // 5. Verification Footer
    const finalY = (doc as any).lastAutoTable.finalY + 35;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.line(14, finalY, 70, finalY);
    doc.text("Authorized Administrator Signature", 14, finalY + 5);
    doc.text("This document is a verified electronic copy issued by the AMF School Management System.", 14, doc.internal.pageSize.height - 10);

    doc.save(`Official_Transcript_${student.userId}.pdf`);
    toast.success("Transcript Generated Successfully");
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
            <GraduationCap className="w-10 h-10 text-primary" /> Central Registry
          </h1>
          <p className="text-muted-foreground font-medium">Academic monitoring and official transcript issuance.</p>
        </div>
        <Button
          onClick={generateTranscriptPDF}
          disabled={filteredResults.length === 0 || loading}
          className="gap-2 bg-blue-600 hover:bg-blue-700 h-12 px-6 shadow-lg shadow-blue-200"
        >
          <FileCheck className="w-5 h-5" />
          {selectedRows.size > 0 ? `Export Selected (${selectedRows.size})` : 'Export Visible Results'}
        </Button>
      </div>

      {/* FILTER CONTROLS */}
      <Card className="bg-slate-50 border-slate-200 shadow-sm">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
              <Search className="w-3 h-3" /> Student Search
            </label>
            <Input
              placeholder="Name or User ID..."
              className="bg-white"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchResults()}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400">Classroom</label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Global Search</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Semester
            </label>
            <Select value={selectedSemester} onValueChange={(val) => { setSelectedSemester(val); setSelectedRows(new Set()); }}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {uniqueSemesters.map(sem => <SelectItem key={sem} value={sem}>{sem}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={fetchResults} disabled={loading} variant="secondary" className="w-full font-bold">
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2 w-4 h-4" />}
            Filter Records
          </Button>
        </CardContent>
      </Card>

      {/* MAIN DATA TABLE */}
      <Card className="border-slate-200 shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100/80">
            <TableRow>
              <TableHead className="w-[60px] pl-6">
                <Checkbox
                  checked={selectedRows.size === filteredResults.length && filteredResults.length > 0}
                  onCheckedChange={toggleAllVisible}
                />
              </TableHead>
              <TableHead className="font-bold">Student Profile</TableHead>
              <TableHead className="font-bold">Assessment Details</TableHead>
              <TableHead className="text-center font-bold">Weight</TableHead>
              <TableHead className="text-center font-bold">Score</TableHead>
              <TableHead className="text-center font-bold">Grade</TableHead>
              <TableHead className="pr-6 text-right font-bold">Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="h-64 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></TableCell></TableRow>
            ) : filteredResults.length > 0 ? filteredResults.map((r) => {
              const isPassing = r.marks >= 50;
              const isSelected = selectedRows.has(r.id);
              return (
                <TableRow key={r.id} className={`transition-colors ${isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"}`}>
                  <TableCell className="pl-6">
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(r.id)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserCircle className="w-10 h-10 text-slate-200" />
                      <div>
                        <div className="font-bold text-slate-700">{r.student?.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase">{r.student?.userId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-800">{r.exam?.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase">{r.exam?.term}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{r.exam?.semester}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-slate-500">{r.exam?.weight}%</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-lg font-black ${!isPassing ? 'text-red-500' : 'text-slate-900'}`}>{r.marks}%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200">
                      {r.grade || calculateLetterGrade(r.marks)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex flex-col items-end gap-1.5">
                      {isPassing ? (
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md text-[10px] font-black border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" /> PASSED
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-1 rounded-md text-[10px] font-black border border-rose-100">
                          <AlertCircle className="w-3 h-3" /> FAILED
                        </div>
                      )}
                      {r.exam?.locked && <span className="flex items-center gap-1 text-[9px] text-slate-300 font-bold uppercase"><Lock className="w-2.5 h-2.5" /> Locked Record</span>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow><TableCell colSpan={7} className="h-64 text-center text-muted-foreground italic">No student records found matching filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}


// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';

// import { useEffect, useState, useCallback, useMemo } from 'react';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { Card, CardContent } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Checkbox } from '@/components/ui/checkbox';
// import { toast } from 'sonner';
// import { Download, Search, UserCircle, GraduationCap, Loader2, Lock, FileCheck, Filter } from 'lucide-react';
// import api from '@/lib/api';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// const calculateLetterGrade = (marks: number | string): string => {
//   const score = typeof marks === 'string' ? parseFloat(marks) : marks;
//   if (isNaN(score)) return '-';
//   if (score >= 90) return 'AA';
//   if (score >= 85) return 'BA';
//   if (score >= 80) return 'BB';
//   if (score >= 75) return 'CB';
//   if (score >= 70) return 'CC';
//   if (score >= 60) return 'DC';
//   if (score >= 50) return 'DD';
//   return 'FF';
// };

// export default function AdminResultsPage() {
//   const [results, setResults] = useState<any[]>([]);
//   const [classes, setClasses] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   // Filters
//   const [studentQuery, setStudentQuery] = useState('');
//   const [selectedClassId, setSelectedClassId] = useState<string>('all');
//   const [selectedSemester, setSelectedSemester] = useState<string>('all');

//   // Selection State
//   const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

//   // Derive unique semesters from results for the dropdown
//   const uniqueSemesters = useMemo(() => {
//     const sems = results.map(r => r.exam?.semester).filter(Boolean);
//     return Array.from(new Set(sems));
//   }, [results]);

//   // Filtered results based on the semester selection
//   const filteredResults = useMemo(() => {
//     if (selectedSemester === 'all') return results;
//     return results.filter(r => r.exam?.semester === selectedSemester);
//   }, [results, selectedSemester]);

//   const fetchResults = useCallback(async () => {
//     setLoading(true);
//     setSelectedRows(new Set());
//     const params = new URLSearchParams();
//     if (studentQuery.trim()) params.append('studentQuery', studentQuery.trim());
//     if (selectedClassId && selectedClassId !== 'all') params.append('classId', selectedClassId);

//     try {
//       const response = await api.get(`/admin/results/filter?${params.toString()}`);
//       setResults(Array.isArray(response.data) ? response.data : []);
//     } catch (error: any) {
//       toast.error(`Search failed`);
//       console.log(error)
//     } finally {
//       setLoading(false);
//     }
//   }, [studentQuery, selectedClassId]);

//   useEffect(() => {
//     const init = async () => {
//       try {
//         const classRes = await api.get('/admin/classes');
//         setClasses(classRes.data);
//       } catch (e) { console.error(e); }
//     };
//     init();
//     fetchResults();
//   }, [fetchResults]);

//   const toggleRow = (id: number) => {
//     const next = new Set(selectedRows);
//     if (next.has(id)) next.delete(id);
//     else next.add(id);
//     setSelectedRows(next);
//   };

//   const toggleAllVisible = () => {
//     if (selectedRows.size === filteredResults.length) setSelectedRows(new Set());
//     else setSelectedRows(new Set(filteredResults.map(r => r.id)));
//   };

//   const generateTranscriptPDF = () => {
//     const dataToExport = selectedRows.size > 0
//       ? results.filter(r => selectedRows.has(r.id))
//       : filteredResults;

//     if (dataToExport.length === 0) {
//       toast.error("No results selected.");
//       return;
//     }

//     const student = dataToExport[0].student;
//     const doc = new jsPDF();
//     const date = new Date().toLocaleDateString();

//     // Stats
//     const totalScore = dataToExport.reduce((acc, curr) => acc + (curr.marks || 0), 0);
//     const averageScore = (totalScore / dataToExport.length).toFixed(1);
//     const isPassing = parseFloat(averageScore) >= 50;

//     // PDF UI (Matching previously built style)
//     doc.setFillColor(37, 99, 235);
//     doc.rect(14, 12, 25, 25, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.text("AMF", 21, 22);
//     doc.setTextColor(30, 41, 59);
//     doc.setFontSize(18);
//     doc.setFont("helvetica", "bold");
//     doc.text("AMF INTERNATIONAL EXCELLENCE SCHOOL", 45, 20);
//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     doc.text(`Official Academic Transcript | Generated: ${date}`, 45, 31);
//     doc.line(14, 42, 196, 42);

//     doc.setFontSize(11);
//     doc.text(`Student: ${student.name?.toUpperCase()}`, 14, 52);
//     doc.text(`Student ID: ${student.userId}`, 14, 58);
//     doc.text(`Cumulative Average: ${averageScore}%`, 130, 52);
//     doc.setTextColor(isPassing ? 22 : 220, isPassing ? 163 : 38, 74);
//     doc.text(`Standing: ${isPassing ? 'GOOD STANDING' : 'PROBATION'}`, 130, 58);

//     autoTable(doc, {
//       startY: 68,
//       head: [["Semester", "Subject", "Term", "Weight", "Score", "Grade"]],
//       body: dataToExport.map(r => [
//         r.exam?.semester,
//         r.exam?.name,
//         r.exam?.term,
//         `${r.exam?.weight}%`,
//         `${r.marks}%`,
//         r.grade || calculateLetterGrade(r.marks)
//       ]),
//       headStyles: { fillColor: [30, 41, 59] },
//     });

//     doc.save(`Transcript_${student.userId}.pdf`);
//   };

//   return (
//     <div className="p-8 space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold flex items-center gap-2">
//             <GraduationCap className="w-8 h-8 text-primary" /> Central Gradebook
//           </h1>
//           <p className="text-muted-foreground font-medium">Refine results by semester or search for specific students.</p>
//         </div>
//         <Button
//           onClick={generateTranscriptPDF}
//           disabled={filteredResults.length === 0 || loading}
//           className="gap-2 bg-blue-600 hover:bg-blue-700 h-11"
//         >
//           <FileCheck className="w-4 h-4" />
//           {selectedRows.size > 0 ? `Export Selected (${selectedRows.size})` : 'Export Visible Results'}
//         </Button>
//       </div>

//       {/* ENHANCED FILTER BAR */}
//       <Card className="bg-slate-50 border-none shadow-none">
//         <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
//           <div className="space-y-2">
//             <label className="text-[10px] font-black uppercase text-slate-400">Search</label>
//             <div className="relative">
//               <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//               <Input placeholder="Name / ID..." className="pl-9 bg-white" value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <label className="text-[10px] font-black uppercase text-slate-400">Class</label>
//             <Select value={selectedClassId} onValueChange={setSelectedClassId}>
//               <SelectTrigger className="bg-white"><SelectValue placeholder="All" /></SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Classes</SelectItem>
//                 {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* NEW: SEMESTER FILTER */}
//           <div className="space-y-2">
//             <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
//               <Filter className="w-3 h-3" /> Semester
//             </label>
//             <Select value={selectedSemester} onValueChange={setSelectedSemester}>
//               <SelectTrigger className="bg-white"><SelectValue placeholder="Current" /></SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Semesters</SelectItem>
//                 {uniqueSemesters.map(sem => <SelectItem key={sem} value={sem}>{sem}</SelectItem>)}
//               </SelectContent>
//             </Select>
//           </div>

//           <Button onClick={fetchResults} disabled={loading} className="w-full h-10">
//             {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2 w-4 h-4" />}
//             Refresh Data
//           </Button>
//         </CardContent>
//       </Card>

//       <Card className="border-none shadow-sm overflow-hidden">
//         <Table>
//           <TableHeader className="bg-slate-50">
//             <TableRow>
//               <TableHead className="w-[50px] pl-6">
//                 <Checkbox
//                   checked={selectedRows.size === filteredResults.length && filteredResults.length > 0}
//                   onCheckedChange={toggleAllVisible}
//                 />
//               </TableHead>
//               <TableHead>Student</TableHead>
//               <TableHead>Assessment Details</TableHead>
//               <TableHead className="text-center">Weight</TableHead>
//               <TableHead className="text-center">Score</TableHead>
//               <TableHead className="text-center">Grade</TableHead>
//               <TableHead className="pr-6 text-right">Status</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {loading ? (
//               <TableRow><TableCell colSpan={7} className="h-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
//             ) : filteredResults.length > 0 ? filteredResults.map((r) => (
//               <TableRow key={r.id} className={selectedRows.has(r.id) ? "bg-blue-50/50" : ""}>
//                 <TableCell className="pl-6">
//                   <Checkbox checked={selectedRows.has(r.id)} onCheckedChange={() => toggleRow(r.id)} />
//                 </TableCell>
//                 <TableCell>
//                   <div className="font-bold text-slate-700">{r.student?.name}</div>
//                   <div className="text-[10px] text-muted-foreground font-mono">{r.student?.userId}</div>
//                 </TableCell>
//                 <TableCell>
//                   <div className="font-medium text-slate-700">{r.exam?.name}</div>
//                   <div className="flex items-center gap-2 mt-1">
//                     <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">{r.exam?.term}</span>
//                     <span className="text-[9px] text-slate-400 font-bold">{r.exam?.semester}</span>
//                   </div>
//                 </TableCell>
//                 <TableCell className="text-center font-bold text-slate-400">{r.exam?.weight}%</TableCell>
//                 <TableCell className="text-center font-black text-slate-800">{r.marks}%</TableCell>
//                 <TableCell className="text-center">
//                   <div className="w-8 h-8 mx-auto flex items-center justify-center rounded bg-slate-100 text-xs font-black border">{r.grade || calculateLetterGrade(r.marks)}</div>
//                 </TableCell>
//                 <TableCell className="text-right pr-6">
//                   <div className="flex flex-col items-end gap-1">
//                     <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${r.status === 'DRAFT' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>{r.status}</span>
//                     {r.exam?.locked && <span className="flex items-center gap-1 text-[9px] text-slate-400 font-bold"><Lock className="w-2.5 h-2.5" /> LOCKED</span>}
//                   </div>
//                 </TableCell>
//               </TableRow>
//             )) : (
//               <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground italic">No results found for {selectedSemester !== 'all' ? selectedSemester : 'this search'}.</TableCell></TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </Card>
//     </div>
//   );
// }
