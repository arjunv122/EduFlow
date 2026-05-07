const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const FacultyProfile = require('../../faculty/models/FacultyProfile');
const StudentProfile = require('../../student/models/StudentProfile');
const Institution = require('../../governance/models/Institution');
const Course = require('../../academics/models/Course');
const { generateToken } = require('../../../utils/response.util');
const { sendEmail, emailTemplates } = require('../../../utils/email.util');
const { generateStudentEmail, generateFacultyEmail } = require('../../../utils/emailGenerator');
const { SRET_COURSE_INDEX, DEFAULT_PASSWORDS } = require('../../../config/sretCourses');
const PreApprovedUser = require('../../users/models/PreApprovedUser');

class AuthService {
  // ─── Register a new user ───────────────────────────────────────────
  async register(data) {
    const { name, role, institutionId, profileData } = data;
    let { email, password } = data;

    // ── 1. Validate Institution ──────────────────────────────────────
    let institution = null;
    if (role !== 'superadmin') {
      if (!institutionId) {
        throw Object.assign(new Error('Institution ID is required'), { statusCode: 400 });
      }
      institution = await Institution.findById(institutionId);
      
      // Fallback: If the UI passed the hardcoded dummy ID and it wasn't found,
      // try to resolve the actual institution by domain/name or grab any registered one.
      if (!institution && institutionId === '67fee98ea432cd580c88bc3b') {
        institution = await Institution.findOne({
          $or: [{ name: /SRET/i }, { name: /Sri Ramaswamy/i }, { emailDomain: /sret/i }]
        });
        
        if (!institution) {
          // If no specific SRET institution is found, grab the first one
          institution = await Institution.findOne({});
        }
      }

      if (!institution) {
        throw Object.assign(new Error('Institution not found'), { statusCode: 404 });
      }
      if (institution.status !== 'approved' && role !== 'admin') {
        // Bypass if this is our test fallback where the dummy ID was provided
        if (institutionId !== '67fee98ea432cd580c88bc3b') {
          throw Object.assign(new Error('Institution is not active'), { statusCode: 403 });
        }
      }
    }

    // ── 1.5. Whitelist (Pre-Approved) Check ────────────────────────
    let isWhitelisted = false;
    let whitelistRecord = null;
    if (role === 'student' || role === 'faculty') {
      const contactEmailForCheck = (profileData?.contactEmail || email).toLowerCase().trim();
      whitelistRecord = await PreApprovedUser.findOne({ 
        institution: institution?._id, 
        identifier: contactEmailForCheck,
        role: role,
        isClaimed: false
      });

      if (!whitelistRecord) {
        throw Object.assign(new Error(`${role.charAt(0).toUpperCase() + role.slice(1)} not found in the institution's paid/approved registry. Please assure your fees are paid or contact the admin.`), { statusCode: 403 });
      }
      isWhitelisted = true;
    }

    // ── 2. SRET Institutional Email Generation ───────────────────────
    let institutionalEmail = email;      // final email for the User document
    let defaultPassword = password;      // final password for the User document
    let contactEmail = profileData?.contactEmail || email; // personal email for notifications
    let credentialsEmailSent = false;

    if (role === 'student') {
      // Attempt SRET institutional email generation
      const courseCode = profileData?.courseCode; // e.g. 'AIML'
      const courseIndex = courseCode ? SRET_COURSE_INDEX[courseCode.toUpperCase()] : null;

      if (courseIndex) {
        // Atomically increment the year counter on the Course document
        const yy = String(new Date().getFullYear()).slice(-2); // '26'
        const counterKey = `registrationCounters.${yy}`;

        const updatedCourse = await Course.findOneAndUpdate(
          { code: courseCode.toUpperCase(), institution: institution._id },
          { $inc: { [counterKey]: 1 } },
          { new: true, upsert: false }
        );

        if (updatedCourse) {
          const seq = updatedCourse.registrationCounters.get(yy) || 1;
          institutionalEmail = generateStudentEmail(courseIndex, seq);
          defaultPassword = DEFAULT_PASSWORDS.student;
        } else {
          // DEV FALLBACK: If course is missing in DB, mock the sequence so they can still test email gen
          const mockSeq = Math.floor(Math.random() * 900) + 100;
          institutionalEmail = generateStudentEmail(courseIndex, mockSeq);
          defaultPassword = DEFAULT_PASSWORDS.student;
        }
        // If course not found in DB, fall back to submitted email
      } else if (!email) {
        throw Object.assign(new Error('Either a valid course code or an email is required'), { statusCode: 400 });
      }

    } else if (role === 'faculty') {
      // Generate faculty email from first name
      const existingEmails = await User.find({ institution: institution._id })
        .select('email').lean().then(users => users.map(u => u.email));

      institutionalEmail = generateFacultyEmail(name, existingEmails);
      defaultPassword = DEFAULT_PASSWORDS.faculty;
    }

    // ── 3. Check email uniqueness (with the generated institutional email) ──
    const existing = await User.findOne({ email: institutionalEmail });
    if (existing) {
      throw Object.assign(new Error('Email already registered'), { statusCode: 400 });
    }

    // ── 4. Determine approval status ────────────────────────────────
    // Students: always auto-approved | Faculty/Admin: need approval
    const isApproved = role === 'student' || role === 'superadmin';

    // ── 5. Create the User ──────────────────────────────────────────
    const user = await User.create({
      name,
      email: institutionalEmail,
      password: defaultPassword,
      role,
      institution: institution ? institution._id : null,
      isApproved,
      isActive: isWhitelisted, // Auto-activate if whitelisted
    });

    // ── 6. Create role-specific profile ────────────────────────────
    if (role === 'faculty' && profileData) {
      await FacultyProfile.create({
        user: user._id,
        institution: institution._id,
        facultyId: profileData.facultyId || `FAC${Date.now()}`,
        designation: profileData.designation || 'lecturer',
        qualification: profileData.qualification || '',
        specialization: profileData.specialization || (mongoose.Types.ObjectId.isValid(profileData.department) ? [] : (profileData.department ? [profileData.department] : [])),
        subjectExpertise: profileData.subjectExpertise || [],
        department: mongoose.Types.ObjectId.isValid(profileData.department) ? profileData.department : null,
        experience: profileData.experience || 0,
        dateOfBirth: profileData.dateOfBirth,
        joiningDate: profileData.joiningDate || new Date(),
        status: 'pending',
      });
    }

    if (role === 'student' && profileData) {
      await StudentProfile.create({
        user: user._id,
        institution: institution._id,
        studentId: profileData.studentId || `STU${Date.now()}`,
        batchYear: profileData.batchYear || new Date().getFullYear(),
        currentSemester: profileData.currentSemester || 1,
        department: mongoose.Types.ObjectId.isValid(profileData.department) ? profileData.department : null,
        admissionDate: profileData.admissionDate || new Date(),
        dateOfBirth: profileData.dateOfBirth,
        parent: profileData.parent || {},
      });

      // Increment institution student count
      await Institution.findByIdAndUpdate(institution._id, {
        $inc: { 'stats.totalStudents': 1 },
      });
    }

    // ── 7. Send credentials email ────────────────────────────────────
    credentialsEmailSent = false;
    if (isWhitelisted) {
      // 7a. Send credentials to personal contact email
      try {
        const rollNo = role === 'student' ? (profileData.studentId || `STU${Date.now()}`) : (profileData.facultyId || `FAC${Date.now()}`);
        const template = emailTemplates.activationCredentials(
          name,
          institutionalEmail, // Use the generated email as their Roll No / Login ID wrapper 
          defaultPassword,
          institution?.name || 'Your Institution'
        );
        await sendEmail({ to: contactEmail, ...template });
        credentialsEmailSent = true;

        // 7b. Mark whitelist as claimed
        if (whitelistRecord) {
          whitelistRecord.isClaimed = true;
          await whitelistRecord.save();
        }
      } catch (e) {
        console.error('Email send error during pre-approved activation:', e.message);
      }
    }

    const token = generateToken(user._id);
    return {
      user: this._sanitizeUser(user),
      token,
      isApproved,
      institutionalEmail,
      credentialsEmailSent,
      // Show in API response for dev/admin awareness
      ...(institutionalEmail !== email && { generatedEmailInfo: { sentTo: contactEmail } }),
    };
  }

