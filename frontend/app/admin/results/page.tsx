/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { toast } from 'sonner';
import { Download, Search, UserCircle, GraduationCap, Loader2 } from 'lucide-react';
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

  // Filters matching your backend @RequestParam names
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // 1. Fetch results based on latest backend logic
  const fetchResults = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();

    // Match the @RequestParam name 'studentQuery'
    if (studentQuery.trim()) {
      params.append('studentQuery', studentQuery.trim());
    }

    // Crucial: Only append classId if it is a numeric ID
    if (selectedClassId && selectedClassId !== 'all') {
      params.append('classId', selectedClassId);
    }

    try {
      const response = await api.get(`/admin/results/filter?${params.toString()}`);
      setResults(response.data);
    } catch (error: any) {
      console.error("Axios Error Details:", error.response?.data);
      toast.error('Search failed: ' + (error.response?.data?.message || 'Check server logs'));
    } finally {
      setLoading(false);
    }
  }, [studentQuery, selectedClassId]);

  // Load Classes and Initial Data
  useEffect(() => {
    const init = async () => {
      try {
        const classRes = await api.get('/admin/classes');
        setClasses(classRes.data);
      } catch (e) {
        console.error("Initialization error", e);
      }
    };
    init();
    fetchResults();
  }, [fetchResults]);

  // --- TRANSCRIPT GENERATOR ---
  const generateTranscriptPDF = () => {
    if (results.length === 0) {
      toast.error("No data found to generate transcript.");
      return;
    }

    const firstResult = results[0];
    const student = firstResult.student;
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // 1. Header & Official Branding
    doc.setFillColor(30, 41, 59); // Dark Slate
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("OFFICIAL ACADEMIC TRANSCRIPT", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text("AMF INTERNATIONAL EXCELLENCE SCHOOL - ADMINISTRATIVE RECORD", 105, 30, { align: 'center' });

    // 2. Student Info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("STUDENT INFORMATION", 14, 50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${student.name?.toUpperCase() || 'N/A'}`, 14, 58);
    doc.text(`Student ID: ${student.userId || student.id || 'N/A'}`, 14, 64);
    doc.text(`Report Date: ${date}`, 130, 58);

    // 3. Results Table
    autoTable(doc, {
      startY: 75,
      head: [["Exam/Subject", "Score", "Class Avg", "Grade", "Status"]],
      body: results.map(r => [
        r.exam?.name || 'N/A',
        `${r.marks}%`,
        r.classAverage ? `${Number(r.classAverage).toFixed(2)}%` : 'N/A',
        r.grade || calculateLetterGrade(r.marks),
        r.status
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.text("__________________________", 14, finalY);
    doc.text("Authorized Administrator", 14, finalY + 5);

    doc.save(`Admin_Transcript_${student.name || 'Student'}.pdf`);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-800">
            <GraduationCap className="w-8 h-8 text-primary" /> Administrative Results
          </h1>
          <p className="text-muted-foreground font-medium">Global view of student scores and performance metrics.</p>
        </div>
        <Button
          onClick={generateTranscriptPDF}
          disabled={results.length === 0 || loading}
          variant="outline"
          className="gap-2"
        >
          <Download className="w-4 h-4" /> Export Student Transcript
        </Button>
      </div>

      {/* FILTER BAR */}
      <Card className="bg-slate-50/50 border-dashed">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Student Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Name or User ID..."
                  className="pl-9 bg-white"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchResults()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Classroom Filter</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={fetchResults} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Filter Records
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULTS TABLE */}
      <Card className="shadow-sm border-none overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100/50">
            <TableRow>
              <TableHead className="pl-6">Student Details</TableHead>
              <TableHead>Exam & Subject</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-center">Class Avg</TableHead>
              <TableHead className="text-center">Grade</TableHead>
              <TableHead className="pr-6 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                  Updating records...
                </TableCell>
              </TableRow>
            ) : results.length > 0 ? results.map((r) => (
              <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="pl-6 py-4">
                  <div className="flex items-center gap-3">
                    <UserCircle className="w-8 h-8 text-slate-300" />
                    <div>
                      <div className="font-bold text-slate-700">{r.student?.name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-mono">{r.student?.userId}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-700">{r.exam?.name}</div>
                  <div className="text-[10px] text-primary/70 font-bold uppercase">{r.exam?.subject?.name}</div>
                </TableCell>
                <TableCell className="text-center">
                  <div className={`text-lg font-black ${r.marks < 50 ? "text-red-500" : "text-slate-800"}`}>
                    {r.marks}
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium text-slate-400">
                  {r.classAverage ? `${Number(r.classAverage).toFixed(1)}%` : '—'}
                </TableCell>
                <TableCell className="text-center">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border">
                    {r.grade || calculateLetterGrade(r.marks)}
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${r.status === 'DRAFT'
                    ? 'bg-orange-50 text-orange-600 border-orange-100'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                    {r.status}
                  </span>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                  No records found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}


// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';

// import { useEffect, useState, useCallback } from 'react';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { toast } from 'sonner';
// import { Download, Search, FileText, UserCircle, GraduationCap } from 'lucide-react';
// import api from '@/lib/api';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// // --- SHARED HELPERS ---
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

//   // Filters
//   const [studentId, setStudentId] = useState('');
//   const [selectedClassId, setSelectedClassId] = useState<string>('all');
//   const [selectedSemester, setSelectedSemester] = useState<string>('all');

//   const fetchResults = async () => {
//     const params = new URLSearchParams();
//     if (studentId) params.append('studentId', studentId);
//     if (selectedClassId !== 'all') params.append('classId', selectedClassId);
//     if (selectedSemester !== 'all') params.append('semester', selectedSemester);

//     try {
//       const response = await api.get(`/admin/results/filter?${params.toString()}`);
//       setResults(response.data);
//     } catch (error) {
//       toast.error('Failed to fetch results');
//       console.log(error)
//     }
//   };

//   // Load Initial Data
//   useEffect(() => {
//     const init = async () => {
//       try {
//         const classRes = await api.get('/admin/classes'); // Adjust endpoint to your admin API
//         setClasses(classRes.data);
//       } catch (e) {
//         console.error("Initialization error", e);
//       }
//     };
//     init();
//     //fetchResults();
//   }, []);

//   useEffect(() => {
//     const loadData = async () => {
//       await fetchResults();
//     };

//     loadData();
//   }, []);

//   // --- TRANSCRIPT GENERATOR (Admin Version) ---
//   const generateTranscriptPDF = () => {
//     if (results.length === 0) {
//       toast.error("No data found to generate transcript.");
//       return;
//     }

//     // Since results are filtered by studentId, we assume index 0 contains the target student
//     const student = results[0].student;
//     const doc = new jsPDF();
//     const date = new Date().toLocaleDateString();

//     // 1. Header & Official Branding
//     doc.setFillColor(30, 41, 59); // Dark Slate
//     doc.rect(0, 0, 210, 40, 'F');
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(22);
//     doc.text("OFFICIAL ACADEMIC TRANSCRIPT", 105, 20, { align: 'center' });
//     doc.setFontSize(10);
//     doc.text("AMF INTERNATIONAL EXCELLENCE SCHOOL - ADMINISTRATIVE RECORD", 105, 30, { align: 'center' });

//     // 2. Student & Admin Info Block
//     doc.setTextColor(30, 41, 59);
//     doc.setFontSize(12);
//     doc.setFont("helvetica", "bold");
//     doc.text("STUDENT INFORMATION", 14, 50);

//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     doc.text(`Name: ${student.name.toUpperCase()}`, 14, 58);
//     doc.text(`Student ID: ${student.userId || student.id}`, 14, 64);
//     doc.text(`Class: ${selectedClassId !== 'all' ? classes.find(c => String(c.id) === selectedClassId)?.name : 'Multiple'}`, 130, 58);
//     doc.text(`Report Date: ${date}`, 130, 64);

//     // 3. Results Table
//     autoTable(doc, {
//       startY: 75,
//       head: [["Exam/Subject", "Semester", "Teacher", "Score", "Grade", "Status"]],
//       body: results.map(r => [
//         r.exam.name,
//         r.exam.semester || 'S1',
//         r.exam.teacher?.name || 'Staff',
//         `${r.marks}%`,
//         calculateLetterGrade(r.marks),
//         r.status
//       ]),
//       theme: 'striped',
//       headStyles: { fillColor: [41, 128, 185] },
//       styles: { fontSize: 9 }
//     });

//     // 4. Verification Footer
//     const finalY = (doc as any).lastAutoTable.finalY + 20;
//     doc.setFontSize(9);
//     doc.text("__________________________", 14, finalY);
//     doc.text("Authorized Administrator", 14, finalY + 5);
//     doc.text("Seal of Authenticity", 150, finalY + 5);

//     doc.save(`Admin_Transcript_${student.name.replace(/\s+/g, '_')}.pdf`);
//   };

//   return (
//     <div className="p-8 space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold flex items-center gap-2">
//             <GraduationCap className="w-8 h-8 text-primary" /> Centralized Result Management
//           </h1>
//           <p className="text-muted-foreground font-medium">Monitor student performance across all departments.</p>
//         </div>
//         <Button onClick={generateTranscriptPDF} disabled={results.length === 0} variant="outline" className="gap-2">
//           <Download className="w-4 h-4" /> Export Student Transcript
//         </Button>
//       </div>

//       {/* FILTER BAR */}
//       <Card className="bg-slate-50/50">
//         <CardContent className="pt-6">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
//             <div className="space-y-2">
//               <label className="text-xs font-bold uppercase text-slate-500">Search Student</label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   placeholder="ID or Name"
//                   className="pl-9"
//                   value={studentId}
//                   onChange={(e) => setStudentId(e.target.value)}
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <label className="text-xs font-bold uppercase text-slate-500">Filter Class</label>
//               <Select value={selectedClassId} onValueChange={setSelectedClassId}>
//                 <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Classes</SelectItem>
//                   {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <label className="text-xs font-bold uppercase text-slate-500">Semester</label>
//               <Select value={selectedSemester} onValueChange={setSelectedSemester}>
//                 <SelectTrigger><SelectValue placeholder="All Time" /></SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">Cumulative</SelectItem>
//                   <SelectItem value="Semester 1">Semester 1</SelectItem>
//                   <SelectItem value="Semester 2">Semester 2</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <Button onClick={fetchResults} className="w-full gap-2">
//               <Search className="w-4 h-4" /> Filter Records
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* RESULTS TABLE */}
//       <Card className="shadow-sm">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Student Details</TableHead>
//               <TableHead>Exam / Semester</TableHead>
//               <TableHead>Subject</TableHead>
//               <TableHead className="text-center">Score</TableHead>
//               <TableHead className="text-center">Grade</TableHead>
//               <TableHead>Status</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {results.length > 0 ? results.map((r) => (
//               <TableRow key={r.id}>
//                 <TableCell>
//                   <div className="flex items-center gap-3">
//                     <UserCircle className="w-8 h-8 text-slate-300" />
//                     <div>
//                       <div className="font-bold">{r.student.name}</div>
//                       <div className="text-[10px] text-muted-foreground uppercase">{r.student.userId}</div>
//                     </div>
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <div className="font-medium">{r.exam.name}</div>
//                   <div className="text-[10px] text-primary font-bold">{r.exam.semester || 'N/A'}</div>
//                 </TableCell>
//                 <TableCell>{r.exam.subject?.name}</TableCell>
//                 <TableCell className="text-center font-bold text-lg">
//                   <span className={r.marks < 50 ? "text-red-500" : ""}>{r.marks}%</span>
//                 </TableCell>
//                 <TableCell className="text-center">
//                   <div className="inline-block px-2 py-1 rounded bg-slate-100 font-bold text-xs">
//                     {calculateLetterGrade(r.marks)}
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${r.status === 'DRAFT' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
//                     }`}>
//                     {r.status}
//                   </span>
//                 </TableCell>
//               </TableRow>
//             )) : (
//               <TableRow>
//                 <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
//                   No records found matching your filters.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </Card>
//     </div>
//   );
// }

