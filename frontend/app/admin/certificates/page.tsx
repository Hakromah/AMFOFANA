/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Award, Printer, CheckCircle2, Search, Plus, FileText,
  ShieldCheck, User, Sliders, GraduationCap, Sparkles,
  BookOpen, Loader2, Fingerprint, ClipboardList, QrCode,
  TrendingUp, RefreshCcw, XCircle, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CertRecord {
  id: number;
  serialNumber: string;
  studentName: string;
  studentUserId: string;
  certificateType: string;
  programme: string;
  issueDate: string;
  verificationHash: string;
  status: 'Valide' | 'Révoqué';
  certStatus?: 'Valide' | 'Revoque';
  mention?: string;
  gpa?: number;
  maxGpa?: number;
  totalCredits?: number;
  classRank?: string;
  className?: string;
  note?: string;
}

interface CertType   { id: number; name: string; isGraduation: boolean; defaultProgramme?: string; }
interface CertMention{ id: number; name: string; minAverage?: number; }
interface StudentOpt { id: number; name: string; userId: string; className?: string; }

// ─── Serial / Hash ────────────────────────────────────────────────────────────
const mkSerial = () => `AMF-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900000)+100000)}`;
const mkHash   = () => 'sha256-' + Math.random().toString(36).substring(2,14).toUpperCase();

// ─── Logo loader ──────────────────────────────────────────────────────────────
const loadLogo = (): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = '/logo/fofana.png';
    img.onload = () => {
      const s = Math.min(img.naturalWidth || 200, img.naturalHeight || 200);
      const c = document.createElement('canvas');
      c.width = s; c.height = s;
      const ctx = c.getContext('2d');
      if (ctx) { ctx.beginPath(); ctx.arc(s/2,s/2,s/2,0,2*Math.PI); ctx.clip(); ctx.drawImage(img,0,0,s,s); }
      const out = new window.Image();
      out.src = c.toDataURL('image/png');
      out.onload = () => resolve(out);
      out.onerror = reject;
    };
    img.onerror = reject;
  });

