/**
 * school-admin controller
 * Maps all HTTP endpoints → AdminService methods (replicating Spring Boot AdminController)
 */

export default {
  // ─── Users ─────────────────────────────────────────────────────────
  async getAllUsers(ctx: any) {
    const { role } = ctx.query;
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllUsers(role);
  },

  async createUser(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').createUser(ctx.request.body);
  },

  async bulkCreateUsers(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').bulkCreateUsers(ctx.request.body);
  },

  async updateUser(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').updateUser(
      Number(ctx.params.id),
      ctx.request.body,
    );
  },

  async deleteUser(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteUser(Number(ctx.params.id));
    ctx.body = {};
  },

  // ─── Classes ───────────────────────────────────────────────────────
  async getAllClasses(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllClasses();
  },

  async createClass(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').createClass(ctx.request.body);
  },

  async updateClass(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').updateClass(
      Number(ctx.params.id),
      ctx.request.body,
    );
  },

  async deleteClass(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteClass(Number(ctx.params.id));
    ctx.body = {};
  },

  async assignTeacher(ctx: any) {
    const { teacherId, classId } = ctx.request.body;
    await strapi.service('api::school-admin.school-admin').assignTeacherToClass(teacherId, classId);
    ctx.body = {};
  },

  async assignStudent(ctx: any) {
    const { studentId, classId } = ctx.request.body;
    await strapi.service('api::school-admin.school-admin').assignStudentToClass(studentId, classId);
    ctx.body = {};
  },

  async getClassesForStudent(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getClassesForStudent(
      Number(ctx.params.studentId),
    );
  },

  // ─── Subjects ──────────────────────────────────────────────────────
  async getAllSubjects(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllSubjects();
  },

  async createSubject(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').createSubject(ctx.request.body);
  },

  async updateSubject(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').updateSubject(
      Number(ctx.params.id),
      ctx.request.body,
    );
  },

  async deleteSubject(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteSubject(Number(ctx.params.id));
    ctx.body = {};
  },

  // ─── Learning Materials ────────────────────────────────────────────
  async getAllMaterials(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllMaterials();
  },

  async createMaterial(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').createMaterial(ctx.request.body);
  },

  async deleteMaterial(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteMaterial(Number(ctx.params.id));
    ctx.body = {};
  },

  async getMaterialAnalytics(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getMaterialAnalytics();
  },

  // ─── Timetables ────────────────────────────────────────────────────
  async getAllTimetables(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllTimetables();
  },

  async createTimetable(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').createTimetable(ctx.request.body);
  },

  async updateTimetable(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').updateTimetable(
      Number(ctx.params.id),
      ctx.request.body,
    );
  },

  async deleteTimetable(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteTimetable(Number(ctx.params.id));
    ctx.body = {};
  },

  // ─── Exams ─────────────────────────────────────────────────────────
  async getExams(ctx: any) {
    const { teacherId, classId } = ctx.query;
    ctx.body = await strapi.service('api::school-admin.school-admin').getExams({
      teacherId: teacherId ? Number(teacherId) : undefined,
      classId: classId ? Number(classId) : undefined,
    });
  },

  async lockSemesterExams(ctx: any) {
    const semester = ctx.request.body?.semester || ctx.query.semester;
    await strapi.service('api::school-admin.school-admin').lockAllExamsInSemester(semester);
    ctx.body = {};
  },

  // ─── Results & Reports ─────────────────────────────────────────────
  async filterResults(ctx: any) {
    const { studentQuery, classId } = ctx.query;
    ctx.body = await strapi.service('api::school-admin.school-admin').filterResultsForAdmin(
      studentQuery,
      classId ? Number(classId) : undefined,
    );
  },

  async getSummaryReport(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getSummaryReport();
  },

  async getSemesterGPA(ctx: any) {
    const { studentId, semester } = ctx.query;
    ctx.body = await strapi.service('api::school-admin.school-admin').calculateSemesterGPA(
      Number(studentId),
      semester as string,
    );
  },

  async finalizeSemester(ctx: any) {
    const semester = ctx.query.semester as string;
    await strapi.service('api::school-admin.school-admin').lockSemesterResults(semester);
    ctx.body = { message: `Semester ${semester} has been officially closed.` };
  },

  // ─── Profile & Password ────────────────────────────────────────────
  async updateProfile(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-admin.school-admin').updateProfile(
      user.id,
      ctx.request.body,
    );
  },

  async changePassword(ctx: any) {
    const user = ctx.state.user;
    await strapi.service('api::school-admin.school-admin').changePassword(
      user.id,
      ctx.request.body.currentPassword,
      ctx.request.body.newPassword,
    );
    ctx.body = {};
  },
};
