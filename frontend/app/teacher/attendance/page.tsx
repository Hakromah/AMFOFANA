/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar, Users, ClipboardCheck, Loader2, Save, History,
  PlusCircle, Search, CheckCheck, X, Clock, AlertTriangle, UserCheck,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'SICK';

interface Student {
  id: number;
  name: string;
  username?: string;
  userId: string;
}

interface AttendanceRecord {
  studentId: number;
  status: AttendanceStatus;
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; bg: string; text: string; dot: string }> = {
  PRESENT: { label: 'Present',  bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ABSENT:  { label: 'Absent',   bg: 'bg-rose-50 border-rose-200',       text: 'text-rose-700',    dot: 'bg-rose-500'   },
  LATE:    { label: 'Late',     bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   dot: 'bg-amber-500'  },
  EXCUSED: { label: 'Excused',  bg: 'bg-blue-50 border-blue-200',       text: 'text-blue-700',    dot: 'bg-blue-500'   },
  SICK:    { label: 'Sick',     bg: 'bg-purple-50 border-purple-200',   text: 'text-purple-700',  dot: 'bg-purple-500' },
};

// ── Status cycle button ───────────────────────────────────────────────────────
function StatusButton({ status, onChange }: { status: AttendanceStatus; onChange: (s: AttendanceStatus) => void }) {
  const cfg = STATUS_CONFIG[status];
  const order: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'];
  const next = () => onChange(order[(order.indexOf(status) + 1) % order.length]);

  return (
    <button
      onClick={next}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-full border font-black text-[10px] uppercase tracking-widest transition-all duration-200 ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </button>
  );
}

// ── Analytics card ────────────────────────────────────────────────────────────
function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[70px]">
      <span className={`text-2xl font-black ${color}`}>{value}</span>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function TeacherAttendancePage() {
  const [classes, setClasses]             = useState<any[]>([]);
  const [students, setStudents]           = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendance, setAttendance]       = useState<AttendanceRecord[]>([]);
  const [view, setView]                   = useState<'mark' | 'history'>('mark');
  const [history, setHistory]             = useState<any[]>([]);
  const [search, setSearch]               = useState('');
  const [sessionDate, setSessionDate]     = useState(new Date().toISOString().split('T')[0]);
  const [isEditing, setIsEditing]         = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [loadingStudents, setLoadingStudents]   = useState(false);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/teacher/classes').then(r => setClasses(r.data)).catch(() => toast.error('Failed to load classes'));
  }, []);

  // ── Filtered students by search ─────────────────────────────────────────────
  const filteredStudents = useMemo(
    () => students.filter(s => {
      const q = search.toLowerCase();
      return (s.username || s.name || '').toLowerCase().includes(q) || (s.userId || '').toLowerCase().includes(q);
    }),
    [students, search]
  );

  // ── Analytics ───────────────────────────────────────────────────────────────
  const presentCount  = attendance.filter(a => a.status === 'PRESENT').length;
  const absentCount   = attendance.filter(a => a.status === 'ABSENT').length;
  const lateCount     = attendance.filter(a => a.status === 'LATE').length;
  const excusedCount  = attendance.filter(a => a.status === 'EXCUSED' || a.status === 'SICK').length;
  const attendanceRate = students.length > 0
    ? Math.round(((presentCount + lateCount) / students.length) * 100) : 0;

  // ── Fetch helpers ───────────────────────────────────────────────────────────
  const fetchStudents = async (classId: string) => {
    setLoadingStudents(true);
    try {
      const r = await api.get(`/teacher/classes/${classId}/students`);
      setStudents(r.data);
      if (!isEditing) {
        setAttendance(r.data.map((s: Student) => ({ studentId: s.id, status: 'PRESENT' as AttendanceStatus })));
      }
    } catch { toast.error('Failed to fetch students'); }
    finally { setLoadingStudents(false); }
  };

  const fetchHistory = async (classId: string) => {
    try {
      const r = await api.get(`/teacher/classes/${classId}/attendance-history`);
      setHistory(r.data);
    } catch { toast.error('Failed to load history'); }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setIsEditing(false);
    setCurrentSessionId(null);
    setSearch('');
    if (view === 'mark') fetchStudents(classId);
    else fetchHistory(classId);
  };

  const setStatus = (studentId: number, status: AttendanceStatus) =>
    setAttendance(prev => prev.map(a => a.studentId === studentId ? { ...a, status } : a));

  const markAll = (status: AttendanceStatus) =>
    setAttendance(prev => prev.map(a => ({ ...a, status })));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedClass) return;
    setSubmitting(true);
    const tid = toast.loading(isEditing ? 'Updating registry...' : 'Finalizing registry...');
    const payload = {
      classId: parseInt(selectedClass),
      date: sessionDate,
      records: attendance.map(a => ({ studentId: a.studentId, status: a.status })),
    };
    try {
      if (isEditing && currentSessionId) {
        await api.put(`/teacher/attendance/${currentSessionId}`, payload);
        toast.success('Session updated', { id: tid });
        setIsEditing(false);
        setCurrentSessionId(null);
        setView('history');
        fetchHistory(selectedClass);
      } else {
        await api.post('/teacher/attendance', payload);
        toast.success('Attendance finalized ✓', { id: tid });
        setSelectedClass('');
        setStudents([]);
        setAttendance([]);
      }
    } catch { toast.error('Sync failed — check connection.', { id: tid }); }
    finally { setSubmitting(false); }
  };

  // ── Edit session ────────────────────────────────────────────────────────────
  const handleEditSession = async (session: any) => {
    const tid = toast.loading('Loading session...');
    try {
      setIsEditing(true);
      setCurrentSessionId(session.id);
      setSessionDate(session.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      const r = await api.get(`/teacher/classes/${selectedClass}/students`);
      setStudents(r.data);
      setAttendance(session.records.map((rec: any) => ({
        studentId: rec.studentId,
        status: rec.status as AttendanceStatus,
      })));
      setView('mark');
      toast.success('Ready to edit', { id: tid });
    } catch { toast.error('Failed to load session', { id: tid }); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 lg:p-10 min-h-screen space-y-6 bg-[#f8fafc]">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Attendance</span>
          </div>
          <h1 className="text-[clamp(1.4rem,3vw,2.5rem)] font-black tracking-tighter text-slate-900 italic">
            Academic <span className="text-primary">Registry.</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">
            <Calendar size={10} className="inline mr-1" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Class selector */}
        <Select value={selectedClass} onValueChange={handleClassChange}>
          <SelectTrigger className="w-full md:w-[260px] h-12 rounded-2xl bg-white shadow-sm font-black text-[10px] uppercase tracking-widest border-slate-100">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            {classes.map(c => (
              <SelectItem key={c.id} value={String(c.id)} className="font-bold">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── View toggle ── */}
      {selectedClass && (
        <div className="flex gap-3">
          <Button
            onClick={() => { setView('mark'); if (selectedClass) fetchStudents(selectedClass); }}
            className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all ${view === 'mark' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            <PlusCircle size={13} /> {isEditing ? 'Editing Session' : 'New Session'}
          </Button>
          <Button
            onClick={() => { setView('history'); fetchHistory(selectedClass); }}
            className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all ${view === 'history' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            <History size={13} /> View History
          </Button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {!selectedClass ? (
        /* EMPTY STATE */
        <div className="h-[500px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white hover:border-primary/40 transition-colors duration-500">
          <div className="p-8 bg-slate-50 rounded-3xl mb-6">
            <Users size={64} className="text-slate-200" />
          </div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Select a Class</h2>
          <p className="text-slate-400 text-sm font-medium mt-2 text-center max-w-xs">
            Choose a class from the dropdown to begin managing attendance.
          </p>
        </div>

      ) : view === 'mark' ? (
        /* ═══ MARK SESSION VIEW ══════════════════════════════════════════════ */
        <div className="space-y-5">
          {/* Live analytics bar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap gap-8">
                <StatPill label="Total"   value={students.length}           color="text-slate-900" />
                <StatPill label="Present" value={presentCount}              color="text-emerald-600" />
                <StatPill label="Absent"  value={absentCount}               color="text-rose-600" />
                <StatPill label="Late"    value={lateCount}                 color="text-amber-600" />
                <StatPill label="Excused" value={excusedCount}              color="text-blue-600" />
              </div>
              <div className="flex items-center gap-3 min-w-[180px]">
                <span className={`text-2xl font-black ${attendanceRate >= 75 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {attendanceRate}%
                </span>
                <div className="flex-1">
                  <Progress value={attendanceRate} className="h-2.5 rounded-full bg-slate-100" />
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">Attendance Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Session controls */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            {/* Date picker */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 px-4 h-11 shadow-sm">
              <Calendar size={14} className="text-primary" />
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="text-sm font-bold text-slate-700 bg-transparent outline-none"
              />
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search student..."
                className="pl-9 h-11 rounded-xl bg-white border-slate-100 font-bold text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Bulk actions */}
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5 font-bold text-xs border-slate-200 hover:border-emerald-300 hover:text-emerald-700" onClick={() => markAll('PRESENT')}>
                <CheckCheck size={13} /> All Present
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5 font-bold text-xs border-slate-200 hover:border-rose-300 hover:text-rose-700" onClick={() => markAll('ABSENT')}>
                <X size={13} /> All Absent
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5 font-bold text-xs border-slate-200 hover:border-amber-300 hover:text-amber-700" onClick={() => markAll('LATE')}>
                <Clock size={13} /> All Late
              </Button>
            </div>
          </div>

          {/* Registry table */}
          <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="border-b border-slate-50 px-8 py-4 flex flex-row items-center justify-between bg-white">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-900">Class Registry</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  {loadingStudents ? 'Loading...' : `${students.length} students enrolled`}
                </p>
              </div>
              <Badge className="bg-blue-50 text-primary border-none font-black px-4 py-1 rounded-full uppercase text-[9px]">
                {isEditing ? 'Edit Mode' : 'New Session'}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 max-h-[50vh] overflow-y-auto">
              {loadingStudents ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="pl-8 py-4 font-black text-[9px] uppercase tracking-widest text-slate-400 w-[130px]">Student ID</TableHead>
                      <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Full Name</TableHead>
                      <TableHead className="text-right pr-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Attendance Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-slate-400 font-bold italic text-sm">
                          {search ? 'No students match your search.' : 'No students in this class.'}
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.map(student => {
                      const record = attendance.find(a => a.studentId === student.id);
                      const status = record?.status ?? 'PRESENT';
                      return (
                        <TableRow key={student.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <TableCell className="pl-8 py-4">
                            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                              #{student.userId || student.id}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-black text-sm">
                                {(student.username || student.name || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm capitalize">
                                  {student.username || student.name}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8 py-4">
                            <StatusButton
                              status={status as AttendanceStatus}
                              onChange={s => setStatus(student.id, s)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Footer action bar */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-4">
            <div className="flex items-center gap-2 text-slate-500">
              <UserCheck size={16} />
              <span className="text-sm font-bold">{presentCount} of {students.length} present</span>
            </div>
            <div className="flex gap-3">
              {isEditing && (
                <Button variant="ghost" className="rounded-xl font-bold text-slate-400 text-xs" onClick={() => { setIsEditing(false); setView('history'); }}>
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={submitting || students.length === 0}
                className="h-12 px-8 bg-slate-900 hover:bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-lg gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isEditing ? 'Update Session' : 'Finalize Registry'}
              </Button>
            </div>
          </div>
        </div>

      ) : (
        /* ═══ HISTORY VIEW ══════════════════════════════════════════════════ */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">
              {history.length} Previous Sessions
            </h2>
            {history.length === 0 && (
              <p className="text-slate-400 text-xs font-bold italic">No sessions recorded yet for this class.</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {history.map((session, idx) => {
              const rate = session.totalCount > 0
                ? Math.round(((session.presentCount + (session.lateCount || 0)) / session.totalCount) * 100)
                : 0;
              const isGood = rate >= 75;
              return (
                <Card key={session.id} className="border border-slate-100 hover:border-primary/40 duration-500 transition-all shadow-sm rounded-3xl bg-white p-6 group hover:shadow-md">
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <Calendar size={22} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {rate}%
                      </span>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">Session #{idx + 1}</p>
                    </div>
                  </div>

                  <h4 className="text-lg font-black text-slate-900 tracking-tight mb-1">
                    {new Date(session.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h4>

                  <div className="flex gap-4 mb-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black text-slate-500 uppercase">{session.presentCount} Present</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-[10px] font-black text-slate-500 uppercase">{session.totalCount - session.presentCount} Absent</span>
                    </div>
                  </div>

                  <Progress value={rate} className="h-1.5 mb-5 bg-slate-100" />

                  <Button
                    className="w-full h-10 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all"
                    onClick={() => handleEditSession(session)}
                  >
                    Modify Session
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
