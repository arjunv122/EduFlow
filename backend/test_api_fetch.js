const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

async function testApi() {
  try {
    await mongoose.connect('mongodb+srv://eduflow:adhiarjun122@cluster0.bd2ku64.mongodb.net/eduflow?appName=Cluster0');
    console.log('Connected to DB');

    const User = mongoose.connection.collection('users');
    const admin = await User.findOne({ email: 'sretadmin@sret.edu.in' });
    
    if (!admin) return console.log('Admin not found');
    
    // Simulate token
    const token = jwt.sign({ id: admin._id }, 'eduflow_super_secret_jwt_key_2026_change_in_production', { expiresIn: '1h' });
    
    // Make request to backend
    const res = await fetch('http://localhost:8000/api/faculty', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testApi();
