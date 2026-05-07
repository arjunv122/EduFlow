const mongoose = require('mongoose');

async function fixDepartment() {
  try {
    await mongoose.connect('mongodb+srv://eduflow:adhiarjun122@cluster0.bd2ku64.mongodb.net/eduflow?appName=Cluster0');
    console.log('Connected to DB');

    const db = mongoose.connection;
    const User = db.collection('users');
    const user = await User.findOne({email: 'e0226327@sret.edu.in'});
    
    if(user) {
      const StudentProfile = db.collection('studentprofiles');
      const Dept = db.collection('departments');
      
      const aiml = await Dept.findOne({ code: 'AIML' });
      if (aiml) {
        await StudentProfile.updateOne(
          { user: user._id },
          { $set: { department: aiml._id } }
        );
        console.log('Department updated to', aiml.name);
      } else {
        console.log('AIML department not found');
      }
    } else {
      console.log('user not found');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixDepartment();
