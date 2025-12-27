/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react'; // For the button icon
import { toast } from 'sonner';
import api from '@/lib/api';

// PDF Libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function GradebookPage() {
   const [classes, setClasses] = useState<any[]>([]);
   const [selectedClassId, setSelectedClassId] = useState<string>('');
   const [reportData, setReportData] = useState<any[]>([]);
   const [exams, setExams] = useState<string[]>([]);

   useEffect(() => {
      api.get('/teacher/classes').then(res => setClasses(res.data));
   }, []);

   useEffect(() => {
      if (!selectedClassId) return;

      const fetchGrades = async () => {
         try {
            const res = await api.get(`/teacher/classes/${selectedClassId}/gradebook`);
            const results = res.data;

            const uniqueExams = Array.from(new Set(results.map((r: any) => r.exam.name))) as string[];
            setExams(uniqueExams);

            const studentMap: any = {};
            results.forEach((r: any) => {
               const sId = r.student.userId;
               if (!studentMap[sId]) {
                  studentMap[sId] = {
                     name: r.student.name,
                     userId: sId,
                     marks: {}
                  };
               }
               studentMap[sId].marks[r.exam.name] = r.marks;
            });

            setReportData(Object.values(studentMap));
         } catch (error) {
            toast.error('Failed to load gradebook');
            console.log(error);
         }
      };

      fetchGrades();
   }, [selectedClassId]);

   // --- PDF GENERATION LOGIC ---
   const downloadPDF = () => {
      if (reportData.length === 0) {
         toast.error("No data available to download");
         return;
      }

      const doc = new jsPDF({ orientation: 'landscape' }); // Landscape fits more exams
      const className = classes.find(c => String(c.id) === selectedClassId)?.name || 'Class';

      // Title & Metadata
      doc.setFontSize(20);
      doc.text(`Grade Report: ${className}`, 14, 15);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

      // Define Columns
      const tableColumn = ["ID", "Student Name", ...exams, "Average"];

      // Define Rows
      const tableRows = reportData.map(student => {
         const scores = Object.values(student.marks) as number[];
         const average = scores.length > 0
            ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) + '%'
            : '-';

         return [
            student.userId,
            student.name,
            ...exams.map(examName => student.marks[examName] ?? '-'),
            average
         ];
      });

      // Build Table
      autoTable(doc, {
         startY: 30,
         head: [tableColumn],
         body: tableRows,
         theme: 'striped',
         headStyles: { fillColor: [41, 128, 185], textColor: 255 },
         styles: { fontSize: 8, cellPadding: 2 },
         didParseCell: (data) => {
            // Apply red color in PDF for failing grades
            if (data.section === 'body' && typeof data.cell.raw === 'number' && data.cell.raw < 50) {
               data.cell.styles.textColor = [220, 38, 38]; // Red color
            }
         }
      });

      doc.save(`${className.replace(/\s+/g, '_')}_Grades.pdf`);
      toast.success('PDF Downloaded');
   };

   return (
      <div className="p-8 space-y-6">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-3xl font-bold tracking-tight">Gradebook</h1>
               <p className="text-muted-foreground">Monitor and export student performance.</p>
            </div>

            <div className="flex items-center gap-4">
               {reportData.length > 0 && (
                  <Button onClick={downloadPDF} variant="outline" className="flex gap-2">
                     <Download className="w-4 h-4" /> Download PDF
                  </Button>
               )}

               <Select onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-[250px]">
                     <SelectValue placeholder="Select a Class" />
                  </SelectTrigger>
                  <SelectContent>
                     {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>Student Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="rounded-md border overflow-x-auto">
                  <Table>
                     <TableHeader className="bg-muted/50">
                        <TableRow>
                           <TableHead className="w-[120px]">Student ID</TableHead>
                           <TableHead className="min-w-[180px]">Name</TableHead>
                           {exams.map(examName => (
                              <TableHead key={examName} className="text-center">{examName}</TableHead>
                           ))}
                           <TableHead className="text-right font-bold">Average</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {reportData.length > 0 ? reportData.map((student) => {
                           const scores = Object.values(student.marks) as number[];
                           const average = scores.length > 0
                              ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
                              : '-';

                           return (
                              <TableRow key={student.userId}>
                                 <TableCell className="font-mono text-xs">{student.userId}</TableCell>
                                 <TableCell className="font-medium">{student.name}</TableCell>
                                 {exams.map(examName => (
                                    <TableCell
                                       key={examName}
                                       className={`text-center ${student.marks[examName] < 50 ? 'text-red-500 font-bold' : ''}`}
                                    >
                                       {student.marks[examName] ?? '-'}
                                    </TableCell>
                                 ))}
                                 <TableCell className="text-right font-bold text-primary">
                                    {average === '-' ? '-' : `${average}%`}
                                 </TableCell>
                              </TableRow>
                           );
                        }) : (
                           <TableRow>
                              <TableCell colSpan={exams.length + 3} className="h-24 text-center text-muted-foreground">
                                 Select a class to view performance data.
                              </TableCell>
                           </TableRow>
                        )}
                     </TableBody>
                  </Table>
               </div>
            </CardContent>
         </Card>
      </div>
   );
}
