/**
 * school-finance API routes
 */

export default {
  routes: [
    // ─── Flat Finance Data Endpoints ──────────────────────────────────────────
    {
      method: 'GET',
      path: '/school-finance/data/students',
      handler: 'school-finance.getStudentFinanceData',
      config: { middlewares: [] }
    },
    {
      method: 'GET',
      path: '/school-finance/data/staff',
      handler: 'school-finance.getStaffFinanceData',
      config: { middlewares: [] }
    },
    {
      method: 'GET',
      path: '/school-finance/stats',
      handler: 'school-finance.getStats',
      config: { middlewares: [] }
    },
    {
      method: 'POST',
      path: '/school-finance/recalculate',
      handler: 'school-finance.recalculateSystem',
      config: { middlewares: [] }
    },
    {
      method: 'GET',
      path: '/school-finance/audit-logs',
      handler: 'school-finance.getAuditLogs',
      config: { middlewares: [] }
    },
    {
      method: 'POST',
      path: '/school-finance/invoices',
      handler: 'school-finance.createInvoice',
      config: { middlewares: [] }
    },
    {
      method: 'PUT',
      path: '/school-finance/invoices/:id/approve',
      handler: 'school-finance.approveInvoice',
      config: { middlewares: [] }
    },
    {
      method: 'PUT',
      path: '/school-finance/invoices/:id/reject',
      handler: 'school-finance.rejectInvoice',
      config: { middlewares: [] }
    },
    {
      method: 'POST',
      path: '/school-finance/payments',
      handler: 'school-finance.createPayment',
      config: { middlewares: [] }
    },
    {
      method: 'PUT',
      path: '/school-finance/payments/:id/approve',
      handler: 'school-finance.approvePayment',
      config: { middlewares: [] }
    },
    {
      method: 'PUT',
      path: '/school-finance/payments/:id/reject',
      handler: 'school-finance.rejectPayment',
      config: { middlewares: [] }
    },
    {
      method: 'GET',
      path: '/school-finance/statements/:studentId',
      handler: 'school-finance.getStudentStatement',
      config: { middlewares: [] }
    },
    {
      method: 'POST',
      path: '/school-finance/salaries',
      handler: 'school-finance.createSalaryRecord',
      config: { middlewares: [] }
    },
    {
      method: 'PUT',
      path: '/school-finance/salaries/:id/approve',
      handler: 'school-finance.approveSalaryRecord',
      config: { middlewares: [] }
    },
    {
      method: 'PUT',
      path: '/school-finance/salaries/:id/reject',
      handler: 'school-finance.rejectSalaryRecord',
      config: { middlewares: [] }
    },
    {
      method: 'POST',
      path: '/school-finance/salary-payments',
      handler: 'school-finance.createSalaryPayment',
      config: { middlewares: [] }
    },
    {
      method: 'PUT',
      path: '/school-finance/salary-payments/:id/approve',
      handler: 'school-finance.approveSalaryPayment',
      config: { middlewares: [] }
    },
    {
      method: 'PUT',
      path: '/school-finance/salary-payments/:id/reject',
      handler: 'school-finance.rejectSalaryPayment',
      config: { middlewares: [] }
    }
  ]
};
