const SupportTicket = require('../models/SupportTicket');
const ClassSection = require('../../academics/models/ClassSection');

class SupportService {
  async raiseTicket(institutionId, userId, data) {
    const { category, courseId } = data;
    
    // Auto-routing logic
    let routedTo = 'support_team';
    let assignedTo = null;

    if (['academic_doubt', 'assignment_help', 'grade_query', 'attendance_issue', 'quiz_issue'].includes(category)) {
      routedTo = 'faculty';
      // Find faculty for this course to auto-assign
      if (courseId) {
        // Just find a class section for this course to see who teaches it (simplified for MVP)
        const classSec = await ClassSection.findOne({ course: courseId, institution: institutionId });
        if (classSec && classSec.faculty) {
           assignedTo = classSec.faculty;
        }
      }
    } else if (['fee_issue'].includes(category)) {
      routedTo = 'admin';
    }

    return await SupportTicket.create({
      ...data,
      institution: institutionId,
      raisedBy: userId,
      routedTo,
      assignedTo,
    });
  }

  async getMyTickets(institutionId, userId) {
    return await SupportTicket.find({ institution: institutionId, raisedBy: userId })
      .populate('assignedTo', 'name role')
      .populate('relatedCourse', 'name code')
      .sort('-createdAt');
  }

  async getAssignedTickets(institutionId, userId, role) {
    let query = { institution: institutionId };
    
    if (role === 'faculty') {
      query.$or = [{ assignedTo: userId }, { routedTo: 'faculty', assignedTo: null }];
    } else if (role === 'admin') {
      query.routedTo = 'admin';
    }

    return await SupportTicket.find(query)
      .populate('raisedBy', 'name role email')
      .populate('relatedCourse', 'name code')
      .sort('-createdAt');
  }

  async respondToTicket(institutionId, ticketId, userId, message, isInternal = false) {
    const ticket = await SupportTicket.findOne({ _id: ticketId, institution: institutionId });
    if (!ticket) throw Object.assign(new Error('Ticket not found'), { statusCode: 404 });

    // Status logic
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
      if (!ticket.firstResponseAt && ticket.raisedBy.toString() !== userId.toString()) {
        ticket.firstResponseAt = new Date();
        ticket.responseTimeMinutes = Math.round((ticket.firstResponseAt - ticket.createdAt) / 60000);
      }
    }

    ticket.responses.push({
      respondedBy: userId,
      message,
      isInternal,
    });

    await ticket.save();
    return ticket;
  }

  async closeTicket(institutionId, ticketId, userId) {
    const ticket = await SupportTicket.findOne({ _id: ticketId, institution: institutionId });
    if (!ticket) throw Object.assign(new Error('Ticket not found'), { statusCode: 404 });

    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    await ticket.save();
    return ticket;
  }
}

module.exports = new SupportService();
