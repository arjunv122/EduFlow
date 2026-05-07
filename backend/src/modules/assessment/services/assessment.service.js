const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const FacultyProfile = require('../../faculty/models/FacultyProfile');
const StudentProfile = require('../../student/models/StudentProfile');

class AssessmentService {
  // ─── Helper: get faculty department ──────────────────────────────
  async _getFacultyDepartment(facultyId) {
    const profile = await FacultyProfile.findOne({ user: facultyId });
    return profile?.department || null;
  }

  // ─── Helper: get student department ─────────────────────────────
  async _getStudentDepartment(studentId) {
    const profile = await StudentProfile.findOne({ user: studentId });
    return profile?.department || null;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  QUIZ MANAGEMENT (Faculty)
  // ═══════════════════════════════════════════════════════════════════

  async createQuiz(institutionId, facultyId, data) {
    const totalMarks = data.questions ? data.questions.reduce((sum, q) => sum + (q.marks || 1), 0) : 0;
    const department = await this._getFacultyDepartment(facultyId);

    return await Quiz.create({
      ...data,
      institution: institutionId,
      createdBy: facultyId,
      department,
      totalMarks,
    });
  }

  async getQuizzes(institutionId, classSectionId = null, userRole = null, userId = null) {
    const query = { institution: institutionId };
    if (classSectionId) query.classSection = classSectionId;

    // Filter for students based on enrolled classes
    if (userRole === 'student' && userId) {
      const profile = await StudentProfile.findOne({ user: userId });
      if (profile && profile.enrolledClasses && profile.enrolledClasses.length > 0) {
        query.classSection = { $in: profile.enrolledClasses };
      } else {
        const dept = profile?.department || null;
        if (dept) query.department = dept;
      }
      // Only show published/active quizzes to students
      query.status = { $in: ['published', 'active'] };
    }

    return await Quiz.find(query)
      .populate('course', 'name code')
      .populate('classSection', 'section')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .select('-questions.correctAnswer');
  }

  // ─── Quiz Taking (Student) ─────────────────────────────────────────
  async startQuizAttempt(institutionId, studentId, quizId) {
    const quiz = await Quiz.findOne({ _id: quizId, institution: institutionId, isActive: true });
    if (!quiz) throw Object.assign(new Error('Quiz not found or not active'), { statusCode: 404 });

    const now = new Date();
    if (now < quiz.startDateTime) throw Object.assign(new Error('Quiz has not started yet'), { statusCode: 400 });
    if (now > quiz.endDateTime) throw Object.assign(new Error('Quiz window has closed'), { statusCode: 400 });

    const existing = await QuizAttempt.findOne({ quiz: quizId, student: studentId });
    if (existing) {
      if (existing.status !== 'in_progress') {
        throw Object.assign(new Error('Quiz already submitted'), { statusCode: 400 });
      }
      return { quiz, attempt: existing };
    }

    const attempt = await QuizAttempt.create({
      institution: institutionId,
      quiz: quizId,
      student: studentId,
      totalMarks: quiz.totalMarks,
    });

    return { quiz, attempt };
  }

  async submitQuizAttempt(institutionId, studentId, quizId, answers, autoSubmitted = false, proctorData = {}) {
    const quiz = await Quiz.findOne({ _id: quizId, institution: institutionId });
    const attempt = await QuizAttempt.findOne({ quiz: quizId, student: studentId });

    if (!quiz || !attempt) throw Object.assign(new Error('Attempt not found'), { statusCode: 404 });
    if (attempt.status !== 'in_progress') throw Object.assign(new Error('Quiz already submitted'), { statusCode: 400 });

    let autoGradedScore = 0;
    let pendingGrading = false;

    const processedAnswers = (answers || []).map(ans => {
      const question = quiz.questions.id(ans.questionId);
      if (!question) return null;

      let isCorrect = null;
      let marksAwarded = null;

      if (['mcq', 'true_false'].includes(question.questionType)) {
        if (question.questionType === 'mcq') {
          const option = question.options.find(o => o.text === ans.selectedOption);
          isCorrect = option ? option.isCorrect : false;
        } else {
          isCorrect = question.correctAnswer?.toLowerCase() === ans.selectedOption?.toLowerCase();
        }
        marksAwarded = isCorrect ? question.marks : 0;
        autoGradedScore += marksAwarded;
      } else {
        pendingGrading = true;
      }

      return {
        question: question._id,
        questionType: question.questionType,
        selectedOption: ans.selectedOption,
        textAnswer: ans.textAnswer,
        isCorrect,
        marksAwarded,
      };
    }).filter(Boolean);

    attempt.answers = processedAnswers;
    attempt.autoGradedScore = autoGradedScore;
    attempt.totalScore = autoGradedScore;
    attempt.percentage = quiz.totalMarks > 0 ? (autoGradedScore / quiz.totalMarks) * 100 : 0;
    attempt.status = pendingGrading ? 'submitted' : 'graded';
    attempt.submittedAt = new Date();
    attempt.autoSubmitted = autoSubmitted;

    // Save proctoring data
    if (proctorData.tabSwitchCount !== undefined) attempt.tabSwitchCount = proctorData.tabSwitchCount;
    if (proctorData.fullScreenExitCount !== undefined) attempt.fullScreenExitCount = proctorData.fullScreenExitCount;
    if (proctorData.autoSubmitReason) attempt.autoSubmitReason = proctorData.autoSubmitReason;
    if (proctorData.proctorLog?.length) attempt.proctorLog = proctorData.proctorLog;

    if (!pendingGrading && quiz.showResultImmediately) {
      attempt.isPublished = true;
    }

    await attempt.save();
    return attempt;
  }

  // ─── Gradebook: Get quiz attempts (Faculty) ────────────────────────
  async getQuizAttempts(institutionId, quizId) {
    return await QuizAttempt.find({ quiz: quizId, institution: institutionId })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });
  }

  // ─── Publish quiz results (Faculty) ────────────────────────────────
  async publishQuizResults(institutionId, quizId) {
    const result = await QuizAttempt.updateMany(
      { quiz: quizId, institution: institutionId },
      { $set: { isPublished: true } }
    );
    return { modifiedCount: result.modifiedCount };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  ASSIGNMENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  async createAssignment(institutionId, facultyId, data) {
    const department = await this._getFacultyDepartment(facultyId);

    return await Assignment.create({
      ...data,
      institution: institutionId,
      createdBy: facultyId,
      department,
    });
  }

  async getAssignments(institutionId, userRole, userId) {
    const query = { institution: institutionId, isActive: true };

    // Auto-close expired assignments
    await Assignment.updateMany(
      { institution: institutionId, status: 'published', dueDate: { $ne: null, $lt: new Date() } },
      { $set: { status: 'closed', closedAt: new Date() } }
    );

    if (userRole === 'student') {
      const profile = await StudentProfile.findOne({ user: userId });
      if (profile && profile.enrolledClasses && profile.enrolledClasses.length > 0) {
        query.classSection = { $in: profile.enrolledClasses };
      } else {
        const dept = profile?.department || null;
        if (dept) query.department = dept;
      }
      query.status = { $in: ['published', 'closed'] };
    }

    return await Assignment.find(query)
      .populate('course', 'name code')
      .populate('classSection', 'section')
      .populate('department', 'name code')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
  }

  async getAssignmentById(institutionId, assignmentId) {
    return await Assignment.findOne({ _id: assignmentId, institution: institutionId })
      .populate('course', 'name code')
      .populate('classSection', 'section')
      .populate('department', 'name code')
      .populate('createdBy', 'name');
  }

  async closeAssignment(institutionId, assignmentId) {
    const assignment = await Assignment.findOne({ _id: assignmentId, institution: institutionId });
    if (!assignment) throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });
    assignment.status = 'closed';
    assignment.closedAt = new Date();
    await assignment.save();
    return assignment;
  }

  async submitAssignment(institutionId, studentId, assignmentId, data) {
    const assignment = await Assignment.findOne({ _id: assignmentId, institution: institutionId });
    if (!assignment) throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });
    if (assignment.status === 'closed') throw Object.assign(new Error('Assignment is closed'), { statusCode: 400 });

    // Check for existing submission
    const existing = await Submission.findOne({ assignment: assignmentId, student: studentId });
    if (existing && !assignment.allowResubmission) {
      throw Object.assign(new Error('Already submitted. Resubmission is not allowed.'), { statusCode: 400 });
    }

    const isLate = assignment.dueDate && new Date() > new Date(assignment.dueDate);
    const lateDays = isLate && assignment.dueDate
      ? Math.ceil((Date.now() - new Date(assignment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (isLate && !assignment.lateSubmission?.allowed) {
      throw Object.assign(new Error('Late submission is not allowed for this assignment'), { statusCode: 400 });
    }

    if (isLate && lateDays > (assignment.lateSubmission?.maxLateDays || 3)) {
      throw Object.assign(new Error('Maximum late submission period has passed'), { statusCode: 400 });
    }

    if (existing) {
      // Update existing submission
      existing.textResponse = data.textResponse || '';
      existing.submittedAt = new Date();
      existing.isLate = isLate;
      existing.lateDays = lateDays;
      existing.status = 'submitted';
      if (data.attachments) existing.attachments = data.attachments;
      await existing.save();
      return existing;
    }

    return await Submission.create({
      assignment: assignmentId,
      student: studentId,
      institution: institutionId,
      textResponse: data.textResponse || '',
      attachments: data.attachments || [],
      isLate,
      lateDays,
    });
  }

  async getSubmissions(institutionId, assignmentId) {
    return await Submission.find({ assignment: assignmentId, institution: institutionId })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });
  }

  async gradeSubmission(institutionId, submissionId, graderId, marks, feedback) {
    const submission = await Submission.findOne({ _id: submissionId, institution: institutionId });
    if (!submission) throw Object.assign(new Error('Submission not found'), { statusCode: 404 });

    submission.marksAwarded = marks;
    submission.feedback = feedback || '';
    submission.gradedBy = graderId;
    submission.gradedAt = new Date();
    submission.status = 'graded';
    submission.isPublished = true;
    await submission.save();
    return submission;
  }

  // Student: Get my submission for an assignment
  async getMySubmission(institutionId, studentId, assignmentId) {
    return await Submission.findOne({ assignment: assignmentId, student: studentId, institution: institutionId });
  }
}

module.exports = new AssessmentService();
