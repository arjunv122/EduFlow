const AttendanceSession = require('../models/Attendance');
const ClassSection = require('../../academics/models/ClassSection');
const StudentProfile = require('../../student/models/StudentProfile');
const Institution = require('../../governance/models/Institution');
const Department = require('../../academics/models/Department');
const { calcAttendancePercent } = require('../../../utils/response.util');
const { sendEmail, emailTemplates } = require('../../../utils/email.util');

// Simple in-memory alert cooldown tracker (7-day window)
// Key: `${studentId}_${courseId}`, Value: Date of last alert
const alertCooldown = new Map();
const ALERT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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
   * Returns attendance stats broken down by ALL enrolled courses at once.
   * Used by the student per-subject attendance table.
   */
  async getStudentAttendanceBySubject(institutionId, studentId) {
    // Get all submitted sessions this student is part of
    const sessions = await AttendanceSession.find({
      institution: institutionId,
      isSubmitted: true,
      'records.student': studentId,
    })
      .select('records course')
      .populate('course', 'name code');

    // Group by course
    const courseMap = new Map(); // courseId -> { courseName, courseCode, present, total }

    sessions.forEach(session => {
      const courseId = session.course?._id?.toString();
      if (!courseId) return;

      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          courseId,
          courseName: session.course.name,
          courseCode: session.course.code,
          present: 0,
          total: 0,
        });
      }

      const entry = courseMap.get(courseId);
      const record = session.records.find(r => r.student.toString() === studentId.toString());
      if (record) {
        entry.total++;
        if (['present', 'late'].includes(record.status)) {
          entry.present++;
        }
      }
    });

    // Calculate percentages and return as array
    return Array.from(courseMap.values()).map(entry => ({
      ...entry,
      percentage: calcAttendancePercent(entry.present, entry.total),
    }));
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

  /**
   * Generate attendance report data for export (CSV/Excel/PDF).
   * Faculty: their own classes. Admin: all classes.
   */
  async generateReportData(institutionId, filters = {}) {
    const { classSectionId, courseId, facultyId } = filters;

    const query = { institution: institutionId, isSubmitted: true };
    if (classSectionId) query.classSection = classSectionId;
    if (courseId) query.course = courseId;
    if (facultyId) query.faculty = facultyId;

    const sessions = await AttendanceSession.find(query)
      .populate('course', 'name code')
      .populate('classSection', 'section')
      .populate('records.student', 'name email')
      .sort({ date: -1 });

    // Build per-student per-course aggregated data
    const studentCourseMap = new Map();

    sessions.forEach(session => {
      const courseName = session.course?.name || 'Unknown';
      const courseCode = session.course?.code || '';
      const sectionName = session.classSection?.section || '';

      session.records.forEach(record => {
        const studentName = record.student?.name || 'Unknown';
        const studentEmail = record.student?.email || '';
        const key = `${record.student?._id}_${session.course?._id}`;

        if (!studentCourseMap.has(key)) {
          studentCourseMap.set(key, {
            studentName,
            studentEmail,
            courseName,
            courseCode,
            section: sectionName,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
          });
        }

        const entry = studentCourseMap.get(key);
        entry.total++;
        if (record.status === 'present') entry.present++;
        else if (record.status === 'absent') entry.absent++;
        else if (record.status === 'late') { entry.late++; entry.present++; } // late counts as present
        else if (record.status === 'excused') entry.excused++;
      });
    });

    // Convert to array and compute percentages
    return Array.from(studentCourseMap.values()).map(entry => ({
      ...entry,
      percentage: calcAttendancePercent(entry.present, entry.total),
    }));
  }

  // Internal helper to alert if low — with deduplication and HOD notification
  async _checkLowAttendanceMetrics(institutionId, courseId, classSectionId) {
    const classSec = await ClassSection.findById(classSectionId).populate('course');

    // Get configurable threshold from institution settings
    const institution = await Institution.findById(institutionId);
    const threshold = institution?.settings?.minAttendancePercent || 75;

    for (const studentId of classSec.enrolledStudents) {
      const stats = await this.getStudentAttendanceStats(institutionId, studentId, courseId);
      
      // If below threshold and total classes > 5 (give them a chance at start of sem)
      if (stats.total > 5 && stats.percentage < threshold) {
        // Check cooldown to avoid spamming
        const cooldownKey = `${studentId}_${courseId}`;
        const lastAlert = alertCooldown.get(cooldownKey);
        if (lastAlert && (Date.now() - lastAlert.getTime()) < ALERT_COOLDOWN_MS) {
          continue; // Skip — already alerted within the last 7 days
        }

        const profile = await StudentProfile.findOne({ user: studentId }).populate('user');
        if (profile && profile.user) {
          // Send alert to student
          try {
            await sendEmail({
              to: profile.user.email,
              ...emailTemplates.lowAttendanceAlert(profile.user.name, classSec.course.name, stats.percentage, threshold)
            });
          } catch (e) {
            console.error('Student attendance alert email failed:', e.message);
          }

          // Send alert to HOD / faculty advisor
          try {
            if (profile.department) {
              const dept = await Department.findById(profile.department).populate('head', 'name email');
              if (dept?.head?.email) {
                await sendEmail({
                  to: dept.head.email,
                  ...emailTemplates.lowAttendanceAlert(
                    `${profile.user.name} (Student in ${dept.name})`,
                    classSec.course.name,
                    stats.percentage,
                    threshold
                  )
                });
              }
            }
          } catch (e) {
            console.error('HOD attendance alert email failed:', e.message);
          }

          // Update cooldown tracker
          alertCooldown.set(cooldownKey, new Date());
        }
      }
    }
  }
}

module.exports = new AttendanceService();
