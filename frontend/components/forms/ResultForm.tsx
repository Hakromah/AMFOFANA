/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import api from '@/lib/api';
import { useEffect, useState, useMemo } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  classId: z.string().min(1, { message: 'Class is required' }),
  studentId: z.string().min(1, { message: 'Student is required' }),
  examId: z.string().min(1, { message: 'Exam is required' }),
  marks: z.string()
    .refine((val) => !isNaN(Number(val)), { message: 'Score must be a number' })
    .refine((val) => Number(val) <= 100 && Number(val) >= 0, { message: 'Score must be 0-100' }),
  grade: z.string().optional(),
});

interface ResultFormProps {
  result?: any;
  existingResults: any[]; // Data passed from parent to prevent duplicates
  onFinished: () => void;
}

export default function ResultForm({ result, existingResults, onFinished }: ResultFormProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classId: result?.exam?.classe?.id ? String(result.exam.classe.id) : '',
      studentId: result?.student?.id ? String(result.student.id) : '',
      examId: result?.exam?.id ? String(result.exam.id) : '',
      marks: result?.marks ? String(result.marks) : '',
      grade: result?.grade || undefined,
    },
  });

  // Watch fields for dynamic filtering
  const watchExamId = form.watch('examId');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classesRes, examsRes] = await Promise.all([
          api.get('/teacher/classes'),
          api.get('/teacher/exams'),
        ]);
        setClasses(classesRes.data);
        setExams(examsRes.data);

        if (result?.exam?.classe?.id) {
          const studentRes = await api.get(`/teacher/classes/${result.exam.classe.id}/students`);
          setStudents(studentRes.data);
        }
      } catch (error) {
        toast.error('Failed to load form data');
        console.log(error);
      }
    };
    fetchInitialData();
  }, [result]);

  const handleClassChange = async (classId: string) => {
    form.setValue('classId', classId);
    form.setValue('studentId', ''); // Reset student selection
    try {
      const response = await api.get(`/teacher/classes/${classId}/students`);
      setStudents(response.data);
    } catch (error) {
      setStudents([]);
      toast.error('No students found for this class');
      console.log(error);
    }
  };

  // --- DUPLICATE PREVENTION LOGIC ---
  const filteredStudents = useMemo(() => {
    // If we are editing, we must show the current student
    if (result) return students;
    if (!watchExamId) return students;

    // Find IDs of students who already have a result for the selected exam
    const gradedStudentIds = existingResults
      .filter((r: any) => String(r.exam.id) === watchExamId)
      .map((r: any) => String(r.student.id));

    return students.filter((s: any) => !gradedStudentIds.includes(String(s.id)));
  }, [students, watchExamId, existingResults, result]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const payload = {
        exam: { id: parseInt(values.examId) },
        student: { id: parseInt(values.studentId) },
        marks: parseFloat(values.marks),
        grade: values.grade || null,
      };

      if (result) {
        await api.put(`/teacher/results/${result.id}`, payload);
        toast.success('Record updated');
      } else {
        await api.post('/teacher/results', payload);
        toast.success('Draft saved successfully');
      }
      onFinished();
    } catch (error: any) {
      // Backend error message for duplicate (from our saveResult update)
      const errorMsg = error.response?.data?.message || 'Failed to save record';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* CLASS SELECT */}
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select onValueChange={handleClassChange} defaultValue={field.value} disabled={!!result}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger></FormControl>
                <SelectContent>
                  {classes.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* EXAM SELECT */}
        <FormField
          control={form.control}
          name="examId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exam Title</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!result}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger></FormControl>
                <SelectContent>
                  {exams.filter(e => !form.watch('classId') || String(e.classe.id) === form.watch('classId')).map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* STUDENT SELECT - FILTERED */}
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Name</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!result || !watchExamId}>
                <FormControl><SelectTrigger><SelectValue placeholder={watchExamId ? "Select Student" : "Select Exam First"} /></SelectTrigger></FormControl>
                <SelectContent>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-center text-muted-foreground">All students in this class are already graded for this exam.</div>
                  )}
                </SelectContent>
              </Select>
              {filteredStudents.length === 0 && watchExamId && !result && (
                <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> No ungraded students remaining.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="marks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marks (%)</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="grade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FF'].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {result ? 'Update Record' : 'Save as Draft'}
        </Button>
      </form>
    </Form>
  );
}


// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';

// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { Button } from '@/components/ui/button';
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
// import { useEffect, useState } from 'react';

