'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus, Check, X, Download, DollarSign, Users, UserCheck, CreditCard, Clock, UserCircle2, Edit, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export default function StaffFinance() {
  const [role, setRole] = useState<string>('ACCOUNTANT');
  const [staff, setStaff] = useState<any[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<any[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-Select Checkboxes
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  const [selectedPayoutIds, setSelectedPayoutIds] = useState<number[]>([]);

  // Dialog States
  const [isSalaryOpen, setIsSalaryOpen] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectType, setRejectType] = useState<'RECORD' | 'DISBURSE'>('RECORD');
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Salary Record Form State (Create & Edit)
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [salaryMonth, setSalaryMonth] = useState<string>('June');
  const [salaryYear, setSalaryYear] = useState<number>(2026);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [allowances, setAllowances] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [salaryNotes, setSalaryNotes] = useState<string>('');

  // Salary Payout Form State (Disburse & Edit)
  const [editingPayout, setEditingPayout] = useState<any>(null);
  const [selectedRecordIdForPayout, setSelectedRecordIdForPayout] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<string>('BANK');
  const [payoutNotes, setPayoutNotes] = useState<string>('');

  // Safe Relational Unwrapping Helpers
  const getStaffData = (staffField: any) => {
    if (!staffField) return null;
    if (staffField.data) {
      return staffField.data.attributes || staffField.data;
    }
    return staffField.attributes || staffField;
  };

  const getRecordData = (recordField: any) => {
    if (!recordField) return null;
    if (recordField.data) {
      return recordField.data.attributes || recordField.data;
    }
    return recordField.attributes || recordField;
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [userRes, allUsersRes, recordRes, paymentRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/admin/users'), // fetches all roles
        api.get('/salary-records?populate[staff]=*&populate[submittedBy]=*&populate[approvedBy]=*'),
        api.get('/salary-payments?populate[salaryRecord]=*&populate[staff]=*')
      ]);

      setRole(userRes.data.role.replace('ROLE_', ''));
      
      // Filter drivers, workers, teachers, accountants
      const staffRoles = ['DRIVER', 'WORKER', 'TEACHER', 'ACCOUNTANT', 'ACCOUNTLEAD'];
      const filteredStaff = allUsersRes.data.filter((u: any) => staffRoles.includes(u.schoolRole)).map((u: any) => ({
        ...u,
        name: u.username || u.name
      }));
      setStaff(filteredStaff);

      setSalaryRecords(recordRes.data?.data || recordRes.data || []);
      setSalaryPayments(paymentRes.data?.data || paymentRes.data || []);
    } catch (e: any) {
      toast.error('Failed to sync staff payroll ledger');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const computedNetSalary = useMemo(() => {
    return Number(baseSalary) + Number(allowances) - Number(deductions);
  }, [baseSalary, allowances, deductions]);

  // Submit salary record / edit record
  const handleCreateOrEditSalaryRecord = async () => {
    if (!selectedStaffId) {
      toast.error('Please select a staff member');
      return;
    }
    if (Number(baseSalary) <= 0) {
      toast.error('Please specify a positive base salary');
      return;
    }

    const payload = {
      staff: Number(selectedStaffId),
      month: salaryMonth,
      year: Number(salaryYear),
      baseSalary: Number(baseSalary),
      allowances: Number(allowances),
      deductions: Number(deductions),
      netSalary: computedNetSalary,
      notes: salaryNotes
    };

    const tid = toast.loading(editingRecord ? 'Saving changes...' : 'Generating record...');
    try {
      if (editingRecord) {
        const docId = editingRecord.documentId || editingRecord.id;
        await api.put(`/salary-records/${docId}`, { data: payload });
        toast.success('Payroll statement updated successfully', { id: tid });
      } else {
        await api.post('/school-finance/salaries', {
          staffId: Number(selectedStaffId),
          month: salaryMonth,
          year: Number(salaryYear),
          baseSalary: Number(baseSalary),
          allowances: Number(allowances),
          deductions: Number(deductions),
          notes: salaryNotes
        });
        toast.success('Salary record generated in DRAFT state', { id: tid });
      }

      setIsSalaryOpen(false);
      setEditingRecord(null);
      setSelectedStaffId('');
      setBaseSalary(0);
      setAllowances(0);
      setDeductions(0);
      setSalaryNotes('');
      setSelectedRecordIds([]);
      fetchAllData();
    } catch (e: any) {
      toast.error('Payroll creation failed', { id: tid });
    }
  };

  // Trigger record edit modal
  const startEditRecord = (rec: any) => {
    const actual = rec.attributes || rec;
    const staffObj = getStaffData(actual.staff);
    setEditingRecord(rec);
    setSelectedStaffId(String(staffObj?.id || ''));
    setSalaryMonth(actual.month);
    setSalaryYear(Number(actual.year));
    setBaseSalary(Number(actual.baseSalary));
    setAllowances(Number(actual.allowances));
    setDeductions(Number(actual.deductions));
    setSalaryNotes(actual.notes || '');
    setIsSalaryOpen(true);
  };

  // Delete salary record
  const handleDeleteRecord = async (rec: any) => {
    if (!confirm('Are you sure you want to delete this salary record?')) return;
    const tid = toast.loading('Deleting salary record...');
    const docId = rec.documentId || rec.id;
    try {
      await api.delete(`/salary-records/${docId}`);
      toast.success('Salary record deleted successfully', { id: tid });
      setSelectedRecordIds(selectedRecordIds.filter(x => x !== rec.id));
      fetchAllData();
    } catch (e) {
      toast.error('Failed to delete salary record', { id: tid });
    }
  };

  // Submit selected records (Bulk submit)
  const handleSubmitSelectedRecords = async () => {
    const tid = toast.loading(`Submitting ${selectedRecordIds.length} salary records...`);
    try {
      await Promise.all(selectedRecordIds.map(id => {
        const r = salaryRecords.find(x => x.id === id);
        const docId = r?.documentId || id;
        return api.put(`/salary-records/${docId}`, { data: { status: 'SUBMITTED' } });
      }));
      toast.success('Salary records submitted successfully for review', { id: tid });
      setSelectedRecordIds([]);
      fetchAllData();
    } catch (e) {
      toast.error('Failed to submit selected records', { id: tid });
    }
  };

  // Submit payout disbursement / edit payout
  const handleCreateOrEditPayout = async () => {
    if (!selectedRecordIdForPayout) {
      toast.error('Please select an approved salary record');
      return;
    }
    if (Number(payoutAmount) <= 0) {
      toast.error('Please specify a positive payout amount');
      return;
    }

    const rec = salaryRecords.find(r => String(r.id) === selectedRecordIdForPayout);
    const record = rec?.attributes || rec;
    const staffObj = getStaffData(record?.staff);

    const payload = {
      salaryRecord: Number(selectedRecordIdForPayout),
      staff: staffObj?.id,
      amount: Number(payoutAmount),
      paymentMethod: payoutMethod,
      notes: payoutNotes
    };

    const tid = toast.loading(editingPayout ? 'Saving changes...' : 'Logging disbursement...');
    try {
      if (editingPayout) {
        const docId = editingPayout.documentId || editingPayout.id;
        await api.put(`/salary-payments/${docId}`, { data: payload });
        toast.success('Payout entry updated successfully', { id: tid });
      } else {
        await api.post('/school-finance/salary-payments', {
          salaryRecordId: Number(selectedRecordIdForPayout),
          staffId: staffObj?.id,
          amount: Number(payoutAmount),
          paymentMethod: payoutMethod,
          notes: payoutNotes
        });
        toast.success('Disbursement entry drafted successfully', { id: tid });
      }

      setIsPayoutOpen(false);
      setEditingPayout(null);
      setPayoutAmount(0);
      setPayoutNotes('');
      setSelectedRecordIdForPayout('');
      setSelectedPayoutIds([]);
      fetchAllData();
    } catch (e: any) {
      toast.error('Disbursement logging failed', { id: tid });
    }
  };

  // Trigger payout edit modal
  const startEditPayout = (pay: any) => {
    const actual = pay.attributes || pay;
    const recordObj = getRecordData(actual.salaryRecord);
    setEditingPayout(pay);
    setSelectedRecordIdForPayout(String(recordObj?.id || ''));
    setPayoutAmount(actual.amount);
    setPayoutMethod(actual.paymentMethod);
    setPayoutNotes(actual.notes || '');
    setIsPayoutOpen(true);
  };

  // Delete payout disbursement
  const handleDeletePayout = async (pay: any) => {
    if (!confirm('Are you sure you want to delete this disbursement log?')) return;
    const tid = toast.loading('Deleting disbursement log...');
    const docId = pay.documentId || pay.id;
    try {
      await api.delete(`/salary-payments/${docId}`);
      toast.success('Disbursement log deleted successfully', { id: tid });
      setSelectedPayoutIds(selectedPayoutIds.filter(x => x !== pay.id));
      fetchAllData();
    } catch (e) {
      toast.error('Failed to delete disbursement log', { id: tid });
    }
  };

  // Submit selected payouts (Bulk submit)
  const handleSubmitSelectedPayouts = async () => {
    const tid = toast.loading(`Submitting ${selectedPayoutIds.length} payouts...`);
    try {
      await Promise.all(selectedPayoutIds.map(id => {
        const p = salaryPayments.find(x => x.id === id);
        const docId = p?.documentId || id;
        return api.put(`/salary-payments/${docId}`, { data: { status: 'SUBMITTED' } });
      }));
      toast.success('Disbursements submitted successfully for approval', { id: tid });
      setSelectedPayoutIds([]);
      fetchAllData();
    } catch (e) {
      toast.error('Failed to submit selected payouts', { id: tid });
    }
  };

  // Approval Workflow
  const handleApprove = async (id: number, type: 'RECORD' | 'DISBURSE') => {
    const endpoint = type === 'RECORD'
      ? `/school-finance/salaries/${id}/approve`
      : `/school-finance/salary-payments/${id}/approve`;

    try {
      await api.put(endpoint);
      toast.success(`${type} record approved successfully`);
      fetchAllData();
    } catch (e: any) {
      toast.error('Approval failed');
    }
  };

  const handleOpenReject = (id: number, type: 'RECORD' | 'DISBURSE') => {
    setSelectedRecordId(id);
    setRejectType(type);
    setRejectionReason('');
    setIsRejectOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason) {
      toast.error('Please provide a reason');
      return;
    }
    const endpoint = rejectType === 'RECORD'
      ? `/school-finance/salaries/${selectedRecordId}/reject`
      : `/school-finance/salary-payments/${selectedRecordId}/reject`;

    try {
      await api.put(endpoint, { reason: rejectionReason });
      toast.success(`${rejectType} rejected successfully`);
      setIsRejectOpen(false);
      fetchAllData();
    } catch (e: any) {
      toast.error('Rejection submission failed');
    }
  };

  // Compile Payslip / Receipt PDF
  const downloadPayslip = async (paymentId: number) => {
    const tid = toast.loading('Compiling payslip data...');
    try {
      const pmRes = await api.get(`/salary-payments/${paymentId}?populate=*`);
      const paymentData = pmRes.data?.data?.attributes || pmRes.data?.data || pmRes.data;

      const rcRes = await api.get(`/receipts?filters[salaryPayment][id]=${paymentId}`);
      const receiptData = rcRes.data?.[0] || {};

      const staffObj = getStaffData(paymentData.staff);
      const salaryRecordObj = getRecordData(paymentData.salaryRecord);

      const doc = new jsPDF();
      
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);

      doc.setFillColor(15, 23, 42);
      doc.rect(5, 5, 200, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('AMFOFANA ACADEMY', 15, 23);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text('EMPLOYEE SALARY PAYSLIP STATEMENT', 15, 30);
      doc.text('Conakry, Guinea | accounts@amfofana.edu', 15, 36);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(20);
      doc.setFont('Helvetica', 'bold');
      doc.text('SALARY RECEIPT', 15, 70);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');

      doc.text(`Transaction Reference: ${paymentData.paymentNumber || 'N/A'}`, 15, 80);
      doc.text(`Payslip Number: ${receiptData.receiptNumber || 'REC-TEMP'}`, 15, 87);
      doc.text(`Disbursement Date: ${new Date(paymentData.paymentDate).toLocaleDateString()}`, 15, 94);

      doc.setFont('Helvetica', 'bold');
      doc.text('Employee Profile:', 120, 80);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Name: ${staffObj?.username || staffObj?.name || 'Staff'}`, 120, 87);
      doc.text(`Role: ${staffObj?.schoolRole || 'Staff'}`, 120, 94);
      doc.text(`Email: ${staffObj?.email || 'N/A'}`, 120, 101);

      const base = Number(salaryRecordObj?.baseSalary || 0);
      const allow = Number(salaryRecordObj?.allowances || 0);
      const ded = Number(salaryRecordObj?.deductions || 0);

      const rows = [
        ['Base Salary', `${base.toLocaleString()} GNF`],
        ['Allowances', `+ ${allow.toLocaleString()} GNF`],
        ['Deductions', `- ${ded.toLocaleString()} GNF`],
        ['Net Payout Disbursed', `${Number(paymentData.amount).toLocaleString()} GNF`]
      ];

      autoTable(doc, {
        startY: 115,
        head: [['Payroll Breakdown Component', 'Ledger Amount']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 160;

      const qrDataUrl = await QRCode.toDataURL(receiptData.qrCode || 'https://verify.amfofana.edu');
      doc.addImage(qrDataUrl, 'PNG', 140, finalY + 15, 45, 45);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Scan to verify digital payroll signature', 142, finalY + 63);

      doc.save(`Payslip-${paymentData.paymentNumber || 'GEN'}.pdf`);
      toast.success('PDF compiled safely', { id: tid });
    } catch (e: any) {
      toast.error('Payslip generation failed', { id: tid });
      console.error(e);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic uppercase">Staff Payroll & Finance</h1>
          <p className="text-sm text-slate-500 font-medium">Manage monthly salaries and payout disbursements for teachers, drivers, and workers</p>
        </div>

        <div className="flex items-center gap-3">
          {role === 'ACCOUNTANT' && selectedRecordIds.length > 0 && (
            <Button
              onClick={handleSubmitSelectedRecords}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs px-5 duration-300"
            >
              Submit Selected ({selectedRecordIds.length})
            </Button>
          )}

          <Button 
            onClick={() => { setEditingRecord(null); setIsSalaryOpen(true); }}
            className="flex items-center gap-2 px-5 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
          >
            <Plus className="w-4 h-4" /> Create Salary Record
          </Button>

          <Button 
            onClick={() => { setEditingPayout(null); setIsPayoutOpen(true); }}
            className="flex items-center gap-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
          >
            <DollarSign className="w-4 h-4" /> Disburse Payout
          </Button>
        </div>
      </div>

      {/* Main payroll record table */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-slate-50">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Employee Monthly Payroll Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                {role === 'ACCOUNTANT' && <TableHead className="w-12"></TableHead>}
                <TableHead className="font-bold text-slate-700">Record ID</TableHead>
                <TableHead className="font-bold text-slate-700">Employee Name</TableHead>
                <TableHead className="font-bold text-slate-700">Role</TableHead>
                <TableHead className="font-bold text-slate-700">Period</TableHead>
                <TableHead className="font-bold text-slate-700">Base Salary</TableHead>
                <TableHead className="font-bold text-slate-700">Net Salary</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryRecords.map((rec: any) => {
                const actual = rec.attributes || rec;
                const staffObj = getStaffData(actual.staff);
                const staffName = staffObj?.username || staffObj?.name || 'N/A';
                const staffRole = staffObj?.schoolRole || 'N/A';

                const isDraftOrRejected = actual.status === 'DRAFT' || actual.status === 'REJECTED';

                return (
                  <TableRow key={rec.id} className="hover:bg-slate-50/50 duration-200">
                    {role === 'ACCOUNTANT' && (
                      <TableCell className="w-12">
                        {isDraftOrRejected && (
                          <input
                            type="checkbox"
                            checked={selectedRecordIds.includes(rec.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRecordIds([...selectedRecordIds, rec.id]);
                              } else {
                                setSelectedRecordIds(selectedRecordIds.filter(id => id !== rec.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        )}
                      </TableCell>
                    )}

                    <TableCell className="font-bold text-slate-900">{actual.recordNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="w-5 h-5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{staffName}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider">{staffRole}</Badge></TableCell>
                    <TableCell className="font-medium text-slate-600">{actual.month} {actual.year}</TableCell>
                    <TableCell className="font-black text-slate-900">{Number(actual.baseSalary).toLocaleString()} GNF</TableCell>
                    <TableCell className="font-black text-blue-600">{Number(actual.netSalary).toLocaleString()} GNF</TableCell>
                    <TableCell>
                      <Badge className={
                        actual.status === 'PAID' ? 'bg-emerald-500 hover:bg-emerald-600' :
                        actual.status === 'PARTIALLY_PAID' ? 'bg-amber-500 hover:bg-amber-600' :
                        actual.status === 'APPROVED' ? 'bg-blue-600 hover:bg-blue-700' :
                        actual.status === 'REJECTED' ? 'bg-rose-500 hover:bg-rose-600' :
                        actual.status === 'DRAFT' ? 'bg-slate-300 text-slate-800 hover:bg-slate-400' :
                        'bg-slate-500 hover:bg-slate-600'
                      }>
                        {actual.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {role === 'ACCOUNTANT' && isDraftOrRejected && (
                          <>
                            <Button 
                              onClick={() => startEditRecord(rec)}
                              size="icon" 
                              variant="ghost"
                              className="rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100 text-amber-700 h-8 w-8"
                              title="Edit Record"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              onClick={() => handleDeleteRecord(rec)}
                              size="icon" 
                              variant="ghost"
                              className="rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100 text-rose-600 h-8 w-8"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}

                        {role === 'ACCOUNTLEAD' && actual.status === 'SUBMITTED' && (
                          <>
                            <Button 
                              onClick={() => handleApprove(rec.id, 'RECORD')}
                              size="icon" 
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl h-8 w-8"
                              title="Approve"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              onClick={() => handleOpenReject(rec.id, 'RECORD')}
                              size="icon" 
                              className="bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl h-8 w-8"
                              title="Reject"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}

                        {role === 'ACCOUNTLEAD' && actual.status === 'REJECTED' && (
                          <span className="text-[10px] text-rose-500 font-extrabold uppercase bg-rose-50 px-2.5 py-1 rounded-xl">Rejected - Waiting Revision</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Salary Disbursements Awaiting Approval / Rejected Logs for Reviewer */}
      {role === 'ACCOUNTLEAD' && (
        <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden mt-8">
          <CardHeader className="px-6 py-5 border-b border-slate-50">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Salary Payouts Pending Review / Revision
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payout Ref</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryPayments.filter((p: any) => {
                  const actual = p.attributes || p;
                  return actual.status === 'SUBMITTED' || actual.status === 'REJECTED';
                }).map((p: any) => {
                  const actual = p.attributes || p;
                  const staffObj = getStaffData(actual.staff);
                  const staffName = staffObj?.username || staffObj?.name || 'Staff';
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{actual.paymentNumber}</TableCell>
                      <TableCell>{staffName}</TableCell>
                      <TableCell>{actual.paymentMethod}</TableCell>
                      <TableCell className="font-black">{Number(actual.amount).toLocaleString()} GNF</TableCell>
                      <TableCell>
                        <Badge className={actual.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'}>
                          {actual.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {actual.status === 'SUBMITTED' ? (
                          <>
                            <Button 
                              onClick={() => handleApprove(p.id, 'DISBURSE')}
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"
                            >
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleOpenReject(p.id, 'DISBURSE')}
                              size="sm" 
                              className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs"
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className="text-[10px] text-rose-500 font-extrabold uppercase bg-rose-50 px-2.5 py-1 rounded-xl">Waiting Accountant Revision</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {salaryPayments.filter((p: any) => {
                  const actual = p.attributes || p;
                  return actual.status === 'SUBMITTED' || actual.status === 'REJECTED';
                }).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-6 text-slate-400 font-bold uppercase text-[10px]">No pending review payout logs found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Historical Payroll payouts / Accountant Drafts & Rejected */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden mt-8">
        <CardHeader className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Approved Payslips & Payout Ledger</CardTitle>
          {role === 'ACCOUNTANT' && selectedPayoutIds.length > 0 && (
            <Button
              onClick={handleSubmitSelectedPayouts}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] h-8 px-4"
            >
              Submit Selected ({selectedPayoutIds.length})
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {role === 'ACCOUNTANT' && <TableHead className="w-12"></TableHead>}
                <TableHead>Payout Reference</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount Disbursed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryPayments.map((p: any) => {
                const actual = p.attributes || p;
                const staffObj = getStaffData(actual.staff);
                const staffName = staffObj?.username || staffObj?.name || 'N/A';

                const isDraftOrRejected = actual.status === 'DRAFT' || actual.status === 'REJECTED';

                return (
                  <TableRow key={p.id}>
                    {role === 'ACCOUNTANT' && (
                      <TableCell className="w-12">
                        {isDraftOrRejected && (
                          <input
                            type="checkbox"
                            checked={selectedPayoutIds.includes(p.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPayoutIds([...selectedPayoutIds, p.id]);
                              } else {
                                setSelectedPayoutIds(selectedPayoutIds.filter(id => id !== p.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        )}
                      </TableCell>
                    )}

                    <TableCell className="font-bold">{actual.paymentNumber}</TableCell>
                    <TableCell>{staffName}</TableCell>
                    <TableCell>{actual.paymentMethod}</TableCell>
                    <TableCell className="font-black">{Number(actual.amount).toLocaleString()} GNF</TableCell>
                    <TableCell>
                      <Badge className={
                        actual.status === 'APPROVED' ? 'bg-emerald-500' :
                        actual.status === 'REJECTED' ? 'bg-rose-500' :
                        actual.status === 'DRAFT' ? 'bg-slate-300 text-slate-800' :
                        'bg-amber-500'
                      }>
                        {actual.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {role === 'ACCOUNTANT' && isDraftOrRejected && (
                          <>
                            <Button 
                              onClick={() => startEditPayout(p)}
                              size="icon" 
                              variant="ghost"
                              className="rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100 text-amber-700 h-8 w-8"
                              title="Edit Disbursement"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              onClick={() => handleDeletePayout(p)}
                              size="icon" 
                              variant="ghost"
                              className="rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100 text-rose-600 h-8 w-8"
                              title="Delete Disbursement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}

                        {actual.status === 'APPROVED' && (
                          <Button 
                            onClick={() => downloadPayslip(p.id)}
                            size="sm" 
                            variant="outline"
                            className="rounded-lg gap-2 text-xs"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF Payslip
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Salary Record Dialog */}
      <Dialog open={isSalaryOpen} onOpenChange={(open) => { setIsSalaryOpen(open); if (!open) setEditingRecord(null); }}>
        <DialogContent className="max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-wide">
              {editingRecord ? 'Edit Staff Salary Payroll Record' : 'Generate Staff Salary Statement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Select Employee</label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId} disabled={!!editingRecord}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                  <SelectValue placeholder="Search employee..." />
                </SelectTrigger>
                <SelectContent className="max-h-[250px] overflow-y-auto">
                  {staff.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.schoolRole})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Month</label>
                <Select value={salaryMonth} onValueChange={setSalaryMonth}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Year</label>
                <Input 
                  type="number" 
                  value={salaryYear} 
                  onChange={(e) => setSalaryYear(Number(e.target.value))}
                  className="h-11 rounded-xl bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Base Salary (GNF)</label>
              <Input 
                type="number" 
                value={baseSalary || ''} 
                onChange={(e) => setBaseSalary(Number(e.target.value))}
                className="h-11 rounded-xl bg-slate-50 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Allowances (GNF)</label>
                <Input 
                  type="number" 
                  value={allowances || ''} 
                  onChange={(e) => setAllowances(Number(e.target.value))}
                  className="h-11 rounded-xl bg-slate-50 text-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Deductions (GNF)</label>
                <Input 
                  type="number" 
                  value={deductions || ''} 
                  onChange={(e) => setDeductions(Number(e.target.value))}
                  className="h-11 rounded-xl bg-slate-50 text-rose-600"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Net Salary Payout</span>
              <span className="text-lg font-black text-blue-600">{computedNetSalary.toLocaleString()} GNF</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Payroll Notes</label>
              <Input 
                value={salaryNotes} 
                onChange={(e) => setSalaryNotes(e.target.value)}
                placeholder="Remarks, tax offsets, details..."
                className="h-11 rounded-xl bg-slate-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCreateOrEditSalaryRecord}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
            >
              {editingRecord ? 'Save Payroll Changes' : 'Generate Payroll Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disburse / Edit Payout Dialog */}
      <Dialog open={isPayoutOpen} onOpenChange={(open) => { setIsPayoutOpen(open); if (!open) setEditingPayout(null); }}>
        <DialogContent className="max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-wide">
              {editingPayout ? 'Edit Salary Payout Disbursement' : 'Record Salary Payout Disbursement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Select Approved Payroll Record</label>
              <Select value={selectedRecordIdForPayout} onValueChange={(val) => {
                setSelectedRecordIdForPayout(val);
                const rec = salaryRecords.find(r => String(r.id) === val);
                const actual = rec?.attributes || rec;
                setPayoutAmount(actual?.netSalary || 0);
              }} disabled={!!editingPayout}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                  <SelectValue placeholder="Select payroll record..." />
                </SelectTrigger>
                <SelectContent className="max-h-[250px] overflow-y-auto">
                  {salaryRecords.filter(r => {
                    const actual = r.attributes || r;
                    if (editingPayout) return true;
                    return actual.status === 'APPROVED' || actual.status === 'PARTIALLY_PAID';
                  }).map((rec: any) => {
                    const actual = rec.attributes || rec;
                    const staffObj = getStaffData(actual.staff);
                    const staffName = staffObj?.username || staffObj?.name || 'Staff';
                    const staffRole = staffObj?.schoolRole ? ` (${staffObj.schoolRole})` : '';
                    return (
                      <SelectItem key={rec.id} value={String(rec.id)}>
                        {actual.recordNumber} - {staffName}{staffRole} ({Number(actual.netSalary).toLocaleString()} GNF due)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Payout Disbursed Amount (GNF)</label>
              <Input 
                type="number" 
                value={payoutAmount || ''} 
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
                className="h-11 rounded-xl bg-slate-50 font-black text-lg text-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Disbursement Method</label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK">Bank Transfer</SelectItem>
                  <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                  <SelectItem value="CARD">Debit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Disbursement Notes</label>
              <Input 
                value={payoutNotes} 
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder="Reference numbers, description..."
                className="h-11 rounded-xl bg-slate-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCreateOrEditPayout}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
            >
              {editingPayout ? 'Save Payout changes' : 'Submit Payout Record Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-sm bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-md font-black uppercase tracking-wide text-rose-600">Reject Salary Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Rejection Reason</label>
              <Input 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify reason..."
                className="h-11 rounded-xl bg-slate-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleRejectSubmit}
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
