const LeaveRequest = require('../models/LeaveRequest');
const Substitution = require('../models/Substitution');
const FacultyProfile = require('../../faculty/models/FacultyProfile');
const { findSubstitutes } = require('./substitution.algorithm');
const { sendEmail, emailTemplates } = require('../../../utils/email.util');
const ClassSection = require('../../academics/models/ClassSection');
const User = require('../../identity/models/User');

class SubstitutionService {
  async applyForLeave(institutionId, data, facultyId) {
    const { startDate, endDate, reason, leaveType } = data;

    // Determine affected classes (simplified logic for MVP - normally involves checking schedule against date range)
    // For MVP, we pass affected classes from frontend
    const affectedClasses = data.affectedClasses || [];

    const request = await LeaveRequest.create({
      institution: institutionId,
      faculty: facultyId,
      startDate,
      endDate,
      reason,
      leaveType,
      affectedClasses,
    });

    return request;
  }

  async processLeaveRequest(institutionId, requestId, status, adminId, adminRemarks = '') {
    const request = await LeaveRequest.findOne({ _id: requestId, institution: institutionId });
    if (!request) throw Object.assign(new Error('Leave request not found'), { statusCode: 404 });

    request.status = status;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    if (adminRemarks) request.adminRemarks = adminRemarks;
    await request.save();

    // Trigger AI Matching for affected classes if approved
    if (status === 'approved') {
      for (const affected of request.affectedClasses) {
        try {
          const suggestions = await findSubstitutes({
            institutionId,
            classSectionId: affected.classSection,
            date: affected.date,
            startTime: affected.startTime,
            endTime: affected.endTime,
            originalFacultyId: request.faculty,
          });

          await Substitution.create({
            institution: institutionId,
            leaveRequest: request._id,
            originalFaculty: request.faculty,
            classSection: affected.classSection,
            course: affected.course,
            date: affected.date,
            startTime: affected.startTime,
            endTime: affected.endTime,
            aiSuggestions: suggestions,
            detectionType: 'proactive',
          });
        } catch (e) {
          console.error('Failed to create substitution match:', e);
        }
      }
    }

    return request;
  }

  async getPendingSubstitutions(institutionId) {
    return await Substitution.find({ institution: institutionId, status: 'pending' })
      .populate('originalFaculty', 'name')
      .populate('classSection', 'section maxStudents')
      .populate('course', 'name code')
      .populate('aiSuggestions.faculty', 'name');
  }

  async assignSubstitute(institutionId, substitutionId, substituteFacultyId, adminId) {
    const sub = await Substitution.findOne({ _id: substitutionId, institution: institutionId })
      .populate('course')
      .populate('classSection');
    if (!sub) throw Object.assign(new Error('Substitution not found'), { statusCode: 404 });

    sub.substituteFaculty = substituteFacultyId;
    sub.assignedBy = adminId;
    sub.assignedAt = new Date();
    sub.status = 'assigned';
    await sub.save();

    // Increment the substitute faculty's substitution count
    try {
      await FacultyProfile.findOneAndUpdate(
        { user: substituteFacultyId },
        { $inc: { currentSubstitutionCount: 1 } }
      );
    } catch (e) {
      console.error('Failed to increment substitution count:', e.message);
    }

    // Send notifications
    try {
      const substitute = await User.findById(substituteFacultyId);
      if (substitute) {
        await sendEmail({
          to: substitute.email,
          ...emailTemplates.substitutionAssigned(
            substitute.name,
            sub.course.name,
            sub.classSection.section,
            sub.date.toDateString(),
            sub.startTime,
            null, // room
            null // last topic
          )
        });
        sub.notificationsSent.toSubstitute = true;
        await sub.save();
      }
    } catch (e) {
      console.error('Email failed', e);
    }

    return sub;
  }
  async getMyLeaveRequests(institutionId, facultyId) {
    return await LeaveRequest.find({ institution: institutionId, faculty: facultyId })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name');
  }

  async getMySubstitutions(institutionId, facultyId) {
    // Get substitutions where this faculty is either the original or the assigned substitute
    const asOriginal = await Substitution.find({ institution: institutionId, originalFaculty: facultyId })
      .populate('substituteFaculty', 'name')
      .populate('classSection', 'section')
      .populate('course', 'name code')
      .sort({ date: -1 });

    const asSubstitute = await Substitution.find({ institution: institutionId, substituteFaculty: facultyId })
      .populate('originalFaculty', 'name')
      .populate('classSection', 'section')
      .populate('course', 'name code')
      .sort({ date: -1 });

    return { asOriginal, asSubstitute };
  }
}

module.exports = new SubstitutionService();
