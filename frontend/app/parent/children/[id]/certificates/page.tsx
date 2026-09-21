/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Award, Printer, QrCode, Loader2, ShieldCheck, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buildCertPDF, type CertRecord } from '@/app/admin/certificates/page';

function StatusBadge({ cert }: { cert: CertRecord }) {
  const isRevoked = String(cert.status || cert.certStatus || '').toLowerCase().includes('revoq') || String(cert.status || cert.certStatus || '').toLowerCase().includes('révoq');
  const displayStatus = isRevoked ? 'Revoked' : 'Valid';
  return (
    <Badge className={`text-[9px] font-black uppercase border-none px-2 py-0.5 ${isRevoked ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
      {isRevoked ? <XCircle size={9} className="mr-1 inline" /> : <CheckCircle2 size={9} className="mr-1 inline" />}
      {displayStatus}
    </Badge>
  );
}

export default function ChildCertificatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = React.use(params);
  const [certs, setCerts] = useState<CertRecord[]>([]);
  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let stuData: any = null;
        try {
          const stuRes = await api.get(`/parent/children/${studentId}`);
          stuData = stuRes.data;
          setStudent(stuData);
        } catch (e) {
          console.error('Failed to load child profile:', e);
        }

        const targetId = Number(studentId);
        const targetUserId = (stuData?.userId || '').toLowerCase().trim();
        const targetUsername = (stuData?.username || '').toLowerCase().trim();
        const targetFullName = (stuData?.firstName && stuData?.lastName)
          ? `${stuData.firstName} ${stuData.lastName}`.toLowerCase().trim()
          : '';

        let loadedCerts: CertRecord[] = [];
        try {
          const certRes = await api.get(`/parent/children/${studentId}/certificates`);
          if (Array.isArray(certRes.data) && certRes.data.length > 0) {
            loadedCerts = certRes.data;
          }
        } catch (e) {
          console.log('Child specific certificates route unavailable, falling back to /my/certificates');
        }

        if (loadedCerts.length === 0) {
          try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') || '' : '';
            const myRes = await api.get('/my/certificates', { headers: { Authorization: `Bearer ${token}` } });
            const allMyCerts = myRes.data || [];

            loadedCerts = allMyCerts.filter((c: any) => {
              const rId = c.recipientUser?.id || (c.recipientUser && typeof c.recipientUser === 'object' ? c.recipientUser.id : Number(c.recipientUser));
              const cUserId = (c.studentUserId || '').toLowerCase().trim();
              const cName = (c.studentName || '').toLowerCase().trim();

              const idMatch = rId && Number(rId) === targetId;
              const uidMatch = targetUserId && cUserId && (cUserId === targetUserId || cUserId.includes(targetUserId));
              const nameMatch = (targetFullName && cName && (cName.includes(targetFullName) || targetFullName.includes(cName))) ||
                                (targetUsername && cName && (cName.includes(targetUsername) || targetUsername.includes(cName)));

              return idMatch || uidMatch || nameMatch;
            });
          } catch (err) {
            console.error('Failed to load /my/certificates fallback:', err);
          }
        }

        setCerts(loadedCerts);
      } catch {
        toast.error('Unable to load certificates');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const studentName = student
    ? (student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : student.username)
    : `Student #${studentId}`;

  const validCount = certs.filter(c => !String(c.status || c.certStatus || '').toLowerCase().includes('revoq')).length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href="/parent" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/parent/children" className="hover:text-primary transition-colors">My Children</Link>
          <span>/</span>
          <Link href={`/parent/children/${studentId}`} className="hover:text-primary transition-colors">{studentName}</Link>
          <span>/</span>
          <span className="text-slate-700 font-bold">Certificates</span>
        </div>
        <Link href={`/parent/children/${studentId}`}>
          <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-500 hover:text-slate-900 gap-1.5 rounded-xl">
            <ArrowLeft size={13} /> Back to Profile
          </Button>
        </Link>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
          ACADEMIC CREDENTIALS &amp; CERTIFICATES <Award className="text-amber-500" size={24} />
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1">
          Official academic diplomas and certificates issued to <span className="font-bold text-slate-800">{studentName}</span> by AMFOFANA High School
        </p>
      </motion.div>

      {/* Summary */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total Issued', value: certs.length, bg: 'bg-blue-50', color: 'text-blue-600', icon: <Award size={16}/> },
          { label: 'Valid', value: validCount, bg: 'bg-emerald-50', color: 'text-emerald-600', icon: <CheckCircle2 size={16}/> },
        ].map(s => (
          <Card key={s.label} className="border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>{s.icon}</div>
              <div>
                <p className="text-xl font-black text-slate-900">{loading ? '…' : s.value}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Certificates Table */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card className="border border-slate-100 shadow bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-900 text-white py-4 px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Award size={13} className="text-amber-400"/> Official Student Credentials
            </CardTitle>
          </CardHeader>
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  {['Serial No', 'Type & Curriculum', 'Honors / GPA', 'Issue Date', 'Status', 'PDF'].map(h => (
                    <TableHead key={h} className="font-black uppercase text-[9px] tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {loading ? (
                    <TableRow key="loading">
                      <TableCell colSpan={6} className="text-center py-16">
                        <Loader2 size={24} className="animate-spin text-slate-300 mx-auto"/>
                      </TableCell>
                    </TableRow>
                  ) : certs.length === 0 ? (
                    <TableRow key="empty">
                      <TableCell colSpan={6} className="text-center py-16">
                        <Award size={36} className="text-slate-200 mx-auto mb-2"/>
                        <p className="text-xs font-black uppercase text-slate-400">No certificates available</p>
                        <p className="text-[11px] text-slate-300 mt-1">Official certificates and diplomas will appear here once issued</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    certs.map(cert => (
                      <motion.tr key={cert.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/80 border-slate-50">
                        <TableCell>
                          <code className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-700">{cert.serialNumber}</code>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[9px] font-black uppercase border-none px-2 py-0.5 mb-1 ${cert.certificateType.toLowerCase().includes('diploma') || cert.certificateType.toLowerCase().includes('excellence') ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {cert.certificateType}
                          </Badge>
                          <p className="text-[10px] text-slate-500 line-clamp-1 max-w-[200px]">{cert.programme}</p>
                        </TableCell>
                        <TableCell>
                          {cert.mention ? (
                            <div>
                              <span className="text-[11px] font-black text-amber-600 block">{cert.mention}</span>
                              {cert.gpa != null && <span className="text-[10px] text-emerald-600 font-mono">{Number(cert.gpa).toFixed(2)}/{(cert.maxGpa || 4).toFixed(1)}</span>}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                          {cert.note && <p className="text-[9px] text-slate-400 italic line-clamp-1 mt-0.5">{cert.note}</p>}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-slate-600">{cert.issueDate}</TableCell>
                        <TableCell>
                          <StatusBadge cert={cert} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" title="Download Official PDF"
                              onClick={() => buildCertPDF(cert, []).catch(() => toast.error('PDF error'))}>
                              <Printer size={14}/>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50" title="Verification Hash"
                              onClick={() => toast.info(`Verification Hash: ${cert.verificationHash}`, { description: cert.serialNumber })}>
                              <QrCode size={14}/>
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
          {certs.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-1.5">
              <ShieldCheck size={10} className="text-emerald-500"/>
              <p className="text-[10px] text-slate-400 font-bold">Cryptographic verification enabled — amfofana.edu.gn</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
