const supportService = require('../services/support.service');
const { sendSuccess } = require('../../../utils/response.util');

const getInstId = (req) => req.institutionId;

const raiseTicket = async (req, res, next) => {
  try {
    const result = await supportService.raiseTicket(getInstId(req), req.user._id, req.body);
    sendSuccess(res, result, 'Support ticket raised successfully', 201);
  } catch (error) { next(error); }
};

const getMyTickets = async (req, res, next) => {
  try {
    const result = await supportService.getMyTickets(getInstId(req), req.user._id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const getAssignedTickets = async (req, res, next) => {
  try {
    const result = await supportService.getAssignedTickets(getInstId(req), req.user._id, req.user.role);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const respondToTicket = async (req, res, next) => {
  try {
    const { message, isInternal } = req.body;
    const result = await supportService.respondToTicket(getInstId(req), req.params.id, req.user._id, message, isInternal);
    sendSuccess(res, result, 'Message sent');
  } catch (error) { next(error); }
};

const closeTicket = async (req, res, next) => {
  try {
    const result = await supportService.closeTicket(getInstId(req), req.params.id, req.user._id);
    sendSuccess(res, result, 'Ticket resolved');
  } catch (error) { next(error); }
};

module.exports = { raiseTicket, getMyTickets, getAssignedTickets, respondToTicket, closeTicket };
