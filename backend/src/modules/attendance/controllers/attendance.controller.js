const attendanceService = require('../services/attendance.service');
const { sendSuccess } = require('../../../utils/response.util');

const getInstId = (req) => req.institutionId;

const initiateSession = async (req, res, next) => {
  try {
    const data = { ...req.body, facultyId: req.user._id };
    const result = await attendanceService.initiateSession(getInstId(req), data);
    sendSuccess(res, result, 'Attendance session initiated', 201);
  } catch (error) { next(error); }
};

const markAttendance = async (req, res, next) => {
  try {
    const { records } = req.body;
    const result = await attendanceService.markAttendance(getInstId(req), req.params.id, records);
    sendSuccess(res, result, 'Attendance marked');
  } catch (error) { next(error); }
};

const submitSession = async (req, res, next) => {
  try {
    const result = await attendanceService.submitSession(getInstId(req), req.params.id);
    sendSuccess(res, result, 'Attendance submitted successfully');
  } catch (error) { next(error); }
};

const getMyAttendanceStats = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const result = await attendanceService.getStudentAttendanceStats(getInstId(req), req.user._id, courseId);
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

module.exports = {
  initiateSession, markAttendance, submitSession,
  getMyAttendanceStats, getStudentStatsForFaculty, getMyAttendanceCalendar
};

