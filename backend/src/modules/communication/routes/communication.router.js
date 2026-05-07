const express = require('express');
const {
  createAnnouncement, getAnnouncements, getAnnouncementById
} = require('../controllers/communication.controller');
const { protect, requireRole, requireSameInstitution } = require('../../../middleware/auth.middleware');
const { sendSuccess } = require('../../../utils/response.util');
const Meeting = require('../models/Meeting');
const FacultyProfile = require('../../faculty/models/FacultyProfile');
const StudentProfile = require('../../student/models/StudentProfile');

const router = express.Router();

router.use(protect);
router.use(requireSameInstitution);

// ── Announcements ────────────────────────────────────────────────────
router.post('/', requireRole('admin', 'faculty'), createAnnouncement);
router.get('/', getAnnouncements);
router.get('/announcement/:id', getAnnouncementById);

// ── Meetings ─────────────────────────────────────────────────────────
router.post('/meetings', requireRole('faculty', 'admin'), async (req, res, next) => {
  try {
    const { title, description, meetingLink, scheduledAt, duration, departmentId } = req.body;
    let department = departmentId || null;
    if (!department) {
      const profile = await FacultyProfile.findOne({ user: req.user._id });
      department = profile?.department || null;
    }
    const meeting = await Meeting.create({
      institution: req.institutionId,
      createdBy: req.user._id,
      department,
      title,
      description,
      meetingLink,
      scheduledAt,
      duration: duration || 60,
    });
    sendSuccess(res, meeting, 'Meeting scheduled', 201);
  } catch (error) { next(error); }
});

router.get('/meetings', async (req, res, next) => {
  try {
    const query = { institution: req.institutionId };

    // For students, filter by their department
    if (req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: req.user._id });
      if (profile?.department) {
        query.$or = [{ department: profile.department }, { department: null }];
      }
    }

    const meetings = await Meeting.find(query)
      .populate('createdBy', 'name')
      .populate('department', 'name code')
      .sort({ scheduledAt: -1 });
    sendSuccess(res, meetings);
  } catch (error) { next(error); }
});

router.put('/meetings/:id', requireRole('faculty', 'admin'), async (req, res, next) => {
  try {
    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, institution: req.institutionId },
      req.body,
      { new: true }
    );
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    sendSuccess(res, meeting, 'Meeting updated');
  } catch (error) { next(error); }
});

router.delete('/meetings/:id', requireRole('faculty', 'admin'), async (req, res, next) => {
  try {
    await Meeting.findOneAndDelete({ _id: req.params.id, institution: req.institutionId });
    sendSuccess(res, {}, 'Meeting deleted');
  } catch (error) { next(error); }
});

module.exports = router;
