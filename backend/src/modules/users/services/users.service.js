const User = require('../../identity/models/User');
const StudentProfile = require('../../student/models/StudentProfile');
const FacultyProfile = require('../../faculty/models/FacultyProfile');
const Institution = require('../../governance/models/Institution');
const { generateToken } = require('../../../utils/response.util');
const { getInstitutionFilter } = require('../../../utils/institutionFilter');
const crypto = require('crypto');
const { sendEmail, emailTemplates } = require('../../../utils/email.util');
const PreApprovedUser = require('../models/PreApprovedUser');

class UserProvisioningService {
  /**
   * List all users in the institution with their profile summaries.
   */
  async listUsers(institutionId, { role, isActive, page = 1, limit = 50 } = {}) {
    const query = { institution: institutionId };
    if (role) query.role = role;
    if (typeof isActive !== 'undefined') query.isActive = isActive;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Deactivate a user account (soft-delete).
   */
  async deactivateUser(institutionId, userId) {
    const user = await User.findOne({ _id: userId, institution: institutionId });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    if (user.role === 'superadmin') throw Object.assign(new Error('Cannot deactivate superadmin'), { statusCode: 403 });

    user.isActive = false;
    await user.save({ validateBeforeSave: false });
    return { userId, deactivated: true };
  }

  /**
   * Delete a user account completely, including profiles.
   */
  async deleteUser(institutionId, userId) {
    const user = await User.findOne({ _id: userId, institution: institutionId });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    if (user.role === 'superadmin' || user.role === 'admin') {
      throw Object.assign(new Error(`Cannot delete ${user.role} via this interface`), { statusCode: 403 });
    }

    if (user.role === 'student') {
      await StudentProfile.findOneAndDelete({ user: userId });
    } else if (user.role === 'faculty') {
      await FacultyProfile.findOneAndDelete({ user: userId });
    }

    await User.findByIdAndDelete(userId);
    return { userId, deleted: true };
  }

  /**
   * Activate a user account (with credential generation and email dispatch)
   */
  async activateUser(institutionId, userId) {
    const user = await User.findOne({ _id: userId, institution: institutionId }).populate('institution');
    if (!user) throw Object.assign(new Error('User not found in this institution'), { statusCode: 404 });
    if (user.isActive) throw Object.assign(new Error('User is already active'), { statusCode: 400 });

    // Generate secure 10-char password (uppercase, lowercase, number)
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const num = '0123456789';
    let rawPassword = '';
    rawPassword += upper[Math.floor(Math.random() * upper.length)];
    rawPassword += lower[Math.floor(Math.random() * lower.length)];
    rawPassword += num[Math.floor(Math.random() * num.length)];
    const charset = upper + lower + num;
    for (let i = 0; i < 7; i++) {
      rawPassword += charset[Math.floor(Math.random() * charset.length)];
    }
    // Shuffle the password
    rawPassword = rawPassword.split('').sort(() => 0.5 - Math.random()).join('');

    user.password = rawPassword;
    user.isActive = true;

    await user.save(); // pre('save') hash is triggered here

    // Resolve Roll No / ID
    let rollNo = 'N/A';
    if (user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: user._id });
      rollNo = profile?.studentId || 'N/A';
    } else if (user.role === 'faculty') {
      const profile = await FacultyProfile.findOne({ user: user._id });
      rollNo = profile?.facultyId || 'N/A';
    }

    // Send Activation Email
    try {
      const template = emailTemplates.activationCredentials(
        user.name,
        rollNo,
        rawPassword,
        user.institution?.name || 'Your Institution'
      );
      await sendEmail({ to: user.email, ...template });
    } catch (e) {
      console.error('Email send failed during activation:', e.message);
    }

    return { userId, activated: true, emailSentTo: user.email };
  }

  /**
   * Reactivate a user account without password reset (if previously active)
   */
  async reactivateUser(institutionId, userId) {
    const user = await User.findOne({ _id: userId, institution: institutionId });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    user.isActive = true;
    await user.save({ validateBeforeSave: false });
    return { userId, reactivated: true };
  }

  /**
   * Change a user's role.
   */
  async changeUserRole(institutionId, userId, newRole) {
    const allowed = ['faculty', 'student', 'admin'];
    if (!allowed.includes(newRole)) {
      throw Object.assign(new Error(`Invalid role. Allowed: ${allowed.join(', ')}`), { statusCode: 400 });
    }
    const user = await User.findOneAndUpdate(
      { _id: userId, institution: institutionId },
      { role: newRole },
      { new: true }
    ).select('-password');
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
  }

  /**
   * Bulk import students from a parsed CSV array.
   * Each row: { name, email, studentId, batchYear, departmentId }
   * Returns a summary: { created, skipped, errors }
   */
  async bulkImportStudents(institutionId, rows) {
    const results = { created: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const { name, email, studentId, batchYear, departmentId } = row;
        if (!name || !email) {
          results.errors.push({ row, reason: 'Missing name or email' });
          results.skipped++;
          continue;
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
          results.skipped++;
          results.errors.push({ row, reason: 'Email already registered' });
          continue;
        }

        // Default password = studentId or first part of email
        const defaultPassword = studentId || email.split('@')[0];

        const user = await User.create({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: defaultPassword,
          role: 'student',
          institution: institutionId,
          isApproved: true,
          isActive: false, // Must be activated manually by admin
        });

        await StudentProfile.create({
          user: user._id,
          institution: institutionId,
          studentId: studentId || `STU${Date.now()}`,
          batchYear: parseInt(batchYear) || new Date().getFullYear(),
          department: departmentId || null,
          admissionDate: new Date(),
          status: 'active',
        });

        // Update institution stats
        await Institution.findByIdAndUpdate(institutionId, {
          $inc: { 'stats.totalStudents': 1 },
        });

        results.created++;
      } catch (err) {
        results.errors.push({ row, reason: err.message });
        results.skipped++;
      }
    }

    return results;
  }

  // --- PRE-APPROVED WHITELIST ---

  async addPreApprovedUser(institutionId, data) {
    const { name, identifier, role } = data;
    if (!name || !identifier || !role) {
      throw Object.assign(new Error('Name, identifier, and role are required'), { statusCode: 400 });
    }
    
    // Check if user already exists
    const existing = await PreApprovedUser.findOne({ institution: institutionId, identifier: identifier.toLowerCase() });
    if (existing) {
      throw Object.assign(new Error('Identifier is already pre-approved'), { statusCode: 400 });
    }

    const preApprove = await PreApprovedUser.create({
      institution: institutionId,
      name,
      identifier: identifier.toLowerCase(),
      role,
      isClaimed: false
    });

    return preApprove;
  }

  async getPreApprovedUsers(institutionId) {
    return await PreApprovedUser.find({ institution: institutionId }).sort({ createdAt: -1 });
  }

  async removePreApprovedUser(institutionId, preApprovedId) {
    const doc = await PreApprovedUser.findOneAndDelete({ _id: preApprovedId, institution: institutionId });
    if (!doc) throw Object.assign(new Error('Entry not found'), { statusCode: 404 });
    return { success: true };
  }
}

module.exports = new UserProvisioningService();
