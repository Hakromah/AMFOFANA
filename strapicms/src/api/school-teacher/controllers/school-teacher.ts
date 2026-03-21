/**
 * school-teacher controller
 */

export default {
  async getMyClasses(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getClassesByTeacher(user.id);
  },

  async getStudentsByClass(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getStudentsByClass(
      user.id, Number(ctx.params.classId)
    );
  },

  async getMyStudents(ctx: any) {
    const user = ctx.state.user;
    const { classId } = ctx.query;
    if (classId) {
      ctx.body = await strapi.service('api::school-teacher.school-teacher').getStudentsByClass(user.id, Number(classId));
    } else {
      ctx.body = await strapi.service('api::school-teacher.school-teacher').getStudentsByTeacher(user.id);
    }
  },

  async submitAttendance(ctx: any) {
    await strapi.service('api::school-teacher.school-teacher').submitAttendance(ctx.request.body);
    ctx.body = {};
  },

  async updateAttendance(ctx: any) {
    await strapi.service('api::school-teacher.school-teacher').updateAttendance(
      Number(ctx.params.attendanceId), ctx.request.body
    );
    ctx.body = {};
  },

  async getAttendanceHistory(ctx: any) {
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getAttendanceHistory(
      Number(ctx.params.classId)
    );
  },

  async createExam(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').createExam(user.id, ctx.request.body);
  },

  async getMyExams(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getExamsByTeacher(user.id);
  },

  async updateExam(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').updateExam(
      Number(ctx.params.id), ctx.request.body, user.id
    );
  },

  async deleteExam(ctx: any) {
    const user = ctx.state.user;
    await strapi.service('api::school-teacher.school-teacher').deleteExam(Number(ctx.params.id), user.id);
    ctx.body = {};
  },

  async toggleExamStatus(ctx: any) {
    const { closed } = ctx.request.body;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').toggleExamStatus(
      Number(ctx.params.id), Boolean(closed)
    );
  },

  async getGradebook(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getGradebookByClass(
      user.id, Number(ctx.params.classId)
    );
  },

  async saveBulkResults(ctx: any) {
    const user = ctx.state.user;
    await strapi.service('api::school-teacher.school-teacher').saveBulkResults(user.id, ctx.request.body);
    ctx.body = { message: 'Bulk marks saved successfully' };
  },

  async createResult(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').saveResult(user.id, ctx.request.body);
  },

  async updateResult(ctx: any) {
    ctx.body = await strapi.service('api::school-teacher.school-teacher').updateResult(
      Number(ctx.params.id), ctx.request.body
    );
  },

  async submitResults(ctx: any) {
    await strapi.service('api::school-teacher.school-teacher').submitResults(ctx.request.body);
    ctx.body = {};
  },

  async getResults(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getResultsByTeacher(user.id);
  },

  async filterResults(ctx: any) {
    const { classId, studentId } = ctx.query;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').filterResults(
      classId ? Number(classId) : undefined, studentId as string
    );
  },

  async submitMarks(ctx: any) {
    await strapi.service('api::school-teacher.school-teacher').submitMarks(ctx.request.body);
    ctx.body = {};
  },

  async getMyTimetable(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getTeacherTimetable(user.id);
  },

  async getAllSubjects(ctx: any) {
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getAllSubjects();
  },

  async updateProfile(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').updateProfile(user.id, ctx.request.body);
  },

  async changePassword(ctx: any) {
    const user = ctx.state.user;
    await strapi.service('api::school-teacher.school-teacher').changePassword(
      user.id, ctx.request.body.currentPassword, ctx.request.body.newPassword
    );
    ctx.body = {};
  },

  async getTeacherMaterials(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getTeacherMaterials(user.id);
  },

  async getMyClassesForMaterials(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getClassesByTeacher(user.id);
  },

  async uploadTeacherMaterial(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').uploadTeacherMaterial(
      user.id, 
      ctx.request.body, 
      ctx.request.files
    );
  },

  async deleteTeacherMaterial(ctx: any) {
    const user = ctx.state.user;
    await strapi.service('api::school-teacher.school-teacher').deleteTeacherMaterial(user.id, Number(ctx.params.id));
    ctx.body = { message: 'Deleted' };
  },
};
