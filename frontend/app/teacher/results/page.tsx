/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import ResultForm from '@/components/forms/ResultForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from '@/lib/api';
import { BadgeCheck, Download, Edit3, FileSpreadsheet, LayoutGrid, ListFilter, Lock, Save, Search, Send, TrendingUp, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';

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

export default function TeacherResultsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [results, setResults] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<any | null>(null);
  const [filterStudentId, setFilterStudentId] = useState('');
  const [exams, setExams] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>({});
  const [selectedStudentForChart, setSelectedStudentForChart] = useState<any | null>(null);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/teacher/classes');
      setClasses(response.data);
    } catch (error) { toast.error('Failed to fetch classes'); console.log(error)}
  };

  const fetchResultsList = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedClassId !== 'all') params.append('classId', selectedClassId);

    // This sends the string from the input to the 'studentId' param in Java
    if (filterStudentId.trim()) params.append('studentId', filterStudentId.trim());

    try {
      const response = await api.get(`/teacher/results/filter?${params.toString()}`);
      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setResults([]);
      console.log(error)
    }
}, [selectedClassId, filterStudentId]);

  const fetchGradebookData = useCallback(async () => {
    if (selectedClassId === 'all') return;
    try {
      const [resultsRes, examsRes] = await Promise.all([
        api.get(`/teacher/classes/${selectedClassId}/gradebook`),
        api.get('/teacher/exams'),
      ]);

      const classExams = examsRes.data.filter((e: any) => String(e.classe.id) === selectedClassId);
      setExams(classExams);

      const studentMap: any = {};
      resultsRes.data.forEach((r: any) => {
        const sId = r.student.userId;
        if (!studentMap[sId]) {
          studentMap[sId] = { id: r.student.id, name: r.student.name, userId: sId, marks: {} };
        }
        studentMap[sId].marks[r.exam.id] = { val: r.marks, resultId: r.id, isLocked: r.exam.locked };
      });
      setReportData(Object.values(studentMap));
    } catch (error) { toast.error('Failed to load gradebook'); console.log(error) }
  }, [selectedClassId]);

  useEffect(() => {

    const loadData = async () => {
      await fetchClasses();
    };

    loadData();
  }, []);

  // Effect to handle search and class filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResultsList();
      if (selectedClassId !== 'all') fetchGradebookData();
    }, 300); // 300ms Debounce for search
    return () => clearTimeout(timer);
  }, [selectedClassId, filterStudentId, fetchResultsList, fetchGradebookData]);

  const handleSubmitResults = async () => {
    const draftResultIds = results.filter(r => r.status === 'DRAFT' && !r.exam.locked).map(r => r.id);
    if (draftResultIds.length === 0) {
      toast.info('No editable draft results to submit.');
      return;
    }
    const toastId = toast.loading('Publishing results...');
    try {
      await api.post('/teacher/results/submit', draftResultIds);
      toast.success('Results published!', { id: toastId });
      fetchResultsList();
      fetchGradebookData();
    } catch (error) { toast.error('Submission failed', { id: toastId }); console.log(error) }
  };

  // const saveBulk = async () => {
  //   const payload = Object.entries(pendingChanges).map(([key, val]) => {
  //     const [studentId, examId] = key.split('-');
  //     return {
  //       student: { id: parseInt(studentId) },
  //       exam: { id: parseInt(examId) },
  //       marks: parseFloat(val as string)
  //     };
  //   });

  //   if (payload.length === 0) {
  //     setIsEditMode(false);
  //     return;
  //   }

  //   const tid = toast.loading("Saving changes...");
  //   try {
  //     await api.post('/teacher/results/bulk', payload);
  //     toast.success("Drafts Saved successfully!", { id: tid });
  //     setIsEditMode(false);
  //     setPendingChanges({});
  //     fetchResultsList();
  //     fetchGradebookData();
  //   } catch (error) {
  //     toast.error("Bulk save failed", { id: tid });
  //     console.log(error);
  //   }
  // };

  const saveBulk = async () => {
  // 1. Prepare the payload from pendingChanges
  const payload = Object.entries(pendingChanges).map(([key, val]) => {
    const [studentId, examId] = key.split('-');
    return {
      student: { id: parseInt(studentId) },
      exam: { id: parseInt(examId) },
      marks: parseFloat(val as string)
    };
  });

  if (payload.length === 0) {
    setIsEditMode(false);
    return;
  }

  // 2. Start the loading state
  const tid = toast.loading("Syncing marks with registry...");

  try {
    // 3. Make the API call
    // Note: Ensure the URL matches your backend @PostMapping ("/results/bulk")
    const response = await api.post('/teacher/results/bulk', payload);

    // 4. Destructure the summary map returned by the Java Map<String, Object>
    const { created, updated } = response.data;

    // 5. Show the specific success message
    toast.success(
      `Ledger Updated: ${created} new entries, ${updated} modifications saved.`,
      { id: tid }
    );

    // 6. Reset UI states
    setIsEditMode(false);
    setPendingChanges({});

    // 7. Refresh data to show new Letter Grades and Statuses
    fetchResultsList();
    fetchGradebookData();

  } catch (error) {
    toast.error("Bulk entry failed. Please check authorization.", { id: tid });
    console.error("Bulk save error:", error);
  }
};

  const getChartData = (student: any) => {
    return exams.map((exam) => {
      const allScores = reportData.map((s) => s.marks[exam.id]?.val).filter(v => v != null);
      const avg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
      return {
        name: exam.name,
        studentScore: student.marks[exam.id]?.val || 0,
        classAverage: parseFloat(avg.toFixed(1)),
      };
    });
  };

  const hasDrafts = results.some(r => r.status === 'DRAFT' && !r.exam.locked);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Academic Gradebook</h1>
          <p className="text-muted-foreground font-medium">Manage assessment marks and semester aggregation.</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingResult(null); setIsDialogOpen(true) }}>Add Single Record</Button>
          {hasDrafts && (
            <Button variant="secondary" onClick={handleSubmitResults} className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
              <Send className="w-4 h-4 mr-2" /> Publish Drafts
            </Button>
          )}
        </div>
      </div>

      {selectedStudentForChart && (
        <Card className="border-primary bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>Analysis: {selectedStudentForChart.name}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStudentForChart(null)}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData(selectedStudentForChart)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line name="Score" type="monotone" dataKey="studentScore" stroke="#2563eb" strokeWidth={3} />
                <Line name="Class Avg" type="monotone" dataKey="classAverage" stroke="#94a3b8" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="list" className="gap-2"><ListFilter className="w-4 h-4" /> List View</TabsTrigger>
          <TabsTrigger value="gradebook" className="gap-2"><LayoutGrid className="w-4 h-4" /> Gradebook</TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2"><FileSpreadsheet className="w-4 h-4" /> Bulk Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Student ID..."
              className="pl-9"
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
            />
          </div>
          <div className="rounded-md border shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Assessment (Term)</TableHead>
                  <TableHead className="text-center">Weight</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length > 0 ? results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.exam?.classe?.name ?? '—'}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{r.student.name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{r.student.userId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.exam?.name}</div>
                      <div className="text-[10px] font-bold uppercase text-blue-700">
                        <span className="bg-blue-100">{r.exam?.term}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-500">{r.exam?.weight}%</TableCell>
                    <TableCell className="text-center font-bold text-base">{r.marks}</TableCell>
                    <TableCell className="text-center">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-black">{calculateLetterGrade(r.marks)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black text-center w-fit ${r.status === 'DRAFT' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {r.status}
                        </span>
                        {r.exam.locked && <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400"><Lock className="w-2.5 h-2.5" /> LOCKED</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.exam.locked ? <BadgeCheck className="w-5 h-5 ml-auto text-slate-300" /> :
                        <Button variant="ghost" size="sm" onClick={() => { setEditingResult(r); setIsDialogOpen(true) }}>Edit</Button>}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground italic">No results found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="gradebook">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Performance Matrix</CardTitle></div>
              {selectedClassId !== 'all' && <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>}
            </CardHeader>
            <CardContent>
              {selectedClassId === 'all' ? <p className="text-center py-20 text-muted-foreground italic">Select a class to view matrix.</p> : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Student</TableHead>
                        {exams.map(e => <TableHead key={e.id} className="text-center">{e.name} ({e.weight}%)</TableHead>)}
                        <TableHead className="text-right font-black">Weighted Avg</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map(s => {
                        const total = Object.values(s.marks).reduce((acc: number, curr: any) => acc + (curr.val || 0), 0);
                        const avg = exams.length > 0 ? (total / exams.length).toFixed(1) : '0';
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedStudentForChart(s)}>
                              <div className="font-bold">{s.name}</div>
                              <div className="text-[10px] text-muted-foreground">{s.userId}</div>
                            </TableCell>
                            {exams.map(e => (
                              <TableCell key={e.id} className="text-center">
                                <div className={s.marks[e.id]?.val < 50 ? 'text-red-500 font-bold' : ''}>{s.marks[e.id]?.val ?? '-'}</div>
                                <div className="text-[9px] text-muted-foreground">{calculateLetterGrade(s.marks[e.id]?.val)}</div>
                              </TableCell>
                            ))}
                            <TableCell className="text-right font-black text-primary">{avg}%</TableCell>
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

        <TabsContent value="bulk">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bulk Mark Entry</CardTitle>
              <div className="flex gap-2">
                {isEditMode ? (
                  <>
                    <Button variant="ghost" onClick={() => { setIsEditMode(false); setPendingChanges({}); }}><X className="w-4 h-4 mr-2" /> Cancel</Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={saveBulk}><Save className="w-4 h-4 mr-2" /> Save Drafts</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditMode(true)} disabled={selectedClassId === 'all'}><Edit3 className="w-4 h-4 mr-2" /> Start Editing</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedClassId === 'all' ? <p className="text-center py-20 text-muted-foreground italic">Select a class to enable bulk entry.</p> : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Student</TableHead>
                        {exams.map(e => <TableHead key={e.id} className="text-center">{e.name}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          {exams.map(e => (
                            <TableCell key={e.id} className="text-center">
                              {isEditMode && !e.locked ? (
                                <Input
                                  type="number"
                                  className="w-20 mx-auto h-8 text-center"
                                  defaultValue={s.marks[e.id]?.val}
                                  onChange={(el) => setPendingChanges((prev: any) => ({ ...prev, [`${s.id}-${e.id}`]: el.target.value }))}
                                />
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  {s.marks[e.id]?.val ?? '-'}
                                  {e.locked && <Lock className="w-3 h-3 text-slate-300" />}
                                </div>
                              )}
                            </TableCell>
                          ))}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingResult ? 'Update Assessment' : 'New Mark Entry'}</DialogTitle></DialogHeader>
          <ResultForm
            result={editingResult}
            existingResults={results}
            onFinished={() => {
              setIsDialogOpen(false);
              fetchResultsList();
              fetchGradebookData();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}



// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';

// import { useEffect, useState, useCallback } from 'react';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Button } from '@/components/ui/button';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { toast } from 'sonner';
// import { Download, Save, Edit3, X, FileSpreadsheet, ListFilter, LayoutGrid, UserSearch, TrendingUp, Send, Lock, BadgeCheck } from 'lucide-react';
// import api from '@/lib/api';
// import ResultForm from '@/components/forms/ResultForm';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

// export default function TeacherResultsPage() {
//   const [classes, setClasses] = useState<any[]>([]);
//   const [selectedClassId, setSelectedClassId] = useState<string>('all');
//   const [results, setResults] = useState<any[]>([]);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingResult, setEditingResult] = useState<any | null>(null);
//   const [filterStudentId, setFilterStudentId] = useState('');
//   const [exams, setExams] = useState<any[]>([]);
//   const [reportData, setReportData] = useState<any[]>([]);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [pendingChanges, setPendingChanges] = useState<any>({});
//   const [selectedStudentForChart, setSelectedStudentForChart] = useState<any | null>(null);

//   const getChartData = (student: any) => {
//     return exams.map((exam) => {
//       const allScoresForThisExam = reportData
//         .map((s) => s.marks[exam.id]?.val)
//         .filter((v): v is number => typeof v === 'number');

//       const classAvg = allScoresForThisExam.length > 0
//         ? allScoresForThisExam.reduce((a, b) => a + b, 0) / allScoresForThisExam.length
//         : 0;

//       return {
//         name: exam.name,
//         studentScore: student.marks[exam.id]?.val || 0,
//         classAverage: parseFloat(classAvg.toFixed(1)),
//       };
//     });
//   };

//   const fetchClasses = async () => {
//     try {
//       const response = await api.get('/teacher/classes');
//       setClasses(response.data);
//     } catch (error) { toast.error('Failed to fetch classes');console.log(error) }
//   };

//   const fetchResultsList = useCallback(async () => {
//     const params = new URLSearchParams();
//     if (selectedClassId !== 'all') params.append('classId', selectedClassId);
//     if (filterStudentId) params.append('studentId', filterStudentId);
//     try {
//       const response = await api.get(`/teacher/results/filter?${params.toString()}`);
//       setResults(response.data);
//     } catch (error) { toast.error('Failed to fetch results'); console.log(error)}
//   }, [selectedClassId, filterStudentId]);

//   const fetchGradebookData = async () => {
//     if (selectedClassId === 'all') return;
//     try {
//       const [resultsRes, examsRes] = await Promise.all([
//         api.get(`/teacher/classes/${selectedClassId}/gradebook`),
//         api.get('/teacher/exams'),
//       ]);
//       const classExams = examsRes.data.filter((e: any) => String(e.classe.id) === selectedClassId);
//       setExams(classExams);
//       const studentMap: any = {};
//       resultsRes.data.forEach((r: any) => {
//         const sId = r.student.userId;
//         if (!studentMap[sId]) {
//           studentMap[sId] = { id: r.student.id, name: r.student.name, userId: sId, marks: {} };
//         }
//         studentMap[sId].marks[r.exam.id] = { val: r.marks, resultId: r.id, isLocked: r.exam.locked };
//       });
//       setReportData(Object.values(studentMap));
//     } catch (error) { toast.error('Failed to load gradebook'); console.log(error) }

//   };

//   useEffect(() => {
//     const loadData = async () => {
//       await fetchClasses();
//       await fetchResultsList();
//       if (selectedClassId !== 'all') fetchGradebookData();
//     };
//     loadData();
//   }, [selectedClassId, filterStudentId, fetchResultsList]);

//   const handleSubmitResults = async () => {
//     const draftResultIds = results.filter(r => r.status === 'DRAFT' && !r.exam.locked).map(r => r.id);
//     if (draftResultIds.length === 0) {
//       toast.info('No editable draft results to submit.');
//       return;
//     }
//     const toastId = toast.loading('Publishing results to student portal...');
//     try {
//       await api.post('/teacher/results/submit', draftResultIds);
//       toast.success('Results published successfully!', { id: toastId });
//       fetchResultsList();
//       if (selectedClassId !== 'all') fetchGradebookData();
//     } catch (error) { toast.error('Submission failed', { id: toastId }); console.log(error)}
//   };

//   const saveBulk = async () => {
//     const payload = Object.entries(pendingChanges).map(([key, val]) => {
//       const [studentId, examId] = key.split('-');
//       return { student: { id: parseInt(studentId) }, exam: { id: parseInt(examId) }, marks: parseFloat(val as string) };
//     });
//     const tid = toast.loading("Saving changes...");
//     try {
//       await api.post('/teacher/results/bulk', payload);
//       toast.success("Drafts Saved!", { id: tid });
//       setIsEditMode(false);
//       setPendingChanges({});
//       fetchResultsList();
//       fetchGradebookData();
//     } catch (error) { toast.error("Bulk save failed", { id: tid }); console.log(error)}
//   };

//   const hasDrafts = results.some(r => r.status === 'DRAFT' && !r.exam.locked);

//   return (
//     <div className="p-8 space-y-6">
//       <div className="flex justify-between items-start">
//         <div>
//           <h1 className="text-3xl font-bold">Academic Gradebook</h1>
//           <p className="text-muted-foreground font-medium">Semester-based assessment management.</p>
//         </div>
//         <div className="flex flex-col items-end gap-2">
//           <div className="flex gap-3">
//             <Select value={selectedClassId} onValueChange={setSelectedClassId}>
//               <SelectTrigger className="w-48"><SelectValue placeholder="Select Class" /></SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Classes</SelectItem>
//                 {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
//               </SelectContent>
//             </Select>
//             <Button onClick={() => { setEditingResult(null); setIsDialogOpen(true) }}>Add Single Record</Button>
//             {hasDrafts && (
//               <Button variant="secondary" onClick={handleSubmitResults} className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
//                 <Send className="w-4 h-4 mr-2" /> Publish to Students
//               </Button>
//             )}
//           </div>
//         </div>
//       </div>

//       {selectedStudentForChart && (
//         <Card className="border-primary bg-primary/5 animate-in fade-in zoom-in-95 duration-300">
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <div className="flex items-center gap-3">
//               <TrendingUp className="w-5 h-5 text-primary" />
//               <CardTitle>Analysis: {selectedStudentForChart.name}</CardTitle>
//             </div>
//             <Button variant="ghost" size="sm" onClick={() => setSelectedStudentForChart(null)}><X className="w-4 h-4" /></Button>
//           </CardHeader>
//           <CardContent className="h-[300px]">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={getChartData(selectedStudentForChart)}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                 <XAxis dataKey="name" tick={{ fontSize: 12 }} />
//                 <YAxis domain={[0, 100]} />
//                 <Tooltip />
//                 <Legend />
//                 <Line name="Score" type="monotone" dataKey="studentScore" stroke="#2563eb" strokeWidth={3} />
//                 <Line name="Class Avg" type="monotone" dataKey="classAverage" stroke="#94a3b8" strokeDasharray="5 5" />
//               </LineChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>
//       )}

//       <Tabs defaultValue="list" className="w-full">
//         <TabsList className="grid w-full grid-cols-3 max-w-md">
//           <TabsTrigger value="list" className="gap-2"><ListFilter className="w-4 h-4" /> List View</TabsTrigger>
//           <TabsTrigger value="gradebook" className="gap-2"><LayoutGrid className="w-4 h-4" /> Gradebook</TabsTrigger>
//           <TabsTrigger value="bulk" className="gap-2"><FileSpreadsheet className="w-4 h-4" /> Bulk Entry</TabsTrigger>
//         </TabsList>

//         <TabsContent value="list" className="space-y-4">
//           <div className="flex gap-4 items-center">
//             <Input placeholder="Search Student ID..." className="max-w-xs" value={filterStudentId} onChange={(e) => setFilterStudentId(e.target.value)} />
//           </div>
//           <div className="rounded-md border shadow-sm">
//             <Table>
//               <TableHeader className="bg-slate-50">
//                 <TableRow>
//                   <TableHead>Class</TableHead>
//                   <TableHead>Student</TableHead>
//                   <TableHead>Assessment (Term)</TableHead>
//                   <TableHead className="text-center">Weight</TableHead>
//                   <TableHead className="text-center">Score</TableHead>
//                   <TableHead className="text-center">Grade</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead className="text-right">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {results.map((r) => (
//                   <TableRow key={r.id}>
//                     <TableCell className="font-medium">{r.exam?.classe?.name ?? '—'}</TableCell>
//                     <TableCell>
//                       <div className="font-semibold">{r.student.name}</div>
//                       <div className="text-[10px] text-muted-foreground uppercase">{r.student.userId}</div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="text-sm font-medium">{r.exam?.name}</div>
//                       <div className="text-[10px] text-primary font-bold uppercase">{r.exam?.term}</div>
//                     </TableCell>
//                     <TableCell className="text-center text-xs font-bold text-slate-500">{r.exam?.weight}%</TableCell>
//                     <TableCell className="text-center font-bold text-base">{r.marks}%</TableCell>
//                     <TableCell className="text-center">
//                       <span className="bg-slate-100 px-2 py-1 rounded text-xs font-black">{calculateLetterGrade(r.marks)}</span>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex flex-col gap-1">
//                         <span className={`px-2 py-0.5 rounded-full text-[9px] font-black text-center w-fit ${r.status === 'DRAFT' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
//                           {r.status}
//                         </span>
//                         {r.exam.locked && (
//                           <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
//                             <Lock className="w-2.5 h-2.5" /> SEMESTER LOCKED
//                           </span>
//                         )}
//                       </div>
//                     </TableCell>
//                     <TableCell className="text-right">
//                       {r.exam.locked ? (
//                         <Button variant="ghost" size="sm" disabled className="text-slate-300">
//                           <BadgeCheck className="w-4 h-4" />
//                         </Button>
//                       ) : (
//                         <Button variant="ghost" size="sm" onClick={() => { setEditingResult(r); setIsDialogOpen(true) }}>
//                           <Edit3 className="w-4 h-4 mr-2" /> Edit
//                         </Button>
//                       )}
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//         </TabsContent>

//         <TabsContent value="gradebook">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between">
//               <div>
//                 <CardTitle>Semester Performance Matrix</CardTitle>
//                 <p className="text-xs text-muted-foreground uppercase font-bold mt-1">
//                   Active Period: {exams[0]?.semester || 'N/A'}
//                 </p>
//               </div>
//               {selectedClassId !== 'all' && (
//                 <Button variant="outline" size="sm" onClick={() => { }} className="gap-2"><Download className="w-4 h-4" /> Export Ledger</Button>
//               )}
//             </CardHeader>
//             <CardContent>
//               {selectedClassId === 'all' ? (
//                 <p className="text-center py-20 text-muted-foreground">Select a class to generate gradebook view.</p>
//               ) : (
//                 <div className="rounded-md border overflow-x-auto">
//                   <Table>
//                     <TableHeader className="bg-slate-50">
//                       <TableRow>
//                         <TableHead className="min-w-[180px]">Student</TableHead>
//                         {exams.map((e) => (
//                           <TableHead key={e.id} className="text-center">
//                             <div className="text-xs ">{e.name}</div>
//                             <div className="text-[9px] text-primary">{e.weight}%</div>
//                           </TableHead>
//                         ))}
//                         <TableHead className="text-right font-black text-primary">Weighted Avg</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {reportData.map((s) => {
//                         const marksArray = Object.values(s.marks) as { val: number }[];
//                         const total = marksArray.reduce((acc, curr) => acc + (curr.val || 0), 0);
//                         const avg = exams.length > 0 ? (total / exams.length).toFixed(1) : '0';
//                         return (
//                           <TableRow key={s.id}>
//                             <TableCell className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedStudentForChart(s)}>
//                               <div className="font-bold text-sm">{s.name}</div>
//                               <div className="text-[10px] text-muted-foreground">{s.userId}</div>
//                             </TableCell>
//                             {exams.map((e) => {
//                               const markEntry = s.marks[e.id];
//                               return (
//                                 <TableCell key={e.id} className="text-center">
//                                   <div className={`font-bold ${markEntry?.val < 50 ? 'text-red-500' : ''}`}>
//                                     {markEntry?.val ?? '-'}
//                                   </div>
//                                   <div className="text-[9px] text-muted-foreground font-bold">{calculateLetterGrade(markEntry?.val)}</div>
//                                 </TableCell>
//                               );
//                             })}
//                             <TableCell className="text-right font-black text-primary text-base">{avg}%</TableCell>
//                           </TableRow>
//                         );
//                       })}
//                     </TableBody>
//                   </Table>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>
//         {/* Bulk Content remains similar but check r.exam.locked in edit mode */}
//       </Tabs>

//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               {editingResult ? <Edit3 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
//               {editingResult ? 'Update Assessment' : 'New Mark Entry'}
//             </DialogTitle>
//           </DialogHeader>
//           <ResultForm
//             result={editingResult}
//             existingResults={results}
//             onFinished={() => {
//               setIsDialogOpen(false);
//               fetchResultsList();
//               fetchGradebookData();
//             }}
//           />
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
