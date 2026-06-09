const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../../../utils/response.util');
const { SRET_COURSE_LIST } = require('../../../config/sretCourses');
const Institution = require('../../governance/models/Institution');
const Department = require('../../academics/models/Department');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    const message = result.isApproved
      ? 'Registration successful. You can now log in.'
      : 'Registration successful. Your account is pending approval.';
    sendSuccess(res, result, message, 201);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }
    const result = await authService.login(email, password);
    sendSuccess(res, result, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user._id);
    sendSuccess(res, result, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/superadmin/create
const createSuperAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return sendError(res, 'Name, email and password are required', 400);
    }
    const result = await authService.createSuperAdmin(name, email, password);
    sendSuccess(res, result, 'Super admin created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/change-password (requires JWT)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 'currentPassword and newPassword are required', 400);
    }
    const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
    sendSuccess(res, result, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/sret-courses (public — used by StudentRegister dropdown)
const getSretCourses = (req, res) => {
  sendSuccess(res, { courses: SRET_COURSE_LIST });
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Email is required', 400);
    }
    const result = await authService.forgotPassword(email.trim().toLowerCase());
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return sendError(res, 'New password is required', 400);
    }
    const result = await authService.resetPassword(token, password);
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/sret-info (public — institution ID + departments for registration form)
const getSretInfo = async (req, res, next) => {
  try {
    const institution = await Institution.findOne({
      $or: [{ name: /SRET/i }, { name: /Sri Ramaswamy/i }]
    });
    if (!institution) {
      return sendError(res, 'Institution not found', 404);
    }
    const departments = await Department.find({ institution: institution._id })
      .select('name code _id')
      .sort({ name: 1 });
    sendSuccess(res, { institutionId: institution._id, institutionName: institution.name, departments });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, createSuperAdmin, changePassword, getSretCourses, forgotPassword, resetPassword, getSretInfo };
