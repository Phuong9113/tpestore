/**
 * Create Test Token Script
 * 
 * Script này để tạo test token cho testing
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret';

// Tạo test user token
const testUser = {
  id: 'test_user_123',
  email: 'test@example.com',
  role: 'USER'
};

const testToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

console.log('🔑 Test Token Created:');
console.log('Token:', testToken);
console.log('\n📋 Usage:');
console.log('Authorization: Bearer ' + testToken);
console.log('\n👤 Test User Info:');
console.log('ID:', testUser.id);
console.log('Email:', testUser.email);
console.log('Role:', testUser.role);
