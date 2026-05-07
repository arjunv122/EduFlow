const facultyService = require('../services/faculty.service');
const { sendSuccess } = require('../../../utils/response.util');

const getInstId = (req) => req.institutionId;

const getFacultyList = async (req, res, next) => {
  try {
    const { status } = req.query;
    const result = await facultyService.getFacultyList(getInstId(req), status);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const getFacultyById = async (req, res, next) => {
  try {
    const result = await facultyService.getFacultyById(getInstId(req), req.params.id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const approveFaculty = async (req, res, next) => {
  try {
    const result = await facultyService.approveFaculty(getInstId(req), req.params.id);
    sendSuccess(res, result, 'Faculty approved successfully');
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    // If admin, they could specify userId in body, otherwise use req.user._id
    const targetUserId = req.body.userId || req.user._id;
    const result = await facultyService.updateFacultyProfile(getInstId(req), targetUserId, req.body);
    sendSuccess(res, result, 'Profile updated successfully');
  } catch (error) { next(error); }
};

module.exports = { getFacultyList, getFacultyById, approveFaculty, updateProfile };
