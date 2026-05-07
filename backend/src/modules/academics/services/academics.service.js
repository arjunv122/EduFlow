const Department = require('../models/Department');
const Course = require('../models/Course');
const ClassSection = require('../models/ClassSection');

class AcademicsService {
  // --- Departments ---
  async createDepartment(institutionId, data) {
    return await Department.create({ ...data, institution: institutionId });
  }

  async getDepartments(institutionId) {
    return await Department.find({ institution: institutionId }).populate('head', 'name email');
  }

  async updateDepartment(institutionId, deptId, data) {
    const dept = await Department.findOneAndUpdate(
      { _id: deptId, institution: institutionId },
      data,
      { new: true, runValidators: true }
    );
    if (!dept) throw Object.assign(new Error('Department not found'), { statusCode: 404 });
    return dept;
  }


  // --- Courses ---
  async createCourse(institutionId, data) {
    return await Course.create({ ...data, institution: institutionId });
  }

  async getCourses(institutionId, departmentId) {
    const query = { institution: institutionId };
    if (departmentId) query.department = departmentId;
    return await Course.find(query).populate('department', 'name code');
  }

  async updateCourse(institutionId, courseId, data) {
    const course = await Course.findOneAndUpdate(
      { _id: courseId, institution: institutionId },
      data,
      { new: true, runValidators: true }
    );
    if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });
    return course;
  }


  // --- Class Sections ---
  async createClassSection(institutionId, data) {
    return await ClassSection.create({ ...data, institution: institutionId });
  }

  async getClassSections(institutionId, courseId) {
    const query = { institution: institutionId };
    if (courseId) query.course = courseId;
    return await ClassSection.find(query)
      .populate('course', 'name code semester credits')
      .populate('faculty', 'name email');
  }

  async updateClassSection(institutionId, sectionId, data) {
    const section = await ClassSection.findOneAndUpdate(
      { _id: sectionId, institution: institutionId },
      data,
      { new: true, runValidators: true }
    );
    if (!section) throw Object.assign(new Error('Class Section not found'), { statusCode: 404 });
    return section;
  }

  async enrollStudents(institutionId, sectionId, studentIds) {
    const section = await ClassSection.findOne({ _id: sectionId, institution: institutionId });
    if (!section) throw Object.assign(new Error('Class Section not found'), { statusCode: 404 });

    // Add unique students that aren't already enrolled, taking limit into account
    const toAdd = studentIds.filter(id => !section.enrolledStudents.includes(id));
    if (section.enrolledStudents.length + toAdd.length > section.maxStudents) {
       throw Object.assign(new Error('Class capacity exceeded'), { statusCode: 400 });
    }

    section.enrolledStudents.push(...toAdd);
    await section.save();
    return section;
  }
}

module.exports = new AcademicsService();
