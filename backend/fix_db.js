const mongoose = require('mongoose');

async function fixSuperadmin() {
  try {
    await mongoose.connect('mongodb+srv://eduflow:adhiarjun122@cluster0.bd2ku64.mongodb.net/eduflow?appName=Cluster0');
    console.log('Connected to DB');

    // Find the single institution
    const Institution = mongoose.connection.collection('institutions');
    const inst = await Institution.findOne({});
    
    if (!inst) {
      console.log('No institution found!');
      return;
    }
    console.log('Found Institution:', inst.name, inst._id);

    // Find superadmin(s)
    const User = mongoose.connection.collection('users');
    const result = await User.updateMany(
      { role: 'superadmin' },
      { $set: { institution: inst._id, role: 'admin' } }
    );
    
    console.log(`Updated ${result.modifiedCount} superadmins to admins with institution bound.`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixSuperadmin();
