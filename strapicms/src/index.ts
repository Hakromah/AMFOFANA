export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register() {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    // Attempt to automatically assign permissions to the Authenticated role
    try {
      const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });

      if (authRole) {
        // Find all controllers for school-admin and school-auth
        const schoolAdminActions = [
          'getAllUsers', 'createUser', 'bulkCreateUsers', 'updateUser', 'deleteUser',
          'getAllClasses', 'createClass', 'updateClass', 'deleteClass', 'assignTeacher',
          'assignStudent', 'getClassesForStudent', 'getAllSubjects', 'createSubject',
          'updateSubject', 'deleteSubject', 'getAllMaterials', 'createMaterial',
          'deleteMaterial', 'getMaterialAnalytics', 'getAllTimetables', 'createTimetable', 'updateTimetable',
          'deleteTimetable', 'getExams', 'lockSemesterExams', 'filterResults',
          'getSummaryReport', 'getSemesterGPA', 'finalizeSemester', 'updateProfile',
          'changePassword'
        ].map(act => `api::school-admin.school-admin.${act}`);
        
        const schoolAuthActions = [
          'logout', 'me'
        ].map(act => `api::school-auth.school-auth.${act}`);

        const schoolTeacherActions = [
          'getMyClasses', 'getStudentsByClass', 'getMyStudents', 'submitAttendance',
          'updateAttendance', 'getAttendanceHistory', 'createExam', 'getMyExams',
          'updateExam', 'deleteExam', 'toggleExamStatus', 'getGradebook',
          'saveBulkResults', 'createResult', 'updateResult', 'submitResults',
          'getResults', 'filterResults', 'submitMarks', 'getMyTimetable',
          'getAllSubjects', 'updateProfile', 'changePassword',
          'getTeacherMaterials', 'getMyClassesForMaterials', 'uploadTeacherMaterial', 'deleteTeacherMaterial'
        ].map(act => `api::school-teacher.school-teacher.${act}`);

        const schoolStudentActions = [
          'getProfile', 'updateProfile', 'changePassword',
          'getMyClasses', 'getMyAttendance', 'getMyTimetable',
          'getMyExams', 'getMyResults', 'getMaterialsByClass',
          'getSemesterTranscript', 'getDashboardStats'
        ].map(act => `api::school-student.school-student.${act}`);

        const allActions = [
          ...schoolAdminActions, 
          ...schoolAuthActions, 
          ...schoolTeacherActions, 
          ...schoolStudentActions,
          'api::contact-message.contact-message.create',
          'api::newsletter-subscription.newsletter-subscription.create'
        ];

        for (const action of allActions) {
          const authPermission = await strapi.db.query('plugin::users-permissions.permission').findOne({
            where: { role: authRole.id, action },
          });

          if (!authPermission) {
            await strapi.db.query('plugin::users-permissions.permission').create({
              data: {
                role: authRole.id,
                action,
              },
            });
            strapi.log.info(`[ACL Matrix] Granted Authenticated access to ${action}`);
          }
        }
      }

      // Automatically assign public submission permissions for the Contact Form
      const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
      });

      if (publicRole) {
        const publicActions = [
            'api::contact-message.contact-message.create',
            'api::newsletter-subscription.newsletter-subscription.create'
        ];
        
        for (const publicAction of publicActions) {
            const publicPermission = await strapi.db.query('plugin::users-permissions.permission').findOne({
            where: { role: publicRole.id, action: publicAction },
            });

            if (!publicPermission) {
            await strapi.db.query('plugin::users-permissions.permission').create({
                data: { role: publicRole.id, action: publicAction },
            });
            strapi.log.info(`[ACL Matrix] Granted Public access to ${publicAction}`);
            }
        }
      }

      // 1. Repair any existing users created manually from the dashboard who got stuck with a null provider
      await strapi.db.query('plugin::users-permissions.user').updateMany({
        where: { provider: null },
        data: { provider: 'local' },
      });

      // 2. Attach a permanent database lifecycle hook so future dashboard users never get locked out again
      strapi.db.lifecycles.subscribe({
        models: ['plugin::users-permissions.user'],
        async beforeCreate(event) {
          if (!event.params.data.provider) {
            event.params.data.provider = 'local';
          }
        },
      });

    } catch (e) {
      strapi.log.error('Failed to auto-assign role permissions. Ensure the database matches the v5 shape.', e);
    }
  },
};
