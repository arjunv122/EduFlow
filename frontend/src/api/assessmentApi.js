import api from './axios';

// ═══════════════════════════════════════════════════════════════════
//  QUIZ APIs
// ═══════════════════════════════════════════════════════════════════

// Faculty: Create a new quiz
export const createQuiz = (data) => api.post('/assessment/quizzes', data);

// Faculty: Get all quizzes for their institution (optionally filtered by class)
export const getQuizzesManage = (classSectionId = null) =>
  api.get('/assessment/quizzes/manage', {
    params: classSectionId ? { classSectionId } : {},
  });

// Student/Faculty: Get published quizzes
export const getQuizzes = (classSectionId = null) =>
  api.get('/assessment/quizzes', {
    params: classSectionId ? { classSectionId } : {},
  });

// Student: Start (or resume) a quiz attempt
export const startQuiz = (quizId) =>
  api.post(`/assessment/quizzes/${quizId}/start`);

// Student: Submit final answers (with proctoring data)
export const submitQuiz = (quizId, answers, autoSubmitted = false, proctorData = {}) =>
  api.post(`/assessment/quizzes/${quizId}/submit`, { answers, autoSubmitted, proctorData });

// Faculty: Get quiz attempts (for gradebook)
export const getQuizAttempts = (quizId) =>
  api.get(`/assessment/quiz/${quizId}/attempts`);

// Faculty: Publish quiz results
export const publishQuizResults = (quizId) =>
  api.put(`/assessment/quiz/${quizId}/publish-results`);

// Student: Get my own attempt for a quiz
export const getMyAttempt = (quizId) =>
  api.get(`/assessment/quizzes/${quizId}/my-attempt`);

// ═══════════════════════════════════════════════════════════════════
//  ASSIGNMENT APIs
// ═══════════════════════════════════════════════════════════════════

// Faculty: Create assignment
export const createAssignment = (data) => api.post('/assessment/assignments', data);

// Get assignments (faculty sees all, student sees dept-scoped)
export const getAssignments = () => api.get('/assessment/assignments');

// Get single assignment
export const getAssignmentById = (id) => api.get(`/assessment/assignments/${id}`);

// Faculty: Close assignment
export const closeAssignment = (id) => api.put(`/assessment/assignments/${id}/close`);

// Student: Submit assignment
export const submitAssignment = (id, data) => api.post(`/assessment/assignments/${id}/submit`, data);

// Student: Get my submission for an assignment
export const getMySubmission = (id) => api.get(`/assessment/assignments/${id}/my-submission`);

// Faculty: Get submissions for an assignment
export const getSubmissions = (id) => api.get(`/assessment/assignments/${id}/submissions`);

// Faculty: Grade a submission
export const gradeSubmission = (submissionId, marks, feedback) =>
  api.put(`/assessment/submissions/${submissionId}/grade`, { marks, feedback });

// ═══════════════════════════════════════════════════════════════════
//  MEETING APIs
// ═══════════════════════════════════════════════════════════════════
export const createMeeting = (data) => api.post('/communication/meetings', data);
export const getMeetings = () => api.get('/communication/meetings');
export const updateMeeting = (id, data) => api.put(`/communication/meetings/${id}`, data);
export const deleteMeeting = (id) => api.delete(`/communication/meetings/${id}`);

// ═══════════════════════════════════════════════════════════════════
//  STUDENT LEAVE APIs
// ═══════════════════════════════════════════════════════════════════
export const applyStudentLeave = (data) => api.post('/student/leaves', data);
export const getMyLeaves = () => api.get('/student/leaves/my');
export const uploadMedicalDocument = (leaveId, documentUrl, documentName) =>
  api.put(`/student/leaves/${leaveId}/upload-document`, { documentUrl, documentName });
export const getDepartmentLeaves = (status = null) =>
  api.get('/student/leaves/department', { params: status ? { status } : {} });
export const processStudentLeave = (id, status, remarks = '') =>
  api.put(`/student/leaves/${id}/process`, { status, remarks });
