const Announcement = require('../models/Announcement');

class CommunicationService {
  async createAnnouncement(institutionId, userId, data) {
    return await Announcement.create({
      ...data,
      institution: institutionId,
      createdBy: userId,
    });
  }

  async getAnnouncements(institutionId, user) {
    const query = { institution: institutionId, isActive: true };
    
    // If not admin/superadmin, apply audience filters
    if (!['admin', 'superadmin'].includes(user.role)) {
       // A more sophisticated system would build an OR query based on user's department and classes.
       // For MVP, we fetch institution-wide ones and let frontend filter, or build a simple query here:
       const orConditions = [
         { audience: 'institution' }
       ];
       
       // Add specifics if we know them (simplified)
       if (user.institution) {
         query.$or = orConditions;
       }
    }

    return await Announcement.find(query)
      .populate('createdBy', 'name role')
      .sort('-createdAt');
  }

  async getAnnouncementById(institutionId, id) {
    const announcement = await Announcement.findOne({ _id: id, institution: institutionId })
      .populate('createdBy', 'name role');
    if (!announcement) throw Object.assign(new Error('Announcement not found'), { statusCode: 404 });
    return announcement;
  }
}

module.exports = new CommunicationService();
