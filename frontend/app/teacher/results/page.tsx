/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Download, Save, Edit3, X, FileSpreadsheet, ListFilter, LayoutGrid, UserSearch, TrendingUp, Send } from 'lucide-react';
import api from '@/lib/api';
import ResultForm from '@/components/forms/ResultForm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  const getChartData = (student: any) => {
    return exams.map((exam) => {
      const allScoresForThisExam = reportData
        .map((s) => s.marks[exam.id]?.val)
        .filter((v): v is number => typeof v === 'number');

      const classAvg = allScoresForThisExam.length > 0
        ? allScoresForThisExam.reduce((a, b) => a + b, 0) / allScoresForThisExam.length
        : 0;

      return {
        name: exam.name,
        studentScore: student.marks[exam.id]?.val || 0,
        classAverage: parseFloat(classAvg.toFixed(1)),
      };
    });
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/teacher/classes');
      setClasses(response.data);
    } catch (error) { toast.error('Failed to fetch classes'); console.log(error) }
  };

  const fetchResultsList = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedClassId !== 'all') params.append('classId', selectedClassId);
    if (filterStudentId) params.append('studentId', filterStudentId);
    try {
      const response = await api.get(`/teacher/results/filter?${params.toString()}`);
      setResults(response.data);
    } catch (error) { toast.error('Failed to fetch results'); console.log(error) }
  }, [selectedClassId, filterStudentId]);

  const fetchGradebookData = async () => {
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
        studentMap[sId].marks[r.exam.id] = { val: r.marks, resultId: r.id };
      });
      setReportData(Object.values(studentMap));
    } catch (error) { toast.error('Failed to load gradebook'); console.log(error) }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchResultsList();
      await fetchClasses();
      if (selectedClassId !== 'all') fetchGradebookData();
    };
    loadData();
  }, [selectedClassId, filterStudentId,]);

  // --- SUBMIT DRAFTS HANDLER ---
  const handleSubmitResults = async () => {
    const draftResultIds = results
      .filter(r => r.status === 'DRAFT')
      .map(r => r.id);

    if (draftResultIds.length === 0) {
      toast.info('No draft results to submit.');
      return;
    }

    const toastId = toast.loading('Publishing results to student portal...');
    try {
      await api.post('/teacher/results/submit', draftResultIds);
      toast.success('Results submitted successfully!', { id: toastId });
      fetchResultsList(); // Refresh to see updated status
      if (selectedClassId !== 'all') fetchGradebookData();
    } catch (error) {
      toast.error('Failed to submit results', { id: toastId });
      console.log(error)
    }
  };

  const saveBulk = async () => {
    const payload = Object.entries(pendingChanges).map(([key, val]) => {
      const [studentId, examId] = key.split('-');
      return { student: { id: parseInt(studentId) }, exam: { id: parseInt(examId) }, marks: parseFloat(val as string) };
    });
    const tid = toast.loading("Saving as DRAFT...");
    try {
      await api.post('/teacher/results/bulk', payload);
      toast.success("Drafts Saved! Click 'Submit' to publish to students.", { id: tid });
      setIsEditMode(false);
      setPendingChanges({});
      fetchResultsList();
      fetchGradebookData();
    } catch (e) { toast.error("Error saving bulk drafts", { id: tid }); }
  };

  const downloadPDF = () => {
    if (reportData.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    const className = classes.find(c => String(c.id) === selectedClassId)?.name || 'Report';
    const examNames = exams.map(e => e.name);
    autoTable(doc, {
      head: [["ID", "Name", ...examNames, "Average"]],
      body: reportData.map(s => {
        const marksArray = Object.values(s.marks) as { val: number }[];
        const totalMarks = marksArray.reduce((acc, curr) => acc + (curr.val || 0), 0);
        const average = exams.length > 0 ? (totalMarks / exams.length).toFixed(2) + '%' : '0%';
        return [s.userId, s.name, ...exams.map(e => s.marks[e.id]?.val ?? '-'), average];
      }),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save(`${className}_Results.pdf`);
  };

  // Logic to show/hide the submit button
  const hasDrafts = results.some(r => r.status === 'DRAFT');

  return (
    <div className="p-8 space-y-6">
      {/* HEADER WITH INTEGRATED SUBMIT ACTION */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Results & Gradebook</h1>
          <p className="text-muted-foreground">Manage student marks. Drafts are only visible to you.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-3">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
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
      </div>

      {selectedStudentForChart && (
        <Card className="border-primary bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-full">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Progress Analysis: {selectedStudentForChart.name}</CardTitle>
                <p className="text-xs text-muted-foreground">Performance relative to class average</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStudentForChart(null)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData(selectedStudentForChart)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line name="Student Score" type="monotone" dataKey="studentScore" stroke="#2563eb" strokeWidth={3} dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
                  <Line name="Class Average" type="monotone" dataKey="classAverage" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="list" className="flex gap-2"><ListFilter className="w-4 h-4" /> List View</TabsTrigger>
          <TabsTrigger value="gradebook" className="flex gap-2"><LayoutGrid className="w-4 h-4" /> Gradebook</TabsTrigger>
          <TabsTrigger value="bulk" className="flex gap-2"><FileSpreadsheet className="w-4 h-4" /> Bulk Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex gap-4 items-center py-2">
            <Input placeholder="Search Student ID..." className="max-w-xs" value={filterStudentId} onChange={(e) => setFilterStudentId(e.target.value)} />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Class</TableHead><TableHead>Student</TableHead><TableHead>Subject</TableHead>
                <TableHead>Score</TableHead><TableHead>Grade</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.exam?.classe?.name ?? '—'}</TableCell>
                    <TableCell>{r.student.name}</TableCell>
                    <TableCell>{r.exam?.subject?.name}</TableCell>
                    <TableCell>{r.marks}</TableCell>
                    <TableCell>{calculateLetterGrade(r.marks)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${r.status === 'DRAFT' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingResult(r); setIsDialogOpen(true) }}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="gradebook">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Class Performance Report</CardTitle>
                <p className="text-sm text-muted-foreground">Click a student name to see progress chart.</p>
              </div>
              {selectedClassId !== 'all' && (
                <Button variant="outline" onClick={downloadPDF}><Download className="mr-2 w-4 h-4" /> Export PDF</Button>
              )}
            </CardHeader>
            <CardContent>
              {selectedClassId === 'all' ? (
                <p className="text-center py-10 text-muted-foreground">Select a class to view Gradebook.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Student</TableHead>
                        {exams.map((e) => (<TableHead key={e.id} className="text-center">{e.name}</TableHead>))}
                        <TableHead className="text-right font-bold text-primary">Average</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((s) => {
                        const marksArray = Object.values(s.marks) as { val: number }[];
                        const totalMarks = marksArray.reduce((acc, curr) => acc + (curr.val || 0), 0);
                        const avgValue = exams.length > 0 ? (totalMarks / exams.length).toFixed(1) : '0';
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="cursor-pointer hover:text-primary transition-colors group" onClick={() => setSelectedStudentForChart(s)}>
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{s.name}</div>
                                <UserSearch className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase">{s.userId}</div>
                            </TableCell>
                            {exams.map((e) => {
                              const score = s.marks[e.id]?.val;
                              return (
                                <TableCell key={e.id} className="text-center">
                                  <span className={score < 50 ? "text-red-500 font-semibold" : ""}>{score ?? '-'}</span>
                                  <div className="text-[10px] text-muted-foreground">{calculateLetterGrade(score)}</div>
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-right font-bold text-primary">{avgValue}%</TableCell>
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
              <CardTitle>Bulk Mark Entry (Saves as Draft)</CardTitle>
              {isEditMode ? (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setIsEditMode(false)}><X className="mr-2 w-4 h-4" /> Cancel</Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={saveBulk}><Save className="mr-2 w-4 h-4" /> Save Drafts</Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditMode(true)} disabled={selectedClassId === 'all'}><Edit3 className="mr-2 w-4 h-4" /> Start Editing</Button>
              )}
            </CardHeader>
            <CardContent>
              {selectedClassId === 'all' ? <p className="text-center py-10 text-muted-foreground">Select a class to enable bulk entry.</p> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Student</TableHead>
                    {exams.map(e => <TableHead key={e.id} className="text-center">{e.name}</TableHead>)}
                  </TableRow></TableHeader>
                  <TableBody>
                    {reportData.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{s.name}</TableCell>
                        {exams.map(e => (
                          <TableCell key={e.id} className="text-center">
                            {isEditMode ? (
                              <Input type="number" className="w-20 mx-auto h-8 text-center" defaultValue={s.marks[e.id]?.val} onChange={(el) => setPendingChanges((prev: any) => ({ ...prev, [`${s.id}-${e.id}`]: el.target.value }))} />
                            ) : (s.marks[e.id]?.val ?? '-')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingResult ? 'Edit Record' : 'Add Record'}</DialogTitle></DialogHeader>
          <ResultForm result={editingResult} onFinished={() => { setIsDialogOpen(false); fetchResultsList(); fetchGradebookData(); }} />
        </DialogContent>
      </Dialog> */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingResult ? 'Edit Record' : 'Add New Record'}</DialogTitle>
          </DialogHeader>
          {/* CRITICAL CHANGE: Passing existingResults prop */}
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
