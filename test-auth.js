const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test data
const testUser = {
  username: 'testuser123',
  email: 'test@example.com',
  password: 'password123'
};

async function testAuthEndpoints() {
  try {
    console.log('🧪 Testing Auth Endpoints...\n');

    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Signup
    console.log('2. Testing signup endpoint...');
    const signupResponse = await axios.post(`${API_BASE}/auth/signup`, testUser);
    console.log('✅ Signup successful:', {
      message: signupResponse.data.message,
      user: signupResponse.data.user.username,
      hasToken: !!signupResponse.data.token
    });
    console.log('');

    // Test 3: Login
    console.log('3. Testing login endpoint...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', {
      message: loginResponse.data.message,
      user: loginResponse.data.user.username,
      hasToken: !!loginResponse.data.token
    });
    console.log('');

    // Test 4: Get current user (with token)
    console.log('4. Testing get current user endpoint...');
    const token = loginResponse.data.token;
    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Get current user successful:', {
      user: meResponse.data.user.username,
      email: meResponse.data.user.email
    });
    console.log('');

    console.log('🎉 All auth endpoints are working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('This might be because the user already exists. Try with different test data.');
    }
  }
}

// Run the test
testAuthEndpoints();
