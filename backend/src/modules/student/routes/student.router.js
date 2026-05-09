const express = require('express');
const {
  getStudentList, getStudentById, getMyTimetable, updateProfile, syncEnrollment
} = require('../controllers/student.controller');
const studentLeaveService = require('../services/studentLeave.service');
const { protect, requireRole, requireSameInstitution } = require('../../../middleware/auth.middleware');
const { sendSuccess } = require('../../../utils/response.util');

const router = express.Router();

router.use(protect);
router.use(requireSameInstitution);

// Admin / Faculty routes
router.get('/', requireRole('admin', 'faculty'), getStudentList);
router.get('/:id', requireRole('admin', 'faculty'), getStudentById);
router.post('/:userId/sync', requireRole('admin'), syncEnrollment);

// Student routes
router.get('/me/timetable', requireRole('student'), getMyTimetable);
router.put('/profile', updateProfile);

// ── Student Leave Routes ─────────────────────────────────────────────
router.post('/leaves', requireRole('student'), async (req, res, next) => {
  try {
    const result = await studentLeaveService.applyLeave(req.institutionId, req.user._id, req.body);
    sendSuccess(res, result, 'Leave request submitted', 201);
  } catch (error) { next(error); }
});

router.get('/leaves/my', requireRole('student'), async (req, res, next) => {
  try {
    const result = await studentLeaveService.getMyLeaves(req.institutionId, req.user._id);
    sendSuccess(res, result);
  } catch (error) { next(error); }
});

// HOD / Faculty leave routes — view dept leaves
router.get('/leaves/department', requireRole('faculty', 'admin'), async (req, res, next) => {
  try {
    const FacultyProfile = require('../../faculty/models/FacultyProfile');
    const Department = require('../../academics/models/Department');

    // Find this faculty's department from their profile
    const facultyProfile = await FacultyProfile.findOne({ user: req.user._id });
    let deptId = facultyProfile?.department || null;

    // If no department, check if they are HOD of any department
    if (!deptId) {
      const dept = await Department.findOne({
        institution: req.institutionId,
        $or: [{ head: req.user._id }, { coordinator: req.user._id }]
      });
      deptId = dept?._id || null;
    }

    if (!deptId) {
      return res.status(403).json({ success: false, message: 'You are not associated with any department' });
    }

    const result = await studentLeaveService.getDepartmentLeaves(req.institutionId, deptId, req.query.status || null);
    sendSuccess(res, result);
  } catch (error) { next(error); }
});

// Upload medical document for an existing leave request
router.put('/leaves/:id/upload-document', requireRole('student'), async (req, res, next) => {
  try {
    const { documentUrl, documentName } = req.body;
    if (!documentUrl) return res.status(400).json({ success: false, message: 'documentUrl is required' });
    const result = await studentLeaveService.uploadMedicalDocument(
      req.institutionId, req.user._id, req.params.id, { documentUrl, documentName: documentName || 'Medical Document' }
    );
    sendSuccess(res, result, 'Medical document uploaded');
  } catch (error) { next(error); }
});

router.put('/leaves/:id/process', requireRole('faculty', 'admin'), async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const result = await studentLeaveService.processLeave(req.institutionId, req.params.id, req.user._id, status, remarks);
    sendSuccess(res, result, `Leave ${status}`);
  } catch (error) { next(error); }
});

module.exports = router;
