const governanceService = require('../services/governance.service');
const { sendSuccess, sendError } = require('../../../utils/response.util');

const registerInstitution = async (req, res, next) => {
  try {
    const result = await governanceService.registerInstitution(req.body);
    sendSuccess(res, { data: result }, 'Institution registered successfully. Pending approval.', 201);
  } catch (error) {
    next(error);
  }
};

const getAllInstitutions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const result = await governanceService.getAllInstitutions(status);
    sendSuccess(res, { data: result }, 'Institutions fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getInstitution = async (req, res, next) => {
  try {
    const result = await governanceService.getInstitutionById(req.params.id);
    sendSuccess(res, { data: result }, 'Institution fetched successfully');
  } catch (error) {
    next(error);
  }
};

const approveInstitution = async (req, res, next) => {
  try {
    const { subscriptionPlan } = req.body;
    const result = await governanceService.approveInstitution(req.params.id, req.user._id, subscriptionPlan);
    sendSuccess(res, { data: result }, 'Institution approved successfully');
  } catch (error) {
    next(error);
  }
};

const setInstitutionAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await governanceService.setInstitutionAdmin(req.params.id, userId);
    sendSuccess(res, { data: result }, 'Institution admin set successfully');
  } catch (error) {
    next(error);
  }
};

const updateInstitution = async (req, res, next) => {
  try {
    const instId = req.params.id;
    // Security check: Admin can only update their own institution
    // req.user.institution may be a populated object OR a raw ObjectId
    const userInstId = (req.user.institution?._id || req.user.institution)?.toString();
    if (req.user.role === 'admin' && userInstId !== instId) {
      return sendError(res, 'You can only update your own institution', 403);
    }
    
    const result = await governanceService.updateInstitution(instId, req.body);
    sendSuccess(res, { data: result }, 'Institution settings updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerInstitution,
  getAllInstitutions,
  getInstitution,
  approveInstitution,
  setInstitutionAdmin,
  updateInstitution
};
