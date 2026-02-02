#!/usr/bin/env node

/**
 * Quick API Test Script
 * Run this script to test the authentication endpoints
 * Usage: node test-api.js
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🚀 Testing Chat-Me Authentication API\n');
  
  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
  };

  try {
    // Test 1: Register a new user
    console.log('1️⃣  Testing POST /api/auth/register');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    
    const registerData = await registerResponse.json();
    console.log(`   Status: ${registerResponse.status}`);
    console.log(`   Success: ${registerData.success}`);
    console.log(`   Token: ${registerData.data?.token ? '✓ Generated' : '✗ Missing'}`);
    console.log(`   User: ${registerData.data?.user?.email || 'N/A'}\n`);

    if (!registerData.success || !registerData.data?.token) {
      console.error('❌ Registration failed!', registerData);
      return;
    }

    const token = registerData.data.token;

    // Test 2: Login with the user
    console.log('2️⃣  Testing POST /api/auth/login');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });
    
    const loginData = await loginResponse.json();
    console.log(`   Status: ${loginResponse.status}`);
    console.log(`   Success: ${loginData.success}`);
    console.log(`   Token: ${loginData.data?.token ? '✓ Generated' : '✗ Missing'}\n`);

    // Test 3: Get current user (protected route)
    console.log('3️⃣  Testing GET /api/auth/me (Protected)');
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const meData = await meResponse.json();
    console.log(`   Status: ${meResponse.status}`);
    console.log(`   Success: ${meData.success}`);
    console.log(`   User: ${meData.data?.email || 'N/A'}\n`);

    // Test 4: Access protected route
    console.log('4️⃣  Testing GET /api/protected (Protected)');
    const protectedResponse = await fetch(`${BASE_URL}/api/protected`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const protectedData = await protectedResponse.json();
    console.log(`   Status: ${protectedResponse.status}`);
    console.log(`   Success: ${protectedData.success}`);
    console.log(`   Message: ${protectedData.data?.message || 'N/A'}\n`);

    // Test 5: Try to access protected route without token
    console.log('5️⃣  Testing unauthorized access (No Token)');
    const unauthorizedResponse = await fetch(`${BASE_URL}/api/protected`, {
      method: 'GET',
    });
    
    const unauthorizedData = await unauthorizedResponse.json();
    console.log(`   Status: ${unauthorizedResponse.status}`);
    console.log(`   Success: ${unauthorizedData.success}`);
    console.log(`   Expected: 401 Unauthorized\n`);

    // Test 6: Try wrong password
    console.log('6️⃣  Testing wrong password');
    const wrongPasswordResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'WrongPassword123!',
      }),
    });
    
    const wrongPasswordData = await wrongPasswordResponse.json();
    console.log(`   Status: ${wrongPasswordResponse.status}`);
    console.log(`   Success: ${wrongPasswordData.success}`);
    console.log(`   Expected: 401 Unauthorized\n`);

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
