/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Pencil, Trash2, Calendar, Clock, BookOpen, Lock, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import DeleteExamAlert from '@/components/forms/DeleteExamAlert';

// --- UPDATED SCHEMA FOR SEMESTER MODEL ---
const formSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  classId: z.string().min(1, 'Class is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  semester: z.string().min(1, 'Semester is required'),
  term: z.string().min(1, 'Term is required'),
  weight: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Weight must be a positive number',
  }),
});

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [currentTeacherId, setCurrentTeacherId] = useState<number | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<any | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectId: '', classId: '', date: '', startTime: '', endTime: '',
      semester: 'Fall 2025', term: 'MIDTERM', weight: '30'
    },
  });

  const loadAllData = async () => {
    try {
      const [examsRes, subjectsRes, classesRes, userRes] = await Promise.all([
        api.get('/teacher/exams'),
        api.get('/teacher/subjects'),
        api.get('/teacher/classes'),
        api.get('/auth/me'),
      ]);
      setExams(examsRes.data);
      setSubjects(subjectsRes.data);
      setClasses(classesRes.data);
      setCurrentTeacherId(userRes.data.id);
    } catch (error) {
      toast.error('Failed to synchronize academic data');
      console.log(error);
    }
  };

    useEffect(() => {
      const loadInitial = async () => {
        await loadAllData();
      };
      loadInitial();
    }, []);

  const onOpenEdit = (exam: any) => {
    if (exam.locked) {
      toast.error("This exam is locked by Admin and cannot be modified.");
      return;
    }
    setEditingExam(exam);
    form.reset({
      subjectId: String(exam.subject.id),
      classId: String(exam.classe.id),
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
      semester: exam.semester,
      term: exam.term,
      weight: String(exam.weight),
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const selectedSubject = subjects.find(s => String(s.id) === values.subjectId);

    // PAYLOAD MATCHING THE NEW SEMESTER-BASED BACKEND ENTITY
    const payload = {
      name: selectedSubject?.name || 'Exam',
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      semester: values.semester,
      term: values.term,
      weight: parseInt(values.weight),
      classe: { id: parseInt(values.classId) },
      subject: { id: parseInt(values.subjectId) },
    };

    try {
      if (editingExam) {
        await api.put(`/teacher/exams/${editingExam.id}`, payload);
        toast.success('Exam updated successfully');
      } else {
        await api.post('/teacher/exams', payload);
        toast.success('Exam scheduled for ' + values.semester);
      }
      loadAllData();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not save exam schedule');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Exam Center</h1>
          <p className="text-muted-foreground mt-2 font-medium">Define weights and terms for your assessments.</p>
        </div>
        <Button onClick={() => { setEditingExam(null); form.reset(); setIsDialogOpen(true); }} className="gap-2">
          <BookOpen className="w-4 h-4" /> Schedule Assessment
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingExam ? 'Edit Assessment' : 'New Assessment Period'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="semester" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Semester</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                        <SelectItem value="Spring 2026">Spring 2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="term" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term/Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="QUIZ_1">Quiz 1</SelectItem>
                        <SelectItem value="MIDTERM">Midterm</SelectItem>
                        <SelectItem value="FINAL_EXAM">Final Exam</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="subjectId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger></FormControl>
                      <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (%)</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g. 30" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="classId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Classroom</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1"><FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                )} /></div>
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem><FormLabel>Start</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem><FormLabel>End</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full">Save Assessment Config</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Assessment Details</TableHead>
              <TableHead>Semester & Term</TableHead>
              <TableHead className="text-center">Weight</TableHead>
              <TableHead>Time Window</TableHead>
              <TableHead className="text-right">Management</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.map((exam) => {
              const isOwner = exam.teacher?.id === currentTeacherId;
              return (
                <TableRow key={exam.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="font-bold text-slate-800">{exam.name}</div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase">{exam.classe.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{exam.semester}</div>
                    <div className="text-[10px] text-primary font-black uppercase">{exam.term}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-black border border-blue-100">{exam.weight}%</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium flex items-center gap-1"><Calendar className="w-3 h-3"/> {exam.date}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> {exam.startTime} - {exam.endTime}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {exam.locked ? (
                      <div className="flex justify-end items-center gap-2 text-slate-400 font-bold text-[10px]">
                        <Lock className="w-4 h-4" /> LOCKED
                      </div>
                    ) : isOwner ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onOpenEdit(exam)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setExamToDelete(exam); setIsDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-400">READ-ONLY</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {examToDelete && (
        <DeleteExamAlert examId={examToDelete.id} examName={examToDelete.name} open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onFinished={loadAllData} />
      )}
    </div>
  );
}


// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import { Input } from '@/components/ui/input';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { toast } from 'sonner';
// import { Pencil, Trash2, Calendar, Clock, BookOpen } from 'lucide-react';
// import api from '@/lib/api';
// import DeleteExamAlert from '@/components/forms/DeleteExamAlert';

// // --- SCHEMA & INTERFACES ---
// const formSchema = z.object({
//   subjectId: z.string().min(1, { message: 'Subject is required' }),
//   classId: z.string().min(1, { message: 'Class is required' }),
//   date: z.string().min(1, { message: 'Date is required' }),
//   startTime: z.string().min(1, { message: 'Start time is required' }),
//   endTime: z.string().min(1, { message: 'End time is required' }),
// });

// interface Exam {
//   id: number;
//   name: string;
//   date: string;
//   startTime: string;
//   endTime: string;
//   classe: { id: number; name: string };
//   subject: { id: number; name: string };
//   teacher: { id: number; name: string };
// }

// export default function TeacherExamsPage() {
//   const [exams, setExams] = useState<Exam[]>([]);
//   const [subjects, setSubjects] = useState<any[]>([]);
//   const [classes, setClasses] = useState<any[]>([]);
//   const [currentTeacherId, setCurrentTeacherId] = useState<number | null>(null);

//   // Dialog States
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingExam, setEditingExam] = useState<Exam | null>(null);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: { subjectId: '', classId: '', date: '', startTime: '', endTime: '' },
//   });

//   // --- DATA FETCHING ---
//   const loadAllData = async () => {
//     try {
//       const [examsRes, subjectsRes, classesRes, userRes] = await Promise.all([
//         api.get('/teacher/exams'),
//         api.get('/teacher/subjects'),
//         api.get('/teacher/classes'),
//         api.get('/auth/me'), // Endpoint to get the logged-in user's profile
//       ]);
//       setExams(examsRes.data);
//       setSubjects(subjectsRes.data);
//       setClasses(classesRes.data);
//       setCurrentTeacherId(userRes.data.id);
//     } catch (error) {
//       toast.error('Failed to synchronize data');
//       console.log(error)
//     }
//   };

//   useEffect(() => {
//     const loadData = async () => {
//       await loadAllData();
//     };

//     loadData();
//   }, []);

//   // --- FORM HANDLERS ---
//   const onOpenCreate = () => {
//     setEditingExam(null);
//     form.reset({ subjectId: '', classId: '', date: '', startTime: '', endTime: '' });
//     setIsDialogOpen(true);
//   };

//   const onOpenEdit = (exam: Exam) => {
//     setEditingExam(exam);
//     form.reset({
//       subjectId: String(exam.subject.id),
//       classId: String(exam.classe.id),
//       date: exam.date,
//       startTime: exam.startTime,
//       endTime: exam.endTime,
//     });
//     setIsDialogOpen(true);
//   };

//   const onSubmit = async (values: z.infer<typeof formSchema>) => {
//     const isEditing = !!editingExam;
//     const selectedSubject = subjects.find(s => String(s.id) === values.subjectId);

//     const payload = {
//       name: selectedSubject?.name || 'Exam',
//       date: values.date,
//       startTime: values.startTime,
//       endTime: values.endTime,
//       classe: { id: parseInt(values.classId) },
//       subject: { id: parseInt(values.subjectId) },
//     };

//     try {
//       if (isEditing) {
//         await api.put(`/teacher/exams/${editingExam.id}`, payload);
//         toast.success('Exam updated');
//       } else {
//         await api.post('/teacher/exams', payload);
//         toast.success('Exam scheduled');
//       }
//       loadAllData();
//       setIsDialogOpen(false);
//     } catch (error) {
//       toast.error('Could not save exam');
//       console.log(error);
//     }
//   };

//   return (
//     <div className="p-8 max-w-7xl mx-auto">
//       <div className="flex justify-between items-end mb-8">
//         <div>
//           <h1 className="text-4xl font-extrabold tracking-tight">Exam Schedule</h1>
//           <p className="text-muted-foreground mt-2">Manage assessments for your assigned classes.</p>
//         </div>
//         <Button onClick={onOpenCreate} className="gap-2">
//           <BookOpen className="w-4 h-4" /> Schedule New Exam
//         </Button>
//       </div>

//       {/* --- DELETE CONFIRMATION --- */}
//       {examToDelete && (
//         <DeleteExamAlert
//           examId={examToDelete.id}
//           examName={examToDelete.name}
//           open={isDeleteDialogOpen}
//           onOpenChange={setIsDeleteDialogOpen}
//           onFinished={loadAllData}
//         />
//       )}

//       {/* --- CREATE/EDIT DIALOG --- */}
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent className="sm:max-w-[425px]">
//           <DialogHeader>
//             <DialogTitle>{editingExam ? 'Modify Exam' : 'Schedule Assessment'}</DialogTitle>
//           </DialogHeader>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
//               <FormField
//                 control={form.control}
//                 name="subjectId"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Subject</FormLabel>
//                     <Select onValueChange={field.onChange} value={field.value}>
//                       <FormControl><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
//                       <SelectContent>
//                         {subjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="classId"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Class</FormLabel>
//                     <Select onValueChange={field.onChange} value={field.value}>
//                       <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
//                       <SelectContent>
//                         {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="date"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Date</FormLabel>
//                     <FormControl><Input type="date" {...field} /></FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <div className="grid grid-cols-2 gap-4">
//                 <FormField
//                   control={form.control}
//                   name="startTime"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Starts</FormLabel>
//                       <FormControl><Input type="time" {...field} /></FormControl>
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="endTime"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Ends</FormLabel>
//                       <FormControl><Input type="time" {...field} /></FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </div>
//               <Button type="submit" className="w-full mt-4">
//                 {editingExam ? 'Update Schedule' : 'Confirm Exam'}
//               </Button>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>

//       {/* --- EXAMS TABLE --- */}
//       <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
//         <Table>
//           <TableHeader className="bg-muted/50">
//             <TableRow>
//               <TableHead className="w-[200px]">Exam Name</TableHead>
//               <TableHead>Class</TableHead>
//               <TableHead>Instructor (Owner)</TableHead>
//               <TableHead>Date</TableHead>
//               <TableHead>Time Window</TableHead>
//               <TableHead className="text-right">Manage</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {exams.length > 0 ? (
//               exams.map((exam) => {
//                 const isOwner = exam.teacher?.id === currentTeacherId;
//                 return (
//                   <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
//                     <TableCell className="font-semibold">{exam.name}</TableCell>
//                     <TableCell>{exam.classe.name}</TableCell>
//                     <TableCell>
//                       <span className={isOwner ? "text-primary font-medium" : "text-muted-foreground"}>
//                         {isOwner ? "You" : (exam.teacher?.name || 'Unknown')}
//                       </span>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2"><Calendar className="w-3 h-3" />{exam.date}</div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2"><Clock className="w-3 h-3" />{exam.startTime} - {exam.endTime}</div>
//                     </TableCell>
//                     <TableCell className="text-right">
//                       {isOwner ? (
//                         <div className="flex justify-end gap-2">
//                           <Button variant="ghost" size="icon" onClick={() => onOpenEdit(exam)}><Pencil className="w-4 h-4" /></Button>
//                           <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => { setExamToDelete(exam); setIsDeleteDialogOpen(true); }}>
//                             <Trash2 className="w-4 h-4" />
//                           </Button>
//                         </div>
//                       ) : (
//                         <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">ReadOnly</span>
//                       )}
//                     </TableCell>
//                   </TableRow>
//                 );
//               })
//             ) : (
//               <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No exams scheduled for your classes.</TableCell></TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// }
