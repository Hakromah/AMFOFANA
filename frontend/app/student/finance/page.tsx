/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Loader2, DollarSign, Download, CreditCard, FileText,
  CheckCircle2, Clock, AlertCircle, RefreshCw,
  Search, Receipt, Landmark, ShieldCheck, Eye,
  Building, Phone, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import api from '@/lib/api';
import {
  generateStatement,
  generateInvoicePDF,
  generateReceipt,
  InvoicePDFData,
  StatementData,
  ReceiptData
} from '@/lib/pdf-generator';

interface InvoiceItem {
  description?: string;
  name?: string;
  category?: string;
  amount?: number;
  quantity?: number;
}

interface StudentInvoice {
  id: number;
  invoiceNumber: string;
  month: string;
  year: number;
  dueDate: string;
  subtotal: number;
  totalPaid: number;
  remainingBalance: number;
  status: string;
  currency?: string;
  notes?: string;
  items?: InvoiceItem[];
  createdAt?: string;
}

interface StudentPayment {
  id: number;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  paymentCategory?: string;
  status: string;
  notes?: string;
  currency?: string;
  originalAmount?: number;
  invoice?: {
    id: number;
    invoiceNumber: string;
    subtotal: number;
  };
  createdAt?: string;
}

interface StudentProfile {
  id: number;
  userId?: string;
  username?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  enrolledClasses?: Array<{ id: number; name: string }>;
}

interface Balance {
  totalCharged: number;
  totalPaid: number;
  outstandingBalance: number;
  currency: string;
}

interface PaymentMethodsConfig {
  bankName?: string;
  accountHolder?: string;
  rib?: string;
  branchCode?: string;
  swift?: string;
  bankInstructions?: string;
  isBankTransferActive?: boolean;
  orangeMoneyMerchant?: string;
  orangeMoneyInstructions?: string;
  isOrangeMoneyActive?: boolean;
  mtnMoMoCode?: string;
  mtnMoMoInstructions?: string;
  isMtnMoMoActive?: boolean;
  cashierLocation?: string;
  cashierHours?: string;
  isCashierActive?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  additionalNotes?: string;
}

