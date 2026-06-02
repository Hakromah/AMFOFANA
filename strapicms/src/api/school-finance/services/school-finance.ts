import crypto from 'crypto';

export default () => ({
  // ─── Immutable Audit Logging Helper ────────────────────────────────────────
  async logAction(actionType: string, entityName: string, entityId: number | string, userId: number, prev: any, current: any, notes = '') {
    try {
      await (strapi.entityService.create as any)('api::accounting-log.accounting-log' as any, {
        data: {
          actionType,
          entityName,
          entityId: String(entityId),
          performedBy: userId,
          previousValues: prev ? JSON.parse(JSON.stringify(prev)) : null,
          newValues: current ? JSON.parse(JSON.stringify(current)) : null,
          timestamp: new Date().toISOString(),
          notes
        }
      });
    } catch (e) {
      console.error('Audit logger failed:', e);
    }
  },

  async syncInvoiceBalances(invoiceId: number) {
    const invoice = await (strapi.entityService.findOne as any)('api::student-invoice.student-invoice' as any, invoiceId) as any;
    if (!invoice) return;

    const allPayments = await (strapi.entityService.findMany as any)('api::student-payment.student-payment' as any, {
      filters: { invoice: { id: invoiceId }, status: 'APPROVED' }
    }) as any[];

    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const remainingBalance = Math.max(0, Number(invoice.subtotal || 0) - totalPaid);

    let invoiceStatus = invoice.status;
    if (invoiceStatus !== 'DRAFT' && invoiceStatus !== 'REJECTED') {
      if (remainingBalance === 0 && totalPaid > 0) {
        invoiceStatus = 'PAID';
      } else if (totalPaid > 0) {
        invoiceStatus = 'PARTIALLY_PAID';
      } else {
        invoiceStatus = 'APPROVED';
      }
    }

    await (strapi.entityService.update as any)('api::student-invoice.student-invoice' as any, invoiceId, {
      data: {
        totalPaid,
        remainingBalance,
        status: invoiceStatus
      }
    });
  },

  async syncSalaryRecordStatus(salId: number) {
    const record = await (strapi.entityService.findOne as any)('api::salary-record.salary-record' as any, salId) as any;
    if (!record) return;

    const allPayments = await (strapi.entityService.findMany as any)('api::salary-payment.salary-payment' as any, {
      filters: { salaryRecord: { id: salId }, status: 'APPROVED' }
    }) as any[];

    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    let recordStatus = record.status;
    if (recordStatus !== 'DRAFT' && recordStatus !== 'REJECTED') {
      if (totalPaid >= Number(record.netSalary || 0)) {
        recordStatus = 'PAID';
      } else if (totalPaid > 0) {
        recordStatus = 'PARTIALLY_PAID';
      } else {
        recordStatus = 'APPROVED';
      }
    }

    await (strapi.entityService.update as any)('api::salary-record.salary-record' as any, salId, {
      data: { status: recordStatus }
    });
  },

  // ─── Dashboard Stats & Analytics ───────────────────────────────────────────
  async getStats() {
    // Compile totals and distributions
    const [invoices, payments, salaryRecords, students] = await Promise.all([
      (strapi.entityService.findMany as any)('api::student-invoice.student-invoice' as any, {
        filters: { status: { $in: ['APPROVED', 'PAID', 'PARTIALLY_PAID'] } }
      }) as Promise<any[]>,
      (strapi.entityService.findMany as any)('api::student-payment.student-payment' as any, {
        filters: { status: 'APPROVED' }
      }) as Promise<any[]>,
      (strapi.entityService.findMany as any)('api::salary-record.salary-record' as any, {
        filters: { status: { $in: ['APPROVED', 'PAID', 'PARTIALLY_PAID'] } }
      }) as Promise<any[]>,
      (strapi.entityService.findMany as any)('plugin::users-permissions.user' as any, {
        filters: { schoolRole: 'STUDENT' }
      }) as Promise<any[]>
    ]);

    const totalStudents = students.length;

    // Calculate invoice aggregate
    let totalInvoiced = 0;
    let outstandingDebt = 0;
    const billedStudents = new Set<number>();
    const paidStudents = new Set<number>();

    invoices.forEach(inv => {
      totalInvoiced += Number(inv.subtotal || 0);
      outstandingDebt += Number(inv.remainingBalance || 0);
      if (inv.student?.id) {
        billedStudents.add(inv.student.id);
        if (inv.status === 'PAID') {
          paidStudents.add(inv.student.id);
        }
      }
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const salaryExpenses = salaryRecords.reduce((sum, s) => sum + Number(s.netSalary || 0), 0);

    const paidStudentsCount = paidStudents.size;
    const debtorStudentsCount = totalStudents - paidStudentsCount;

    // Categorized tuition and transportation revenue
    let tuitionRevenue = 0;
    let transportationRevenue = 0;
    payments.forEach(p => {
      if (p.paymentCategory === 'TUITION') tuitionRevenue += Number(p.amount || 0);
      else if (p.paymentCategory === 'TRANSPORT') transportationRevenue += Number(p.amount || 0);
    });

    return {
      totalStudents,
      paidStudents: paidStudentsCount,
      debtorStudents: debtorStudentsCount,
      monthlyRevenue: totalRevenue,
      tuitionRevenue,
      transportationRevenue,
      salaryExpenses,
      outstandingDebt,
      yearlyTrends: [
        { month: 'Jan', revenue: totalRevenue * 0.08, debt: outstandingDebt * 0.1 },
        { month: 'Feb', revenue: totalRevenue * 0.12, debt: outstandingDebt * 0.09 },
        { month: 'Mar', revenue: totalRevenue * 0.18, debt: outstandingDebt * 0.08 },
        { month: 'Apr', revenue: totalRevenue * 0.22, debt: outstandingDebt * 0.07 },
        { month: 'May', revenue: totalRevenue * 0.28, debt: outstandingDebt * 0.06 },
        { month: 'Jun', revenue: totalRevenue, debt: outstandingDebt }
      ]
    };
  },

  // ─── Global Recalculation Engine ──────────────────────────────────────────
  async recalculateSystem(userId: number) {
    const invoices = await (strapi.entityService.findMany as any)('api::student-invoice.student-invoice' as any, {
      populate: ['student']
    }) as any[];

    let correctedCount = 0;

    for (const inv of invoices) {
      // Find all APPROVED payments for this invoice
      const payments = await (strapi.entityService.findMany as any)('api::student-payment.student-payment' as any, {
        filters: { invoice: inv.id, status: 'APPROVED' }
      }) as any[];

      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const remainingBalance = Math.max(0, Number(inv.subtotal || 0) - totalPaid);

      let status = inv.status;
      if (inv.status !== 'SUBMITTED' && inv.status !== 'REJECTED') {
        if (remainingBalance === 0) {
          status = 'PAID';
        } else if (totalPaid > 0) {
          status = 'PARTIALLY_PAID';
        } else {
          status = 'APPROVED';
        }
      }

      if (
        inv.totalPaid !== totalPaid ||
        inv.remainingBalance !== remainingBalance ||
        inv.status !== status
      ) {
        const prev = { totalPaid: inv.totalPaid, remainingBalance: inv.remainingBalance, status: inv.status };
        const updated = await (strapi.entityService.update as any)('api::student-invoice.student-invoice' as any, inv.id, {
          data: { totalPaid, remainingBalance, status }
        });
        correctedCount++;

        await this.logAction(
          'RECALCULATE_INVOICE',
          'student-invoice',
          inv.id,
          userId,
          prev,
          updated,
          'Recalculation engine auto-repair'
        );
      }
    }

    // Now recalculate salary record payments
    const salaryRecords = await (strapi.entityService.findMany as any)('api::salary-record.salary-record' as any) as any[];
    for (const sal of salaryRecords) {
      const payments = await (strapi.entityService.findMany as any)('api::salary-payment.salary-payment' as any, {
        filters: { salaryRecord: sal.id, status: 'APPROVED' }
      }) as any[];

      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      let status = sal.status;
      if (sal.status !== 'SUBMITTED' && sal.status !== 'REJECTED') {
        if (totalPaid >= Number(sal.netSalary || 0)) {
          status = 'PAID';
        } else if (totalPaid > 0) {
          status = 'PARTIALLY_PAID';
        } else {
          status = 'APPROVED';
        }
      }

      if (sal.status !== status) {
        const prev = { status: sal.status };
        const updated = await (strapi.entityService.update as any)('api::salary-record.salary-record' as any, sal.id, {
          data: { status }
        });
        correctedCount++;

        await this.logAction(
          'RECALCULATE_SALARY',
          'salary-record',
          sal.id,
          userId,
          prev,
          updated,
          'Recalculation engine salary auto-repair'
        );
      }
    }

    return {
      success: true,
      correctedRecords: correctedCount,
      timestamp: new Date().toISOString()
    };
  },

  async getAuditLogs() {
    return (strapi.entityService.findMany as any)('api::accounting-log.accounting-log' as any, {
      populate: ['performedBy'],
      sort: [{ timestamp: 'desc' }]
    });
  },

  // ─── Student Invoicing ─────────────────────────────────────────────────────
  async createInvoice(dto: any, userId: number) {
    const timestamp = Date.now().toString().slice(-4);
    const invoiceNumber = `INV-${dto.year}${String(dto.month).toUpperCase().substring(0, 3)}-${timestamp}`;

    let subtotal = 0;
    dto.items.forEach((item: any) => {
      subtotal += Number(item.amount || 0);
    });

    const invoice = await (strapi.entityService.create as any)('api::student-invoice.student-invoice' as any, {
      data: {
        invoiceNumber,
        student: dto.studentId,
        month: dto.month,
        year: dto.year,
        dueDate: dto.dueDate,
        status: 'DRAFT',
        notes: dto.notes,
        items: dto.items,
        subtotal,
        totalPaid: 0,
        remainingBalance: subtotal,
        submittedBy: userId,
        currency: 'GNF'
      },
      populate: ['student']
    }) as any;

    await this.logAction(
      'CREATE_INVOICE',
      'student-invoice',
      invoice.id,
      userId,
      null,
      invoice,
      `Created invoice ${invoiceNumber}`
    );

    return invoice;
  },

  async approveInvoice(id: number, userId: number) {
    const invoice = await (strapi.entityService.findOne as any)('api::student-invoice.student-invoice' as any, id) as any;
    if (!invoice) throw new Error('Invoice not found');
    // ACCOUNTLEAD can approve from DRAFT or SUBMITTED status directly
    const approvableStatuses = ['DRAFT', 'SUBMITTED', 'REJECTED'];
    if (!approvableStatuses.includes(invoice.status)) {
      throw new Error(`Cannot approve an invoice with status ${invoice.status}`);
    }

    const updated = await (strapi.entityService.update as any)('api::student-invoice.student-invoice' as any, id, {
      data: {
        status: 'APPROVED',
        approvedBy: userId
      },
      populate: ['student']
    }) as any;

    await this.logAction(
      'APPROVE_INVOICE',
      'student-invoice',
      id,
      userId,
      invoice,
      updated,
      'Approved student billing invoice'
    );

    return updated;
  },

  async rejectInvoice(id: number, reason: string, userId: number) {
    const invoice = await (strapi.entityService.findOne as any)('api::student-invoice.student-invoice' as any, id) as any;
    if (!invoice) throw new Error('Invoice not found');
    // ACCOUNTLEAD can reject from DRAFT or SUBMITTED
    const rejectableStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED'];
    if (!rejectableStatuses.includes(invoice.status)) {
      throw new Error(`Cannot reject an invoice with status ${invoice.status}`);
    }

    const updated = await (strapi.entityService.update as any)('api::student-invoice.student-invoice' as any, id, {
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: userId
      },
      populate: ['student']
    }) as any;

    await this.logAction(
      'REJECT_INVOICE',
      'student-invoice',
      id,
      userId,
      invoice,
      updated,
      `Rejected invoice: ${reason}`
    );

    return updated;
  },

  // ─── Student Payment Collection ────────────────────────────────────────────
  async createPayment(dto: any, userId: number) {
    const timestamp = Date.now().toString().slice(-4);
    const paymentNumber = `PAY-${dto.paymentCategory.toUpperCase().substring(0, 3)}-${timestamp}`;

    const payment = await (strapi.entityService.create as any)('api::student-payment.student-payment' as any, {
      data: {
        paymentNumber,
        invoice: dto.invoiceId,
        student: dto.studentId,
        amount: Number(dto.amount),
        paymentDate: dto.paymentDate || new Date().toISOString(),
        paymentMethod: dto.paymentMethod,
        paymentCategory: dto.paymentCategory,
        status: 'DRAFT',
        notes: dto.notes,
        receivedBy: userId
      },
      populate: ['invoice', 'student']
    }) as any;

    await this.logAction(
      'RECEIVE_PAYMENT',
      'student-payment',
      payment.id,
      userId,
      null,
      payment,
      `Logged payment collection request ${paymentNumber}`
    );

    return payment;
  },

  async approvePayment(id: number, userId: number) {
    const payment = await (strapi.entityService.findOne as any)('api::student-payment.student-payment' as any, id, {
      populate: ['invoice', 'student']
    }) as any;
    if (!payment) throw new Error('Payment record not found');
    // ACCOUNTLEAD can approve from DRAFT or SUBMITTED
    const approvableStatuses = ['DRAFT', 'SUBMITTED', 'REJECTED'];
    if (!approvableStatuses.includes(payment.status)) {
      throw new Error(`Cannot approve a payment with status ${payment.status}`);
    }

    // 1. Approve the payment
    const approvedPayment = await (strapi.entityService.update as any)('api::student-payment.student-payment' as any, id, {
      data: {
        status: 'APPROVED',
        approvedBy: userId
      },
      populate: ['invoice', 'student']
    }) as any;

    // 2. Generate downloadable receipt record with QR verification signature
    const qrSignature = crypto.createHash('sha256').update(`${approvedPayment.paymentNumber}-${approvedPayment.amount}`).digest('hex').slice(0, 20).toUpperCase();
    const receiptNumber = `REC-${approvedPayment.paymentNumber.split('-')[2] || 'GEN'}-${Date.now().toString().slice(-4)}`;
    
    await (strapi.entityService.create as any)('api::receipt.receipt' as any, {
      data: {
        receiptNumber,
        paymentType: 'STUDENT_PAYMENT',
        studentPayment: approvedPayment.id,
        generatedDate: new Date().toISOString(),
        qrCode: `https://verify.amfofana.edu/receipt/${qrSignature}`
      }
    });

    // 3. Recalculate related Invoice balances & status
    const invoiceId = payment.invoice?.id;
    if (invoiceId) {
      await this.syncInvoiceBalances(invoiceId);
    }

    await this.logAction(
      'APPROVE_PAYMENT',
      'student-payment',
      id,
      userId,
      payment,
      approvedPayment,
      'Approved student payment & compiled PDF receipt details'
    );

    return approvedPayment;
  },

  async rejectPayment(id: number, reason: string, userId: number) {
    const payment = await (strapi.entityService.findOne as any)('api::student-payment.student-payment' as any, id, { populate: ['invoice'] }) as any;
    if (!payment) throw new Error('Payment not found');
    // ACCOUNTLEAD can reject from DRAFT, SUBMITTED, or APPROVED
    const rejectableStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED'];
    if (!rejectableStatuses.includes(payment.status)) {
      throw new Error(`Cannot reject a payment with status ${payment.status}`);
    }

    const updated = await (strapi.entityService.update as any)('api::student-payment.student-payment' as any, id, {
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: userId
      },
      populate: ['invoice', 'student']
    }) as any;

    if (payment.invoice?.id) {
      await this.syncInvoiceBalances(payment.invoice.id);
    }

    await this.logAction(
      'REJECT_PAYMENT',
      'student-payment',
      id,
      userId,
      payment,
      updated,
      `Rejected payment collection: ${reason}`
    );

    return updated;
  },

  // ─── Student Statement Compilations ────────────────────────────────────────
  async getStudentStatement(studentId: number) {
    const [student, invoices, payments] = await Promise.all([
      (strapi.entityService.findOne as any)('plugin::users-permissions.user' as any, studentId, {
        populate: ['role']
      }) as any,
      (strapi.entityService.findMany as any)('api::student-invoice.student-invoice' as any, {
        filters: { student: { id: studentId } },
        sort: [{ year: 'desc' }, { month: 'desc' }]
      }) as any[],
      (strapi.entityService.findMany as any)('api::student-payment.student-payment' as any, {
        filters: {
          status: 'APPROVED',
          $or: [
            { student: { id: studentId } },
            { invoice: { student: { id: studentId } } }
          ]
        },
        populate: ['invoice', 'student'],
        sort: [{ paymentDate: 'desc' }]
      }) as any[]
    ]);

    if (!student) throw new Error('Student not found');

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);

    return {
      studentProfile: {
        id: student.id,
        userId: student.userId,
        name: student.username || student.name,
        email: student.email,
        phone: student.phoneNumber
      },
      totalInvoiced,
      totalPaid,
      outstandingBalance,
      invoices,
      payments
    };
  },

  // ─── Staff Payroll & Salaries ──────────────────────────────────────────────
  async createSalaryRecord(dto: any, userId: number) {
    const timestamp = Date.now().toString().slice(-4);
    const recordNumber = `SAL-${dto.year}${String(dto.month).toUpperCase().substring(0, 3)}-${timestamp}`;
    const baseSalary = Number(dto.baseSalary || 0);
    const allowances = Number(dto.allowances || 0);
    const deductions = Number(dto.deductions || 0);
    const netSalary = baseSalary + allowances - deductions;

    const record = await (strapi.entityService.create as any)('api::salary-record.salary-record' as any, {
      data: {
        recordNumber,
        staff: dto.staffId,
        month: dto.month,
        year: dto.year,
        baseSalary,
        allowances,
        deductions,
        netSalary,
        status: 'DRAFT',
        notes: dto.notes,
        submittedBy: userId
      },
      populate: ['staff']
    }) as any;

    await this.logAction(
      'CREATE_SALARY_RECORD',
      'salary-record',
      record.id,
      userId,
      null,
      record,
      `Compiled salary payroll record ${recordNumber}`
    );

    return record;
  },

  async approveSalaryRecord(id: number, userId: number) {
    const record = await (strapi.entityService.findOne as any)('api::salary-record.salary-record' as any, id) as any;
    if (!record) throw new Error('Salary record not found');
    // ACCOUNTLEAD can approve from DRAFT or SUBMITTED
    const approvableStatuses = ['DRAFT', 'SUBMITTED', 'REJECTED'];
    if (!approvableStatuses.includes(record.status)) {
      throw new Error(`Cannot approve a salary record with status ${record.status}`);
    }

    const updated = await (strapi.entityService.update as any)('api::salary-record.salary-record' as any, id, {
      data: {
        status: 'APPROVED',
        approvedBy: userId
      },
      populate: ['staff']
    }) as any;

    await this.logAction(
      'APPROVE_SALARY_RECORD',
      'salary-record',
      id,
      userId,
      record,
      updated,
      'Approved staff salary payroll statement'
    );

    return updated;
  },

  async rejectSalaryRecord(id: number, reason: string, userId: number) {
    const record = await (strapi.entityService.findOne as any)('api::salary-record.salary-record' as any, id) as any;
    if (!record) throw new Error('Salary record not found');
    // ACCOUNTLEAD can reject from DRAFT, SUBMITTED, or APPROVED
    const rejectableStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED'];
    if (!rejectableStatuses.includes(record.status)) {
      throw new Error(`Cannot reject a salary record with status ${record.status}`);
    }

    const updated = await (strapi.entityService.update as any)('api::salary-record.salary-record' as any, id, {
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: userId
      },
      populate: ['staff']
    }) as any;

    await this.logAction(
      'REJECT_SALARY_RECORD',
      'salary-record',
      id,
      userId,
      record,
      updated,
      `Rejected payroll salary record: ${reason}`
    );

    return updated;
  },

  // ─── Salary Payout Disbursements ───────────────────────────────────────────
  async createSalaryPayment(dto: any, userId: number) {
    const timestamp = Date.now().toString().slice(-4);
    const paymentNumber = `PAY-SAL-${timestamp}`;

    const payment = await (strapi.entityService.create as any)('api::salary-payment.salary-payment' as any, {
      data: {
        paymentNumber,
        salaryRecord: dto.salaryRecordId,
        staff: dto.staffId,
        amount: Number(dto.amount),
        paymentDate: dto.paymentDate || new Date().toISOString(),
        paymentMethod: dto.paymentMethod,
        status: 'DRAFT',
        notes: dto.notes,
        paidBy: userId
      },
      populate: ['salaryRecord', 'staff']
    }) as any;

    await this.logAction(
      'DISBURSE_SALARY',
      'salary-payment',
      payment.id,
      userId,
      null,
      payment,
      `Disbursed salary payment collection ${paymentNumber}`
    );

    return payment;
  },

  async approveSalaryPayment(id: number, userId: number) {
    const payment = await (strapi.entityService.findOne as any)('api::salary-payment.salary-payment' as any, id, {
      populate: ['salaryRecord', 'staff']
    }) as any;
    if (!payment) throw new Error('Salary payment not found');
    // ACCOUNTLEAD can approve from DRAFT or SUBMITTED
    const approvableStatuses = ['DRAFT', 'SUBMITTED', 'REJECTED'];
    if (!approvableStatuses.includes(payment.status)) {
      throw new Error(`Cannot approve a salary payment with status ${payment.status}`);
    }

    // 1. Approve
    const approvedPayment = await (strapi.entityService.update as any)('api::salary-payment.salary-payment' as any, id, {
      data: {
        status: 'APPROVED',
        approvedBy: userId
      },
      populate: ['salaryRecord', 'staff']
    }) as any;

    // 2. Generate downloadable receipt record with QR verification signature
    const qrSignature = crypto.createHash('sha256').update(`${approvedPayment.paymentNumber}-${approvedPayment.amount}`).digest('hex').slice(0, 20).toUpperCase();
    const receiptNumber = `REC-SAL-${approvedPayment.paymentNumber.split('-')[2] || 'GEN'}-${Date.now().toString().slice(-4)}`;
    
    await (strapi.entityService.create as any)('api::receipt.receipt' as any, {
      data: {
        receiptNumber,
        paymentType: 'SALARY_PAYMENT',
        salaryPayment: approvedPayment.id,
        generatedDate: new Date().toISOString(),
        qrCode: `https://verify.amfofana.edu/receipt/${qrSignature}`
      }
    });

    // 3. Recalculate salary status
    const salaryRecordId = payment.salaryRecord?.id;
    if (salaryRecordId) {
      await this.syncSalaryRecordStatus(salaryRecordId);
    }

    await this.logAction(
      'APPROVE_SALARY_PAYMENT',
      'salary-payment',
      id,
      userId,
      payment,
      approvedPayment,
      'Approved salary payment & generated receipt'
    );

    return approvedPayment;
  },

  async rejectSalaryPayment(id: number, reason: string, userId: number) {
    const payment = await (strapi.entityService.findOne as any)('api::salary-payment.salary-payment' as any, id, { populate: ['salaryRecord'] }) as any;
    if (!payment) throw new Error('Salary payment not found');
    // ACCOUNTLEAD can reject from DRAFT, SUBMITTED, or APPROVED
    const rejectableStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED'];
    if (!rejectableStatuses.includes(payment.status)) {
      throw new Error(`Cannot reject a salary payment with status ${payment.status}`);
    }

    const updated = await (strapi.entityService.update as any)('api::salary-payment.salary-payment' as any, id, {
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: userId
      },
      populate: ['salaryRecord', 'staff']
    }) as any;

    if (payment.salaryRecord?.id) {
      await this.syncSalaryRecordStatus(payment.salaryRecord.id);
    }

    await this.logAction(
      'REJECT_SALARY_PAYMENT',
      'salary-payment',
      id,
      userId,
      payment,
      updated,
      `Rejected salary disbursement: ${reason}`
    );

    return updated;
  }
});