  // ─── Login ─────────────────────────────────────────────────────────
  async login(email, password) {
    const user = await User.findOne({ email }).select('+password').populate('institution');
    if (!user || !(await user.comparePassword(password))) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    if (!user.isActive) {
      throw Object.assign(new Error('Your account has not been activated yet. Please contact your institution administrator to get access.'), { 
        statusCode: 403, 
        code: 'ACCOUNT_NOT_ACTIVATED' 
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    return { user: this._sanitizeUser(user), token };
  }

  // ─── Get current user ──────────────────────────────────────────────
  async getMe(userId) {
    const user = await User.findById(userId).populate('institution');
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    let profileData = null;
    if (user.role === 'faculty') {
      profileData = await FacultyProfile.findOne({ user: userId })
        .populate('department').populate('institution');
    } else if (user.role === 'student') {
      profileData = await StudentProfile.findOne({ user: userId })
        .populate('department').populate('enrolledClasses');
    }

    return { user: this._sanitizeUser(user), profile: profileData };
  }

  // ─── Change Password ───────────────────────────────────────────────
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw Object.assign(new Error('Current password is incorrect'), { statusCode: 401 });
    }

    if (newPassword.length < 8) {
      throw Object.assign(new Error('New password must be at least 8 characters'), { statusCode: 400 });
    }

    if (currentPassword === newPassword) {
      throw Object.assign(new Error('New password must be different from current password'), { statusCode: 400 });
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  // ─── Forgot Password ───────────────────────────────────────────────
  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw Object.assign(new Error('No account found with that email address'), { statusCode: 404 });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    try {
      await sendEmail({
        to: user.email,
        ...emailTemplates.passwordReset(user.name, resetUrl),
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw Object.assign(new Error('Failed to send reset email. Please try again later.'), { statusCode: 500 });
    }

    return { message: 'Password reset link sent to your email' };
  }

  // ─── Reset Password (via token) ────────────────────────────────────
  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
    }

    if (newPassword.length < 6) {
      throw Object.assign(new Error('Password must be at least 6 characters'), { statusCode: 400 });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    return { message: 'Password reset successful. You can now log in with your new password.' };
  }

  // ─── Create Initial Super Admin ────────────────────────────────────
  async createSuperAdmin(name, email, password) {
    const existing = await User.findOne({ role: 'superadmin' });
    if (existing) {
      throw Object.assign(new Error('Super admin already exists'), { statusCode: 400 });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'superadmin',
      isApproved: true,
      isActive: true,
    });

    const token = generateToken(user._id);
    return { user: this._sanitizeUser(user), token };
  }

  _sanitizeUser(user) {
    const u = user.toObject ? user.toObject() : { ...user._doc };
    delete u.password;
    delete u.resetPasswordToken;
    delete u.resetPasswordExpires;
    return u;
  }
}

module.exports = new AuthService();
