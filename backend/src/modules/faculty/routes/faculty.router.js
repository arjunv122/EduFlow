const express = require('express');
const {
  getFacultyList, getFacultyById, approveFaculty, updateProfile
} = require('../controllers/faculty.controller');
const { protect, requireRole, requireSameInstitution } = require('../../../middleware/auth.middleware');
const { sendSuccess } = require('../../../utils/response.util');
const Department = require('../../academics/models/Department');
const User = require('../../identity/models/User');
const StudentProfile = require('../../student/models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const QuizAttempt = require('../../assessment/models/QuizAttempt');
const Submission = require('../../assessment/models/Submission');

const router = express.Router();

router.use(protect);
router.use(requireSameInstitution);

// Admin routes
router.get('/', requireRole('admin'), getFacultyList);
router.get('/:id', requireRole('admin'), getFacultyById);
router.put('/:id/approve', requireRole('admin'), approveFaculty);

// Faculty route to update own profile
router.put('/profile', requireRole('faculty', 'admin'), updateProfile);

// ── Admin: Set department for a faculty ──────────────────────────────
router.put('/:id/department', requireRole('admin'), async (req, res, next) => {
  try {
    const { departmentId } = req.body;
    await FacultyProfile.findOneAndUpdate({ user: req.params.id }, { department: departmentId });
    await User.findByIdAndUpdate(req.params.id, { department: departmentId });
    sendSuccess(res, {}, 'Faculty department updated');
  } catch (error) { next(error); }
});

// ── Admin: Set HOD for a department ──────────────────────────────────
router.put('/departments/:deptId/hod', requireRole('admin'), async (req, res, next) => {
  try {
    const { hodUserId } = req.body;
    // Remove old HOD flag
    const oldDept = await Department.findById(req.params.deptId);
    if (oldDept?.head) {
      await User.findByIdAndUpdate(oldDept.head, { isHOD: false });
    }
    // Set new HOD
    await Department.findByIdAndUpdate(req.params.deptId, { head: hodUserId });
    await User.findByIdAndUpdate(hodUserId, { isHOD: true, department: req.params.deptId });
    sendSuccess(res, {}, 'HOD assigned successfully');
  } catch (error) { next(error); }
});

// ── Admin: Set Coordinator for a department ──────────────────────────
router.put('/departments/:deptId/coordinator', requireRole('admin'), async (req, res, next) => {
  try {
    const { coordinatorUserId } = req.body;
    await Department.findByIdAndUpdate(req.params.deptId, { coordinator: coordinatorUserId });
    sendSuccess(res, {}, 'Coordinator assigned successfully');
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════════════
//  HOD DASHBOARD ROUTES
// ═══════════════════════════════════════════════════════════════════

// HOD: Get my department info
router.get('/hod/department', requireRole('faculty'), async (req, res, next) => {
  try {
    const dept = await Department.findOne({
      institution: req.institutionId,
      $or: [{ head: req.user._id }, { coordinator: req.user._id }]
    }).populate('head', 'name email').populate('coordinator', 'name email');
    if (!dept) return res.status(404).json({ success: false, message: 'You are not an HOD/coordinator' });
    sendSuccess(res, dept);
  } catch (error) { next(error); }
});

// HOD: Get department students
router.get('/hod/students', requireRole('faculty'), async (req, res, next) => {
  try {
    const dept = await Department.findOne({
      institution: req.institutionId,
      $or: [{ head: req.user._id }, { coordinator: req.user._id }]
    });
    if (!dept) return res.status(403).json({ success: false, message: 'Not authorized' });

    const profiles = await StudentProfile.find({ department: dept._id, institution: req.institutionId })
      .populate('user', 'name email isActive');
    sendSuccess(res, profiles);
  } catch (error) { next(error); }
});

// HOD: Get department faculty
router.get('/hod/faculty', requireRole('faculty'), async (req, res, next) => {
  try {
    const dept = await Department.findOne({
      institution: req.institutionId,
      $or: [{ head: req.user._id }, { coordinator: req.user._id }]
    });
    if (!dept) return res.status(403).json({ success: false, message: 'Not authorized' });

    const profiles = await FacultyProfile.find({ department: dept._id, institution: req.institutionId })
      .populate('user', 'name email isActive');
    sendSuccess(res, profiles);
  } catch (error) { next(error); }
});

// HOD: Get department student marks (quiz + assignment)
router.get('/hod/marks', requireRole('faculty'), async (req, res, next) => {
  try {
    const dept = await Department.findOne({
      institution: req.institutionId,
      $or: [{ head: req.user._id }, { coordinator: req.user._id }]
    });
    if (!dept) return res.status(403).json({ success: false, message: 'Not authorized' });

    // Get all students in dept
    const studentProfiles = await StudentProfile.find({ department: dept._id }).select('user');
    const studentIds = studentProfiles.map(sp => sp.user);

    // Get quiz attempts + assignment submissions
    const [quizAttempts, submissions] = await Promise.all([
      QuizAttempt.find({ student: { $in: studentIds }, institution: req.institutionId })
        .populate('student', 'name email')
        .populate('quiz', 'title totalMarks')
        .sort({ submittedAt: -1 })
        .limit(100),
      Submission.find({ student: { $in: studentIds }, institution: req.institutionId })
        .populate('student', 'name email')
        .populate('assignment', 'title maxMarks')
        .sort({ submittedAt: -1 })
        .limit(100),
    ]);

    sendSuccess(res, { quizAttempts, submissions });
  } catch (error) { next(error); }
});

module.exports = router;
