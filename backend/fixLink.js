const mongoose = require('mongoose');
const Institution = require('./src/modules/governance/models/Institution');
const User = require('./src/modules/identity/models/User');

require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://arjun:arjun%402005@sret-project.bd2ku64.mongodb.net/eduflow?retryWrites=true&w=majority')
  .then(async () => {
    try {
      const admin = await User.findOne({ email: 'sretadmin@sret.edu.in' });
      if (admin) {
        console.log('Admin found. Institution ID:', admin.institution);
        const inst = await Institution.findById(admin.institution);
        if (!inst) {
          console.log('Institution NOT FOUND! It is a dead link.');
          const sret = await Institution.findOne({ email: 'admin@sret.edu.in' });
          if (sret) {
            console.log('Found SRET. Relinking...');
            admin.institution = sret._id;
            await admin.save({ validateBeforeSave: false });
            console.log('Relinked successfully!');
          }
        } else {
          console.log('Institution EXISTS:', inst.name);
        }
      }
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  });
