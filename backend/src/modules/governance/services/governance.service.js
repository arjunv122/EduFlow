const Institution = require('../models/Institution');
const User = require('../../identity/models/User');
const { sendEmail, emailTemplates } = require('../../../utils/email.util');

class GovernanceService {
  async registerInstitution(data) {
    const { name, type, email, phone, website, address } = data;

    const existing = await Institution.findOne({ email });
    if (existing) {
      throw Object.assign(new Error('Institution with this email already exists'), { statusCode: 400 });
    }

    const institution = await Institution.create({
      name,
      type,
      email,
      phone,
      website,
      address,
      status: 'pending',
    });

    return institution;
  }

  async getAllInstitutions(status) {
    const query = status ? { status } : {};
    return await Institution.find(query).populate('adminUser', 'name email phone').sort('-createdAt');
  }

  async getInstitutionById(id) {
    const institution = await Institution.findById(id).populate('adminUser', 'name email');
    if (!institution) throw Object.assign(new Error('Institution not found'), { statusCode: 404 });
    return institution;
  }

  async approveInstitution(id, superadminId, subscriptionPlan = 'free') {
    const institution = await Institution.findById(id);
    if (!institution) throw Object.assign(new Error('Institution not found'), { statusCode: 404 });

    if (institution.status === 'approved') {
      throw Object.assign(new Error('Institution is already approved'), { statusCode: 400 });
    }

    // Default max limits based on plan
    let maxUsers = 50, maxStorage = 1;
    if (subscriptionPlan === 'basic') { maxUsers = 200; maxStorage = 10; }
    else if (subscriptionPlan === 'professional') { maxUsers = 1000; maxStorage = 50; }
    else if (subscriptionPlan === 'enterprise') { maxUsers = 999999; maxStorage = 9999; }

    institution.status = 'approved';
    institution.approvedBy = superadminId;
    institution.approvedAt = new Date();
    institution.subscription.plan = subscriptionPlan;
    institution.subscription.status = 'active'; // or trial
    institution.subscription.maxUsers = maxUsers;
    institution.subscription.maxStorage = maxStorage;

    await institution.save();

    // Now send the welcome email to the contact email (if we had contact name, we would use it)
    await sendEmail({
      to: institution.email,
      subject: 'EduFlow – Institution Approved',
      html: `<h2>Your institution ${institution.name} has been approved on EduFlow.</h2><p>You can now log in and set up your institution.</p>`
    });

    return institution;
  }

  async setInstitutionAdmin(institutionId, userId) {
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      throw Object.assign(new Error('User not found or is not an admin'), { statusCode: 400 });
    }

    const institution = await Institution.findByIdAndUpdate(
      institutionId,
      { adminUser: userId },
      { new: true }
    );
    return institution;
  }

  async updateInstitution(id, data) {
    const institution = await Institution.findById(id);
    if (!institution) throw Object.assign(new Error('Institution not found'), { statusCode: 404 });

    // Ensure we don't accidentally override the entire settings object if only partial is sent
    const updatedSettings = {
      ...institution.settings,
      ...data.settings
    };

    const updatedData = {
      ...data,
      settings: updatedSettings
    };

    // Remove any sensitive fields from being updated directly via this route
    delete updatedData.status;
    delete updatedData.subscription;
    delete updatedData.adminUser;

    const updated = await Institution.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    );
    return updated;
  }
}

module.exports = new GovernanceService();
