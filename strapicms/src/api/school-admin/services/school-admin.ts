/**
 * school-admin service
 * Replicates all AdminService + AdminMaterialService logic from Spring Boot
 */

import { generateUserId } from '../utils/userId';

export default () => ({

  // ─── User Management ─────────────────────────────────────────────

  async getAllUsers(role?: string) {
    const filters: any = {};
    if (role) filters.schoolRole = role.toUpperCase();
    return strapi.entityService.findMany('plugin::users-permissions.user' as any, {
      filters,
      fields: ['id', 'userId', 'username', 'email', 'schoolRole', 'birthDate',
        'birthCountry', 'birthCity', 'address', 'gender', 'phoneNumber', 'createdAt'] as any,
    });
  },

  async createUser(data: any) {
    const userId = data.userId || generateUserId();
    
    const defaultRoles = await strapi.entityService.findMany('plugin::users-permissions.role' as any, {
      filters: { type: 'authenticated' },
    }) as any[];

    // Map frontend Next.js payload to Strapi schema
    const username = data.name || data.username || `user_${Date.now()}`;
    const schoolRole = data.role || data.schoolRole || 'STUDENT';

    // Remove the frontend 'name' and 'role' fields to prevent DB conflict
    const cleanData = { ...data };
    delete cleanData.name;
    delete cleanData.role;

    // Provide plain-text password; Strapi's users-permissions beforeCreate hook hashes it automatically!

    try {
      return await strapi.entityService.create('plugin::users-permissions.user' as any, {
        data: {
          ...cleanData,
          username,
          schoolRole,
          userId,
          password: data.password, // Strapi native hooks take over here!
          provider: 'local', // Mandatory for Strapi v5 local auth!
          role: defaultRoles[0]?.id, // The ID for 'Authenticated' in Strapi Core
          confirmed: true,
        },
      });
    } catch (e: any) {
      const fs = require('fs');
      fs.writeFileSync('C:/Users/pc/AMFOFANA-UPDATES/AMFOFANA/strapicms/error.log', e.stack + '\n\n' + JSON.stringify(e.details));
      throw e;
    }
  },

  async bulkCreateUsers(users: any[]) {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const u of users) {
      try {
        const existing = await strapi.entityService.findMany('plugin::users-permissions.user' as any, {
          filters: { email: u.email } as any,
        });
        if ((existing as any[]).length > 0) { skipped++; continue; }
        await this.createUser(u);
        imported++;
      } catch (e: any) {
        errors.push(u.email + ': ' + e.message);
        skipped++;
      }
    }
    return { imported, skipped, errors };
  },

  async updateUser(id: number, data: any) {
    const cleanData = { ...data };
    const username = data.name || data.username;
    if (username) cleanData.username = username;
    const schoolRole = data.role || data.schoolRole;
    if (schoolRole) cleanData.schoolRole = schoolRole;
    
    delete cleanData.name;
    delete cleanData.role;

    // Strapi's beforeUpdate hook automatically hashes cleanData.password if present

    return strapi.entityService.update('plugin::users-permissions.user' as any, id, { data: cleanData });
  },

  async deleteUser(id: number) {
    return strapi.entityService.delete('plugin::users-permissions.user', id);
  },

  // ─── Class Management ─────────────────────────────────────────────

  async getAllClasses() {
    return strapi.entityService.findMany('api::school-class.school-class', {
      populate: ['teachers', 'students'],
    });
  },

  async createClass(data: any) {
    return strapi.entityService.create('api::school-class.school-class', { data });
  },

  async updateClass(id: number, data: any) {
    return strapi.entityService.update('api::school-class.school-class', id, { data });
  },

  async deleteClass(id: number) {
    return strapi.entityService.delete('api::school-class.school-class', id);
  },

  async assignTeacherToClass(teacherId: number, classId: number) {
    const cls = await strapi.entityService.findOne('api::school-class.school-class', classId, {
      populate: ['teachers'],
    }) as any;
    const existingTeacherIds = (cls.teachers || []).map((t: any) => t.id);
    if (!existingTeacherIds.includes(teacherId)) {
      await strapi.entityService.update('api::school-class.school-class' as any, classId, {
        data: { teachers: { connect: [{ id: teacherId }] } as any },
      });
    }
  },

  async assignStudentToClass(studentId: number, classId: number) {
    const cls = await strapi.entityService.findOne('api::school-class.school-class', classId, {
      populate: ['students'],
    }) as any;
    const existingStudentIds = (cls.students || []).map((s: any) => s.id);
    if (!existingStudentIds.includes(studentId)) {
      await strapi.entityService.update('api::school-class.school-class' as any, classId, {
        data: { students: { connect: [{ id: studentId }] } as any },
      });
    }
  },

  async getClassesForStudent(studentId: number) {
    return strapi.entityService.findMany('api::school-class.school-class', {
      filters: { students: { id: studentId } },
      populate: ['teachers', 'students'],
    });
  },

  // ─── Subject Management ───────────────────────────────────────────

  async getAllSubjects() {
    return strapi.entityService.findMany('api::subject.subject');
  },

  async createSubject(data: any) {
    return strapi.entityService.create('api::subject.subject', { data });
  },

  async updateSubject(id: number, data: any) {
    return strapi.entityService.update('api::subject.subject', id, { data });
  },

  async deleteSubject(id: number) {
    return strapi.entityService.delete('api::subject.subject', id);
  },

  // ─── Learning Materials ───────────────────────────────────────────

  async getAllMaterials() {
    return strapi.entityService.findMany('api::learning-material.learning-material', {
      populate: ['classe', 'subject', 'uploadedBy', 'file'],
    });
  },

  async createMaterial(data: any) {
    const payload = {
      ...data,
      classe: data.classe?.id || data.classe,
      subject: data.subject?.id || data.subject,
    };
    return strapi.entityService.create('api::learning-material.learning-material', { data: payload });
  },

  async deleteMaterial(id: number) {
    return strapi.entityService.delete('api::learning-material.learning-material', id);
  },

  async getMaterialAnalytics() {
    const classes = await strapi.entityService.findMany('api::school-class.school-class') as any[];
    const materials = await strapi.entityService.findMany('api::learning-material.learning-material', { populate: ['classe'] }) as any[];
    
    return classes.map(c => {
      const count = materials.filter(m => m.classe?.id === c.id).length;
      return { className: c.name, downloads: count };
    });
  },

  // ─── Timetable Management ─────────────────────────────────────────

  async getAllTimetables() {
    return strapi.entityService.findMany('api::timetable-entry.timetable-entry', {
      populate: ['classe', 'subject'],
    });
  },

  async createTimetable(data: any) {
    const classeId = data.classe?.id || (typeof data.classe === 'number' ? data.classe : null);
    const subjectId = data.subject?.id || (typeof data.subject === 'number' ? data.subject : null);
    return strapi.entityService.create('api::timetable-entry.timetable-entry', {
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        ...(classeId ? { classe: { connect: [{ id: classeId }] } } : {}),
        ...(subjectId ? { subject: { connect: [{ id: subjectId }] } } : {}),
      } as any,
    });
  },

  async updateTimetable(id: number, data: any) {
    const classeId = data.classe?.id || (typeof data.classe === 'number' ? data.classe : null);
    const subjectId = data.subject?.id || (typeof data.subject === 'number' ? data.subject : null);
    return strapi.entityService.update('api::timetable-entry.timetable-entry', id, {
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        ...(classeId ? { classe: { connect: [{ id: classeId }] } } : {}),
        ...(subjectId ? { subject: { connect: [{ id: subjectId }] } } : {}),
      } as any,
    });
  },

  async deleteTimetable(id: number) {
    return strapi.entityService.delete('api::timetable-entry.timetable-entry', id);
  },

  // ─── Exam Management ──────────────────────────────────────────────

  async getExams(filters: { teacherId?: number; classId?: number }) {
    const f: any = {};
    if (filters.teacherId) f.teacher = { id: filters.teacherId };
    if (filters.classId) f.classe = { id: filters.classId };
    return strapi.entityService.findMany('api::school-exam.school-exam', {
      filters: f,
      populate: ['classe', 'teacher', 'subject'],
    });
  },

  async lockAllExamsInSemester(semester: string) {
    const exams = await strapi.entityService.findMany('api::school-exam.school-exam', {
      filters: { semester },
    }) as any[];

    await Promise.all(exams.map((e) =>
      strapi.entityService.update('api::school-exam.school-exam', e.id, {
        data: { locked: true, closed: true },
      })
    ));
  },

  // ─── Results & GPA ────────────────────────────────────────────────

  async filterResultsForAdmin(studentQuery?: string, classId?: number) {
    const filters: any = {};
    if (classId) filters.exam = { classe: { id: classId } };

    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters,
      populate: ['exam', 'exam.classe', 'exam.subject', 'student'],
    }) as any[];

    if (studentQuery) {
      const q = studentQuery.toLowerCase();
      return results.filter((r) =>
        r.student?.username?.toLowerCase().includes(q) ||
        r.student?.email?.toLowerCase().includes(q) ||
        r.student?.userId?.toLowerCase().includes(q)
      );
    }
    return results;
  },

  async calculateSemesterGPA(studentId: number, semester: string) {
    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters: { student: { id: studentId }, exam: { semester }, status: 'SUBMITTED' },
      populate: ['exam'],
    }) as any[];

    if (!results.length) return { studentId, semester, gpa: 0, totalCredits: 0, results: [] };

    let totalWeightedMarks = 0;
    let totalWeight = 0;
    for (const r of results) {
      const weight = r.exam?.weight || 1;
      totalWeightedMarks += (r.marks || 0) * weight;
      totalWeight += weight;
    }

    const gpa = totalWeight > 0 ? (totalWeightedMarks / totalWeight / 25) : 0; // scale to 4.0

    return {
      studentId,
      semester,
      gpa: Math.min(4.0, parseFloat(gpa.toFixed(2))),
      totalCredits: totalWeight,
      results: results.map((r) => ({
        examId: r.exam?.id,
        examName: r.exam?.name,
        marks: r.marks,
        letterGrade: r.letterGrade,
        weight: r.exam?.weight,
      })),
    };
  },

  async lockSemesterResults(semester: string) {
    await this.lockAllExamsInSemester(semester);
    // Also mark all submitted results as graded
    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters: { exam: { semester }, status: 'SUBMITTED' },
    }) as any[];

    await Promise.all(results.map((r) =>
      strapi.entityService.update('api::exam-result.exam-result', r.id, {
        data: { status: 'GRADED' },
      })
    ));
  },

  // ─── Summary Report ───────────────────────────────────────────────

  async getSummaryReport() {
    const [students, teachers, admins, classes, subjects, exams] = await Promise.all([
      strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { schoolRole: 'STUDENT' },
      }),
      strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { schoolRole: 'TEACHER' },
      }),
      strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { schoolRole: 'ADMIN' },
      }),
      strapi.entityService.findMany('api::school-class.school-class'),
      strapi.entityService.findMany('api::subject.subject'),
      strapi.entityService.findMany('api::school-exam.school-exam'),
    ]);

    return {
      totalStudents: (students as any[]).length,
      totalTeachers: (teachers as any[]).length,
      totalAdmins: (admins as any[]).length,
      totalClasses: (classes as any[]).length,
      totalSubjects: (subjects as any[]).length,
      totalExams: (exams as any[]).length,
    };
  },

  // ─── Profile & Password ───────────────────────────────────────────

  async updateProfile(userId: number, payload: Record<string, string>) {
    return strapi.entityService.update('plugin::users-permissions.user', userId, {
      data: {
        username: payload.name || payload.username,
        email: payload.email,
        birthDate: payload.birthDate,
        birthCountry: payload.birthCountry,
        birthCity: payload.birthCity,
        address: payload.address,
        gender: payload.gender as any,
        phoneNumber: payload.phoneNumber,
      },
    });
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId) as any;
    const isMatch = await strapi.plugin('users-permissions')
      .service('user').validatePassword(currentPassword, user.password);

    if (!isMatch) throw new Error('Current password is incorrect');

    const hashed = await strapi.plugin('users-permissions')
      .service('user').hashPassword({ password: newPassword });

    await strapi.entityService.update('plugin::users-permissions.user' as any, userId, {
      data: { password: hashed } as any,
    });
  },
});
