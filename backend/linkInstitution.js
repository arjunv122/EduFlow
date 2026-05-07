const mongoose = require('mongoose');
const Institution = require('./src/modules/governance/models/Institution');
const User = require('./src/modules/identity/models/User');

require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://arjun:arjun%402005@sret-project.bd2ku64.mongodb.net/eduflow?retryWrites=true&w=majority')
  .then(async () => {
    console.log('Connected to DB');
    try {
      // Find the superadmin user or the admin
      const users = await User.find({ role: { $in: ['superadmin', 'admin'] } });
      
      if (users.length === 0) {
        console.log('No superadmin or admin found. Please register first.');
        process.exit(0);
      }

      // Check if SRET institution exists
      let sret = await Institution.findOne({ name: 'Sri Ramaswamy Memorial Engineering College' });
      
      if (!sret) {
        console.log('Creating SRET Institution...');
        sret = await Institution.create({
          name: 'Sri Ramaswamy Memorial Engineering College',
          type: 'college',
          email: 'admin@sret.edu.in',
          emailDomain: 'sret.edu.in',
          contactEmail: 'admin@sret.edu.in',
          phone: '044-2345678',
          status: 'approved',
          subscription: {
            plan: 'enterprise',
            status: 'active'
          },
          settings: {
            academicYearStart: 'June'
          }
        });
        console.log('Created SRET Institution:', sret._id);
      } else {
        console.log('SRET Institution already exists:', sret._id);
      }

      // Ensure all admins/superadmins are linked to it if they don't have one
      for (const user of users) {
        if (!user.institution) {
          user.institution = sret._id;
          await user.save({ validateBeforeSave: false });
          console.log(`Linked user ${user.email} (${user.role}) to SRET Institution`);
        } else {
          console.log(`User ${user.email} (${user.role}) is already linked to institution ${user.institution}`);
        }
      }

      console.log('Finished linking. Please refresh your browser.');
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  });
