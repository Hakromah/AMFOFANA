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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, ClipboardCheck, Loader2, Save, History, PlusCircle, ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Student {
  id: number;
  name: string;
  userId: string;
}

interface Class {
  id: number;
  name: string;
}

interface AttendanceRecord {
  studentId: number;
  present: boolean;
}

export default function TeacherAttendancePage() {
  // State Management
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [view, setView] = useState<'mark' | 'history'>('mark');
  const [history, setHistory] = useState<any[]>([]);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/teacher/classes');
        setClasses(response.data);
      } catch (error) {
        toast.error('Failed to load classes');
        console.log(error)
      }
    };
    fetchClasses();
  }, []);

  const fetchStudentsByClass = async (classId: string) => {
    try {
      const response = await api.get(`/teacher/classes/${classId}/students`);
      setStudents(response.data);
      if (!isEditing) {
        setAttendance(
          response.data.map((student: Student) => ({
            studentId: student.id,
            present: true,
          }))
        );
      }
    } catch (error) {
      toast.error('Failed to fetch students');
      console.log(error)

    }
  };

  const fetchHistory = async (classId: string) => {
    try {
      const res = await api.get(`/teacher/classes/${classId}/attendance-history`);
      setHistory(res.data);
    } catch (error) {
      toast.error('Failed to load history');
      console.log(error)
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setIsEditing(false);
    setCurrentSessionId(null);
    if (view === 'mark') {
      fetchStudentsByClass(classId);
    } else {
      fetchHistory(classId);
    }
  };

  const handleEditSession = async (session: any) => {
    const tid = toast.loading("Loading session data...");
    try {
      // In a real app, you might need a detailed session endpoint
      // For now, we assume history contains enough or we fetch students again
      setIsEditing(true);
      setCurrentSessionId(session.id);

      // Load current students and match statuses
      const studentRes = await api.get(`/teacher/classes/${selectedClass}/students`);
      setStudents(studentRes.data);

      // Map existing record statuses to state
      // Note: This assumes session.records contains studentId and present status
      // You may need an additional API call: await api.get(`/teacher/attendance/${session.id}`)
      const detailRes = await api.get(`/teacher/attendance/${session.id}`);

      setAttendance(detailRes.data.records.map((r: any) => ({
        studentId: r.student.id,
        present: r.present
      })));

      setView('mark');
      toast.success("Ready for edit", { id: tid });
    } catch (err) {
      toast.error("Failed to load details", { id: tid });
      console.log(err)
    }
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClass) return;
    setSubmitting(true);
    const tid = toast.loading(isEditing ? "Updating registry..." : "Finalizing registry...");

    const payload = {
      classId: parseInt(selectedClass),
      date: new Date().toISOString().split('T')[0],
      records: attendance,
    };

    try {
      if (isEditing && currentSessionId) {
        await api.put(`/teacher/attendance/${currentSessionId}`, payload);
        toast.success('Session updated successfully', { id: tid });
      } else {
        await api.post(`/teacher/attendance`, payload);
        toast.success('Attendance finalized', { id: tid });
      }

      if (isEditing) {
        setIsEditing(false);
        setCurrentSessionId(null);
        setView('history');
        fetchHistory(selectedClass);
      } else {
        // Reset after new submission
        setSelectedClass('');
        setStudents([]);
      }
    } catch (error) {
      toast.error('Sync failed. Please check connection.', { id: tid });
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = attendance.filter(a => a.present).length;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  return (
    <div className="p-6 lg:p-10 bg-[#f8fafc] min-h-screen space-y-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Academic <span className="text-blue-600">Registry</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
            <Calendar size={14} className="text-blue-600" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={selectedClass} onValueChange={handleClassChange}>
            <SelectTrigger className="w-full md:w-[300px] h-12 rounded-2xl shadow-sm border-none bg-white font-black uppercase text-[10px] tracking-widest">
              <SelectValue placeholder="Select Class Session" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)} className="font-bold">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedClass && (
        <div className="flex gap-4">
          <Button
            variant={view === 'mark' ? 'default' : 'outline'}
            onClick={() => setView('mark')}
            className={`rounded-2xl font-black uppercase text-[10px] tracking-widest px-6 h-10 transition-all ${view === 'mark' ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-white'}`}
          >
            <PlusCircle size={14} className="mr-2" /> {isEditing ? 'Editing Session' : 'New Session'}
          </Button>
          <Button
            variant={view === 'history' ? 'default' : 'outline'}
            onClick={() => { setView('history'); fetchHistory(selectedClass); }}
            className={`rounded-2xl font-black uppercase text-[10px] tracking-widest px-6 h-10 transition-all ${view === 'history' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white'}`}
          >
            <History size={14} className="mr-2" /> View History
          </Button>
        </div>
      )}

      {selectedClass ? (
        view === 'mark' ? (
          /* MARKING VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="border-b border-slate-50 p-8 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Class Registry</CardTitle>
                <Badge className="bg-blue-50 text-blue-600 border-none font-black px-4 py-1 rounded-full uppercase text-[9px]">
                  {students.length} Enrolled
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="w-[120px] pl-8 py-5 font-black text-slate-400 uppercase text-[9px] tracking-widest">Identity</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Full Name</TableHead>
                      <TableHead className="text-right pr-8 font-black text-slate-400 uppercase text-[9px] tracking-widest">Presence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const isPresent = attendance.find((a) => a.studentId === student.id)?.present;
                      return (
                        <TableRow key={student.id} className="border-slate-50 hover:bg-blue-50/20 transition-all">
                          <TableCell className="pl-8 py-5 font-mono text-[10px] font-bold text-slate-400">
                            #{student.userId || student.id}
                          </TableCell>
                          <TableCell className="font-black text-slate-800 text-sm tracking-tight capitalize">
                            {student.name}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex justify-end items-center gap-4">
                              <span className={`text-[9px] font-black uppercase tracking-tighter ${isPresent ? 'text-emerald-500' : 'text-rose-400'}`}>
                                {isPresent ? 'Present' : 'Absent'}
                              </span>
                              <Checkbox
                                className="w-6 h-6 rounded-xl border-2 border-slate-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all"
                                checked={isPresent}
                                onCheckedChange={(checked) =>
                                  setAttendance(prev => prev.map(a => a.studentId === student.id ? { ...a, present: !!checked } : a))
                                }
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white p-8">
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/10 rounded-2xl">
                      <ClipboardCheck className="text-blue-400" size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Session Status</p>
                      <h2 className="text-xl font-black italic">Live Overview</h2>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-400">
                      <span>Rate</span>
                      <span>{attendanceRate}%</span>
                    </div>
                    <Progress
                      value={attendanceRate}
                      className="h-2 bg-white/5"
                      style={{ ['--progress-foreground' as any]: '#3b82f6' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-5 rounded-4xl border border-white/5">
                      <p className="text-[9px] font-black uppercase text-emerald-500 tracking-tighter mb-1">Present</p>
                      <p className="text-3xl font-black">{presentCount}</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-4xl border border-white/5">
                      <p className="text-[9px] font-black uppercase text-rose-500 tracking-tighter mb-1">Absent</p>
                      <p className="text-3xl font-black">{students.length - presentCount}</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmitAttendance}
                    disabled={submitting}
                    className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl shadow-blue-900/40 border-none"
                  >
                    {submitting ? <Loader2 className="animate-spin" /> : (
                      isEditing ? <><Save size={18} className="mr-2" /> Update Session</> : <><Save size={18} className="mr-2" /> Finalize Registry</>
                    )}
                  </Button>

                  {isEditing && (
                    <Button
                      variant="ghost"
                      onClick={() => { setIsEditing(false); setView('history'); }}
                      className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-white"
                    >
                      Cancel Changes
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* HISTORY VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {history.length > 0 ? history.map((session, idx) => (
              <Card key={session.id} className="border-none shadow-sm rounded-[2rem] bg-white p-8 group hover:shadow-xl transition-all duration-500">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Calendar size={24} />
                  </div>
                  <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] uppercase tracking-tighter">
                    Session #{idx + 1}
                  </Badge>
                </div>

                <div className="space-y-1 mb-8">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">
                    {new Date(session.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {session.presentCount} Students Present • {session.totalCount - session.presentCount} Absent
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    className="flex-1 h-11 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all"
                    onClick={() => handleEditSession(session)}
                  >
                    Modify
                  </Button>
                  <Button variant="outline" className="h-11 rounded-xl px-4 border-slate-100 text-slate-400 hover:text-rose-500">
                    <Users size={16} />
                  </Button>
                </div>
              </Card>
            )) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No previous sessions found for this class.</p>
              </div>
            )}
          </div>
        )
      ) : (
        /* EMPTY STATE */
        <div className="h-[500px] flex flex-col items-center justify-center bg-white rounded-[4rem] border border-dashed border-slate-200">
          <div className="p-8 bg-slate-50 rounded-full mb-6">
            <Users size={64} className="text-slate-200" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Select a Class</h2>
          <p className="text-slate-400 text-sm font-medium mt-2">Initialize your curriculum session to begin registry control.</p>
        </div>
      )}
    </div>
  );
}


// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';

// import { useEffect, useState, startTransition } from 'react';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { Button } from '@/components/ui/button';
// import { Checkbox } from '@/components/ui/checkbox';
// import { toast } from 'sonner';
// import api from '@/lib/api';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Calendar, Users, ClipboardCheck, Loader2, Save } from 'lucide-react';
// import { Progress } from '@/components/ui/progress';

// interface Student {
//   id: number;
//   name: string;
//   userId: string; // The 12-digit display ID
// }

// interface Class {
//   id: number;
//   name: string;
// }

// interface AttendanceRecord {
//   studentId: number;
//   present: boolean;
// }

// export default function TeacherAttendancePage() {
//   const [students, setStudents] = useState<Student[]>([]);
//   const [classes, setClasses] = useState<Class[]>([]);
//   const [selectedClass, setSelectedClass] = useState<string>('');
//   const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     (async () => {
//       try {
//         const response = await api.get('/teacher/classes');
//         setClasses(response.data);
//       } catch (error) {
//         toast.error('Failed to load classes');
//         console.error(error);
//       }
//     })();
//   }, []);

//   const fetchStudentsByClass = async (classId: string) => {
//     try {
//       const response = await api.get(`/teacher/classes/${classId}/students`);
//       setStudents(response.data);
//       // Initialize all students as present by default (saves teacher time)
//       setAttendance(
//         response.data.map((student: Student) => ({
//           studentId: student.id,
//           present: true,
//         }))
//       );
//     } catch (error) {
//       toast.error('Failed to fetch class registry');
//       console.log(error);
//     }
//   };

