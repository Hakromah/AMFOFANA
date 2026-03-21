/**
 * school-student controller
 */

export default {
  async getProfile(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getStudentProfile(user.email);
  },

  async updateProfile(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').updateProfile(
      user.email, ctx.request.body
    );
  },

  async changePassword(ctx: any) {
    const user = ctx.state.user;
    await strapi.service('api::school-student.school-student').changePassword(
      user.email,
      ctx.request.body.currentPassword,
      ctx.request.body.newPassword,
    );
    ctx.body = { message: 'Security credentials updated' };
  },

  async getMyClasses(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getClassesByStudent(user.id);
  },

  async getMyAttendance(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getAttendanceByStudent(user.id);
  },

  async getMyTimetable(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getStudentTimetable(user.id);
  },

  async getMyExams(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getExamsForStudent(user.id);
  },

  async getMyResults(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getResultsByStudent(user.id);
  },

  async getSemesterTranscript(ctx: any) {
    const user = ctx.state.user;
    const { semester } = ctx.query;
    ctx.body = await strapi.service('api::school-student.school-student').getSemesterTranscript(
      user.id, semester as string
    );
  },

  async getDashboardStats(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getDashboardStats(user.id);
  },

  async getMaterialsByClass(ctx: any) {
    const user = ctx.state.user;
    const classId = Number(ctx.params.classId);
    ctx.body = await strapi.service('api::school-student.school-student').getMaterialsByClass(user.id, classId);
  },
};
