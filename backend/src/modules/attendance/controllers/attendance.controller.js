const attendanceService = require('../services/attendance.service');
const { sendSuccess } = require('../../../utils/response.util');
const { generateCSV, generateExcel, generatePDF } = require('../../../utils/reportGenerator.util');

const getInstId = (req) => req.institutionId;

const initiateSession = async (req, res, next) => {
  try {
    const data = { ...req.body, facultyId: req.user._id };
    const result = await attendanceService.initiateSession(getInstId(req), data);
    sendSuccess(res, { data: result }, 'Attendance session initiated', 201);
  } catch (error) { next(error); }
};

const markAttendance = async (req, res, next) => {
  try {
    const { records } = req.body;
    const result = await attendanceService.markAttendance(getInstId(req), req.params.id, records);
    sendSuccess(res, { data: result }, 'Attendance marked');
  } catch (error) { next(error); }
};

const submitSession = async (req, res, next) => {
  try {
    const result = await attendanceService.submitSession(getInstId(req), req.params.id);
    sendSuccess(res, { data: result }, 'Attendance submitted successfully');
  } catch (error) { next(error); }
};

const getMyAttendanceStats = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const result = await attendanceService.getStudentAttendanceStats(getInstId(req), req.user._id, courseId);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const getMyStatsAllCourses = async (req, res, next) => {
  try {
    const result = await attendanceService.getStudentAttendanceBySubject(getInstId(req), req.user._id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const getStudentStatsForFaculty = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const { studentId } = req.params;
    const result = await attendanceService.getStudentAttendanceStats(getInstId(req), studentId, courseId);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const getMyAttendanceCalendar = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const result = await attendanceService.getAttendanceCalendar(
      getInstId(req),
      req.user._id,
      parseInt(month) || (now.getMonth() + 1),
      parseInt(year) || now.getFullYear()
    );
    sendSuccess(res, { calendar: result });
  } catch (error) { next(error); }
};

const exportReport = async (req, res, next) => {
  try {
    const { format = 'csv', classSectionId, courseId } = req.query;
    const filters = {};
    if (classSectionId) filters.classSectionId = classSectionId;
    if (courseId) filters.courseId = courseId;

    // Faculty can only export their own classes
    if (req.user.role === 'faculty') {
      filters.facultyId = req.user._id;
    }

    const data = await attendanceService.generateReportData(getInstId(req), filters);

    if (data.length === 0) {
      return res.status(404).json({ success: false, message: 'No attendance data found for the given filters' });
    }

    const columns = [
      { header: 'Student Name', key: 'studentName' },
      { header: 'Email', key: 'studentEmail' },
      { header: 'Course', key: 'courseName' },
      { header: 'Code', key: 'courseCode' },
      { header: 'Section', key: 'section' },
      { header: 'Present', key: 'present' },
      { header: 'Absent', key: 'absent' },
      { header: 'Late', key: 'late' },
      { header: 'Excused', key: 'excused' },
      { header: 'Total', key: 'total' },
      { header: 'Percentage', key: 'percentage' },
    ];

    const filename = `attendance_report_${new Date().toISOString().split('T')[0]}`;

    if (format === 'excel') {
      const buffer = await generateExcel(data, columns, 'Attendance Report');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      return res.send(buffer);
    } else if (format === 'pdf') {
      const buffer = await generatePDF(data, columns, 'Attendance Report');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      return res.send(buffer);
    } else {
      // Default: CSV
      const csv = generateCSV(data, columns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csv);
    }
  } catch (error) { next(error); }
};

module.exports = {
  initiateSession, markAttendance, submitSession,
  getMyAttendanceStats, getMyStatsAllCourses, getStudentStatsForFaculty, getMyAttendanceCalendar,
  exportReport
};
