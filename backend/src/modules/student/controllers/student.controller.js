const studentService = require('../services/student.service');
const { sendSuccess } = require('../../../utils/response.util');

const getInstId = (req) => req.institutionId;

const getStudentList = async (req, res, next) => {
  try {
    const { status } = req.query;
    const result = await studentService.getStudentList(getInstId(req), status);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const getStudentById = async (req, res, next) => {
  try {
    const result = await studentService.getStudentById(getInstId(req), req.params.id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const getMyTimetable = async (req, res, next) => {
  try {
    const result = await studentService.getStudentTimetable(getInstId(req), req.user._id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const targetUserId = req.body.userId || req.user._id;
    const result = await studentService.updateStudentProfile(getInstId(req), targetUserId, req.body);
    sendSuccess(res, result, 'Profile updated successfully');
  } catch (error) { next(error); }
};

const syncEnrollment = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await studentService.syncEnrollments(getInstId(req), userId);
    sendSuccess(res, result, 'Enrollments synced successfully');
  } catch (error) { next(error); }
}

module.exports = { getStudentList, getStudentById, getMyTimetable, updateProfile, syncEnrollment };
