const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb+srv://eduflow:adhiarjun122@cluster0.bd2ku64.mongodb.net/eduflow?appName=Cluster0');
    console.log('Connected to DB');

    const User = mongoose.connection.collection('users');
    const users = await User.find({}).toArray();
    
    users.forEach(u => {
      console.log(`Email: ${u.email}, Role: ${u.role}, Inst: ${u.institution}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
