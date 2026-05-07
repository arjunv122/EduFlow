/**
 * EduFlow Permission Matrix — Backend Mirror
 * Identical structure to frontend/src/config/permissions.js.
 * Used by requirePermission() middleware in auth.middleware.js.
 */
const PERMISSIONS = {
  superadmin: [
    'governance.view',
    'governance.approve',
    'institution.settings',
    'institution.deactivate',
    'audit.view',
    'users.manage',
    'users.provision',
    'analytics.view',
  ],
  admin: [
    'attendance.view',
    'attendance.report',
    'quiz.view',
    'quiz.create',
    'quiz.grade',
    'quiz.publish',
    'gradebook.view',
    'announcements.create',
    'announcements.view',
    'institution.settings',
    'users.manage',
    'users.provision',
    'audit.view',
    'analytics.view',
    'substitution.approve',
    'substitution.manage',
    'academics.manage',
    'faculty.manage',
    'students.manage',
    'support.manage',
    'reports.export',
  ],
  faculty: [
    'attendance.mark',
    'attendance.view',
    'attendance.report',
    'quiz.create',
    'quiz.view',
    'quiz.grade',
    'quiz.publish',
    'gradebook.view',
    'announcements.view',
    'substitution.request',
    'support.create',
    'students.viewRoster',
    'academics.view',
  ],
  student: [
    'attendance.view',
    'quiz.take',
    'quiz.viewOwn',
    'gradebook.viewOwn',
    'announcements.view',
    'support.create',
    'timetable.view',
    'academics.view',
  ],
};

module.exports = { PERMISSIONS };
