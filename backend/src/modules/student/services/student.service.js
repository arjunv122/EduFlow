const StudentProfile = require('../models/StudentProfile');
const ClassSection = require('../../academics/models/ClassSection');

class StudentService {
  async getStudentList(institutionId, status) {
    const query = { institution: institutionId };
    if (status) query.status = status;
    return await StudentProfile.find(query)
      .populate('user', 'name email isActive')
      .populate('department', 'name code');
  }

  async getStudentById(institutionId, id) {
    const profile = await StudentProfile.findOne({ _id: id, institution: institutionId })
      .populate('user', 'name email phone')
      .populate('department', 'name code')
      .populate('enrolledClasses');
    if (!profile) throw Object.assign(new Error('Student profile not found'), { statusCode: 404 });
    return profile;
  }

  // Returns all classes a specific student is enrolled in
  async getStudentTimetable(institutionId, userId) {
    const profile = await StudentProfile.findOne({ user: userId, institution: institutionId });
    if (!profile) throw Object.assign(new Error('Student profile not found'), { statusCode: 404 });

    const classes = await ClassSection.find({
      _id: { $in: profile.enrolledClasses },
      institution: institutionId,
      isActive: true,
    })
      .populate('course', 'name code')
      .populate('faculty', 'name');

    return classes;
  }

  async updateStudentProfile(institutionId, userId, data) {
    const profile = await StudentProfile.findOneAndUpdate(
      { user: userId, institution: institutionId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!profile) throw Object.assign(new Error('Student profile not found'), { statusCode: 404 });
    return profile;
  }

  // Called when admin enrolls a student into a class
  async syncEnrollments(institutionId, userId) {
    // Find all classes this student is enrolled in
    const classes = await ClassSection.find({
      institution: institutionId,
      enrolledStudents: userId,
    });

    const classIds = classes.map(c => c._id);
    
    await StudentProfile.findOneAndUpdate(
      { user: userId, institution: institutionId },
      { enrolledClasses: classIds }
    );
    
    return classIds;
  }
}

module.exports = new StudentService();
