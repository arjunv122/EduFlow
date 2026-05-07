const academicsService = require('../services/academics.service');
const { sendSuccess } = require('../../../utils/response.util');

// Get Institution ID from the authenticated user (enforced by middleware)
const getInstId = (req) => req.institutionId;

// --- Departments ---
const createDepartment = async (req, res, next) => {
  try {
    const result = await academicsService.createDepartment(getInstId(req), req.body);
    sendSuccess(res, result, 'Department created successfully', 201);
  } catch (error) { next(error); }
};

const getDepartments = async (req, res, next) => {
  try {
    const result = await academicsService.getDepartments(getInstId(req));
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const updateDepartment = async (req, res, next) => {
  try {
    const result = await academicsService.updateDepartment(getInstId(req), req.params.id, req.body);
    sendSuccess(res, result, 'Department updated successfully');
  } catch (error) { next(error); }
};

// --- Courses ---
const createCourse = async (req, res, next) => {
  try {
    const result = await academicsService.createCourse(getInstId(req), req.body);
    sendSuccess(res, result, 'Course created successfully', 201);
  } catch (error) { next(error); }
};

const getCourses = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const result = await academicsService.getCourses(getInstId(req), departmentId);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const updateCourse = async (req, res, next) => {
  try {
    const result = await academicsService.updateCourse(getInstId(req), req.params.id, req.body);
    sendSuccess(res, result, 'Course updated successfully');
  } catch (error) { next(error); }
};

// --- Class Sections ---
const createClassSection = async (req, res, next) => {
  try {
    const result = await academicsService.createClassSection(getInstId(req), req.body);
    sendSuccess(res, result, 'Class Section created successfully', 201);
  } catch (error) { next(error); }
};

const getClassSections = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const result = await academicsService.getClassSections(getInstId(req), courseId);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const updateClassSection = async (req, res, next) => {
  try {
    const result = await academicsService.updateClassSection(getInstId(req), req.params.id, req.body);
    sendSuccess(res, result, 'Class Section updated successfully');
  } catch (error) { next(error); }
};

const enrollStudents = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    const result = await academicsService.enrollStudents(getInstId(req), req.params.id, studentIds);
    sendSuccess(res, result, 'Students enrolled successfully');
  } catch (error) { next(error); }
};

module.exports = {
  createDepartment, getDepartments, updateDepartment,
  createCourse, getCourses, updateCourse,
  createClassSection, getClassSections, updateClassSection, enrollStudents
};
