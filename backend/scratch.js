const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://arjun:arjun%402005@sret-project.bd2ku64.mongodb.net/eduflow?retryWrites=true&w=majority')
  .then(async () => {
    const users = await mongoose.connection.db.collection('users').find({ role: { $in: ['admin', 'superadmin'] } }).toArray();
    console.log(JSON.stringify(users.map(u => ({ email: u.email, role: u.role, institution: u.institution })), null, 2));
    process.exit(0);
  });
