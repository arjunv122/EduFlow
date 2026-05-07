const substitutionService = require('../services/substitution.service');
const { sendSuccess } = require('../../../utils/response.util');

const getInstId = (req) => req.institutionId;

const applyForLeave = async (req, res, next) => {
  try {
    const result = await substitutionService.applyForLeave(getInstId(req), req.body, req.user._id);
    sendSuccess(res, result, 'Leave request submitted successfully', 201);
  } catch (error) { next(error); }
};

const processLeave = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await substitutionService.processLeaveRequest(getInstId(req), req.params.id, status, req.user._id);
    sendSuccess(res, result, `Leave request ${status}`);
  } catch (error) { next(error); }
};

const getPendingSubstitutions = async (req, res, next) => {
  try {
    const result = await substitutionService.getPendingSubstitutions(getInstId(req));
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const assignSubstitute = async (req, res, next) => {
  try {
    const { substituteFacultyId } = req.body;
    const result = await substitutionService.assignSubstitute(getInstId(req), req.params.id, substituteFacultyId, req.user._id);
    sendSuccess(res, result, 'Substitute assigned successfully');
  } catch (error) { next(error); }
};

module.exports = { applyForLeave, processLeave, getPendingSubstitutions, assignSubstitute };
