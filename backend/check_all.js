const mongoose = require('mongoose');

async function checkAll() {
  try {
    await mongoose.connect('mongodb+srv://eduflow:adhiarjun122@cluster0.bd2ku64.mongodb.net/eduflow?appName=Cluster0');
    console.log('Connected to DB');

    const collections = await mongoose.connection.db.collections();
    for (const c of collections) {
      const count = await c.countDocuments();
      console.log(`Collection ${c.collectionName}: ${count} documents`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAll();