// ─── PDF Generator (exported for student/teacher/parent pages) ────────────────
export async function buildCertPDF(cert: CertRecord, types: CertType[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210, cx = W / 2;
  const isGrad = types.find(t => t.name === cert.certificateType)?.isGraduation ?? 
    (cert.certificateType.toLowerCase().includes('diploma') || cert.certificateType.toLowerCase().includes('excellence') || cert.certificateType.toLowerCase().includes('diplôme'));
  const verifyUrl = `https://amfofana.edu.gn/verify?hash=${cert.verificationHash}`;

  const GOLD = [184,134,11]  as [number,number,number];
  const NAVY = [30, 58, 138] as [number,number,number];
  const DARK = [15, 23, 42]  as [number,number,number];
  const GREY = [100,116,139] as [number,number,number];

  let logoImg: HTMLImageElement | null = null;
  let qrData = '';
  try { logoImg = await loadLogo(); } catch { /**/ }
  try { qrData = await QRCode.toDataURL(verifyUrl, { margin:1, width:80 }); } catch { /**/ }

  doc.setFillColor(253,252,249);
  doc.rect(0,0,W,H,'F');

  if (isGrad) {
    // ── PREMIUM GRADUATION DIPLOMA ─────────────────────────────────────────────
    doc.setDrawColor(...GOLD); doc.setLineWidth(2.2); doc.rect(7,7,283,196);
    doc.setDrawColor(...NAVY); doc.setLineWidth(0.7); doc.rect(10,10,277,190);
    [[7,7],[282,7],[7,195],[282,195]].forEach(([x,y]) => {
      doc.setFillColor(...GOLD); doc.rect(x-0.5,y-0.5,8,8,'F');
      doc.setFillColor(253,252,249); doc.rect(x+1,y+1,4,4,'F');
      doc.setFillColor(...NAVY); doc.rect(x+2,y+2,2,2,'F');
    });

    // Header — logo LEFT, text centered in right portion
    doc.setFillColor(...NAVY); doc.rect(10,10,277,38,'F');
    doc.setFillColor(...GOLD); doc.rect(10,48,277,2,'F');
    const lx=20,ly=14,lsz=30;
    if (logoImg) doc.addImage(logoImg as any,'PNG',lx,ly,lsz,lsz);
    else {
      doc.setFillColor(255,255,255); doc.ellipse(lx+15,ly+15,14,14,'F');
      doc.setTextColor(...NAVY); doc.setFont('Helvetica','bold'); doc.setFontSize(14);
      doc.text('AMF',lx+15,ly+18,{align:'center'});
    }
    const tc = lx+lsz+(W-10-lx-lsz)/2;
    doc.setTextColor(255,255,255); doc.setFont('Helvetica','bold'); doc.setFontSize(17);
    doc.text('AMFOFANA HIGH SCHOOL',tc,24,{align:'center'});
    doc.setFont('Helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(200,210,240);
    doc.text('EXCELLENCE IN EDUCATION  ·  FUTURE LEADERS',tc,31,{align:'center'});
    doc.setFontSize(6.5); doc.setTextColor(160,180,220);
    doc.text('Accredited Academic Institution — Official Graduation Document',tc,38,{align:'center'});

    doc.setFont('Helvetica','bold'); doc.setFontSize(21); doc.setTextColor(...GOLD);
    doc.text(cert.certificateType.toUpperCase(),cx,63,{align:'center'});
    doc.setFont('Helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...GREY);
    doc.text('THE ACADEMIC COUNCIL AND THE BOARD OF TRUSTEES CONFER THIS DIPLOMA UNTO',cx,72,{align:'center'});
    doc.setFont('Helvetica','bold'); doc.setFontSize(23); doc.setTextColor(...DARK);
    doc.text(cert.studentName.toUpperCase(),cx,85,{align:'center'});
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.6); doc.line(cx-65,89,cx+65,89);
    doc.setFont('Helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...GREY);
    doc.text(`Student ID: ${cert.studentUserId}${cert.className?' | Class: '+cert.className:''}`,cx,95,{align:'center'});
    doc.setFontSize(9); doc.setTextColor(71,85,105);
    doc.text('for successfully completing all prescribed requirements and examinations in',cx,103,{align:'center'});
    doc.setFont('Helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...NAVY);
    doc.text(cert.programme.toUpperCase(),cx,112,{align:'center'});

    // Metrics card
    const cY=118,cH=30;
    doc.setFillColor(248,250,252); doc.roundedRect(22,cY,W-44,cH,3,3,'F');
    doc.setDrawColor(226,232,240); doc.setLineWidth(0.4); doc.roundedRect(22,cY,W-44,cH,3,3,'D');
    [
      {label:'HONORS / MENTION',value:cert.mention||'—',color:GOLD,x:cx-90},
      {label:'CUMULATIVE GPA',value:cert.gpa!=null?`${Number(cert.gpa).toFixed(2)} / ${(cert.maxGpa||4).toFixed(2)}`:'—',color:NAVY,x:cx-30},
      {label:'TOTAL CREDITS',value:cert.totalCredits?`${cert.totalCredits} Credits`:'—',color:DARK,x:cx+30},
      {label:'CLASS RANK',value:cert.classRank||'—',color:[22,163,74] as [number,number,number],x:cx+90},
    ].forEach(m=>{
      doc.setFont('Helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...GREY);
      doc.text(m.label,m.x,cY+9,{align:'center'});
      doc.setFontSize(10); doc.setTextColor(...m.color);
      doc.text(m.value,m.x,cY+20,{align:'center'});
    });

    if (cert.note) {
      doc.setFont('Helvetica','italic'); doc.setFontSize(8); doc.setTextColor(...GREY);
      doc.text(`Note: ${cert.note}`,cx,154,{align:'center'});
    }
    doc.setFont('Helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...GREY);
    doc.text(`Issued Date: ${cert.issueDate}   |   Serial No: ${cert.serialNumber}`,cx,cert.note?160:158,{align:'center'});

    const sY=175;
    doc.setDrawColor(148,163,184); doc.setLineWidth(0.4);
    doc.line(30,sY,95,sY);
    doc.setFont('Helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...DARK);
    doc.text('Academic Dean',62,sY+5,{align:'center'});
    doc.setFont('Helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...GREY);
    doc.text('AM Fofana High School',62,sY+10,{align:'center'});

    doc.setFillColor(254,249,231); doc.ellipse(cx,sY+3,13,13,'F');
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.7); doc.ellipse(cx,sY+3,13,13,'D');
    doc.setFont('Helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...GOLD);
    doc.text('OFFICIAL',cx,sY+1.5,{align:'center'});
    doc.text('SEAL',cx,sY+5,{align:'center'});

    doc.line(202,sY,267,sY);
    doc.setFont('Helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...DARK);
    doc.text('Principal / Director General',234,sY+5,{align:'center'});
    doc.setFont('Helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...GREY);
    doc.text('AM Fofana High School',234,sY+10,{align:'center'});

    if (qrData) doc.addImage(qrData,'PNG',W-38,sY-16,24,24);
    doc.setFillColor(241,245,249); doc.rect(10,196,277,6,'F');
    doc.setFont('Helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(148,163,184);
    doc.text(`Digital Fingerprint: ${cert.verificationHash}  |  Verification: ${verifyUrl}`,cx,199.5,{align:'center'});

  } else {
    // ── STANDARD CERTIFICATE ───────────────────────────────────────────────────
    doc.setDrawColor(...NAVY); doc.setLineWidth(2); doc.rect(8,8,281,194);
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.6); doc.rect(11,11,275,188);
    [[8,8],[281,8],[8,194],[281,194]].forEach(([x,y])=>{
      doc.setFillColor(...NAVY); doc.rect(x-1,y-1,10,10,'F');
    });

    doc.setFillColor(...NAVY); doc.rect(11,11,275,36,'F');
    doc.setFillColor(...GOLD); doc.rect(11,47,275,2,'F');
    const lx=20,ly=15,lsz=28;
    if (logoImg) doc.addImage(logoImg as any,'PNG',lx,ly,lsz,lsz);
    else {
      doc.setFillColor(255,255,255); doc.ellipse(lx+14,ly+14,12,12,'F');
      doc.setTextColor(...NAVY); doc.setFont('Helvetica','bold'); doc.setFontSize(12);
      doc.text('AMF',lx+14,ly+17,{align:'center'});
    }
    const tc=lx+lsz+(W-11-lx-lsz)/2;
    doc.setTextColor(255,255,255); doc.setFont('Helvetica','bold'); doc.setFontSize(15);
    doc.text('AMFOFANA HIGH SCHOOL',tc,23,{align:'center'});
    doc.setFont('Helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(200,210,240);
    doc.text('EXCELLENCE IN EDUCATION  ·  FUTURE LEADERS',tc,30,{align:'center'});
    doc.setFontSize(6); doc.setTextColor(160,180,220);
    doc.text('Accredited Academic Institution — Official Certificate',tc,37,{align:'center'});

    doc.setFont('Helvetica','bold'); doc.setFontSize(20); doc.setTextColor(...NAVY);
    doc.text(cert.certificateType.toUpperCase(),cx,62,{align:'center'});
    doc.setFont('Helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(...GREY);
    doc.text('THIS IS TO CERTIFY THAT',cx,73,{align:'center'});
    doc.setFont('Helvetica','bold'); doc.setFontSize(21); doc.setTextColor(...DARK);
    doc.text(cert.studentName.toUpperCase(),cx,87,{align:'center'});
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.5); doc.line(cx-60,91,cx+60,91);
    doc.setFont('Helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...GREY);
    doc.text(`ID: ${cert.studentUserId}${cert.className?' | Class: '+cert.className:''}`,cx,97,{align:'center'});
    doc.setFontSize(9.5); doc.setTextColor(71,85,105);
    doc.text('has successfully completed the prescribed curriculum and requirements for',cx,107,{align:'center'});
    doc.setFont('Helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...NAVY);
    doc.text(cert.programme,cx,119,{align:'center'});

    if (cert.mention) {
      doc.setFontSize(10); doc.setTextColor(...GOLD);
      doc.text(`Honors / Mention: ${cert.mention}`,cx,131,{align:'center'});
    }
    if (cert.note) {
      doc.setFont('Helvetica','italic'); doc.setFontSize(8.5); doc.setTextColor(...GREY);
      doc.text(`Note: ${cert.note}`,cx,140,{align:'center'});
    }
    doc.setFont('Helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...GREY);
    doc.text(`Issued Date: ${cert.issueDate}   |   Serial No: ${cert.serialNumber}`,cx,152,{align:'center'});

    const sy=170;
    doc.setDrawColor(148,163,184); doc.setLineWidth(0.4);
    doc.line(35,sy,100,sy);
    doc.setFont('Helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...DARK);
    doc.text('Academic Dean',67,sy+5,{align:'center'});
    doc.line(197,sy,262,sy);
    doc.text('Principal / Director General',229,sy+5,{align:'center'});
    if (qrData) doc.addImage(qrData,'PNG',cx-12,sy-10,24,24);

    doc.setFillColor(248,250,252); doc.rect(11,191,275,8,'F');
    doc.setFont('Helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(148,163,184);
    doc.text(`Reference: ${cert.verificationHash}  |  Online Verification: ${verifyUrl}`,cx,195.5,{align:'center'});
  }

  doc.save(`Certificate_${cert.serialNumber}.pdf`);
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function StatusBadge({ cert }: { cert: CertRecord }) {
  const isRevoked = String(cert.status || cert.certStatus || '').toLowerCase().includes('revoq') || String(cert.status || cert.certStatus || '').toLowerCase().includes('révoq');
  const displayStatus = isRevoked ? 'Revoked' : 'Valid';
  return (
    <Badge className={`text-[9px] font-black uppercase border-none px-2 py-0.5 ${isRevoked ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
      {isRevoked ? <XCircle size={9} className="mr-1 inline"/> : <CheckCircle2 size={9} className="mr-1 inline"/>}
      {displayStatus}
    </Badge>
  );
}

function TypeBadge({ type, isGrad }: { type: string; isGrad: boolean }) {
  return (
    <Badge className={`text-[9px] font-black uppercase border-none px-2 py-0.5 ${isGrad?'bg-amber-100 text-amber-700':'bg-blue-100 text-blue-700'}`}>
      {isGrad ? <GraduationCap size={9} className="mr-1 inline"/> : <FileText size={9} className="mr-1 inline"/>}
      {type}
    </Badge>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CertificatesPage() {
  // Data
  const [students,  setStudents]   = useState<StudentOpt[]>([]);
  const [certTypes, setCertTypes]  = useState<CertType[]>([]);
  const [mentions,  setMentions]   = useState<CertMention[]>([]);
  const [certs,     setCerts]      = useState<CertRecord[]>([]);
  const [loading,   setLoading]    = useState(true);
  const [generating,setGenerating] = useState(false);
  const [syncingGPA,setSyncingGPA] = useState(false);
  const [isFormOpen,setIsFormOpen] = useState(false);
  const [search,    setSearch]     = useState('');

  // Form state
  const [selStudentId, setSelStudentId] = useState('');
  const [certType,  setCertType]   = useState('');
  const [programme, setProgramme]  = useState('');
  const [mention,   setMention]    = useState('');
  const [note,      setNote]       = useState('');
  const [gpa,       setGpa]        = useState<number>(3.5);
  const [maxGpa,    setMaxGpa]     = useState<number>(4.0);
  const [credits,   setCredits]    = useState<number>(120);
  const [rank,      setRank]       = useState('');
  const [studentClassName, setStudentClassName] = useState('');
  const [academicSummaryInfo, setAcademicSummaryInfo] = useState<string | null>(null);

  const isGrad = certTypes.find(t => t.name === certType)?.isGraduation ?? false;
  const selStudent = useMemo(() => students.find(s => String(s.id) === selStudentId), [students, selStudentId]);

  // ── Load all data ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [stuRes, typeRes, mentRes, certRes] = await Promise.allSettled([
          api.get('/admin/users?role=STUDENT'),
          api.get('/admin/certificate-types'),
          api.get('/admin/certificate-mentions'),
          api.get('/admin/certificates'),
        ]);
        if (stuRes.status === 'fulfilled') {
          setStudents((stuRes.value.data || []).map((u: any) => ({
            id:        u.id,
            name:      u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username || `Student #${u.id}`,
            userId:    u.userId || u.username || String(u.id),
            className: u.enrolledClasses?.[0]?.name || u.className || '',
          })));
        }
        if (typeRes.status === 'fulfilled' && (typeRes.value.data || []).length > 0) {
          const types = typeRes.value.data as CertType[];
          setCertTypes(types);
          setCertType(types[0]?.name || '');
        }
        if (mentRes.status === 'fulfilled' && (mentRes.value.data || []).length > 0) {
          const ments = mentRes.value.data as CertMention[];
          setMentions(ments);
          setMention(ments[0]?.name || '');
        }
        if (certRes.status === 'fulfilled') {
          setCerts(certRes.value.data || []);
        }
      } catch {
        toast.error('Failed to load certificate registry data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Auto-fill programme when type changes
  useEffect(() => {
    const t = certTypes.find(t => t.name === certType);
    if (t?.defaultProgramme) setProgramme(t.defaultProgramme);
  }, [certType, certTypes]);

  // ── Auto-Sync Student Transcript GPA & Information ─────────────────────────
  const syncStudentAcademicData = useCallback(async (studentId: string, currentMentions: CertMention[]) => {
    if (!studentId) {
      setAcademicSummaryInfo(null);
      return;
    }
    setSyncingGPA(true);
    try {
      const res = await api.get(`/admin/transcripts/generate?studentId=${studentId}`);
      const data = res.data;

      if (data && data.summary) {
        const avgScore = Number(data.summary.weightedAverageScore || data.summary.averageScore || 0);
        const gpaValue = Number(data.summary.gpa || 0);
        const subjectsCount = data.summary.totalSubjectsCount || 0;
        const clsName = data.student?.classes?.[0] || '';

        if (clsName) {
          setStudentClassName(clsName);
        }

        let resolvedGPA = gpaValue > 0 ? gpaValue : (avgScore > 0 && avgScore <= 4 ? avgScore : (avgScore > 0 ? Math.round((avgScore / 25) * 100) / 100 : 3.5));
        let resolvedMax = 4.0;
        if (avgScore > 4 && avgScore <= 20) {
          resolvedGPA = avgScore;
          resolvedMax = 20;
        }

        setGpa(resolvedGPA);
        setMaxGpa(resolvedMax);
        if (subjectsCount > 0) {
          setCredits(subjectsCount * 15);
        }

        // Auto-select mention/honors
        const ratio = resolvedGPA / resolvedMax;
        let bestMention = '';
        if (ratio >= 0.9) {
          bestMention = currentMentions.find(m => m.name.toLowerCase().includes('summa') || m.name.toLowerCase().includes('highest'))?.name || 'Summa Cum Laude (Highest Honors)';
        } else if (ratio >= 0.8) {
          bestMention = currentMentions.find(m => m.name.toLowerCase().includes('magna') || m.name.toLowerCase().includes('high'))?.name || 'Magna Cum Laude (High Honors)';
        } else if (ratio >= 0.7) {
          bestMention = currentMentions.find(m => m.name.toLowerCase().includes('cum laude') || m.name.toLowerCase().includes('honors'))?.name || 'Cum Laude (Honors)';
        } else if (ratio >= 0.6) {
          bestMention = currentMentions.find(m => m.name.toLowerCase().includes('merit'))?.name || 'With Merit';
        } else {
          bestMention = currentMentions.find(m => m.name.toLowerCase().includes('pass'))?.name || 'Pass';
        }

        if (bestMention) {
          setMention(bestMention);
        }

        const infoText = `Transcript GPA synced: ${resolvedGPA.toFixed(2)} / ${resolvedMax.toFixed(1)} (${subjectsCount} courses)${clsName ? ' • Class: ' + clsName : ''}`;
        setAcademicSummaryInfo(infoText);
        toast.success(`Academic data synced automatically (${resolvedGPA.toFixed(2)}/${resolvedMax.toFixed(1)})`);
      } else {
        setAcademicSummaryInfo(null);
      }
    } catch {
      setAcademicSummaryInfo(null);
    } finally {
      setSyncingGPA(false);
    }
  }, []);

  const handleStudentChange = (studentId: string) => {
    setSelStudentId(studentId);
    const std = students.find(s => String(s.id) === studentId);
    if (std) {
      setStudentClassName(std.className || '');
    }
    syncStudentAcademicData(studentId, mentions);
  };

  const filteredCerts = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return certs;
    return certs.filter(c =>
      c.studentName.toLowerCase().includes(q) ||
      c.serialNumber.toLowerCase().includes(q) ||
      c.certificateType.toLowerCase().includes(q) ||
      c.studentUserId.toLowerCase().includes(q)
    );
  }, [certs, search]);

  const stats = useMemo(() => ({
    total:    certs.length,
    diplomas: certs.filter(c => certTypes.find(t => t.name===c.certificateType)?.isGraduation).length,
    simple:   certs.filter(c => !certTypes.find(t => t.name===c.certificateType)?.isGraduation).length,
    revoked:  certs.filter(c => String(c.status || c.certStatus || '').toLowerCase().includes('revoq')).length,
  }), [certs, certTypes]);

  // ── Issue certificate ──────────────────────────────────────────────────────
  const handleIssue = async () => {
    if (!selStudentId) { toast.error('Please select a student.'); return; }
    if (!certType)     { toast.error('Please choose a certificate type.'); return; }
    if (!programme.trim()) { toast.error('Please specify the programme or achievement.'); return; }

    const std = selStudent!;
    const effectiveClassName = studentClassName || std.className;

    const payload = {
      serialNumber:     mkSerial(),
      studentName:      std.name,
      studentUserId:    std.userId,
      certificateType:  certType,
      programme:        programme.trim(),
      issueDate:        new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      verificationHash: mkHash(),
      mention:          isGrad ? mention : undefined,
      gpa:              isGrad ? gpa     : undefined,
      maxGpa:           isGrad ? maxGpa  : undefined,
      totalCredits:     isGrad ? credits : undefined,
      classRank:        isGrad && rank.trim() ? rank.trim() : undefined,
      className:        effectiveClassName || undefined,
      note:             note.trim() || undefined,
      recipientUserId:  std.id,
    };

    setGenerating(true);
    try {
      const res = await api.post('/admin/certificates', payload);
      const saved = res.data as CertRecord;
      setCerts(prev => [saved, ...prev]);
      toast.success(`Certificate issued for ${std.name}`);
      setNote('');
      await buildCertPDF(saved, certTypes);
      toast.success('Official PDF downloaded successfully');
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Error generating certificate');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this certificate?')) return;
    try {
      await api.put(`/admin/certificates/${id}/revoke`);
      setCerts(prev => prev.map(c => c.id === id ? { ...c, status: 'Révoqué', certStatus: 'Revoque' } : c));
      toast.success('Certificate revoked');
    } catch { toast.error('Failed to revoke certificate'); }
  };

  const refresh = async () => {
    try {
      const res = await api.get('/admin/certificates');
      setCerts(res.data || []);
      toast.success('Data refreshed');
    } catch { toast.error('Failed to reload certificates'); }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-[clamp(1rem,2vw+1rem,2rem)] space-y-6 bg-slate-50/50 min-h-screen">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div initial={{ x:-20, opacity:0 }} animate={{ x:0, opacity:1 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[clamp(1.2rem,2vw+1rem,1.8rem)] font-black text-slate-900 tracking-tighter flex items-center gap-3 italic">
            CERTIFICATES REGISTRY <Award className="text-amber-500" size={22}/>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-0.5">
            {certTypes.length > 0
              ? `${certTypes.length} type${certTypes.length>1?'s':''} configured in Strapi`
              : 'Add certificate types in Strapi → Content-Manager → Type de Certificat'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200" onClick={refresh} title="Refresh">
            <RefreshCcw size={15}/>
          </Button>
          <Button onClick={() => setIsFormOpen(o => !o)} className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-10 px-5 font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-blue-100">
            {isFormOpen ? <Sliders size={14}/> : <Plus size={14}/>}
            {isFormOpen ? 'Hide Form' : 'Issue Certificate'}
          </Button>
        </div>
      </motion.div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <motion.div initial={{ y:10, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Issued', value:stats.total,    icon:<ClipboardList size={17}/>, bg:'bg-blue-50',    color:'text-blue-600' },
          { label:'Diplomas',     value:stats.diplomas, icon:<GraduationCap size={17}/>, bg:'bg-amber-50',   color:'text-amber-600' },
          { label:'Certificates', value:stats.simple,   icon:<FileText size={17}/>,      bg:'bg-emerald-50', color:'text-emerald-600' },
          { label:'Revoked',      value:stats.revoked,  icon:<XCircle size={17}/>,       bg:'bg-rose-50',    color:'text-rose-600' },
        ].map(s => (
          <Card key={s.label} className="border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>{s.icon}</div>
              <div>
                <p className="text-xl font-black text-slate-900">{loading ? '…' : s.value}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* ── Issue Form ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div key="form" initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.3 }} className="overflow-hidden">
            <Card className="border border-slate-100 shadow bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white py-4 px-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sliders size={13} className="text-amber-400"/> Issue New Official Academic Credential
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">

                {/* Row 1 — Student + Type + Programme */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Student */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                      <User size={11}/> Recipient Student
                      {syncingGPA && <Loader2 size={10} className="animate-spin text-blue-500 ml-1" />}
                    </Label>
                    <Select value={selStudentId} onValueChange={handleStudentChange}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-11">
                        <SelectValue placeholder={loading ? 'Loading students…' : 'Select a student…'} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl max-h-64">
                        {students.map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name} <span className="text-slate-400">({s.userId})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selStudent && (
                      <div className="space-y-1 mt-1">
                        <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={10}/> {selStudent.name}{studentClassName ? ` — ${studentClassName}` : (selStudent.className ? ` — ${selStudent.className}` : '')}
                        </p>
                        {academicSummaryInfo && (
                          <p className="text-[9px] text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg">
                            <Sparkles size={9}/> {academicSummaryInfo}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                      <FileText size={11}/> Certificate Type
                      {certTypes.length > 0
                        ? <span className="ml-1 text-[9px] text-emerald-500 font-bold normal-case">via Strapi</span>
                        : <span className="ml-1 text-[9px] text-rose-400 font-bold normal-case">No types found</span>
                      }
                    </Label>
                    {certTypes.length > 0 ? (
                      <Select value={certType} onValueChange={setCertType}>
                        <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-11"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                          {certTypes.map(t => (
                            <SelectItem key={t.id} value={t.name}>
                              {t.isGraduation ? '🎓 ' : '📄 '}{t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 h-11 px-4 bg-rose-50 rounded-xl border border-rose-100">
                        <p className="text-[11px] text-rose-500 font-bold">Add types via Strapi → Type de Certificat</p>
                      </div>
                    )}
                  </div>

                  {/* Programme */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5"><BookOpen size={11}/> Programme / Accomplishment</Label>
                    <Input value={programme} onChange={e => setProgramme(e.target.value)} className="rounded-xl bg-slate-50 border-slate-200 h-11 px-4" placeholder="Describe the curriculum or accomplishment…" />
                  </div>
                </div>

                {/* Row 2 — Graduation extras (conditional) */}
                {isGrad && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1 border-t border-slate-100">
                    {/* Mention */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                        <Award size={11}/> Honors / Distinction
                        {mentions.length > 0 && <span className="ml-1 text-[9px] text-emerald-500 font-bold normal-case">via Strapi</span>}
                      </Label>
                      {mentions.length > 0 ? (
                        <Select value={mention} onValueChange={setMention}>
                          <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-11"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl shadow-xl">
                            {mentions.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={mention} onChange={e => setMention(e.target.value)} className="rounded-xl bg-slate-50 border-slate-200 h-11 px-4" placeholder="e.g. Magna Cum Laude…" />
                      )}
                    </div>

                    {/* GPA */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                        <TrendingUp size={11}/> Cumulative GPA / Max
                        {syncingGPA && <span className="text-[9px] text-blue-500 font-normal">Auto-syncing…</span>}
                      </Label>
                      <div className="flex gap-2">
                        <Input type="number" step="0.01" min="0" max="20" value={gpa} onChange={e => setGpa(parseFloat(e.target.value)||0)} className="rounded-xl bg-slate-50 border-slate-200 h-11 px-4 font-mono" placeholder="3.80"/>
                        <Input type="number" step="0.01" value={maxGpa} onChange={e => setMaxGpa(parseFloat(e.target.value)||4.0)} className="rounded-xl bg-slate-50 border-slate-200 h-11 px-4 font-mono w-24" placeholder="4.0"/>
                      </div>
                    </div>

                    {/* Credits & Rank */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5"><Sparkles size={11}/> Credits &amp; Class Rank</Label>
                      <div className="flex gap-2">
                        <Input type="number" value={credits} onChange={e => setCredits(parseInt(e.target.value)||120)} className="rounded-xl bg-slate-50 border-slate-200 h-11 px-4 font-mono w-28" placeholder="120"/>
                        <Input value={rank} onChange={e => setRank(e.target.value)} className="rounded-xl bg-slate-50 border-slate-200 h-11 px-4" placeholder="e.g. Top 5%"/>
                      </div>
                    </div>
                  </div>
                )}

                {/* Row 3 — Note */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5"><MessageSquare size={11}/> Remarks / Additional Note <span className="font-normal text-slate-400 normal-case ml-1">(optional — will appear on official certificate)</span></Label>
                  <Textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="rounded-xl bg-slate-50 border-slate-200 min-h-[70px] px-4 py-3 text-sm resize-none"
                    placeholder="Additional official notes or commendations to be printed on certificate…"
                    maxLength={300}
                  />
                  {note && <p className="text-[10px] text-slate-400 text-right">{note.length}/300</p>}
                </div>

                <Separator className="my-1"/>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck size={11} className="text-emerald-500"/> Certificate stored in database and PDF generated with digital security seal
                  </p>
                  <Button
                    onClick={handleIssue}
                    disabled={generating || !selStudentId || !certType || !programme.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 px-8 font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-emerald-100 disabled:opacity-50"
                  >
                    {generating
                      ? <><Loader2 size={14} className="animate-spin"/> Generating…</>
                      : <><Printer size={14}/> Issue &amp; Download PDF</>
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Registry Table ──────────────────────────────────────────────────── */}
      <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.2 }}>
        <Card className="border border-slate-100 shadow bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-900 text-white py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Award size={13} className="text-amber-400"/> Issued Certificates Registry
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5"/>
              <Input
                placeholder="Search by student, serial, type…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-xl text-xs w-56"
              />
            </div>
          </CardHeader>

          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  {['Serial No','Recipient','Type & Programme','Honors / Note','Date','Status','Actions'].map(h => (
                    <TableHead key={h} className="font-black uppercase text-[9px] tracking-widest text-slate-400 whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {loading ? (
                    <TableRow key="loading">
                      <TableCell colSpan={7} className="text-center py-16">
                        <Loader2 size={24} className="animate-spin text-slate-300 mx-auto"/>
                      </TableCell>
                    </TableRow>
                  ) : filteredCerts.length === 0 ? (
                    <TableRow key="empty">
                      <TableCell colSpan={7} className="text-center py-16">
                        <Award size={36} className="text-slate-200 mx-auto mb-2"/>
                        <p className="text-xs font-black uppercase text-slate-400">No certificates issued yet</p>
                        <p className="text-[11px] text-slate-300 mt-1">Click &quot;Issue Certificate&quot; to generate an official document</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCerts.map(cert => {
                      const grad = certTypes.find(t => t.name === cert.certificateType)?.isGraduation ?? 
                        (cert.certificateType.toLowerCase().includes('diploma') || cert.certificateType.toLowerCase().includes('excellence'));
                      const isRevoked = String(cert.status || cert.certStatus || '').toLowerCase().includes('revoq');
                      return (
                        <motion.tr key={cert.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                          className="hover:bg-slate-50/80 transition-colors border-slate-50 group">
                          <TableCell>
                            <code className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-700 tracking-tight">{cert.serialNumber}</code>
                          </TableCell>
                          <TableCell>
                            <p className="font-bold text-slate-800 text-sm tracking-tight">{cert.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1"><Fingerprint size={9}/> {cert.studentUserId}</p>
                          </TableCell>
                          <TableCell>
                            <TypeBadge type={cert.certificateType} isGrad={grad}/>
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 max-w-[190px]">{cert.programme}</p>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              {cert.mention && <p className="text-[11px] font-black text-amber-600">{cert.mention}{cert.gpa != null ? ` — ${Number(cert.gpa).toFixed(2)}/${(cert.maxGpa||4).toFixed(1)}` : ''}</p>}
                              {cert.note    && <p className="text-[10px] text-slate-400 italic line-clamp-1 max-w-[160px]">{cert.note}</p>}
                              {!cert.mention && !cert.note && <span className="text-slate-300">—</span>}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-slate-600">{cert.issueDate}</TableCell>
                          <TableCell><StatusBadge cert={cert}/></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" title="Download PDF"
                                onClick={() => buildCertPDF(cert, certTypes).catch(() => toast.error('Error compiling PDF'))}>
                                <Printer size={14}/>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50" title="Verification Hash"
                                onClick={() => toast.info(`Hash: ${cert.verificationHash}`, { description: cert.serialNumber })}>
                                <QrCode size={14}/>
                              </Button>
                              {!isRevoked && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity" title="Revoke Certificate"
                                  onClick={() => handleRevoke(cert.id)}>
                                  <XCircle size={14}/>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {filteredCerts.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {filteredCerts.length} certificate{filteredCerts.length>1?'s':''} {search ? 'found' : 'total'}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                <ShieldCheck size={10} className="text-emerald-500"/> Cryptographic verification enabled
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
