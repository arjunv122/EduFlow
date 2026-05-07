const express = require('express');
const {
  createDepartment, getDepartments, updateDepartment,
  createCourse, getCourses, updateCourse,
  createClassSection, getClassSections, updateClassSection, enrollStudents
} = require('../controllers/academics.controller');
const { protect, requireRole, requireSameInstitution } = require('../../../middleware/auth.middleware');

const router = express.Router();

// Require valid auth & institution for all routes
router.use(protect);
router.use(requireSameInstitution);

// Departments
// Only admin can create/update
router.post('/departments', requireRole('admin'), createDepartment);
router.put('/departments/:id', requireRole('admin'), updateDepartment);
// Everyone inside the institution can view
router.get('/departments', getDepartments);

// Courses
router.post('/courses', requireRole('admin'), createCourse);
router.put('/courses/:id', requireRole('admin'), updateCourse);
router.get('/courses', getCourses);

// Class Sections
router.post('/classes', requireRole('admin'), createClassSection);
router.put('/classes/:id', requireRole('admin'), updateClassSection);
router.post('/classes/:id/enroll', requireRole('admin'), enrollStudents);
router.get('/classes', getClassSections);

module.exports = router;
