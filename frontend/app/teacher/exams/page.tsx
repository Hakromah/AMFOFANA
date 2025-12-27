/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Pencil, Trash2, Calendar, Clock, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import DeleteExamAlert from '@/components/forms/DeleteExamAlert';

// --- SCHEMA & INTERFACES ---
const formSchema = z.object({
  subjectId: z.string().min(1, { message: 'Subject is required' }),
  classId: z.string().min(1, { message: 'Class is required' }),
  date: z.string().min(1, { message: 'Date is required' }),
  startTime: z.string().min(1, { message: 'Start time is required' }),
  endTime: z.string().min(1, { message: 'End time is required' }),
});

interface Exam {
  id: number;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  classe: { id: number; name: string };
  subject: { id: number; name: string };
  teacher: { id: number; name: string };
}

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [currentTeacherId, setCurrentTeacherId] = useState<number | null>(null);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subjectId: '', classId: '', date: '', startTime: '', endTime: '' },
  });

  // --- DATA FETCHING ---
  const loadAllData = async () => {
    try {
      const [examsRes, subjectsRes, classesRes, userRes] = await Promise.all([
        api.get('/teacher/exams'),
        api.get('/teacher/subjects'),
        api.get('/teacher/classes'),
        api.get('/auth/me'), // Endpoint to get the logged-in user's profile
      ]);
      setExams(examsRes.data);
      setSubjects(subjectsRes.data);
      setClasses(classesRes.data);
      setCurrentTeacherId(userRes.data.id);
    } catch (error) {
      toast.error('Failed to synchronize data');
      console.log(error)
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadAllData();
    };

    loadData();
  }, []);

  // --- FORM HANDLERS ---
  const onOpenCreate = () => {
    setEditingExam(null);
    form.reset({ subjectId: '', classId: '', date: '', startTime: '', endTime: '' });
    setIsDialogOpen(true);
  };

  const onOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    form.reset({
      subjectId: String(exam.subject.id),
      classId: String(exam.classe.id),
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const isEditing = !!editingExam;
    const selectedSubject = subjects.find(s => String(s.id) === values.subjectId);

    const payload = {
      name: selectedSubject?.name || 'Exam',
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      classe: { id: parseInt(values.classId) },
      subject: { id: parseInt(values.subjectId) },
    };

    try {
      if (isEditing) {
        await api.put(`/teacher/exams/${editingExam.id}`, payload);
        toast.success('Exam updated');
      } else {
        await api.post('/teacher/exams', payload);
        toast.success('Exam scheduled');
      }
      loadAllData();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Could not save exam');
      console.log(error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Exam Schedule</h1>
          <p className="text-muted-foreground mt-2">Manage assessments for your assigned classes.</p>
        </div>
        <Button onClick={onOpenCreate} className="gap-2">
          <BookOpen className="w-4 h-4" /> Schedule New Exam
        </Button>
      </div>

      {/* --- DELETE CONFIRMATION --- */}
      {examToDelete && (
        <DeleteExamAlert
          examId={examToDelete.id}
          examName={examToDelete.name}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onFinished={loadAllData}
        />
      )}

      {/* --- CREATE/EDIT DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingExam ? 'Modify Exam' : 'Schedule Assessment'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {subjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starts</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ends</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full mt-4">
                {editingExam ? 'Update Schedule' : 'Confirm Exam'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* --- EXAMS TABLE --- */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[200px]">Exam Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Instructor (Owner)</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time Window</TableHead>
              <TableHead className="text-right">Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length > 0 ? (
              exams.map((exam) => {
                const isOwner = exam.teacher?.id === currentTeacherId;
                return (
                  <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold">{exam.name}</TableCell>
                    <TableCell>{exam.classe.name}</TableCell>
                    <TableCell>
                      <span className={isOwner ? "text-primary font-medium" : "text-muted-foreground"}>
                        {isOwner ? "You" : (exam.teacher?.name || 'Unknown')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2"><Calendar className="w-3 h-3" />{exam.date}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2"><Clock className="w-3 h-3" />{exam.startTime} - {exam.endTime}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isOwner ? (
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => onOpenEdit(exam)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => { setExamToDelete(exam); setIsDeleteDialogOpen(true); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">ReadOnly</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No exams scheduled for your classes.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

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
// import api from '@/lib/api';

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
//   teacher: { id: number; name: string }; // Add this
// }

// interface Subject {
//   id: number;
//   name: string;
// }

// interface Class {
//   id: number;
//   name: string;
// }

// export default function TeacherExamsPage() {
//   const [exams, setExams] = useState<Exam[]>([]);
//   const [subjects, setSubjects] = useState<Subject[]>([]);
//   const [classes, setClasses] = useState<Class[]>([]);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingExam, setEditingExam] = useState<Exam | null>(null);

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       subjectId: '',
//       classId: '',
//       date: '',
//       startTime: '',
//       endTime: '',
//     },
//   });

//   const fetchInitialData = async () => {
//     try {
//       const [examsRes, subjectsRes, classesRes] = await Promise.all([
//         api.get('/teacher/exams'),
//         api.get('/teacher/subjects'),
//         api.get('/teacher/classes'),
//       ]);
//       setExams(examsRes.data);
//       setSubjects(subjectsRes.data);
//       setClasses(classesRes.data);
//     } catch (error) {
//       toast.error('Failed to fetch data');
//       console.log(error);
//     }
//   };

//   useEffect(() => {
//     const loadData = async () => {
//       await fetchInitialData();
//     };

//     loadData();
//   }, []);

//   const onSubmit = async (values: z.infer<typeof formSchema>) => {
//     const isEditing = !!editingExam;
//     const toastId = toast.loading(isEditing ? 'Updating exam...' : 'Creating exam...');

//     const selectedSubject = subjects.find(s => s.id === parseInt(values.subjectId));
//     const examName = selectedSubject ? selectedSubject.name : 'Exam';

//     const payload = {
//       name: examName,
//       date: values.date,
//       startTime: values.startTime,
//       endTime: values.endTime,
//       classe: { id: parseInt(values.classId) },
//       subject: { id: parseInt(values.subjectId) },
//     };

//     try {
//       if (isEditing) {
//         await api.put(`/teacher/exams/${editingExam.id}`, payload);
//         toast.success('Exam updated successfully', { id: toastId });
//       } else {
//         await api.post('/teacher/exams', payload);
//         toast.success('Exam created successfully', { id: toastId });
//       }
//       fetchInitialData();
//       setIsDialogOpen(false);
//       setEditingExam(null);
//       form.reset();
//     } catch (error) {
//       toast.error(isEditing ? 'Failed to update exam' : 'Failed to create exam', { id: toastId });
//       console.log(error);
//     }
//   };

//   const openDialog = (exam: Exam | null = null) => {
//     setEditingExam(exam);
//     if (exam) {
//       form.reset({
//         subjectId: String(exam.subject.id),
//         classId: String(exam.classe.id),
//         date: exam.date,
//         startTime: exam.startTime,
//         endTime: exam.endTime,
//       });
//     } else {
//       form.reset({
//         subjectId: '',
//         classId: '',
//         date: '',
//         startTime: '',
//         endTime: '',
//       });
//     }
//     setIsDialogOpen(true);
//   };

//   const handleDelete = async (id: number) => {
//     const toastId = toast.loading('Deleting exam...');
//     try {
//       await api.delete(`/teacher/exams/${id}`);
//       toast.success('Exam deleted successfully', { id: toastId });
//       fetchInitialData();
//     } catch (error) {
//       toast.error('Failed to delete exam', { id: toastId });
//       console.log(error);
//     }
//   };

//   return (
//     <div className="p-8">
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold">Exams Management</h1>
//         <Button onClick={() => openDialog()}>Create Exam</Button>
//       </div>

//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{editingExam ? 'Edit Exam' : 'Create New Exam'}</DialogTitle>
//           </DialogHeader>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
//               <FormField
//                 control={form.control}
//                 name="subjectId"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Subject (Exam Name)</FormLabel>
//                     <Select onValueChange={field.onChange} defaultValue={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select a subject" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {subjects.map((subject) => (
//                           <SelectItem key={subject.id} value={String(subject.id)}>
//                             {subject.name}
//                           </SelectItem>
//                         ))}
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
//                     <Select onValueChange={field.onChange} defaultValue={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select a class" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {classes.map((c) => (
//                           <SelectItem key={c.id} value={String(c.id)}>
//                             {c.name}
//                           </SelectItem>
//                         ))}
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
//                     <FormControl>
//                       <Input type="date" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="startTime"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Start Time</FormLabel>
//                     <FormControl>
//                       <Input type="time" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="endTime"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>End Time</FormLabel>
//                     <FormControl>
//                       <Input type="time" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <Button type="submit">{editingExam ? 'Save Changes' : 'Create'}</Button>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>

//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>Exam Name</TableHead>
//             <TableHead>Class</TableHead>
//             <TableHead>Created By</TableHead> {/* New Header */}
//             <TableHead>Subject</TableHead>
//             <TableHead>Date</TableHead>
//             <TableHead>Time</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {exams.map((exam) => (
//             <TableRow key={exam.id}>
//               <TableCell className="font-medium">{exam.name}</TableCell>
//               <TableCell>{exam.classe.name}</TableCell>
//               <TableCell>{exam.teacher?.name || 'N/A'}</TableCell> {/* New Cell */}
//               <TableCell>{exam.subject.name}</TableCell>
//               <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
//               <TableCell>{exam.startTime} - {exam.endTime}</TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }
