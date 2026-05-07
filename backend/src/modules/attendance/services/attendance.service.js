const AttendanceSession = require('../models/Attendance');
const ClassSection = require('../../academics/models/ClassSection');
const StudentProfile = require('../../student/models/StudentProfile');
const { calcAttendancePercent } = require('../../../utils/response.util');
const { sendEmail, emailTemplates } = require('../../../utils/email.util');

class AttendanceService {
  async initiateSession(institutionId, data) {
    const { classSectionId, date, startTime, endTime, facultyId, isSubstitute, method } = data;

    const classSection = await ClassSection.findById(classSectionId).populate('course');
    if (!classSection) throw Object.assign(new Error('Class not found'), { statusCode: 404 });

    // Check for existing session
    const existing = await AttendanceSession.findOne({
      institution: institutionId,
      classSection: classSectionId,
      date: new Date(date).setHours(0, 0, 0, 0),
      startTime,
    });

    if (existing) {
      return existing; // Return existing session to resume
    }

    // Scaffold empty records for all enrolled students
    const records = classSection.enrolledStudents.map(studentId => ({
      student: studentId,
      status: 'absent', // Default to absent until marked
    }));

    return await AttendanceSession.create({
      institution: institutionId,
      classSection: classSectionId,
      course: classSection.course._id,
      faculty: facultyId,
      isSubstitute,
      date: new Date(date).setHours(0, 0, 0, 0),
      startTime,
      endTime,
      method,
      records,
    });
  }

  async markAttendance(institutionId, sessionId, records) {
    const session = await AttendanceSession.findOne({ _id: sessionId, institution: institutionId });
    if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });

    // records: [{ student: 'id', status: 'present/absent' }]
    for (const record of records) {
      const existingRecord = session.records.find(r => r.student.toString() === record.student.toString());
      if (existingRecord) {
        existingRecord.status = record.status;
        existingRecord.markedAt = new Date();
        if (record.remarks) existingRecord.remarks = record.remarks;
      }
    }

    await session.save();
    return session;
  }

  async submitSession(institutionId, sessionId) {
    const session = await AttendanceSession.findOne({ _id: sessionId, institution: institutionId }).populate('course');
    if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });

    session.isSubmitted = true;
    session.submittedAt = new Date();
    await session.save();

    // IMPORTANT: Fire-and-forget — never block the HTTP response with O(n) alert checks
    setImmediate(() => {
      this._checkLowAttendanceMetrics(institutionId, session.course._id, session.classSection)
        .catch(console.error);
    });

    return session;
  }

  async getStudentAttendanceStats(institutionId, studentId, courseId = null) {
    const query = {
      institution: institutionId,
      isSubmitted: true,
      'records.student': studentId
    };
    if (courseId) query.course = courseId;

    const sessions = await AttendanceSession.find(query).select('records course date startTime');
    
    // Calculate aggregate
    let presentCount = 0;
    let totalCount = 0;

    sessions.forEach(session => {
      const record = session.records.find(r => r.student.toString() === studentId.toString());
      if (record) {
        totalCount++;
        if (['present', 'late'].includes(record.status)) {
          presentCount++;
        }
      }
    });

    return {
      present: presentCount,
      total: totalCount,
      percentage: calcAttendancePercent(presentCount, totalCount),
    };
  }

  /**
   * Returns per-day attendance status for a given student/month/year.
   * Used by the student calendar heatmap.
   */
  async getAttendanceCalendar(institutionId, studentId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

    const sessions = await AttendanceSession.find({
      institution: institutionId,
      isSubmitted: true,
      'records.student': studentId,
      date: { $gte: startDate, $lte: endDate },
    }).select('date records startTime');

    const calendar = {};
    sessions.forEach(session => {
      const dateKey = new Date(session.date).toISOString().split('T')[0];
      const record = session.records.find(r => r.student.toString() === studentId.toString());
      if (record) {
        // If multiple sessions on same day, use the worst status
        const existing = calendar[dateKey];
        if (!existing || record.status === 'absent') {
          calendar[dateKey] = record.status;
        }
      }
    });

    return calendar; // { '2025-04-01': 'present', '2025-04-02': 'absent', ... }
  }

  // Internal helper to alert if low
  async _checkLowAttendanceMetrics(institutionId, courseId, classSectionId) {
    const classSec = await ClassSection.findById(classSectionId).populate('course');
    for (const studentId of classSec.enrolledStudents) {
      const stats = await this.getStudentAttendanceStats(institutionId, studentId, courseId);
      
      // If below 75% and total classes > 5 (give them a chance at start of sem)
      if (stats.total > 5 && stats.percentage < 75) {
        const profile = await StudentProfile.findOne({ user: studentId }).populate('user');
        if (profile && profile.user && profile.parent && profile.parent.email) {
            await sendEmail({
              to: profile.user.email,
              ...emailTemplates.lowAttendanceAlert(profile.user.name, classSec.course.name, stats.percentage, 75)
            });
            // Optional: Also email parent. Skipping for now to avoid spam during testing.
        }
      }
    }
  }
}

module.exports = new AttendanceService();
