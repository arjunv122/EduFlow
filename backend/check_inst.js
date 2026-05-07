const mongoose = require('mongoose');

async function checkInst() {
  try {
    await mongoose.connect('mongodb+srv://eduflow:adhiarjun122@cluster0.bd2ku64.mongodb.net/eduflow?appName=Cluster0');
    console.log('Connected to DB');

    const Institution = mongoose.connection.collection('institutions');
    const insts = await Institution.find({}).toArray();
    
    insts.forEach(i => {
      console.log(`Inst: ${i.name}, ID: ${i._id}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkInst();