//   const handleClassChange = (classId: string) => {
//     setSelectedClass(classId);
//     fetchStudentsByClass(classId);
//   };

//   const handleAttendanceChange = (studentId: number, present: boolean) => {
//     setAttendance((prev) =>
//       prev.map((record) =>
//         record.studentId === studentId ? { ...record, present } : record
//       )
//     );
//   };

//   const handleSubmitAttendance = async () => {
//     setSubmitting(true);
//     const tid = toast.loading("Syncing with Academic Registry...");
//     try {
//       await api.post(`/teacher/attendance`, {
//         classId: parseInt(selectedClass),
//         date: new Date().toISOString().split('T')[0],
//         records: attendance,
//       });
//       toast.success('Attendance Finalized', { id: tid });
//     } catch (error) {
//       toast.error('Sync Failed', { id: tid });
//       console.error(error);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const presentCount = attendance.filter(a => a.present).length;
//   const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

//   return (
//     <div className="p-6 lg:p-10 bg-[#f8fafc] min-h-screen space-y-8">
//       {/* Header Area */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
//             Registry <span className="text-blue-600">Control</span>
//           </h1>
//           <p className="text-slate-500 font-medium text-sm flex items-center gap-2 mt-1">
//             <Calendar size={14} /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
//           </p>
//         </div>

//         <Select onValueChange={handleClassChange}>
//           <SelectTrigger className="w-full md:w-[300px] h-12 rounded-2xl shadow-sm border-none bg-white font-bold">
//             <SelectValue placeholder="Choose a class session" />
//           </SelectTrigger>
//           <SelectContent className="rounded-2xl border-none shadow-xl">
//             {classes.map((c) => (
//               <SelectItem key={c.id} value={String(c.id)} className="font-medium">
//                 {c.name}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>

