const FacultyProfile = require('../models/FacultyProfile');
const User = require('../../identity/models/User');
const { sendEmail, emailTemplates } = require('../../../utils/email.util');

class FacultyService {
  async getFacultyList(institutionId, status) {
    const query = { institution: institutionId };
    if (status) query.status = status;
    return await FacultyProfile.find(query)
      .populate('user', 'name email isActive isApproved')
      .populate('department', 'name code');
  }

  async getFacultyById(institutionId, id) {
    const profile = await FacultyProfile.findOne({ _id: id, institution: institutionId })
      .populate('user', 'name email phone')
      .populate('department', 'name code');
    if (!profile) throw Object.assign(new Error('Faculty profile not found'), { statusCode: 404 });
    return profile;
  }

  async approveFaculty(institutionId, profileId) {
    const profile = await FacultyProfile.findOne({ _id: profileId, institution: institutionId });
    if (!profile) throw Object.assign(new Error('Faculty profile not found'), { statusCode: 404 });

    profile.status = 'approved';
    await profile.save();

    // Update user auth status
    const user = await User.findById(profile.user);
    if (user) {
      user.isApproved = true;
      await user.save();
      
      // Send email
      await sendEmail({
        to: user.email,
        ...emailTemplates.accountApproved(user.name)
      });
    }

    return profile;
  }

  async updateFacultyProfile(institutionId, userId, data) {
    // A faculty member can update their own profile, or an admin can update any
    const profile = await FacultyProfile.findOneAndUpdate(
      { user: userId, institution: institutionId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!profile) throw Object.assign(new Error('Faculty profile not found'), { statusCode: 404 });
    return profile;
  }
}

module.exports = new FacultyService();
