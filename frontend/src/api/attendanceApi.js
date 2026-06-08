import api from './axios';

// Faculty: Start/resume a session for a class
export const initiateSession = (data) => api.post('/attendance/session', data);

// Faculty: Mark attendance records for an open session
export const markAttendance = (sessionId, records) =>
  api.put(`/attendance/session/${sessionId}/mark`, { records });

// Faculty: Submit a finalized session (triggers email alerts)
export const submitSession = (sessionId) =>
  api.put(`/attendance/session/${sessionId}/submit`);

// Faculty: Get a specific student's stats (optionally per course)
export const getStudentStats = (studentId, courseId = null) =>
  api.get(`/attendance/student/${studentId}/stats`, {
    params: courseId ? { courseId } : {},
  });

// Student: Get own attendance stats (optionally per course)
export const getMyAttendanceStats = (courseId = null) =>
  api.get('/attendance/me/stats', {
    params: courseId ? { courseId } : {},
  });

// Student: Get attendance calendar heatmap data for a given month/year
export const getMyCalendar = (month, year) =>
  api.get('/attendance/me/calendar', { params: { month, year } });

// Student: Get attendance stats broken down by all enrolled courses
export const getMyStatsAllCourses = () =>
  api.get('/attendance/me/stats/all-courses');

// Export attendance report (faculty: own classes, admin: all)
export const exportAttendanceReport = (format = 'csv', filters = {}) =>
  api.get('/attendance/reports/export', {
    params: { format, ...filters },
    responseType: 'blob',
  });