//       {selectedClass ? (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Main Table Section */}
//           <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
//             <CardHeader className="border-b border-slate-50 p-8">
//               <div className="flex justify-between items-center">
//                 <CardTitle className="text-lg font-black uppercase tracking-widest text-slate-400">Student Registry</CardTitle>
//                 <Badge className="bg-blue-50 text-blue-600 border-none font-bold">
//                   {students.length} Total Students
//                 </Badge>
//               </div>
//             </CardHeader>
//             <CardContent className="p-0">
//               <Table>
//                 <TableHeader className="bg-slate-50/50">
//                   <TableRow className="hover:bg-transparent border-none">
//                     <TableHead className="w-[100px] pl-8 py-4 font-bold text-slate-400 uppercase text-[10px]">ID</TableHead>
//                     <TableHead className="font-bold text-slate-400 uppercase text-[10px]">Student</TableHead>
//                     <TableHead className="text-right pr-8 font-bold text-slate-400 uppercase text-[10px]">Status</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {students.map((student) => {
//                     const isPresent = attendance.find((a) => a.studentId === student.id)?.present;
//                     return (
//                       <TableRow key={student.id} className="border-slate-50 hover:bg-blue-50/30 transition-colors">
//                         <TableCell className="pl-8 py-4 font-mono text-xs text-slate-400">
//                           #{student.userId || student.id}
//                         </TableCell>
//                         <TableCell className="font-black text-slate-800 tracking-tight">
//                           {student.name}
//                         </TableCell>
//                         <TableCell className="text-right pr-8">
//                           <div className="flex justify-end items-center gap-3">
//                             <span className={`text-[10px] font-black uppercase ${isPresent ? 'text-emerald-500' : 'text-rose-400'}`}>
//                               {isPresent ? 'Present' : 'Absent'}
//                             </span>
//                             <Checkbox
//                               className="w-6 h-6 rounded-lg border-2 border-slate-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
//                               checked={isPresent}
//                               onCheckedChange={(checked) => handleAttendanceChange(student.id, !!checked)}
//                             />
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     );
//                   })}
//                 </TableBody>
//               </Table>
//             </CardContent>
//           </Card>

//           {/* Action Sidebar */}
//           <div className="space-y-6">
//             <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 text-white p-8">
//               <div className="space-y-6">
//                 <div className="flex items-center gap-3">
//                   <div className="p-3 bg-white/10 rounded-2xl">
//                     <ClipboardCheck className="text-blue-400" />
//                   </div>
//                   <div>
//                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Summary</p>
//                     <h2 className="text-xl font-black">Daily Report</h2>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
//                     <span>Presence Rate</span>
//                     <span>{attendanceRate}%</span>
//                   </div>
//                   <Progress
//                     value={attendanceRate}
//                     className="h-2 bg-white/10"
//                     style={{ ['--progress-foreground' as any]: '#3b82f6' }} // Tailwind blue-500
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 pt-4">
//                   <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center">
//                     <p className="text-[10px] font-bold uppercase text-emerald-500">Present</p>
//                     <p className="text-2xl font-black">{presentCount}</p>
//                   </div>
//                   <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center">
//                     <p className="text-[10px] font-bold uppercase text-rose-500">Absent</p>
//                     <p className="text-2xl font-black">{students.length - presentCount}</p>
//                   </div>
//                 </div>

//                 <Button
//                   onClick={handleSubmitAttendance}
//                   disabled={submitting}
//                   className="w-full h-14 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-900/20"
//                 >
//                   {submitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Finalize Registry</>}
//                 </Button>
//               </div>
//             </Card>

//             <div className="p-6 bg-amber-50 rounded-4xl border border-amber-100">
//               <p className="text-[10px] font-black text-amber-600 uppercase mb-2">Notice</p>
//               <p className="text-xs text-amber-700 font-medium leading-relaxed">
//                 Finalizing this registry will notify students and update their academic dashboard stats immediately.
//               </p>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
//           <Users size={48} className="text-slate-200 mb-4" />
//           <h2 className="text-xl font-black text-slate-800 tracking-tight">No Class Selected</h2>
//           <p className="text-slate-400 text-sm">Please select a class from the dropdown to start marking attendance.</p>
//         </div>
//       )}
//     </div>
//   );
// }