export default function StudentFinancePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & search
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Preview Modal
  const [selectedInvoice, setSelectedInvoice] = useState<StudentInvoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingStatement, setDownloadingStatement] = useState(false);

  const fetchData = async () => {
    try {
      const [profileRes, invoicesRes, paymentsRes, balanceRes, statementRes, paymentMethodsRes] = await Promise.all([
        api.get('/student/profile').catch(() => ({ data: null })),
        api.get('/student/invoices').catch(() => ({ data: [] })),
        api.get('/student/payments').catch(() => ({ data: [] })),
        api.get('/student/balance').catch(() => ({ data: null })),
        api.get('/student/statement').catch(() => ({ data: null })),
        api.get('/finance/payment-methods')
          .catch(() => api.get('/school-finance/payment-methods'))
          .catch(() => api.get('/payment-setting'))
          .catch(() => ({ data: null })),
      ]);

      const prof = profileRes.data;
      setProfile(prof);

      if (paymentMethodsRes?.data) {
        const raw = paymentMethodsRes.data;
        const unwrapped = raw?.data?.attributes || raw?.data || raw;
        setPaymentMethods(unwrapped);
      }

      const rawInvoices: StudentInvoice[] = Array.isArray(invoicesRes.data)
        ? invoicesRes.data
        : (statementRes.data?.invoices || []);
      setInvoices(rawInvoices);

      const rawPayments: StudentPayment[] = Array.isArray(paymentsRes.data)
        ? paymentsRes.data
        : (statementRes.data?.payments || []);
      setPayments(rawPayments);

      if (balanceRes.data) {
        setBalance(balanceRes.data);
      } else if (statementRes.data) {
        setBalance({
          totalCharged: statementRes.data.totalInvoiced || statementRes.data.totalCharged || 0,
          totalPaid: statementRes.data.totalPaid || 0,
          outstandingBalance: statementRes.data.outstandingBalance || 0,
          currency: statementRes.data.invoices?.[0]?.currency || 'GNF'
        });
      }
    } catch (error) {
      console.error('Failed to load financial records:', error);
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const studentDisplayName = profile?.username || profile?.name || 'Student';
  const studentUserId = profile?.userId || `STU-${profile?.id || '00'}`;
  const studentClassName = profile?.enrolledClasses?.[0]?.name || 'Unassigned';
  const studentEmail = profile?.email || '';
  const currency = balance?.currency || 'GNF';

  // Financial KPIs
  const totalCharged = balance?.totalCharged ?? invoices.reduce((s, i) => s + Number(i.subtotal || 0), 0);
  const totalPaid = balance?.totalPaid ?? payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const outstandingBalance = balance?.outstandingBalance ?? Math.max(0, totalCharged - totalPaid);
  const paymentRatio = totalCharged > 0 ? Math.min(100, Math.round((totalPaid / totalCharged) * 100)) : 0;

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.month.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        String(inv.year).includes(invoiceSearch);
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, invoiceSearch, statusFilter]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      return (
        pay.paymentNumber.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        (pay.paymentCategory || '').toLowerCase().includes(paymentSearch.toLowerCase()) ||
        (pay.paymentMethod || '').toLowerCase().includes(paymentSearch.toLowerCase()) ||
        (pay.invoice?.invoiceNumber || '').toLowerCase().includes(paymentSearch.toLowerCase())
      );
    });
  }, [payments, paymentSearch]);

  // Download Statement
  const handleDownloadStatement = async () => {
    if (!profile) return;
    setDownloadingStatement(true);
    const tid = toast.loading('Compiling official statement of account...');
    try {
      const statementPayload: StatementData = {
        studentName: studentDisplayName,
        studentId: studentUserId,
        studentEmail: studentEmail,
        studentPhone: profile?.phoneNumber,
        className: studentClassName,
        period: new Date().getFullYear().toString(),
        totalCharged,
        totalPaid,
        totalOutstanding: outstandingBalance,
        currency,
        invoices: invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          month: inv.month,
          year: inv.year,
          dueDate: inv.dueDate,
          subtotal: inv.subtotal,
          totalPaid: inv.totalPaid,
          remainingBalance: inv.remainingBalance,
          status: inv.status,
          currency: inv.currency || currency,
          items: inv.items,
          createdAt: inv.createdAt
        })),
        payments: payments.map((pay) => ({
          id: pay.id,
          paymentNumber: pay.paymentNumber,
          paymentDate: pay.paymentDate,
          amount: pay.amount,
          paymentMethod: pay.paymentMethod,
          paymentCategory: pay.paymentCategory,
          status: pay.status,
          notes: pay.notes,
          currency: pay.currency || currency,
          originalAmount: pay.originalAmount,
          createdAt: pay.createdAt
        }))
      };

      const doc = await generateStatement(statementPayload);
      doc.save(`Statement_${studentUserId}_${new Date().getFullYear()}.pdf`);
      toast.success('Statement downloaded successfully', { id: tid });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate statement', { id: tid });
    } finally {
      setDownloadingStatement(false);
    }
  };

  // Download Individual Invoice PDF
  const handleDownloadInvoice = async (inv: StudentInvoice) => {
    setDownloadingId(inv.id);
    const tid = toast.loading(`Generating invoice ${inv.invoiceNumber}...`);
    try {
      const invoiceData: InvoicePDFData = {
        invoiceNumber: inv.invoiceNumber,
        studentName: studentDisplayName,
        studentId: studentUserId,
        studentEmail: studentEmail,
        studentPhone: profile?.phoneNumber,
        className: studentClassName,
        month: inv.month,
        year: inv.year,
        dueDate: inv.dueDate,
        status: inv.status,
        subtotal: inv.subtotal,
        totalPaid: inv.totalPaid || 0,
        remainingBalance: inv.remainingBalance || Math.max(0, inv.subtotal - (inv.totalPaid || 0)),
        currency: inv.currency || currency,
        notes: inv.notes,
        items: inv.items
      };

      const doc = await generateInvoicePDF(invoiceData);
      doc.save(`Invoice_${inv.invoiceNumber}.pdf`);
      toast.success(`Invoice ${inv.invoiceNumber} downloaded`, { id: tid });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download invoice', { id: tid });
    } finally {
      setDownloadingId(null);
    }
  };

  // Download Individual Receipt PDF
  const handleDownloadReceipt = async (pay: StudentPayment) => {
    const tid = toast.loading(`Generating receipt ${pay.paymentNumber}...`);
    try {
      const receiptData: ReceiptData = {
        receiptNumber: pay.paymentNumber,
        studentName: studentDisplayName,
        studentId: studentUserId,
        date: new Date(pay.paymentDate).toLocaleDateString('en-GB'),
        amount: pay.amount,
        currency: pay.currency || currency,
        paymentMethod: pay.paymentMethod,
        description: `${pay.paymentCategory || 'Tuition'} — Ref: ${pay.invoice?.invoiceNumber || 'Academic Invoice'}`
      };

      const doc = generateReceipt(receiptData);
      doc.save(`Receipt_${pay.paymentNumber}.pdf`);
      toast.success(`Receipt ${pay.paymentNumber} downloaded`, { id: tid });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate receipt', { id: tid });
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[10px] px-3 py-1">PAID</Badge>;
      case 'PARTIALLY_PAID':
      case 'PARTIAL':
        return <Badge className="bg-amber-100 text-amber-800 border-none font-black text-[10px] px-3 py-1">PARTIAL</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800 border-none font-black text-[10px] px-3 py-1">APPROVED</Badge>;
      case 'SUBMITTED':
      case 'DRAFT':
        return <Badge className="bg-slate-100 text-slate-800 border-none font-black text-[10px] px-3 py-1">PENDING</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-100 text-rose-800 border-none font-black text-[10px] px-3 py-1">REJECTED</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-none font-black text-[10px] px-3 py-1">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Loading Student Finance Portal...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen space-y-8 bg-[#f8fafc]">
      {/* Top Profile & Actions Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <DollarSign size={16} className="text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
              Student Finance Portal
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {studentClassName}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight italic uppercase">
            {studentDisplayName} <span className="text-blue-600">({studentUserId})</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            Billing statements, payment tracking, and official document downloads
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-2xl h-11 px-4 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={14} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleDownloadStatement}
            disabled={downloadingStatement}
            className="bg-slate-900 hover:bg-blue-600 text-white rounded-2xl h-11 px-5 font-black text-xs transition-all shadow-md cursor-pointer flex-1 md:flex-initial"
          >
            {downloadingStatement ? (
              <Loader2 size={14} className="mr-2 animate-spin" />
            ) : (
              <Download size={14} className="mr-2" />
            )}
            Download Statement (PDF)
          </Button>
        </div>
      </header>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Billed */}
        <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Billed</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <FileText size={16} />
              </div>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight italic">
              {Number(totalCharged).toLocaleString()} <span className="text-xs font-bold text-slate-400 not-italic">{currency}</span>
            </h2>
            <p className="text-[9px] font-bold text-slate-400 mt-2 flex items-center gap-1">
              <ArrowDownRight size={12} className="text-slate-400" /> Cumulative academic fees charged
            </p>
          </CardContent>
        </Card>

        {/* Total Paid */}
        <Card className="border border-emerald-100 rounded-3xl overflow-hidden shadow-sm bg-emerald-50/20 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Paid</span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-emerald-700 tracking-tight italic">
              {Number(totalPaid).toLocaleString()} <span className="text-xs font-bold text-emerald-600 not-italic">{currency}</span>
            </h2>
            <p className="text-[9px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <ArrowUpRight size={12} className="text-emerald-600" /> Confirmed payments credited
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Balance */}
        <Card className={`border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
          outstandingBalance > 0 ? 'border-rose-100 bg-rose-50/20' : 'border-emerald-100 bg-emerald-50/20'
        }`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                Outstanding Balance
              </span>
              <div className={`p-2 rounded-xl ${
                outstandingBalance > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {outstandingBalance > 0 ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              </div>
            </div>
            <h2 className={`text-2xl lg:text-3xl font-black tracking-tight italic ${
              outstandingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}>
              {Number(outstandingBalance).toLocaleString()} <span className="text-xs font-bold not-italic opacity-70">{currency}</span>
            </h2>
            <p className={`text-[9px] font-bold mt-2 ${outstandingBalance > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
              {outstandingBalance > 0 ? 'Required payment to clear balance' : 'Account in good standing'}
            </p>
          </CardContent>
        </Card>

        {/* Payment Completion Ratio */}
        <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Ratio</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Clock size={16} />
              </div>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight italic">
              {paymentRatio}%
            </h2>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  paymentRatio === 100 ? 'bg-emerald-500' : paymentRatio > 50 ? 'bg-blue-600' : 'bg-amber-500'
                }`}
                style={{ width: `${paymentRatio}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="bg-slate-200/60 p-1 rounded-2xl h-12 inline-flex">
          <TabsTrigger value="invoices" className="rounded-xl font-bold text-xs px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText size={14} className="mr-2" />
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl font-bold text-xs px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Receipt size={14} className="mr-2" />
            Payment History ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="ledger" className="rounded-xl font-bold text-xs px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CreditCard size={14} className="mr-2" />
            Account Ledger
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="rounded-xl font-bold text-xs px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Landmark size={14} className="mr-2" />
            Payment Instructions
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: INVOICES TABLE ────────────────────────────────────────── */}
        <TabsContent value="invoices" className="space-y-4">
          <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
            <CardHeader className="border-b border-slate-50 px-8 py-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <CardTitle className="font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" /> Academic Invoices
                </CardTitle>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  View billing records and download official PDF copies for every academic period
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex items-center gap-3">
                <div className="relative w-48 sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search invoices..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 px-3 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIALLY_PAID">Partial</option>
                  <option value="APPROVED">Approved</option>
                  <option value="DRAFT">Pending</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredInvoices.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-bold text-sm">
                  <FileText size={36} className="mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  No invoices found for your student profile.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Invoice #</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Period</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Due Date</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Description</TableHead>
                        <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Billed</TableHead>
                        <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Paid</TableHead>
                        <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Balance</TableHead>
                        <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">Status</TableHead>
                        <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((inv) => {
                        const rem = inv.remainingBalance !== undefined ? inv.remainingBalance : Math.max(0, inv.subtotal - (inv.totalPaid || 0));
                        const itemsSummary = Array.isArray(inv.items) && inv.items.length > 0
                          ? inv.items.map((it: any) => it.description || it.name || it.category).join(', ')
                          : 'Tuition Fees';

                        return (
                          <TableRow key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                            <TableCell className="pl-8 font-mono text-xs font-black text-slate-900">
                              {inv.invoiceNumber}
                            </TableCell>
                            <TableCell className="font-bold text-slate-700 text-xs">
                              {inv.month} {inv.year}
                            </TableCell>
                            <TableCell className="text-slate-500 font-medium text-xs">
                              {new Date(inv.dueDate).toLocaleDateString('en-GB')}
                            </TableCell>
                            <TableCell className="text-slate-600 font-medium text-xs max-w-[200px] truncate" title={itemsSummary}>
                              {itemsSummary}
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-900 text-xs">
                              {Number(inv.subtotal).toLocaleString()} {currency}
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 text-xs">
                              {Number(inv.totalPaid || 0).toLocaleString()} {currency}
                            </TableCell>
                            <TableCell className="text-right font-black text-xs">
                              <span className={rem > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                {Number(rem).toLocaleString()} {currency}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(inv.status)}
                            </TableCell>
                            <TableCell className="pr-8 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedInvoice(inv);
                                    setPreviewOpen(true);
                                  }}
                                  className="h-8 px-2.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                                  title="View Details"
                                >
                                  <Eye size={14} />
                                </Button>

                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(inv)}
                                  disabled={downloadingId === inv.id}
                                  className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                                >
                                  {downloadingId === inv.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Download size={13} className="mr-1.5" />
                                  )}
                                  Invoice (PDF)
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: PAYMENTS HISTORY ──────────────────────────────────────── */}
        <TabsContent value="payments" className="space-y-4">
          <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
            <CardHeader className="border-b border-slate-50 px-8 py-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <CardTitle className="font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Receipt size={16} className="text-emerald-600" /> Payment History
                </CardTitle>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  Confirmed payments credited with downloadable official receipts
                </p>
              </div>

              <div className="relative w-48 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search payments..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredPayments.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-bold text-sm">
                  <Receipt size={36} className="mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  No payments recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Receipt #</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Date</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Method</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Category</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Linked Invoice</TableHead>
                        <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Amount Paid</TableHead>
                        <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">Status</TableHead>
                        <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((pay) => (
                        <TableRow key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                          <TableCell className="pl-8 font-mono text-xs font-black text-slate-900">
                            {pay.paymentNumber}
                          </TableCell>
                          <TableCell className="font-bold text-slate-700 text-xs">
                            {new Date(pay.paymentDate).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700">
                              {pay.paymentMethod || 'Cash'}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-600 text-xs">
                            {pay.paymentCategory || 'Tuition'}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-blue-600 font-bold">
                            {pay.invoice?.invoiceNumber || '—'}
                          </TableCell>
                          <TableCell className="text-right font-black text-emerald-700 text-xs">
                            {Number(pay.amount).toLocaleString()} {currency}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[10px] px-2.5 py-0.5">
                              {pay.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReceipt(pay)}
                              className="h-8 px-3 rounded-xl border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 font-bold text-xs"
                            >
                              <Download size={12} className="mr-1.5" />
                              Receipt (PDF)
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: ACCOUNT STATEMENT LEDGER ─────────────────────────────── */}
        <TabsContent value="ledger" className="space-y-4">
          <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
            <CardHeader className="border-b border-slate-50 px-8 py-5 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-blue-600" /> Account Activity Ledger
                </CardTitle>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  Complete chronological journal of debits (Invoices) and credits (Payments) with running balance
                </p>
              </div>

              <Button
                onClick={handleDownloadStatement}
                size="sm"
                className="bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
              >
                <Download size={13} className="mr-1.5" /> Export Statement (PDF)
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              {(() => {
                const activities: any[] = [];
                invoices.forEach((inv) => {
                  activities.push({
                    date: inv.createdAt || inv.dueDate || new Date().toISOString(),
                    ref: inv.invoiceNumber,
                    type: 'INVOICE',
                    description: `Invoice — ${inv.month} ${inv.year}`,
                    billed: Number(inv.subtotal || 0),
                    paid: 0
                  });
                });

                payments.forEach((pay) => {
                  activities.push({
                    date: pay.paymentDate || pay.createdAt || new Date().toISOString(),
                    ref: pay.paymentNumber,
                    type: 'PAYMENT',
                    description: `Payment (${pay.paymentCategory || 'Tuition'} - ${pay.paymentMethod || 'Cash'})`,
                    billed: 0,
                    paid: Number(pay.amount || 0)
                  });
                });

                activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                let runningBal = 0;
                const rows = activities.map((act) => {
                  if (act.type === 'INVOICE') runningBal += act.billed;
                  else runningBal -= act.paid;
                  return { ...act, runningBal };
                });

                if (rows.length === 0) {
                  return (
                    <div className="py-16 text-center text-slate-400 font-bold text-sm">
                      No transactions recorded in the account ledger.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Date</TableHead>
                          <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Reference #</TableHead>
                          <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Type</TableHead>
                          <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Description</TableHead>
                          <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Billed (Dr)</TableHead>
                          <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Paid (Cr)</TableHead>
                          <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-slate-50/70">
                            <TableCell className="pl-8 text-xs font-semibold text-slate-600">
                              {new Date(row.date).toLocaleDateString('en-GB')}
                            </TableCell>
                            <TableCell className="font-mono text-xs font-bold text-slate-800">
                              {row.ref}
                            </TableCell>
                            <TableCell>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                row.type === 'INVOICE' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {row.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs font-medium text-slate-700">
                              {row.description}
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-900 text-xs">
                              {row.billed > 0 ? `${Number(row.billed).toLocaleString()} ${currency}` : '—'}
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 text-xs">
                              {row.paid > 0 ? `${Number(row.paid).toLocaleString()} ${currency}` : '—'}
                            </TableCell>
                            <TableCell className="pr-8 text-right font-black text-xs">
                              <span className={row.runningBal > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                {Number(row.runningBal).toLocaleString()} ${currency}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: PAYMENT METHODS & BANK DETAILS ───────────────────────── */}
        <TabsContent value="payment-methods" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Transfer Instructions */}
            <Card className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                    <Building size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">
                      Bank Transfer & Deposit
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">Official institution bank details</p>
                  </div>
                </div>
                {paymentMethods?.isBankTransferActive !== false ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-black uppercase tracking-wider">
                    Unavailable
                  </Badge>
                )}
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="font-bold text-slate-500">Bank Name:</span>
                  <span className="font-black text-slate-900">
                    {paymentMethods?.bankName || 'Central Bank / Vista Bank Guinea'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="font-bold text-slate-500">Account Name:</span>
                  <span className="font-black text-slate-900">
                    {paymentMethods?.accountHolder || 'AMFOFANA ACADEMY'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="font-bold text-slate-500">Account Number / IBAN:</span>
                  <span className="font-mono font-black text-blue-700">
                    {paymentMethods?.rib || 'GN04 0001 2345 6789 0123 45'}
                  </span>
                </div>
                {paymentMethods?.branchCode && (
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-bold text-slate-500">Branch Code:</span>
                    <span className="font-mono font-black text-slate-800">{paymentMethods.branchCode}</span>
                  </div>
                )}
                {paymentMethods?.swift && (
                  <div className="flex justify-between py-1">
                    <span className="font-bold text-slate-500">SWIFT / BIC Code:</span>
                    <span className="font-mono font-black text-slate-800">{paymentMethods.swift}</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 text-[10px] text-slate-500 font-medium bg-amber-50 p-3 rounded-xl border border-amber-100">
                <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Important:</strong> {paymentMethods?.bankInstructions || `Quote your Invoice Number and Student ID (${studentUserId}) in the payment reference for automatic reconciliation.`}
                </p>
              </div>
            </Card>

            {/* Mobile Money & Cashier Payment */}
            <Card className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">
                      Cashier & Mobile Payments
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">Direct payment options & mobile money</p>
                  </div>
                </div>
                {paymentMethods?.isOrangeMoneyActive !== false || paymentMethods?.isCashierActive !== false ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                    Available
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-black uppercase tracking-wider">
                    Closed
                  </Badge>
                )}
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="font-bold text-slate-500">Orange Money (Merchant):</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900">
                      {paymentMethods?.orangeMoneyMerchant || '#144*2*1*XXXXX#'}
                    </span>
                    {paymentMethods?.isOrangeMoneyActive !== false && (
                      <Badge className="bg-orange-100 text-orange-800 text-[9px] font-bold">OM</Badge>
                    )}
                  </div>
                </div>
                {paymentMethods?.orangeMoneyInstructions && (
                  <p className="text-[10px] text-slate-500 italic pb-1">
                    {paymentMethods.orangeMoneyInstructions}
                  </p>
                )}
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="font-bold text-slate-500">MTN Mobile Money:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900">
                      {paymentMethods?.mtnMoMoCode || '*440*XXXXXX#'}
                    </span>
                    {paymentMethods?.isMtnMoMoActive !== false && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-[9px] font-bold">MoMo</Badge>
                    )}
                  </div>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="font-bold text-slate-500">Bursar Office:</span>
                  <span className="font-black text-slate-900">
                    {paymentMethods?.cashierLocation || 'Administration Building, Ground Floor'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-bold text-slate-500">Cashier Hours:</span>
                  <span className="font-bold text-slate-800">
                    {paymentMethods?.cashierHours || 'Monday to Friday: 08:00 — 16:00'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold bg-blue-50 p-3 rounded-xl border border-blue-100">
                <Phone size={14} className="text-blue-600 shrink-0" />
                <span>
                  Finance & Accounts Support: <strong>{paymentMethods?.contactEmail || 'accounts@amfofana.edu'}</strong>
                  {paymentMethods?.contactPhone && ` | Tel: ${paymentMethods.contactPhone}`}
                </span>
              </div>

              {paymentMethods?.additionalNotes && (
                <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">Note: </span>
                  {paymentMethods.additionalNotes}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── INVOICE DETAILS MODAL (PREVIEW) ──────────────────────────────── */}
      {selectedInvoice && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl rounded-3xl p-6 bg-white">
            <DialogHeader className="border-b border-slate-100 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <DialogTitle className="text-xl font-black text-slate-900 uppercase">
                    Invoice Details
                  </DialogTitle>
                  <p className="text-xs text-blue-600 font-mono font-bold mt-0.5">
                    {selectedInvoice.invoiceNumber}
                  </p>
                </div>
                {getStatusBadge(selectedInvoice.status)}
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl text-xs">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Period</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.month} {selectedInvoice.year}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Due Date</span>
                  <span className="font-bold text-slate-900">{new Date(selectedInvoice.dueDate).toLocaleDateString('en-GB')}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Total Billed</span>
                  <span className="font-black text-slate-900">{Number(selectedInvoice.subtotal).toLocaleString()} {currency}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Balance Due</span>
                  <span className="font-black text-rose-600">
                    {Number(selectedInvoice.remainingBalance !== undefined ? selectedInvoice.remainingBalance : Math.max(0, selectedInvoice.subtotal - (selectedInvoice.totalPaid || 0))).toLocaleString()} {currency}
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Itemized Charges & Services
                </h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-[9px] font-black uppercase">Description</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Category</TableHead>
                        <TableHead className="text-right text-[9px] font-black uppercase">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(selectedInvoice.items) && selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs font-medium text-slate-800">{item.description || item.name}</TableCell>
                            <TableCell className="text-xs font-semibold text-slate-500">{item.category || 'Fees'}</TableCell>
                            <TableCell className="text-right text-xs font-bold text-slate-900">{Number(item.amount || selectedInvoice.subtotal).toLocaleString()} {currency}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell className="text-xs font-medium text-slate-800">Academic Tuition — {selectedInvoice.month} {selectedInvoice.year}</TableCell>
                          <TableCell className="text-xs font-semibold text-slate-500">Tuition</TableCell>
                          <TableCell className="text-right text-xs font-bold text-slate-900">{Number(selectedInvoice.subtotal).toLocaleString()} {currency}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600">
                  <span className="font-bold text-slate-700">Notes:</span> {selectedInvoice.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                onClick={() => setPreviewOpen(false)}
                className="rounded-2xl font-bold text-xs"
              >
                Close
              </Button>
              <Button
                onClick={() => handleDownloadInvoice(selectedInvoice)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs shadow-md cursor-pointer"
              >
                <Download size={14} className="mr-2" />
                Download Invoice (PDF)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
