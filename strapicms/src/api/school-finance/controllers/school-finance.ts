/**
 * school-finance custom controller
 */

export default {
  // ─── Flat Finance Data Endpoints (avoid Strapi v5 populate permission issues) ──
  async getStudentFinanceData(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTANT' && user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Access denied');
    }

    const [invoices, payments] = await Promise.all([
      (strapi.entityService.findMany as any)('api::student-invoice.student-invoice' as any, {
        populate: ['student', 'submittedBy', 'approvedBy'],
        sort: [{ createdAt: 'desc' }]
      }) as Promise<any[]>,
      (strapi.entityService.findMany as any)('api::student-payment.student-payment' as any, {
        populate: ['student', 'invoice', 'receivedBy', 'approvedBy'],
        sort: [{ createdAt: 'desc' }]
      }) as Promise<any[]>
    ]);

    // Flatten - embed student name/userId directly so frontend never needs populate
    const flatInvoices = invoices.map((inv: any) => ({
      id: inv.id,
      documentId: inv.documentId,
      invoiceNumber: inv.invoiceNumber,
      month: inv.month,
      year: inv.year,
      status: inv.status,
      subtotal: inv.subtotal,
      totalPaid: inv.totalPaid,
      remainingBalance: inv.remainingBalance,
      notes: inv.notes,
      items: inv.items,
      dueDate: inv.dueDate,
      rejectionReason: inv.rejectionReason,
      createdAt: inv.createdAt,
      // Flat student fields
      studentId: inv.student?.id || null,
      studentDocumentId: inv.student?.documentId || null,
      studentName: inv.student?.username || inv.student?.name || null,
      studentUserId: inv.student?.userId || null,
      studentEmail: inv.student?.email || null
    }));

    const flatPayments = payments.map((pay: any) => {
      const invoiceStudent = pay.invoice?.student;
      return {
        id: pay.id,
        documentId: pay.documentId,
        paymentNumber: pay.paymentNumber,
        amount: pay.amount,
        paymentDate: pay.paymentDate,
        paymentMethod: pay.paymentMethod,
        paymentCategory: pay.paymentCategory,
        status: pay.status,
        notes: pay.notes,
        rejectionReason: pay.rejectionReason,
        createdAt: pay.createdAt,
        // Flat invoice fields
        invoiceId: pay.invoice?.id || null,
        invoiceDocumentId: pay.invoice?.documentId || null,
        invoiceNumber: pay.invoice?.invoiceNumber || null,
        invoiceRemainingBalance: pay.invoice?.remainingBalance || 0,
        // Flat student fields — prefer direct student link, fallback to invoice.student
        studentId: pay.student?.id || invoiceStudent?.id || null,
        studentDocumentId: pay.student?.documentId || invoiceStudent?.documentId || null,
        studentName: pay.student?.username || pay.student?.name || invoiceStudent?.username || invoiceStudent?.name || null,
        studentUserId: pay.student?.userId || invoiceStudent?.userId || null,
        studentEmail: pay.student?.email || invoiceStudent?.email || null
      };
    });

    ctx.body = { invoices: flatInvoices, payments: flatPayments };
  },

  async getStaffFinanceData(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTANT' && user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Access denied');
    }

    const [salaryRecords, salaryPayments] = await Promise.all([
      (strapi.entityService.findMany as any)('api::salary-record.salary-record' as any, {
        populate: ['staff', 'submittedBy', 'approvedBy'],
        sort: [{ createdAt: 'desc' }]
      }) as Promise<any[]>,
      (strapi.entityService.findMany as any)('api::salary-payment.salary-payment' as any, {
        populate: ['staff', 'salaryRecord', 'paidBy', 'approvedBy'],
        sort: [{ createdAt: 'desc' }]
      }) as Promise<any[]>
    ]);

    const flatRecords = salaryRecords.map((rec: any) => ({
      id: rec.id,
      documentId: rec.documentId,
      recordNumber: rec.recordNumber,
      month: rec.month,
      year: rec.year,
      baseSalary: rec.baseSalary,
      allowances: rec.allowances,
      deductions: rec.deductions,
      netSalary: rec.netSalary,
      status: rec.status,
      notes: rec.notes,
      rejectionReason: rec.rejectionReason,
      createdAt: rec.createdAt,
      staffId: rec.staff?.id || null,
      staffDocumentId: rec.staff?.documentId || null,
      staffName: rec.staff?.username || rec.staff?.name || null,
      staffRole: rec.staff?.schoolRole || null,
      staffEmail: rec.staff?.email || null
    }));

    const flatPayments = salaryPayments.map((pay: any) => ({
      id: pay.id,
      documentId: pay.documentId,
      paymentNumber: pay.paymentNumber,
      amount: pay.amount,
      paymentDate: pay.paymentDate,
      paymentMethod: pay.paymentMethod,
      status: pay.status,
      notes: pay.notes,
      rejectionReason: pay.rejectionReason,
      createdAt: pay.createdAt,
      salaryRecordId: pay.salaryRecord?.id || null,
      salaryRecordDocumentId: pay.salaryRecord?.documentId || null,
      salaryRecordNumber: pay.salaryRecord?.recordNumber || null,
      salaryRecordNetSalary: pay.salaryRecord?.netSalary || 0,
      salaryRecordStatus: pay.salaryRecord?.status || null,
      staffId: pay.staff?.id || null,
      staffDocumentId: pay.staff?.documentId || null,
      staffName: pay.staff?.username || pay.staff?.name || null,
      staffRole: pay.staff?.schoolRole || null,
      staffEmail: pay.staff?.email || null
    }));

    ctx.body = { salaryRecords: flatRecords, salaryPayments: flatPayments };
  },

  async getStats(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTANT' && user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Access denied');
    }
    ctx.body = await strapi.service('api::school-finance.school-finance').getStats();
  },

  async recalculateSystem(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Only an ACCOUNTLEAD or ADMIN can trigger the recalculation engine');
    }
    const result = await strapi.service('api::school-finance.school-finance').recalculateSystem(user.id);
    ctx.body = result;
  },

  async getAuditLogs(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Access denied: Audit logs are restricted');
    }
    ctx.body = await strapi.service('api::school-finance.school-finance').getAuditLogs();
  },

  async createInvoice(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTANT' && user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Access denied');
    }
    const invoice = await strapi.service('api::school-finance.school-finance').createInvoice(ctx.request.body, user.id);
    ctx.body = invoice;
  },

  async approveInvoice(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Only an ACCOUNTLEAD or ADMIN can approve records');
    }
    const invoice = await strapi.service('api::school-finance.school-finance').approveInvoice(Number(ctx.params.id), user.id);
    ctx.body = invoice;
  },

  async rejectInvoice(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Only an ACCOUNTLEAD or ADMIN can reject records');
    }
    const { reason } = ctx.request.body;
    const invoice = await strapi.service('api::school-finance.school-finance').rejectInvoice(Number(ctx.params.id), reason, user.id);
    ctx.body = invoice;
  },

  async createPayment(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTANT' && user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Access denied');
    }
    const payment = await strapi.service('api::school-finance.school-finance').createPayment(ctx.request.body, user.id);
    ctx.body = payment;
  },

  async approvePayment(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Only an ACCOUNTLEAD or ADMIN can approve records');
    }
    const payment = await strapi.service('api::school-finance.school-finance').approvePayment(Number(ctx.params.id), user.id);
    ctx.body = payment;
  },

  async rejectPayment(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Only an ACCOUNTLEAD or ADMIN can reject records');
    }
    const { reason } = ctx.request.body;
    const payment = await strapi.service('api::school-finance.school-finance').rejectPayment(Number(ctx.params.id), reason, user.id);
    ctx.body = payment;
  },

  async getStudentStatement(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const studentId = Number(ctx.params.studentId);
    
    // Authorization safeguard: Students can only view their own statements
    if (user.schoolRole === 'STUDENT' && user.id !== studentId) {
      return ctx.forbidden('Access denied: You can only view your own financial statements');
    }

    ctx.body = await strapi.service('api::school-finance.school-finance').getStudentStatement(studentId);
  },

  async createSalaryRecord(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTANT' && user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Access denied');
    }
    const record = await strapi.service('api::school-finance.school-finance').createSalaryRecord(ctx.request.body, user.id);
    ctx.body = record;
  },

  async approveSalaryRecord(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Only an ACCOUNTLEAD or ADMIN can approve records');
    }
    const record = await strapi.service('api::school-finance.school-finance').approveSalaryRecord(Number(ctx.params.id), user.id);
    ctx.body = record;
  },

  async rejectSalaryRecord(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Only an ACCOUNTLEAD or ADMIN can reject records');
    }
    const { reason } = ctx.request.body;
    const record = await strapi.service('api::school-finance.school-finance').rejectSalaryRecord(Number(ctx.params.id), reason, user.id);
    ctx.body = record;
  },

  async createSalaryPayment(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTANT' && user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Access denied');
    }
    const payment = await strapi.service('api::school-finance.school-finance').createSalaryPayment(ctx.request.body, user.id);
    ctx.body = payment;
  },

  async approveSalaryPayment(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Only an ACCOUNTLEAD or ADMIN can approve records');
    }
    const payment = await strapi.service('api::school-finance.school-finance').approveSalaryPayment(Number(ctx.params.id), user.id);
    ctx.body = payment;
  },

  async rejectSalaryPayment(ctx: any) {
    const user = ctx.state.user;
    if (!user || (user.schoolRole !== 'ACCOUNTLEAD' && user.schoolRole !== 'ADMIN')) {
      return ctx.forbidden('Only an ACCOUNTLEAD or ADMIN can reject records');
    }
    const { reason } = ctx.request.body;
    const payment = await strapi.service('api::school-finance.school-finance').rejectSalaryPayment(Number(ctx.params.id), reason, user.id);
    ctx.body = payment;
  }
};
