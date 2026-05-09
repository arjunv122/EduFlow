const StudentLeave = require('../models/StudentLeave');
const StudentProfile = require('../models/StudentProfile');
const Department = require('../../academics/models/Department');

class StudentLeaveService {
  // Check if a date is a Sunday
  _isSunday(date) {
    return new Date(date).getDay() === 0;
  }

  // Check if a date is the 2nd Saturday of its month
  _isSecondSaturday(date) {
    const d = new Date(date);
    if (d.getDay() !== 6) return false; // Not Saturday
    const dayOfMonth = d.getDate();
    return dayOfMonth >= 8 && dayOfMonth <= 14; // 2nd week
  }

  // Validate leave dates - reject Sundays and 2nd Saturdays
  _validateLeaveDates(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const blockedDates = [];

    const current = new Date(start);
    while (current <= end) {
      if (this._isSunday(current)) {
        blockedDates.push({ date: current.toISOString().split('T')[0], reason: 'Sunday' });
      } else if (this._isSecondSaturday(current)) {
        blockedDates.push({ date: current.toISOString().split('T')[0], reason: '2nd Saturday' });
      }
      current.setDate(current.getDate() + 1);
    }

    return blockedDates;
  }

  // Calculate working days (exclude Sundays and 2nd Saturdays)
  _countLeaveDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      if (!this._isSunday(current) && !this._isSecondSaturday(current)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  async applyLeave(institutionId, studentId, data) {
    const { startDate, endDate, reason, leaveType } = data;

    if (new Date(startDate) > new Date(endDate)) {
      throw Object.assign(new Error('Start date must be before end date'), { statusCode: 400 });
    }

    // Medical leave can be applied for past dates (student may have been sick)
    if (leaveType !== 'medical' && new Date(startDate) < new Date().setHours(0, 0, 0, 0)) {
      throw Object.assign(new Error('Cannot apply leave for past dates'), { statusCode: 400 });
    }

    // Check for blocked dates
    const blockedDates = this._validateLeaveDates(startDate, endDate);
    if (blockedDates.length > 0) {
      const blocked = blockedDates.map(d => `${d.date} (${d.reason})`).join(', ');
      throw Object.assign(
        new Error(`Leave cannot include these dates: ${blocked}. Sundays and 2nd Saturdays are not allowed.`),
        { statusCode: 400 }
      );
    }

    // Get student's department
    const profile = await StudentProfile.findOne({ user: studentId });
    if (!profile?.department) {
      throw Object.assign(new Error('Your department is not set. Please contact admin.'), { statusCode: 400 });
    }

    const totalDays = this._countLeaveDays(startDate, endDate);

    const leaveData = {
      student: studentId,
      institution: institutionId,
      department: profile.department,
      startDate,
      endDate,
      reason,
      leaveType: leaveType || 'personal',
      totalDays,
    };

    // If medical doc was provided at apply time, save it
    if (data.documentUrl) {
      leaveData.medicalDocument = data.documentUrl;
      leaveData.medicalDocumentName = data.documentName || 'Medical Document';
      leaveData.documentUploadedAt = new Date();
    }

    return await StudentLeave.create(leaveData);
  }

  // Upload or update medical document for an existing leave
  async uploadMedicalDocument(institutionId, studentId, leaveId, docData) {
    const leave = await StudentLeave.findOne({ _id: leaveId, student: studentId, institution: institutionId });
    if (!leave) throw Object.assign(new Error('Leave not found'), { statusCode: 404 });
    if (leave.leaveType !== 'medical') throw Object.assign(new Error('Document upload only for medical leaves'), { statusCode: 400 });
    if (leave.status === 'rejected') throw Object.assign(new Error('Cannot update a rejected leave'), { statusCode: 400 });

    leave.medicalDocument = docData.documentUrl;
    leave.medicalDocumentName = docData.documentName;
    leave.documentUploadedAt = new Date();
    await leave.save();
    return leave;
  }

  async getMyLeaves(institutionId, studentId) {
    return await StudentLeave.find({ student: studentId, institution: institutionId })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
  }

  async getDepartmentLeaves(institutionId, departmentId, status = null) {
    const query = { institution: institutionId, department: departmentId };
    if (status) query.status = status;
    return await StudentLeave.find(query)
      .populate('student', 'name email')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });
  }

  async processLeave(institutionId, leaveId, reviewerId, status, remarks = '') {
    const leave = await StudentLeave.findOne({ _id: leaveId, institution: institutionId });
    if (!leave) throw Object.assign(new Error('Leave request not found'), { statusCode: 404 });
    if (leave.status !== 'pending') {
      throw Object.assign(new Error('Leave already processed'), { statusCode: 400 });
    }

    // Verify reviewer belongs to the same department (HOD, coordinator, or any faculty in dept)
    const FacultyProfile = require('../models/FacultyProfile');
    const dept = await Department.findById(leave.department);
    if (!dept) throw Object.assign(new Error('Department not found'), { statusCode: 404 });

    const isHOD = (
      dept.head?.toString() === reviewerId.toString() ||
      dept.coordinator?.toString() === reviewerId.toString()
    );
    const facultyInDept = await FacultyProfile.findOne({ user: reviewerId, department: leave.department });
    if (!isHOD && !facultyInDept) {
      throw Object.assign(new Error('You are not authorized to approve leaves for this department'), { statusCode: 403 });
    }

    leave.status = status;
    leave.reviewedBy = reviewerId;
    leave.reviewedAt = new Date();
    leave.remarks = remarks;
    await leave.save();

    return leave;
  }
}

module.exports = new StudentLeaveService();