// const formSchema = z.object({
//   classId: z.string().min(1, { message: 'Class is required' }),
//   studentId: z.string().min(1, { message: 'Student is required' }),
//   examId: z.string().min(1, { message: 'Exam is required' }),
//   marks: z.string().refine((val) => !isNaN(Number(val)), { message: 'Score must be a number' }),
//   grade: z.string().optional(),
// });

// interface ResultFormProps {
//   result?: any;
//   onFinished: () => void;
// }

// export default function ResultForm({ result, onFinished }: ResultFormProps) {
//   const [classes, setClasses] = useState<any[]>([]);
//   const [students, setStudents] = useState<any[]>([]);
//   const [exams, setExams] = useState<any[]>([]);

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       classId: result?.exam?.classe?.id ? String(result.exam.classe.id) : '',
//       studentId: result?.student?.id ? String(result.student.id) : '',
//       examId: result?.exam?.id ? String(result.exam.id) : '',
//       marks: result?.marks ? String(result.marks) : '',
//       grade: result?.grade || undefined,
//     },
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [classesRes, examsRes] = await Promise.all([
//           api.get('/teacher/classes'),
//           api.get('/teacher/exams'),
//         ]);
//         setClasses(classesRes.data);
//         setExams(examsRes.data);

//         // ADD THIS: If we are editing, fetch the students for the existing class immediately
//         if (result?.exam?.classe?.id) {
//           const studentRes = await api.get(`/teacher/classes/${result.exam.classe.id}/students`);
//           setStudents(studentRes.data);
//         }
//       } catch (error) {
//         toast.error('Failed to fetch initial data');
//         console.log(error)
//       }
//     };
//     fetchData();
//   }, [result]);

//   const handleClassChange = async (classId: string) => {
//     if (!classId || classId === "") return;

//     // Update form state
//     form.setValue('classId', classId);
//     form.setValue('studentId', ''); // Clear previous student selection

//     try {
//       // Ensure the URL matches the Backend @GetMapping
//       const response = await api.get(`/teacher/classes/${classId}/students`);
//       if (response.data) {
//         setStudents(response.data);
//         console.log("Students loaded for class:", classId, response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching students:", error);
//       toast.error('This class has no students or access was denied');
//     }
//   };

//   const onSubmit = async (values: z.infer<typeof formSchema>) => {
//     try {
//       const payload = {
//         exam: { id: parseInt(values.examId) },
//         student: { id: parseInt(values.studentId) },
//         marks: parseFloat(values.marks),
//         grade: values.grade || null,
//       };

//       if (result) {
//         await api.put(`/teacher/results/${result.id}`, payload);
//         toast.success('Result updated successfully');
//       } else {
//         await api.post('/teacher/results', payload);
//         toast.success('Result saved successfully');
//       }
//       onFinished();
//     } catch (error) {
//       toast.error('Failed to save result');
//       console.log(error)
//     }
//   };

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//         <FormField
//           control={form.control}
//           name="classId"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Class</FormLabel>
//               <Select onValueChange={handleClassChange} defaultValue={field.value} disabled={!!result}>
//                 <FormControl>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select a class" />
//                   </SelectTrigger>
//                 </FormControl>
//                 <SelectContent>
//                   {classes.map((c) => (
//                     <SelectItem key={c.id} value={String(c.id)}>
//                       {c.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name="studentId"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Student</FormLabel>
//               <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!result}>
//                 <FormControl>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select a student" />
//                   </SelectTrigger>
//                 </FormControl>
//                 <SelectContent>
//                   {students.map((s) => (
//                     <SelectItem key={s.id} value={String(s.id)}>
//                       {s.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name="examId"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Exam</FormLabel>
//               <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!result}>
//                 <FormControl>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select an exam" />
//                   </SelectTrigger>
//                 </FormControl>
//                 <SelectContent>
//                   {exams.map((e) => (
//                     <SelectItem key={e.id} value={String(e.id)}>
//                       {e.name} ({e.classe.name})
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name="marks"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Score</FormLabel>
//               <FormControl>
//                 <Input type="number" step="0.01" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name="grade"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Grade (Optional)</FormLabel>
//               <Select onValueChange={field.onChange} defaultValue={field.value}>
//                 <FormControl>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select a grade" />
//                   </SelectTrigger>
//                 </FormControl>
//                 <SelectContent>
//                   {['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FF'].map((g) => (
//                     <SelectItem key={g} value={g}>
//                       {g}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <Button type="submit">Save</Button>
//       </form>
//     </Form>
//   );
// }
