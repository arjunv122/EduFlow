const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const axios = require('axios');

async function testApi() {
  const token = jwt.sign({ id: '69f783bed903d3a1f8818a8b' }, 'eduflow_super_secret_jwt_key_2026_change_in_production', { expiresIn: '1h' }); // using some user id
  
  try {
    const res = await axios.get('http://localhost:8000/api/faculty', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(res.data);
  } catch (err) {
    console.log(err.response ? err.response.data : err.message);
  }
}

testApi();
