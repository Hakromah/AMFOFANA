'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search, Plus, Check, X, FileText, Download, Printer, Edit, Trash2,
  DollarSign, Landmark, Filter, CheckCircle2, ShieldAlert, CreditCard, ChevronRight, UserCircle2, Clock
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

export default function StudentFinance() {
  const [role, setRole] = useState<string>('ACCOUNTANT');
  const [students, setStudents] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Multi-Select Checkboxes
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<number[]>([]);

  // Dialog States
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectType, setRejectType] = useState<'INVOICE' | 'PAYMENT'>('INVOICE');
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Invoice Form State (Create & Edit)
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [invoiceMonth, setInvoiceMonth] = useState<string>('June');
  const [invoiceYear, setInvoiceYear] = useState<number>(2026);
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');
  const [chargeItems, setChargeItems] = useState<any[]>([
    { description: 'Tuition Fee', amount: 500000, category: 'TUITION' }
  ]);

  // Payment Form State (Receive & Edit)
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('MOBILE_MONEY');
  const [paymentCategory, setPaymentCategory] = useState<string>('TUITION');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Safe Relational Unwrapping Helpers
  const getStudentData = (studentField: any) => {
    if (!studentField) return null;
    if (studentField.data) {
      return studentField.data.attributes || studentField.data;
    }
    return studentField.attributes || studentField;
  };

  const getInvoiceData = (invoiceField: any) => {
    if (!invoiceField) return null;
    if (invoiceField.data) {
      return invoiceField.data.attributes || invoiceField.data;
    }
    return invoiceField.attributes || invoiceField;
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [userRes, studentRes, classRes, invoiceRes, paymentRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/admin/users?role=STUDENT'),
        api.get('/admin/classes'),
        api.get('/student-invoices?populate[student]=*&populate[submittedBy]=*&populate[approvedBy]=*'),
        api.get('/student-payments?populate[invoice]=*&populate[student]=*')
      ]);

      setRole(userRes.data.role.replace('ROLE_', ''));
      setStudents(studentRes.data.map((s: any) => ({
        ...s,
        name: s.username || s.name
      })));
      setClasses(classRes.data);
      setInvoices(invoiceRes.data?.data || invoiceRes.data || []);
      setPayments(paymentRes.data?.data || paymentRes.data || []);
    } catch (e: any) {
      toast.error('Failed to sync database finance ledger');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered lists
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv: any) => {
      const actualInv = inv.attributes || inv;
      const studentObj = getStudentData(actualInv.student);
      const studentName = studentObj?.username || studentObj?.name || '';
      const invoiceNum = actualInv.invoiceNumber || '';
      const matchesSearch = studentName.toLowerCase().includes(search.toLowerCase()) || invoiceNum.toLowerCase().includes(search.toLowerCase());
      
      const matchesClass = classFilter === 'ALL' || studentObj?.enrolledClasses?.some((c: any) => String(c.id) === classFilter);
      const matchesStatus = statusFilter === 'ALL' || actualInv.status === statusFilter;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [invoices, search, classFilter, statusFilter]);

  // Invoice creation / edit submit
  const handleCreateOrEditInvoice = async () => {
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }
    const subtotal = chargeItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    if (subtotal <= 0) {
      toast.error('Breakdown amounts must be greater than 0');
      return;
    }

    const payload = {
      student: Number(selectedStudentId),
      month: invoiceMonth,
      year: Number(invoiceYear),
      notes: invoiceNotes,
      items: chargeItems,
      subtotal,
      remainingBalance: subtotal - Number(editingInvoice?.attributes?.totalPaid || editingInvoice?.totalPaid || 0)
    };

    const tid = toast.loading(editingInvoice ? 'Saving changes...' : 'Generating invoice...');
    try {
      if (editingInvoice) {
        // Standard REST PUT in Strapi v5 requires the documentId
        const docId = editingInvoice.documentId || editingInvoice.id;
        await api.put(`/student-invoices/${docId}`, { data: payload });
        toast.success('Invoicing updated successfully', { id: tid });
      } else {
        // Create new Draft Invoice
        await api.post('/school-finance/invoices', {
          studentId: Number(selectedStudentId),
          month: invoiceMonth,
          year: Number(invoiceYear),
          notes: invoiceNotes,
          items: chargeItems,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0]
        });
        toast.success('Invoice drafted successfully', { id: tid });
      }

      setIsInvoiceOpen(false);
      setEditingInvoice(null);
      setSelectedStudentId('');
      setInvoiceNotes('');
      setChargeItems([{ description: 'Tuition Fee', amount: 500000, category: 'TUITION' }]);
      setSelectedInvoiceIds([]);
      fetchAllData();
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Invoice operations failed', { id: tid });
    }
  };

  // Trigger invoice edit modal
  const startEditInvoice = (inv: any) => {
    const actual = inv.attributes || inv;
    const studentObj = getStudentData(actual.student);
    setEditingInvoice(inv);
    setSelectedStudentId(String(studentObj?.id || ''));
    setInvoiceMonth(actual.month);
    setInvoiceYear(Number(actual.year));
    setInvoiceNotes(actual.notes || '');
    setChargeItems(actual.items || [{ description: 'Tuition Fee', amount: 500000, category: 'TUITION' }]);
    setIsInvoiceOpen(true);
  };

  // Delete invoice handler
  const handleDeleteInvoice = async (inv: any) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    const tid = toast.loading('Deleting invoice...');
    const docId = inv.documentId || inv.id;
    try {
      await api.delete(`/student-invoices/${docId}`);
      toast.success('Invoice deleted successfully', { id: tid });
      setSelectedInvoiceIds(selectedInvoiceIds.filter(x => x !== inv.id));
      fetchAllData();
    } catch (e) {
      toast.error('Failed to delete invoice', { id: tid });
    }
  };

  // Submit selected invoices (Bulk submit)
  const handleSubmitSelectedInvoices = async () => {
    const tid = toast.loading(`Submitting ${selectedInvoiceIds.length} invoices...`);
    try {
      await Promise.all(selectedInvoiceIds.map(id => {
        const inv = invoices.find(i => i.id === id);
        const docId = inv?.documentId || id;
        return api.put(`/student-invoices/${docId}`, { data: { status: 'SUBMITTED' } });
      }));
      toast.success('Invoices submitted successfully to Account Lead', { id: tid });
      setSelectedInvoiceIds([]);
      fetchAllData();
    } catch (e) {
      toast.error('Failed to submit selected invoices', { id: tid });
    }
  };

  // Payment receipt / edit submission
  const handleCreateOrEditPayment = async () => {
    if (!selectedInvoiceId) {
      toast.error('Please select an invoice');
      return;
    }
    if (Number(paymentAmount) <= 0) {
      toast.error('Please specify a positive payment amount');
      return;
    }

    const inv = invoices.find(i => String(i.id) === selectedInvoiceId);
    const invoice = inv?.attributes || inv;
    const studentObj = getStudentData(invoice?.student);

    const payload = {
      invoice: Number(selectedInvoiceId),
      student: studentObj?.id,
      amount: Number(paymentAmount),
      paymentMethod,
      paymentCategory,
      notes: paymentNotes
    };

    const tid = toast.loading(editingPayment ? 'Saving changes...' : 'Logging payment collection...');
    try {
      if (editingPayment) {
        const docId = editingPayment.documentId || editingPayment.id;
        await api.put(`/student-payments/${docId}`, { data: payload });
        toast.success('Payment log updated successfully', { id: tid });
      } else {
        await api.post('/school-finance/payments', {
          invoiceId: Number(selectedInvoiceId),
          studentId: studentObj?.id,
          amount: Number(paymentAmount),
          paymentMethod,
          paymentCategory,
          notes: paymentNotes
        });
        toast.success('Payment logged successfully in DRAFT state', { id: tid });
      }

      setIsPaymentOpen(false);
      setEditingPayment(null);
      setPaymentAmount(0);
      setPaymentNotes('');
      setSelectedInvoiceId('');
      setSelectedPaymentIds([]);
      fetchAllData();
    } catch (e: any) {
      toast.error('Collection log failed', { id: tid });
    }
  };

  // Trigger payment edit modal
  const startEditPayment = (pay: any) => {
    const actual = pay.attributes || pay;
    const invoiceObj = getInvoiceData(actual.invoice);
    setEditingPayment(pay);
    setSelectedInvoiceId(String(invoiceObj?.id || ''));
    setPaymentAmount(actual.amount);
    setPaymentMethod(actual.paymentMethod);
    setPaymentCategory(actual.paymentCategory);
    setPaymentNotes(actual.notes || '');
    setIsPaymentOpen(true);
  };

  // Delete payment handler
  const handleDeletePayment = async (pay: any) => {
    if (!confirm('Are you sure you want to delete this payment log?')) return;
    const tid = toast.loading('Deleting payment collection log...');
    const docId = pay.documentId || pay.id;
    try {
      await api.delete(`/student-payments/${docId}`);
      toast.success('Payment log deleted successfully', { id: tid });
      setSelectedPaymentIds(selectedPaymentIds.filter(x => x !== pay.id));
      fetchAllData();
    } catch (e) {
      toast.error('Failed to delete payment log', { id: tid });
    }
  };

  // Submit selected payments (Bulk submit)
  const handleSubmitSelectedPayments = async () => {
    const tid = toast.loading(`Submitting ${selectedPaymentIds.length} payments...`);
    try {
      await Promise.all(selectedPaymentIds.map(id => {
        const pay = payments.find(p => p.id === id);
        const docId = pay?.documentId || id;
        return api.put(`/student-payments/${docId}`, { data: { status: 'SUBMITTED' } });
      }));
      toast.success('Payments submitted successfully for approval', { id: tid });
      setSelectedPaymentIds([]);
      fetchAllData();
    } catch (e) {
      toast.error('Failed to submit selected payments', { id: tid });
    }
  };

  // Record Approval Workflow
  const handleApprove = async (id: number, type: 'INVOICE' | 'PAYMENT') => {
    const endpoint = type === 'INVOICE' 
      ? `/school-finance/invoices/${id}/approve` 
      : `/school-finance/payments/${id}/approve`;

    try {
      await api.put(endpoint);
      toast.success(`${type} record approved successfully`);
      fetchAllData();
    } catch (e: any) {
      toast.error('Approval failed');
    }
  };

  const handleOpenReject = (id: number, type: 'INVOICE' | 'PAYMENT') => {
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
    const endpoint = rejectType === 'INVOICE'
      ? `/school-finance/invoices/${selectedRecordId}/reject`
      : `/school-finance/payments/${selectedRecordId}/reject`;

    try {
      await api.put(endpoint, { reason: rejectionReason });
      toast.success(`${rejectType} rejected successfully`);
      setIsRejectOpen(false);
      fetchAllData();
    } catch (e: any) {
      toast.error('Rejection submission failed');
    }
  };

  // Professional PDF printable receipt generator
  const downloadReceipt = async (paymentId: number) => {
    const tid = toast.loading('Compiling receipt data...');
    try {
      const pmRes = await api.get(`/student-payments/${paymentId}?populate=*`);
      const paymentData = pmRes.data?.data?.attributes || pmRes.data?.data || pmRes.data;
      
      const rcRes = await api.get(`/receipts?filters[studentPayment][id]=${paymentId}`);
      const receiptData = rcRes.data?.[0] || {};

      const studentObj = getStudentData(paymentData.student);
      const invoiceObj = getInvoiceData(paymentData.invoice);

      const doc = new jsPDF();
      
      doc.setDrawColor(59, 130, 246);
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
      doc.text('ENTERPRISE FINANCIAL LEDGER RECEIPT', 15, 30);
      doc.text('Conakry, Guinea | billing@amfofana.edu', 15, 36);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(20);
      doc.setFont('Helvetica', 'bold');
      doc.text('PAYMENT RECEIPT', 15, 70);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');

      doc.text(`Receipt Number: ${receiptData.receiptNumber || 'REC-TEMP'}`, 15, 80);
      doc.text(`Invoice Ref: ${invoiceObj?.invoiceNumber || 'N/A'}`, 15, 87);
      doc.text(`Payment Date: ${new Date(paymentData.paymentDate).toLocaleDateString()}`, 15, 94);

      doc.setFont('Helvetica', 'bold');
      doc.text('Billed Student Profile:', 120, 80);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Name: ${studentObj?.username || studentObj?.name || 'Student'}`, 120, 87);
      doc.text(`ID: ${studentObj?.userId || 'N/A'}`, 120, 94);
      doc.text(`Email: ${studentObj?.email || 'N/A'}`, 120, 101);

      const tableRows = [[
        paymentData.paymentCategory || 'Fee',
        paymentData.paymentMethod || 'Cash',
        paymentData.notes || 'payout received',
        `${Number(paymentData.amount).toLocaleString()} GNF`
      ]];

      autoTable(doc, {
        startY: 115,
        head: [['Category', 'Method', 'Description', 'Amount Paid']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        styles: { fontSize: 10 }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 140;
      doc.setFont('Helvetica', 'bold');
      doc.text('Ledger Status:', 15, finalY + 20);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Total Amount Collected: ${Number(paymentData.amount).toLocaleString()} GNF`, 15, finalY + 28);
      doc.text(`Remaining Invoice Balance: ${Number(invoiceObj?.remainingBalance || 0).toLocaleString()} GNF`, 15, finalY + 35);

      const qrDataUrl = await QRCode.toDataURL(receiptData.qrCode || 'https://verify.amfofana.edu');
      doc.addImage(qrDataUrl, 'PNG', 140, finalY + 15, 45, 45);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Scan for official digital verification', 142, finalY + 63);

      doc.save(`Receipt-${paymentData.paymentNumber || 'GEN'}.pdf`);
      toast.success('PDF compiled safely', { id: tid });
    } catch (e: any) {
      toast.error('PDF generation failed', { id: tid });
      console.error(e);
    }
  };

  // Compile detailed statement
  const downloadStatement = async (studentId: number) => {
    if (!studentId) {
      toast.error('Ledger export failed: Student ID was invalid');
      return;
    }
    const tid = toast.loading('Compiling ledger statement...');
    try {
      const res = await api.get(`/school-finance/statements/${studentId}`);
      const data = res.data;

      const doc = new jsPDF();
      
      doc.setFillColor(15, 23, 42);
      doc.rect(5, 5, 200, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('AMFOFANA ACADEMY STATEMENT OF ACCOUNT', 15, 22);
      doc.setFontSize(10);
      doc.text(`Billed Student: ${data.studentProfile.name} | ID: ${data.studentProfile.userId}`, 15, 32);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.text('Ledger Summary Metrics', 15, 60);
      doc.setFontSize(10);
      doc.text(`Total Invoiced: ${data.totalInvoiced.toLocaleString()} GNF`, 15, 70);
      doc.text(`Total Paid: ${data.totalPaid.toLocaleString()} GNF`, 15, 77);
      doc.text(`Outstanding Balance: ${data.outstandingBalance.toLocaleString()} GNF`, 15, 84);

      doc.setFontSize(14);
      doc.text('Invoice Ledger History', 15, 100);
      const invRows = data.invoices.map((i: any) => [
        i.invoiceNumber,
        `${i.month} ${i.year}`,
        i.status,
        `${Number(i.subtotal).toLocaleString()} GNF`,
        `${Number(i.remainingBalance).toLocaleString()} GNF`
      ]);

      autoTable(doc, {
        startY: 105,
        head: [['Invoice #', 'Billing Period', 'Status', 'Billed Subtotal', 'Remaining Balance']],
        body: invRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }
      });

      doc.save(`Statement-${data.studentProfile.userId}.pdf`);
      toast.success('Statement generated successfully', { id: tid });
    } catch (e: any) {
      toast.error('Ledger export failed', { id: tid });
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic uppercase">Student Finance Ledger</h1>
          <p className="text-sm text-slate-500 font-medium">Manage student invoicing billing categories and approval workflows</p>
        </div>
        
        <div className="flex items-center gap-3">
          {role === 'ACCOUNTANT' && selectedInvoiceIds.length > 0 && (
            <Button
              onClick={handleSubmitSelectedInvoices}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs px-5 duration-300"
            >
              Submit Selected ({selectedInvoiceIds.length})
            </Button>
          )}

          <Button 
            onClick={() => { setEditingInvoice(null); setIsInvoiceOpen(true); }}
            className="flex items-center gap-2 px-5 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
          >
            <Plus className="w-4 h-4" /> Create Invoice
          </Button>

          <Button 
            onClick={() => { setEditingPayment(null); setIsPaymentOpen(true); }}
            className="flex items-center gap-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
          >
            <DollarSign className="w-4 h-4" /> Receive Payment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg shadow-slate-100 bg-white rounded-3xl p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search Student name or Invoice..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-100"
            />
          </div>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {classes.map((cls: any) => (
                <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted / Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 px-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs font-bold uppercase tracking-wide">
            <Clock className="w-4 h-4" /> Session Role: <Badge variant="secondary" className="font-extrabold">{role}</Badge>
          </div>
        </div>
      </Card>

      {/* Main Ledger Table */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-slate-50">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Student Billing Ledger Sheets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                {role === 'ACCOUNTANT' && <TableHead className="w-12"></TableHead>}
                <TableHead className="font-bold text-slate-700">Invoice Number</TableHead>
                <TableHead className="font-bold text-slate-700">Student</TableHead>
                <TableHead className="font-bold text-slate-700">Billing Period</TableHead>
                <TableHead className="font-bold text-slate-700">Total Billed</TableHead>
                <TableHead className="font-bold text-slate-700">Paid</TableHead>
                <TableHead className="font-bold text-slate-700">Balance</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv: any) => {
                const actualInv = inv.attributes || inv;
                const studentObj = getStudentData(actualInv.student);
                const studentName = studentObj?.username || studentObj?.name || 'N/A';
                const studentUserId = studentObj?.userId || 'N/A';

                const isDraftOrRejected = actualInv.status === 'DRAFT' || actualInv.status === 'REJECTED';

                return (
                  <TableRow key={inv.id} className="hover:bg-slate-50/50 duration-200">
                    {role === 'ACCOUNTANT' && (
                      <TableCell className="w-12">
                        {isDraftOrRejected && (
                          <input
                            type="checkbox"
                            checked={selectedInvoiceIds.includes(inv.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInvoiceIds([...selectedInvoiceIds, inv.id]);
                              } else {
                                setSelectedInvoiceIds(selectedInvoiceIds.filter(id => id !== inv.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        )}
                      </TableCell>
                    )}
                    
                    <TableCell className="font-bold tracking-tight text-slate-900">{actualInv.invoiceNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-800">{studentName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{studentUserId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-600">{actualInv.month} {actualInv.year}</TableCell>
                    <TableCell className="font-black text-slate-900">{Number(actualInv.subtotal).toLocaleString()} GNF</TableCell>
                    <TableCell className="font-semibold text-emerald-600">{Number(actualInv.totalPaid || 0).toLocaleString()} GNF</TableCell>
                    <TableCell className="font-semibold text-rose-600">{Number(actualInv.remainingBalance).toLocaleString()} GNF</TableCell>
                    <TableCell>
                      <Badge className={
                        actualInv.status === 'PAID' ? 'bg-emerald-500 hover:bg-emerald-600' :
                        actualInv.status === 'PARTIALLY_PAID' ? 'bg-amber-500 hover:bg-amber-600' :
                        actualInv.status === 'APPROVED' ? 'bg-blue-600 hover:bg-blue-700' :
                        actualInv.status === 'REJECTED' ? 'bg-rose-500 hover:bg-rose-600' :
                        actualInv.status === 'DRAFT' ? 'bg-slate-300 text-slate-800 hover:bg-slate-400' :
                        'bg-slate-500 hover:bg-slate-600'
                      }>
                        {actualInv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit/Delete for Accountant when DRAFT/REJECTED */}
                        {role === 'ACCOUNTANT' && isDraftOrRejected && (
                          <>
                            <Button 
                              onClick={() => startEditInvoice(inv)}
                              size="icon" 
                              variant="ghost"
                              className="rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100 text-amber-700 h-8 w-8"
                              title="Edit Invoice"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => handleDeleteInvoice(inv)}
                              size="icon" 
                              variant="ghost"
                              className="rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100 text-rose-600 h-8 w-8"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        {role === 'ACCOUNTLEAD' && actualInv.status === 'SUBMITTED' && (
                          <>
                            <Button 
                              onClick={() => handleApprove(inv.id, 'INVOICE')}
                              size="icon" 
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => handleOpenReject(inv.id, 'INVOICE')}
                              size="icon" 
                              className="bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        {role === 'ACCOUNTLEAD' && actualInv.status === 'REJECTED' && (
                          <span className="text-[10px] text-rose-500 font-extrabold uppercase bg-rose-50 px-2.5 py-1 rounded-xl">
                            Rejected - Awaiting revision
                          </span>
                        )}

                        <Button 
                          onClick={() => downloadStatement(studentObj?.id || actualInv.student?.id)}
                          size="icon"
                          variant="ghost" 
                          className="rounded-xl border hover:bg-slate-50"
                          title="Download Statement"
                        >
                          <FileText className="w-4 h-4 text-slate-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Payments Awaiting Approval / Rejected Logs */}
      {role === 'ACCOUNTLEAD' && (
        <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden mt-8">
          <CardHeader className="px-6 py-5 border-b border-slate-50">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Payment Collections Pending Review / Revision
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt Ref</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.filter((p: any) => {
                  const actual = p.attributes || p;
                  return actual.status === 'SUBMITTED' || actual.status === 'REJECTED';
                }).map((p: any) => {
                  const actualPay = p.attributes || p;
                  const studentObj = getStudentData(actualPay.student);
                  const studentName = studentObj?.username || studentObj?.name || 'Student';
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{actualPay.paymentNumber}</TableCell>
                      <TableCell>{studentName}</TableCell>
                      <TableCell>{actualPay.paymentMethod}</TableCell>
                      <TableCell><Badge variant="secondary">{actualPay.paymentCategory}</Badge></TableCell>
                      <TableCell className="font-black">{Number(actualPay.amount).toLocaleString()} GNF</TableCell>
                      <TableCell>
                        <Badge className={actualPay.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'}>
                          {actualPay.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {actualPay.status === 'SUBMITTED' ? (
                          <>
                            <Button 
                              onClick={() => handleApprove(p.id, 'PAYMENT')}
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"
                            >
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleOpenReject(p.id, 'PAYMENT')}
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
                {payments.filter((p: any) => {
                  const actual = p.attributes || p;
                  return actual.status === 'SUBMITTED' || actual.status === 'REJECTED';
                }).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center p-6 text-slate-400 font-bold uppercase text-[10px]">No pending reviewer collections found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Historical Payments / Receipts / Draft & Rejected Collections for Accountants */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden mt-8">
        <CardHeader className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Payments & Receipts Ledger</CardTitle>
          {role === 'ACCOUNTANT' && selectedPaymentIds.length > 0 && (
            <Button
              onClick={handleSubmitSelectedPayments}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] h-8 px-4"
            >
              Submit Selected ({selectedPaymentIds.length})
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {role === 'ACCOUNTANT' && <TableHead className="w-12"></TableHead>}
                <TableHead>Payment Reference</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p: any) => {
                const actualPay = p.attributes || p;
                const studentObj = getStudentData(actualPay.student);
                const studentName = studentObj?.username || studentObj?.name || 'N/A';

                const isDraftOrRejected = actualPay.status === 'DRAFT' || actualPay.status === 'REJECTED';

                return (
                  <TableRow key={p.id}>
                    {role === 'ACCOUNTANT' && (
                      <TableCell className="w-12">
                        {isDraftOrRejected && (
                          <input
                            type="checkbox"
                            checked={selectedPaymentIds.includes(p.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPaymentIds([...selectedPaymentIds, p.id]);
                              } else {
                                setSelectedPaymentIds(selectedPaymentIds.filter(id => id !== p.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        )}
                      </TableCell>
                    )}

                    <TableCell className="font-bold">{actualPay.paymentNumber}</TableCell>
                    <TableCell>{studentName}</TableCell>
                    <TableCell>{actualPay.paymentMethod}</TableCell>
                    <TableCell><Badge variant="secondary">{actualPay.paymentCategory}</Badge></TableCell>
                    <TableCell className="font-black">{Number(actualPay.amount).toLocaleString()} GNF</TableCell>
                    <TableCell>
                      <Badge className={
                        actualPay.status === 'APPROVED' ? 'bg-emerald-500' :
                        actualPay.status === 'REJECTED' ? 'bg-rose-500' :
                        actualPay.status === 'DRAFT' ? 'bg-slate-300 text-slate-800' :
                        'bg-amber-500'
                      }>
                        {actualPay.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {role === 'ACCOUNTANT' && isDraftOrRejected && (
                          <>
                            <Button 
                              onClick={() => startEditPayment(p)}
                              size="icon" 
                              variant="ghost"
                              className="rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100 text-amber-700 h-8 w-8"
                              title="Edit Log"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              onClick={() => handleDeletePayment(p)}
                              size="icon" 
                              variant="ghost"
                              className="rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100 text-rose-600 h-8 w-8"
                              title="Delete Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}

                        {actualPay.status === 'APPROVED' && (
                          <Button 
                            onClick={() => downloadReceipt(p.id)}
                            size="sm" 
                            variant="outline"
                            className="rounded-lg gap-2 text-xs"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
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

      {/* Create / Edit Invoice Dialog */}
      <Dialog open={isInvoiceOpen} onOpenChange={(open) => { setIsInvoiceOpen(open); if (!open) setEditingInvoice(null); }}>
        <DialogContent className="max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-wide">
              {editingInvoice ? 'Edit Student Billing Invoice' : 'Generate Student Billing Invoice'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Select Student</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!!editingInvoice}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                  <SelectValue placeholder="Search student name..." />
                </SelectTrigger>
                <SelectContent className="max-h-[250px] overflow-y-auto">
                  {students.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.userId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Billing Month</label>
                <Select value={invoiceMonth} onValueChange={setInvoiceMonth}>
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
                <label className="text-xs font-black uppercase text-slate-400">Billing Year</label>
                <Input 
                  type="number" 
                  value={invoiceYear} 
                  onChange={(e) => setInvoiceYear(Number(e.target.value))}
                  className="h-11 rounded-xl bg-slate-50"
                />
              </div>
            </div>

            {/* Charge breakdown items */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase text-slate-400">Fee Breakdown Items</label>
                <Button 
                  onClick={() => setChargeItems([...chargeItems, { description: '', amount: 0, category: 'OTHER' }])}
                  className="h-7 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider"
                >
                  Add Custom Item
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[150px] overflow-y-auto pr-1">
                {chargeItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <Input 
                      placeholder="e.g. Tuition Fee" 
                      value={item.description}
                      onChange={(e) => {
                        const next = [...chargeItems];
                        next[idx].description = e.target.value;
                        setChargeItems(next);
                      }}
                      className="col-span-6 h-9 rounded-lg bg-slate-50 text-xs"
                    />
                    <Input 
                      type="number" 
                      placeholder="Amount" 
                      value={item.amount || ''}
                      onChange={(e) => {
                        const next = [...chargeItems];
                        next[idx].amount = Number(e.target.value);
                        setChargeItems(next);
                      }}
                      className="col-span-4 h-9 rounded-lg bg-slate-50 text-xs"
                    />
                    <Button 
                      onClick={() => setChargeItems(chargeItems.filter((_, i) => i !== idx))}
                      className="col-span-2 h-9 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Additional Ledger Notes</label>
              <Input 
                value={invoiceNotes} 
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="Terms, bank guidelines, custom notes..."
                className="h-11 rounded-xl bg-slate-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCreateOrEditInvoice}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
            >
              {editingInvoice ? 'Save Invoice Changes' : 'Generate Billing Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive / Edit Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={(open) => { setIsPaymentOpen(open); if (!open) setEditingPayment(null); }}>
        <DialogContent className="max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-wide">
              {editingPayment ? 'Edit Student Payment Log' : 'Receive Student Payment Collection'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Select Billing Invoice</label>
              <Select value={selectedInvoiceId} onValueChange={(val) => {
                setSelectedInvoiceId(val);
                const inv = invoices.find(i => String(i.id) === val);
                const actualInv = inv?.attributes || inv;
                setPaymentAmount(actualInv?.remainingBalance || 0);
              }} disabled={!!editingPayment}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                  <SelectValue placeholder="Select invoice ref..." />
                </SelectTrigger>
                <SelectContent className="max-h-[250px] overflow-y-auto">
                  {invoices.filter(i => {
                    const actual = i.attributes || i;
                    // Allow draft/rejected invoices if editing, otherwise only allow approved/partially_paid ones
                    if (editingPayment) return true;
                    return actual.status === 'APPROVED' || actual.status === 'PARTIALLY_PAID';
                  }).map((inv: any) => {
                    const actualInv = inv.attributes || inv;
                    const studentObj = getStudentData(actualInv.student);
                    const studentName = studentObj?.username || studentObj?.name || 'Student';
                    const studentUserId = studentObj?.userId ? ` (${studentObj.userId})` : '';
                    return (
                      <SelectItem key={inv.id} value={String(inv.id)}>
                        {actualInv.invoiceNumber} - {studentName}{studentUserId} ({Number(actualInv.remainingBalance).toLocaleString()} GNF due)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Disbursed Amount (GNF)</label>
              <Input 
                type="number" 
                value={paymentAmount || ''} 
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="h-11 rounded-xl bg-slate-50 font-black text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Payment Category</label>
                <Select value={paymentCategory} onValueChange={setPaymentCategory}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TUITION">Tuition</SelectItem>
                    <SelectItem value="TRANSPORT">Transport</SelectItem>
                    <SelectItem value="TSHIRT">T-Shirt / Uniform</SelectItem>
                    <SelectItem value="REGISTRATION">Registration</SelectItem>
                    <SelectItem value="OTHER">Other Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Disbursed Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                    <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                    <SelectItem value="CARD">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Collection Notes</label>
              <Input 
                value={paymentNotes} 
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Txn ID, references, details..."
                className="h-11 rounded-xl bg-slate-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCreateOrEditPayment}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
            >
              {editingPayment ? 'Save Payment changes' : 'Submit Payment Receipt Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Record Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-sm bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-md font-black uppercase tracking-wide text-rose-600">Reject {rejectType} Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Provide Rejection Reason</label>
              <Input 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify reason for audit..."
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
