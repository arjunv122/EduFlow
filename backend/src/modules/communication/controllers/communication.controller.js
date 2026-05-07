const communicationService = require('../services/communication.service');
const { sendSuccess } = require('../../../utils/response.util');

const getInstId = (req) => req.institutionId;

const createAnnouncement = async (req, res, next) => {
  try {
    const result = await communicationService.createAnnouncement(getInstId(req), req.user._id, req.body);
    sendSuccess(res, result, 'Announcement created successfully', 201);
  } catch (error) { next(error); }
};

const getAnnouncements = async (req, res, next) => {
  try {
    const result = await communicationService.getAnnouncements(getInstId(req), req.user);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const getAnnouncementById = async (req, res, next) => {
  try {
    const result = await communicationService.getAnnouncementById(getInstId(req), req.params.id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

module.exports = { createAnnouncement, getAnnouncements, getAnnouncementById };
