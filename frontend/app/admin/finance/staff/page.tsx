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
      const [userRes, allUsersRes, financeRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/admin/users'),
        api.get('/school-finance/data/staff')  // Custom flat endpoint
      ]);

      const rawRole: string = userRes.data.schoolRole || userRes.data.role || 'ACCOUNTANT';
      setRole(rawRole.replace('ROLE_', ''));

      // Filter staff roles
      const staffRoles = ['DRIVER', 'WORKER', 'TEACHER', 'ACCOUNTANT', 'ACCOUNTLEAD'];
      setStaff(
        (allUsersRes.data as any[]).filter((u: any) => staffRoles.includes(u.schoolRole)).map((u: any) => ({
          ...u,
          name: u.username || u.name
        }))
      );

      setSalaryRecords(financeRes.data?.salaryRecords || []);
      setSalaryPayments(financeRes.data?.salaryPayments || []);
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
        await api.put(`/school-finance/salaries/${editingRecord.id}/update`, {
          staffId: Number(selectedStaffId),
          month: salaryMonth,
          year: Number(salaryYear),
          baseSalary: Number(baseSalary),
          allowances: Number(allowances),
          deductions: Number(deductions),
          notes: salaryNotes
        });
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

  // Trigger record edit modal — uses flat fields from new endpoint
  const startEditRecord = (rec: any) => {
    setEditingRecord(rec);
    // Use the flat staffId field returned by the backend endpoint
    setSelectedStaffId(String(rec.staffId || ''));
    setSalaryMonth(rec.month);
    setSalaryYear(Number(rec.year));
    setBaseSalary(Number(rec.baseSalary));
    setAllowances(Number(rec.allowances));
    setDeductions(Number(rec.deductions));
    setSalaryNotes(rec.notes || '');
    setIsSalaryOpen(true);
  };

  // Delete salary record
  const handleDeleteRecord = async (rec: any) => {
    if (!confirm('Are you sure you want to delete this salary record?')) return;
    const tid = toast.loading('Deleting salary record...');
    try {
      await api.delete(`/school-finance/salaries/${rec.id}`);
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
        return api.put(`/school-finance/salaries/${id}/update`, { status: 'SUBMITTED' });
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
    // rec is now a flat object with staffId directly
    const staffId = rec?.staffId || null;


    const tid = toast.loading(editingPayout ? 'Saving changes...' : 'Logging disbursement...');
    try {
      if (editingPayout) {
        await api.put(`/school-finance/salary-payments/${editingPayout.id}/update`, {
          salaryRecordId: Number(selectedRecordIdForPayout),
          staffId: staffId,
          amount: Number(payoutAmount),
          paymentMethod: payoutMethod,
          notes: payoutNotes
        });
        toast.success('Payout entry updated successfully', { id: tid });
      } else {
        await api.post('/school-finance/salary-payments', {
          salaryRecordId: Number(selectedRecordIdForPayout),
          staffId: staffId,
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

  // Trigger payout edit modal — uses flat fields
  const startEditPayout = (pay: any) => {
    setEditingPayout(pay);
    setSelectedRecordIdForPayout(String(pay.salaryRecordId || ''));
    setPayoutAmount(pay.amount);
    setPayoutMethod(pay.paymentMethod);
    setPayoutNotes(pay.notes || '');
    setIsPayoutOpen(true);
  };

  // Delete payout disbursement
  const handleDeletePayout = async (pay: any) => {
    if (!confirm('Are you sure you want to delete this disbursement log?')) return;
    const tid = toast.loading('Deleting disbursement log...');
    try {
      await api.delete(`/school-finance/salary-payments/${pay.id}`);
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
        return api.put(`/school-finance/salary-payments/${id}/update`, { status: 'SUBMITTED' });
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

  const handleBulkApproveRecords = async () => {
    const tid = toast.loading(`Approving ${selectedRecordIds.length} salary records...`);
    try {
      await Promise.all(selectedRecordIds.map(id => {
        return api.put(`/school-finance/salaries/${id}/approve`);
      }));
      toast.success('Salary records approved successfully', { id: tid });
      setSelectedRecordIds([]);
      fetchAllData();
    } catch (e) {
      toast.error('Failed to approve selected records', { id: tid });
    }
  };

  const handleBulkApprovePayouts = async () => {
    const tid = toast.loading(`Approving ${selectedPayoutIds.length} payouts...`);
    try {
      await Promise.all(selectedPayoutIds.map(id => {
        return api.put(`/school-finance/salary-payments/${id}/approve`);
      }));
      toast.success('Payouts approved successfully', { id: tid });
      setSelectedPayoutIds([]);
      fetchAllData();
    } catch (e) {
      toast.error('Failed to approve selected payouts', { id: tid });
    }
  };

  // Compile Payslip / Receipt PDF — uses flat data from our state
  const downloadPayslip = async (paymentDocId: string, paymentId: number) => {
    const tid = toast.loading('Compiling payslip data...');
    try {
      // Fetch fresh data for PDF
      const pmRes = await api.get(
        `/salary-payments/${paymentDocId}?populate[staff][fields][0]=username&populate[staff][fields][1]=email&populate[staff][fields][2]=schoolRole&populate[salaryRecord][fields][0]=recordNumber&populate[salaryRecord][fields][1]=baseSalary&populate[salaryRecord][fields][2]=allowances&populate[salaryRecord][fields][3]=deductions`
      );
      const rawData = pmRes.data?.data || pmRes.data;
      const paymentData = rawData?.attributes || rawData;
      const numericId = rawData?.id || paymentId;

      const rcRes = await api.get(`/receipts?filters[salaryPayment][id]=${numericId}`);
      const receiptArr = rcRes.data?.data || rcRes.data || [];
      const receiptData = (Array.isArray(receiptArr) ? receiptArr[0] : receiptArr)?.attributes
        || (Array.isArray(receiptArr) ? receiptArr[0] : receiptArr)
        || {};

      // Use flat pay from state as fallback
      const flatPay = salaryPayments.find(p => p.id === paymentId) || salaryPayments.find((p: any) => p.documentId === paymentDocId);
      const staffName = paymentData?.staff?.username || flatPay?.staffName || 'Employee';
      const staffRole = paymentData?.staff?.schoolRole || flatPay?.staffRole || 'Staff';
      const staffEmail = paymentData?.staff?.email || flatPay?.staffEmail || 'N/A';
      const salRec = paymentData?.salaryRecord;
      const base = Number(salRec?.baseSalary || flatPay?.salaryRecordNetSalary || 0);
      const allow = Number(salRec?.allowances || 0);
      const ded = Number(salRec?.deductions || 0);

      const doc = new jsPDF();
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);

      doc.setFillColor(15, 23, 42);
      doc.rect(5, 5, 200, 45, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
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

      doc.text(`Transaction Reference: ${paymentData?.paymentNumber || flatPay?.paymentNumber || 'N/A'}`, 15, 80);
      doc.text(`Payslip Number: ${receiptData?.receiptNumber || 'REC-TEMP'}`, 15, 87);
      doc.text(`Disbursement Date: ${new Date(paymentData?.paymentDate || new Date()).toLocaleDateString()}`, 15, 94);

      doc.setFont('Helvetica', 'bold');
      doc.text('Employee Profile:', 120, 80);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Name: ${staffName}`, 120, 87);
      doc.text(`Role: ${staffRole}`, 120, 94);
      doc.text(`Email: ${staffEmail}`, 120, 101);

      autoTable(doc, {
        startY: 115,
        head: [['Payroll Breakdown Component', 'Ledger Amount']],
        body: [
          ['Base Salary', `${base.toLocaleString()} GNF`],
          ['Allowances', `+ ${allow.toLocaleString()} GNF`],
          ['Deductions', `- ${ded.toLocaleString()} GNF`],
          ['Net Payout Disbursed', `${Number(paymentData?.amount || flatPay?.amount || 0).toLocaleString()} GNF`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 160;
      const qrDataUrl = await QRCode.toDataURL(receiptData?.qrCode || 'https://verify.amfofana.edu');
      doc.addImage(qrDataUrl, 'PNG', 140, finalY + 15, 45, 45);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Scan to verify digital payroll signature', 142, finalY + 63);

      doc.save(`Payslip-${paymentData?.paymentNumber || flatPay?.paymentNumber || 'GEN'}.pdf`);
      toast.success('PDF compiled successfully', { id: tid });
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

          {role === 'ACCOUNTLEAD' && selectedRecordIds.length > 0 && (
            <Button
              onClick={handleBulkApproveRecords}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs px-5 duration-300"
            >
              Approve Selected ({selectedRecordIds.length})
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
                {(role === 'ACCOUNTANT' || role === 'ACCOUNTLEAD') && <TableHead className="w-12"></TableHead>}
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
                // Data is now flat from the backend endpoint
                const staffName = rec.staffName || 'Unknown';
                const staffRole = rec.staffRole || 'N/A';
                const isDraftOrRejected = rec.status === 'DRAFT' || rec.status === 'REJECTED';

                return (
                  <TableRow key={rec.id} className="hover:bg-slate-50/50 duration-200">
                    {(role === 'ACCOUNTANT' || role === 'ACCOUNTLEAD') && (
                      <TableCell className="w-12">
                        {((role === 'ACCOUNTANT' && isDraftOrRejected) || (role === 'ACCOUNTLEAD' && rec.status !== 'PAID')) && (
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

                    <TableCell className="font-bold text-slate-900">{rec.recordNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-800">{staffName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rec.staffUserId || '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider">{staffRole}</Badge></TableCell>
                    <TableCell className="font-medium text-slate-600">{rec.month} {rec.year}</TableCell>
                    <TableCell className="font-black text-slate-900">{Number(rec.baseSalary || 0).toLocaleString()} GNF</TableCell>
                    <TableCell className="font-black text-blue-600">{Number(rec.netSalary || 0).toLocaleString()} GNF</TableCell>
                    <TableCell>
                      <Badge className={
                        rec.status === 'PAID' ? 'bg-emerald-500 hover:bg-emerald-600' :
                        rec.status === 'PARTIALLY_PAID' ? 'bg-amber-500 hover:bg-amber-600' :
                        rec.status === 'APPROVED' ? 'bg-blue-600 hover:bg-blue-700' :
                        rec.status === 'REJECTED' ? 'bg-rose-500 hover:bg-rose-600' :
                        rec.status === 'DRAFT' ? 'bg-slate-300 text-slate-800 hover:bg-slate-400' :
                        'bg-slate-500 hover:bg-slate-600'
                      }>
                        {rec.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {((role === 'ACCOUNTANT' && isDraftOrRejected) || 
                          (role === 'ACCOUNTLEAD' && (isDraftOrRejected || rec.status === 'SUBMITTED' || rec.status === 'APPROVED'))) && (
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

                        {role === 'ACCOUNTLEAD' && (rec.status === 'SUBMITTED' || rec.status === 'DRAFT') && (
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
                  return p.status === 'SUBMITTED' || p.status === 'REJECTED';
                }).map((p: any) => {
                  const staffName = p.staffName || 'Staff';
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{p.paymentNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{staffName}</p>
                          <p className="text-[10px] text-slate-400">{p.staffUserId || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{p.paymentMethod}</TableCell>
                      <TableCell className="font-black">{Number(p.amount || 0).toLocaleString()} GNF</TableCell>
                      <TableCell>
                        <Badge className={p.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {p.status === 'SUBMITTED' ? (
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
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Historical Payroll payouts / Accountant Drafts & Rejected */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden mt-8">
        <CardHeader className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Approved Payslips & Payout Ledger</CardTitle>
          <div className="flex gap-2">
            {(role === 'ACCOUNTANT' || role === 'ACCOUNTLEAD') && selectedPayoutIds.length > 0 && (
              <Button
                onClick={handleSubmitSelectedPayouts}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] h-8 px-4"
              >
                Submit Selected ({selectedPayoutIds.length})
              </Button>
            )}
            {role === 'ACCOUNTLEAD' && selectedPayoutIds.length > 0 && (
              <Button
                onClick={handleBulkApprovePayouts}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] h-8 px-4"
              >
                Approve Selected ({selectedPayoutIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {(role === 'ACCOUNTANT' || role === 'ACCOUNTLEAD') && <TableHead className="w-12"></TableHead>}
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
                const staffName = p.staffName || 'N/A';
                const isDraftOrRejected = p.status === 'DRAFT' || p.status === 'REJECTED';

                return (
                  <TableRow key={p.id}>
                    {(role === 'ACCOUNTANT' || role === 'ACCOUNTLEAD') && (
                      <TableCell className="w-12">
                        {((role === 'ACCOUNTANT' && isDraftOrRejected) || (role === 'ACCOUNTLEAD' && (isDraftOrRejected || p.status === 'SUBMITTED'))) && (
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

                    <TableCell className="font-bold">{p.paymentNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{staffName}</p>
                        <p className="text-[10px] text-slate-400">{p.staffUserId || '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{p.paymentMethod}</TableCell>
                    <TableCell className="font-black">{Number(p.amount || 0).toLocaleString()} GNF</TableCell>
                    <TableCell>
                      <Badge className={
                        p.status === 'APPROVED' ? 'bg-emerald-500' :
                        p.status === 'REJECTED' ? 'bg-rose-500' :
                        p.status === 'DRAFT' ? 'bg-slate-300 text-slate-800' :
                        'bg-amber-500'
                      }>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {((role === 'ACCOUNTANT' && isDraftOrRejected) || 
                          (role === 'ACCOUNTLEAD' && (isDraftOrRejected || p.status === 'SUBMITTED' || p.status === 'APPROVED'))) && (
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

                        {p.status === 'APPROVED' && (
                          <Button 
                            onClick={() => downloadPayslip(p.documentId || String(p.id), p.id)}
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
              {/* Dropdown NOT disabled when editing so user can correct the staff member */}
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
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
                    if (editingPayout) return true;
                    return r.status === 'APPROVED' || r.status === 'PARTIALLY_PAID';
                  }).map((rec: any) => {
                    const staffName = rec.staffName || 'Staff';
                    const staffRoleLabel = rec.staffRole ? ` (${rec.staffRole})` : '';
                    return (
                      <SelectItem key={rec.id} value={String(rec.id)}>
                        {rec.recordNumber} - {staffName}{staffRoleLabel} ({Number(rec.netSalary || 0).toLocaleString()} GNF due)
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
