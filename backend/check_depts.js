const mongoose = require('mongoose');

async function checkDepts() {
  try {
    await mongoose.connect('mongodb+srv://eduflow:adhiarjun122@cluster0.bd2ku64.mongodb.net/eduflow?appName=Cluster0');
    console.log('Connected to DB');

    const Dept = mongoose.connection.collection('departments');
    const depts = await Dept.find({}).toArray();
    
    depts.forEach(d => {
      console.log(`Dept: ${d.name}, Inst: ${d.institution}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDepts();
