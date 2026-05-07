const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://eduflow:adhiarjun122@cluster0.bd2ku64.mongodb.net/eduflow?appName=Cluster0').then(async () => {
  const db = mongoose.connection;
  await db.collection('quizzes').updateMany(
    { title: 'COA' },
    { $set: { endDateTime: new Date('2026-05-10T23:59:00Z') } }
  );
  console.log('Fixed DB quiz end time');
  process.exit(0);
});
