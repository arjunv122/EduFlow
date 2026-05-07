const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://eduflow:adhiarjun122@cluster0.bd2ku64.mongodb.net/eduflow?appName=Cluster0').then(async () => {
  const db = mongoose.connection;
  await db.collection('departments').updateMany(
    { head: new mongoose.Types.ObjectId('69fb5f05a13b57689e711f1c') },
    { $set: { head: new mongoose.Types.ObjectId('69f78dfd8b737fccd1e49cae') } }
  );
  console.log('Fixed DB');
  process.exit(0);
});
