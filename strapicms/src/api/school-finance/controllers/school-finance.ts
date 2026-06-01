/**
 * school-finance custom controller
 */

export default {
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
