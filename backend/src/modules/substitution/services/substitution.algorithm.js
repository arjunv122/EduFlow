const User = require('../../identity/models/User');
const FacultyProfile = require('../../faculty/models/FacultyProfile');
const ClassSection = require('../../academics/models/ClassSection');
const AttendanceSession = require('../../attendance/models/Attendance');

/**
 * AI-Powered Substitution Matching Algorithm
 *
 * Scoring Weights (total 100 points):
 *   Subject Expertise   - 40 pts
 *   Workload Balance    - 30 pts
 *   Qualification Level - 20 pts
 *   Department Match    - 10 pts
 */

const DESIGNATION_SCORES = {
  professor: 20,
  associate_professor: 17,
  assistant_professor: 14,
  lecturer: 10,
  visiting_faculty: 7,
};

/**
 * Find available substitute faculty for a given class and time slot
 *
 * @param {Object} params
 * @param {string} params.institutionId
 * @param {string} params.classSectionId
 * @param {Date}   params.date
 * @param {string} params.startTime  - "09:00"
 * @param {string} params.endTime    - "10:00"
 * @param {string} params.originalFacultyId
 */
const findSubstitutes = async ({ institutionId, classSectionId, date, startTime, endTime, originalFacultyId }) => {
  // Get the affected class details
  const classSection = await ClassSection.findById(classSectionId)
    .populate('course')
    .populate({ path: 'faculty', populate: { path: 'institution' } });

  if (!classSection) throw new Error('Class section not found');

  const course = classSection.course;
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date(date));

  // Get all faculty in the same institution (excluding original)
  const allFacultyProfiles = await FacultyProfile.find({
    institution: institutionId,
    status: 'approved',
    user: { $ne: originalFacultyId },
  }).populate('user').populate('department');

  const suggestions = [];

  for (const profile of allFacultyProfiles) {
    if (!profile.user || !profile.user.isActive || !profile.user.isApproved) continue;

    // ─── AVAILABILITY CHECK ───────────────────────────────────────────────────
    // Find all classes assigned to this faculty on this day at this time
    const conflictingClasses = await ClassSection.find({
      institution: institutionId,
      faculty: profile.user._id,
      isActive: true,
      'schedule.day': dayOfWeek,
      'schedule.startTime': startTime,
    });

    // Also check if they already have a substitution assignment for this slot
    const Substitution = require('../models/Substitution');
    const conflictingSub = await Substitution.findOne({
      institution: institutionId,
      substituteFaculty: profile.user._id,
      date: { $gte: new Date(date).setHours(0, 0, 0, 0), $lt: new Date(date).setHours(23, 59, 59, 999) },
      startTime,
      status: { $in: ['assigned', 'accepted'] },
    });

    if (conflictingClasses.length > 0 || conflictingSub) continue; // Not available

    // ─── SCORING ─────────────────────────────────────────────────────────────

    // 1. Subject Expertise (40 pts)
    let expertiseScore = 0;
    const expertise = profile.subjectExpertise.map(s => s.toLowerCase());
    const courseCodeMatch = expertise.includes(course.code.toLowerCase());
    const courseNameMatch = expertise.some(e => course.name.toLowerCase().includes(e) || e.includes(course.name.toLowerCase()));
    const deptMatch = profile.department && classSection.course.department &&
      profile.department._id.toString() === classSection.course.department.toString();

    if (courseCodeMatch) expertiseScore = 40;
    else if (courseNameMatch) expertiseScore = 32;
    else if (deptMatch) expertiseScore = 20;
    else expertiseScore = 10;

    // 2. Workload Balance (30 pts) - fewer sub assignments this semester = better
    const substitutionCount = profile.currentSubstitutionCount || 0;
    let workloadScore;
    if (substitutionCount === 0) workloadScore = 30;
    else if (substitutionCount <= 2) workloadScore = 25;
    else if (substitutionCount <= 5) workloadScore = 18;
    else if (substitutionCount <= 10) workloadScore = 10;
    else workloadScore = 5;

    // 3. Qualification / Designation Level (20 pts)
    const qualificationScore = DESIGNATION_SCORES[profile.designation] || 10;

    // 4. Department Match (10 pts)
    const departmentScore = deptMatch ? 10 : 5;

    const totalScore = expertiseScore + workloadScore + qualificationScore + departmentScore;

    // Build human-readable reason
    let reason = '';
    if (courseCodeMatch) reason = `Directly teaches ${course.code}`;
    else if (courseNameMatch) reason = `Related subject expertise`;
    else if (deptMatch) reason = `Same department (${profile.department?.name})`;
    else reason = `Qualified and available`;

    if (substitutionCount === 0) reason += ', zero substitutions this semester';
    else reason += `, ${substitutionCount} substitution(s) this semester`;

    suggestions.push({
      faculty: profile.user._id,
      facultyProfile: profile,
      score: Math.min(totalScore, 100),
      breakdown: {
        subjectExpertise: expertiseScore,
        workloadBalance: workloadScore,
        qualification: qualificationScore,
        departmentMatch: departmentScore,
      },
      reason,
    });
  }

  // Sort by score descending, return top 5
  suggestions.sort((a, b) => b.score - a.score);
  return suggestions.slice(0, 5);
};

module.exports = { findSubstitutes };
