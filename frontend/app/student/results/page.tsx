/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Award, BookOpen, TrendingUp, Download, CheckCircle2, AlertCircle, School, Filter, FileCheck } from 'lucide-react';
import api from '@/lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const calculateLetterGrade = (marks: number): string => {
   if (marks >= 90) return 'AA';
   if (marks >= 85) return 'BA';
   if (marks >= 80) return 'BB';
   if (marks >= 75) return 'CB';
   if (marks >= 70) return 'CC';
   if (marks >= 60) return 'DC';
   if (marks >= 50) return 'DD';
   return 'FF';
};

export default function StudentResultsPage() {
   const [results, setResults] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   // --- NEW STATES ---
   const [selectedSemester, setSelectedSemester] = useState<string>('all');
   const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

   useEffect(() => {
      const fetchResults = async () => {
         try {
            const response = await api.get('/student/results');
            setResults(response.data);
         } catch (error) {
            toast.error('Failed to load your academic records');
            console.error(error);
         } finally {
            setLoading(false);
         }
      };
      fetchResults();
   }, []);

   // --- FILTER LOGIC ---
   const uniqueSemesters = useMemo(() => {
      const sems = results.map(r => r.semester).filter(Boolean);
      return Array.from(new Set(sems));
   }, [results]);

   const filteredResults = useMemo(() => {
      if (selectedSemester === 'all') return results;
      return results.filter(r => r.semester === selectedSemester);
   }, [results, selectedSemester]);

   // --- SELECTION LOGIC ---
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

   // Overview Statistics based on ALL results
   const totalScore = results.reduce((acc, curr) => acc + (curr.marks || 0), 0);
   const averageScore = results.length > 0 ? (totalScore / results.length).toFixed(1) : '0';
   const highestScore = results.length > 0 ? Math.max(...results.map(r => r.marks)) : 0;

   const chartData = results.map(r => ({
      name: r.examName || 'Exam',
      myScore: r.marks,
      classAvg: r.classAverage || 0,
   }));

   // --- TRANSCRIPT GENERATION ---
   const downloadTranscript = () => {
      // Use selected rows if any, otherwise use currently filtered results
      const dataToExport = selectedRows.size > 0
         ? results.filter(r => selectedRows.has(r.id))
         : filteredResults;

      if (dataToExport.length === 0) {
         toast.error("No results available for transcript generation.");
         return;
      }

      const studentInfo = dataToExport[0]?.student;
      const studentFullName = studentInfo?.name || "Unknown Student";
      const studentId = studentInfo?.userId || studentInfo?.id || "N/A";

      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();
      const schoolFullName = "AMF INTERNATIONAL EXCELLENCE SCHOOL";

      // Stats for the PDF summary
      const exportTotal = dataToExport.reduce((acc, curr) => acc + (curr.marks || 0), 0);
      const exportAvg = (exportTotal / dataToExport.length).toFixed(1);

      // 1. Header & Branding (Maintained Format)
      doc.setFillColor(37, 99, 235);
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
      doc.text("Official Academic Transcript | Student Copy", 45, 26);
      doc.text(`Generated on: ${date}`, 45, 31);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 42, 196, 42);

      // 2. Student Data Section
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL STUDENT TRANSCRIPT", 14, 52);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Full Name:`, 14, 62);
      doc.setFont("helvetica", "bold");
      doc.text(studentFullName.toUpperCase(), 45, 62);
      doc.setFont("helvetica", "normal");
      doc.text(`Student ID:`, 14, 68);
      doc.setFont("helvetica", "bold");
      doc.text(String(studentId), 45, 68);

      doc.setFont("helvetica", "normal");
      doc.text(`GPA Equivalent:`, 130, 62);
      doc.text(`${exportAvg}%`, 165, 62);
      doc.text(`Academic Status:`, 130, 68);

      const isPassing = parseFloat(exportAvg) >= 50;
      doc.setTextColor(isPassing ? 22 : 220, isPassing ? 163 : 38, 74);
      doc.text(isPassing ? 'GOOD STANDING' : 'PROBATION', 165, 68);

      // 3. Performance Summary Table
      autoTable(doc, {
         startY: 78,
         head: [["Selected Evaluations", "Average Score", "Final Letter Grade"]],
         body: [[dataToExport.length, `${exportAvg}%`, calculateLetterGrade(parseFloat(exportAvg))]],
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
         head: [["Subject", "Term/Exam", "Semester", "Score", "Grade"]],
         body: dataToExport.map(r => [
            r.examName || 'N/A',
            r.term || 'N/A',
            r.semester || 'N/A',
            `${r.marks}%`,
            calculateLetterGrade(r.marks)
         ]),
         headStyles: { fillColor: [37, 99, 235] },
         alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      // 5. Footer
      const finalY = (doc as any).lastAutoTable.finalY + 35;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.line(14, finalY, 70, finalY);
      doc.text("Office of the Registrar", 14, finalY + 5);
      doc.text("Verified electronic student record.", 14, doc.internal.pageSize.height - 10);

      doc.save(`Transcript_${studentFullName.replace(/\s+/g, '_')}.pdf`);
      toast.success("Transcript Downloaded Successfully");
   };

   if (loading) {
      return (
         <div className="flex h-[80vh] items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-2">
               <School className="w-8 h-8 text-primary animate-bounce" />
               <p className="text-muted-foreground font-medium">Loading Academic Profile...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
         {/* HEADER */}
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
            <div>
               <h1 className="text-3xl font-bold tracking-tight">Academic Portal</h1>
               <p className="text-muted-foreground">Welcome, {results[0]?.student?.name || 'Student'}. View your growth and performance.</p>
            </div>
            <div className="flex items-center gap-4">
               <Button onClick={downloadTranscript} className="gap-2 bg-blue-600 hover:bg-blue-700 h-11">
                  <FileCheck className="w-4 h-4" />
                  {selectedRows.size > 0 ? `Export Selected (${selectedRows.size})` : 'Export Transcript'}
               </Button>
               <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <div className="text-right">
                     <p className="text-xs uppercase text-muted-foreground font-bold">Overall Average</p>
                     <p className="text-3xl font-black text-primary">{averageScore}%</p>
                  </div>
                  <Award className="w-8 h-8 text-primary" />
               </div>
            </div>
         </header>

         {/* FILTERS */}
         <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 min-w-max">
               <Filter className="w-4 h-4" />
               <span className="text-sm font-bold uppercase">Filter Results:</span>
            </div>
            <Select value={selectedSemester} onValueChange={(val) => { setSelectedSemester(val); setSelectedRows(new Set()); }}>
               <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="All Semesters" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {uniqueSemesters.map(sem => <SelectItem key={sem} value={sem}>{sem}</SelectItem>)}
               </SelectContent>
            </Select>
         </div>

         {/* ANALYTICS GRID */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-slate-200/60">
               <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-blue-500" />
                     <CardTitle className="text-base font-semibold">Score Trends vs. Class Average</CardTitle>
                  </div>
               </CardHeader>
               <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Line name="My Score" type="monotone" dataKey="myScore" stroke="#2563eb" strokeWidth={4} dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
                        <Line name="Class Mean" type="monotone" dataKey="classAvg" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="6 6" dot={false} />
                     </LineChart>
                  </ResponsiveContainer>
               </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
               <Card className="bg-primary text-primary-foreground border-none shadow-lg">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-primary-foreground/70 text-xs font-bold uppercase">Peak Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <h2 className="text-4xl font-black">{highestScore}%</h2>
                     <p className="text-sm mt-1 opacity-80 font-medium">Highest score achieved to date</p>
                  </CardContent>
               </Card>

               <Card className="flex-1 border-dashed">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Evaluations</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-4">
                     <BookOpen className="w-8 h-8 text-primary/40" />
                     <h2 className="text-3xl font-bold">{results.length} Exams</h2>
                  </CardContent>
               </Card>
            </div>
         </div>

         {/* DETAILED RESULTS TABLE */}
         <Card className="shadow-sm border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
               <Table>
                  <TableHeader>
                     <TableRow className="bg-slate-50/50">
                        <TableHead className="w-[50px] pl-6">
                           <Checkbox
                              checked={selectedRows.size === filteredResults.length && filteredResults.length > 0}
                              onCheckedChange={toggleAllVisible}
                           />
                        </TableHead>
                        <TableHead className="w-[250px] font-bold">Examination</TableHead>
                        <TableHead className="font-bold">Term & Semester</TableHead>
                        <TableHead className="text-center font-bold">Score</TableHead>
                        <TableHead className="text-center font-bold">Grade</TableHead>
                        <TableHead className="text-right pr-6 font-bold">Outcome</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredResults.length > 0 ? filteredResults.map((r) => {
                        const isPassing = r.marks >= 50;
                        const isSelected = selectedRows.has(r.id);
                        return (
                           <TableRow key={r.id} className={`group transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}>
                              <TableCell className="pl-6">
                                 <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleRow(r.id)}
                                 />
                              </TableCell>
                              <TableCell className="font-semibold py-4 text-slate-700">
                                 {r.examName || 'N/A'}
                                 <div className="text-[10px] text-slate-400 font-bold uppercase">{r.className || 'N/A'}</div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase border border-blue-200">
                                       {r.term || 'N/A'}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-bold">
                                       {r.semester || 'N/A'}
                                    </span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-center">
                                 <span className={`text-base font-black ${!isPassing ? 'text-red-500' : 'text-slate-900'}`}>{r.marks}%</span>
                              </TableCell>
                              <TableCell className="text-center">
                                 <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-700 font-black text-xs border">
                                    {r.grade || calculateLetterGrade(r.marks)}
                                 </div>
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                 <div className="flex justify-end">
                                    {isPassing ? (
                                       <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md text-[10px] font-bold border border-emerald-100">
                                          <CheckCircle2 className="w-3 h-3" /> PASSED
                                       </div>
                                    ) : (
                                       <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1 rounded-md text-[10px] font-bold border border-rose-100">
                                          <AlertCircle className="w-3 h-3" /> FAILED
                                       </div>
                                    )}
                                 </div>
                              </TableCell>
                           </TableRow>
                        );
                     }) : (
                        <TableRow>
                           <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                              No records found for this semester.
                           </TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </div>
         </Card>
      </div>
   );
}



// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';

// import { useEffect, useState } from 'react';
// import {
//    Table,
//    TableBody,
//    TableCell,
//    TableHead,
//    TableHeader,
//    TableRow,
// } from '@/components/ui/table';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import {
//    LineChart,
//    Line,
//    XAxis,
//    YAxis,
//    CartesianGrid,
//    Tooltip,
//    ResponsiveContainer,
//    Legend,
// } from 'recharts';
// import { Button } from '@/components/ui/button';
// import { toast } from 'sonner';
// import { Award, BookOpen, TrendingUp, Download, CheckCircle2, AlertCircle, School } from 'lucide-react';
// import api from '@/lib/api';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// // --- SHARED HELPERS ---
// const calculateLetterGrade = (marks: number): string => {
//    if (marks >= 90) return 'AA';
//    if (marks >= 85) return 'BA';
//    if (marks >= 80) return 'BB';
//    if (marks >= 75) return 'CB';
//    if (marks >= 70) return 'CC';
//    if (marks >= 60) return 'DC';
//    if (marks >= 50) return 'DD';
//    return 'FF';
// };

// export default function StudentResultsPage() {
//    const [results, setResults] = useState<any[]>([]);
//    const [loading, setLoading] = useState(true);

//    useEffect(() => {
//       const fetchResults = async () => {
//          try {
//             const response = await api.get('/student/results');
//             setResults(response.data);
//          } catch (error) {
//             toast.error('Failed to load your academic records');
//             console.error(error);
//          } finally {
//             setLoading(false);
//          }
//       };
//       fetchResults();
//    }, []);

//    // Calculate Overview Statistics
//    const totalScore = results.reduce((acc, curr) => acc + (curr.marks || 0), 0);
//    const averageScore = results.length > 0 ? (totalScore / results.length).toFixed(1) : '0';
//    const highestScore = results.length > 0 ? Math.max(...results.map(r => r.marks)) : 0;

//    const chartData = results.map(r => ({
//       name: r.exam.name,
//       myScore: r.marks,
//       classAvg: r.classAverage || 0,
//    }));

//    // --- OFFICIAL TRANSCRIPT GENERATION ---
//    const downloadTranscript = () => {
//       if (results.length === 0) {
//          toast.error("No results available for transcript generation.");
//          return;
//       }

//       // PULL REAL DATA FROM THE NEW STUDENT OBJECT RETURNED BY BACKEND
//       const studentInfo = results[0]?.student;
//       const studentFullName = studentInfo?.name || "Unknown Student";
//       const studentId = studentInfo?.userId || studentInfo?.id || "N/A";

//       const doc = new jsPDF();
//       const date = new Date().toLocaleDateString();
//       const schoolFullName = "AMF INTERNATIONAL EXCELLENCE SCHOOL";

//       // 1. Header & Branding
//       doc.setFillColor(37, 99, 235); // Primary Blue
//       doc.rect(14, 12, 25, 25, 'F');
//       doc.setTextColor(255, 255, 255);
//       doc.setFontSize(10);
//       doc.text("AMF", 21, 22);
//       doc.text("ACADEMIC", 16, 28);

//       doc.setTextColor(30, 41, 59);
//       doc.setFontSize(18);
//       doc.setFont("helvetica", "bold");
//       doc.text(schoolFullName, 45, 20);

//       doc.setFontSize(9);
//       doc.setFont("helvetica", "normal");
//       doc.setTextColor(100);
//       doc.text("Official Academic Transcript | Quality Education for All", 45, 26);
//       doc.text(`Generated on: ${date}`, 45, 31);

//       doc.setDrawColor(226, 232, 240);
//       doc.line(14, 42, 196, 42);

//       // 2. DYNAMIC STUDENT DATA SECTION
//       doc.setFontSize(12);
//       doc.setTextColor(30, 41, 59);
//       doc.setFont("helvetica", "bold");
//       doc.text("OFFICIAL STUDENT TRANSCRIPT", 14, 52);

//       doc.setFontSize(10);
//       doc.setFont("helvetica", "normal");
//       doc.text(`Full Name:`, 14, 62);
//       doc.setFont("helvetica", "bold");
//       doc.text(studentFullName.toUpperCase(), 45, 62); // Real Student Name

//       doc.setFont("helvetica", "normal");
//       doc.text(`Student ID:`, 14, 68);
//       doc.setFont("helvetica", "bold");
//       doc.text(String(studentId), 45, 68); // Real Student ID

//       doc.setFont("helvetica", "normal");
//       doc.text(`GPA Equivalent:`, 130, 62);
//       doc.text(`${averageScore}%`, 165, 62);
//       doc.text(`Academic Status:`, 130, 68);

//       // Status color (Green for passing, Red for failing average)
//       const isPassingOverall = parseFloat(averageScore) >= 50;
//       doc.setTextColor(isPassingOverall ? 22 : 220, isPassingOverall ? 163 : 38, 74);
//       doc.text(isPassingOverall ? 'GOOD STANDING' : 'PROBATION', 165, 68);

//       // 3. Performance Summary Table
//       autoTable(doc, {
//          startY: 78,
//          head: [["Total Examinations", "Cumulative Average", "Final Letter Grade"]],
//          body: [[results.length, `${averageScore}%`, calculateLetterGrade(parseFloat(averageScore))]],
//          theme: 'grid',
//          headStyles: { fillColor: [30, 41, 59] },
//          styles: { halign: 'center', fontSize: 11 }
//       });

//       // 4. Detailed Results Record
//       doc.setTextColor(30, 41, 59);
//       doc.setFontSize(12);
//       doc.setFont("helvetica", "bold");
//       doc.text("Examination Detailed Record", 14, (doc as any).lastAutoTable.finalY + 15);

//       autoTable(doc, {
//          startY: (doc as any).lastAutoTable.finalY + 20,
//          head: [["Subject", "Classroom", "Score", "Result"]],
//          body: results.map(r => [
//             r.exam.name,
//             r.exam.classe.name,
//             `${r.marks}%`,
//             r.marks >= 50 ? "PASSED" : "FAILED"
//          ]),
//          headStyles: { fillColor: [37, 99, 235] },
//          alternateRowStyles: { fillColor: [248, 250, 252] },
//          didParseCell: (data) => {
//             if (data.section === 'body' && data.column.index === 3) {
//                const text = data.cell.raw as string;
//                if (text === "FAILED") data.cell.styles.textColor = [220, 38, 38];
//                if (text === "PASSED") data.cell.styles.textColor = [22, 163, 74];
//             }
//          }
//       });

//       // 5. Verification Footer
//       const finalY = (doc as any).lastAutoTable.finalY + 35;
//       doc.setFontSize(8);
//       doc.setTextColor(150);
//       doc.line(14, finalY, 70, finalY);
//       doc.text("Director of Academic Affairs", 14, finalY + 5);
//       doc.text("This document is a verified electronic transcript issued by the AMF School Management System.", 14, doc.internal.pageSize.height - 10);

//       doc.save(`Transcript_${studentFullName.replace(/\s+/g, '_')}.pdf`);
//       toast.success("Transcript Downloaded Successfully");
//    };

//    if (loading) {
//       return (
//          <div className="flex h-[80vh] items-center justify-center">
//             <div className="animate-pulse flex flex-col items-center gap-2">
//                <School className="w-8 h-8 text-primary animate-bounce" />
//                <p className="text-muted-foreground font-medium">Loading Academic Profile...</p>
//             </div>
//          </div>
//       );
//    }

//    return (
//       <div className="p-8 space-y-8 max-w-7xl mx-auto">
//          {/* HEADER */}
//          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
//             <div>
//                <h1 className="text-3xl font-bold tracking-tight">Academic Portal</h1>
//                <p className="text-muted-foreground">Welcome, {results[0]?.student?.name || 'Student'}. View your growth and performance.</p>
//             </div>
//             <div className="flex items-center gap-4">
//                <Button variant="outline" onClick={downloadTranscript} className="gap-2 border-primary/20 hover:bg-primary/5">
//                   <Download className="w-4 h-4" /> Official Transcript
//                </Button>
//                <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
//                   <div className="text-right">
//                      <p className="text-xs uppercase text-muted-foreground font-bold">Overall Average</p>
//                      <p className="text-3xl font-black text-primary">{averageScore}%</p>
//                   </div>
//                   <Award className="w-8 h-8 text-primary" />
//                </div>
//             </div>
//          </header>

//          {/* ANALYTICS GRID */}
//          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             <Card className="lg:col-span-2 shadow-sm border-slate-200/60">
//                <CardHeader className="flex flex-row items-center justify-between">
//                   <div className="flex items-center gap-2">
//                      <TrendingUp className="w-5 h-5 text-blue-500" />
//                      <CardTitle className="text-base font-semibold">Score Trends vs. Class Average</CardTitle>
//                   </div>
//                </CardHeader>
//                <CardContent className="h-[320px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
//                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
//                         <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
//                         <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
//                         <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
//                         <Line name="My Score" type="monotone" dataKey="myScore" stroke="#2563eb" strokeWidth={4} dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
//                         <Line name="Class Mean" type="monotone" dataKey="classAvg" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="6 6" dot={false} />
//                      </LineChart>
//                   </ResponsiveContainer>
//                </CardContent>
//             </Card>

//             <div className="flex flex-col gap-4">
//                <Card className="bg-primary text-primary-foreground border-none shadow-lg">
//                   <CardHeader className="pb-2">
//                      <CardTitle className="text-primary-foreground/70 text-xs font-bold uppercase">Peak Performance</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                      <h2 className="text-4xl font-black">{highestScore}%</h2>
//                      <p className="text-sm mt-1 opacity-80 font-medium">Highest score achieved to date</p>
//                   </CardContent>
//                </Card>

//                <Card className="flex-1 border-dashed">
//                   <CardHeader className="pb-2">
//                      <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Evaluations</CardTitle>
//                   </CardHeader>
//                   <CardContent className="flex items-center gap-4">
//                      <BookOpen className="w-8 h-8 text-primary/40" />
//                      <h2 className="text-3xl font-bold">{results.length} Exams</h2>
//                   </CardContent>
//                </Card>
//             </div>
//          </div>

//          {/* DETAILED RESULTS TABLE */}
//          <Card className="shadow-sm border-slate-200/60 overflow-hidden">
//             <div className="overflow-x-auto">
//                <Table>
//                   <TableHeader>
//                      <TableRow className="bg-slate-50/50">
//                         <TableHead className="w-[300px] pl-6 font-bold">Examination</TableHead>
//                         <TableHead className="font-bold">Group/Class</TableHead>
//                         <TableHead className="text-center font-bold">Score</TableHead>
//                         <TableHead className="text-center font-bold">Class Avg</TableHead>
//                         <TableHead className="text-center font-bold">Grade</TableHead>
//                         <TableHead className="text-right pr-6 font-bold">Outcome</TableHead>
//                      </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                      {results.length > 0 ? results.map((r) => {
//                         const isPassing = r.marks >= 50;
//                         return (
//                            <TableRow key={r.id} className="group hover:bg-slate-50/50 transition-colors">
//                               <TableCell className="font-semibold py-4 pl-6 text-slate-700">{r.exam.name}</TableCell>
//                               <TableCell className="text-slate-500 font-medium">{r.exam.classe.name}</TableCell>
//                               <TableCell className="text-center">
//                                  <span className={`text-base font-bold ${!isPassing ? 'text-red-500' : 'text-slate-900'}`}>{r.marks}</span>
//                               </TableCell>
//                               <TableCell className="text-center text-slate-400 font-medium">{r.classAverage ? `${Number(r.classAverage).toFixed(2)}%` : '—'}
//                               </TableCell>
//                               <TableCell className="text-center">
//                                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary font-black text-xs">
//                                     {r.grade || calculateLetterGrade(r.marks)}
//                                  </div>
//                               </TableCell>
//                               <TableCell className="text-right pr-6">
//                                  <div className="flex justify-end">
//                                     {isPassing ? (
//                                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md text-[10px] font-bold border border-emerald-100">
//                                           <CheckCircle2 className="w-3 h-3" /> PASSED
//                                        </div>
//                                     ) : (
//                                        <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1 rounded-md text-[10px] font-bold border border-rose-100">
//                                           <AlertCircle className="w-3 h-3" /> FAILED
//                                        </div>
//                                     )}
//                                  </div>
//                               </TableCell>
//                            </TableRow>
//                         );
//                      }) : (
//                         <TableRow>
//                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
//                               No examination records found.
//                            </TableCell>
//                         </TableRow>
//                      )}
//                   </TableBody>
//                </Table>
//             </div>
//          </Card>
//       </div>
//    );
// }
