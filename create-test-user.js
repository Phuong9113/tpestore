/**
 * Create Test User Script
 * 
 * Script này để tạo test user cho testing
 */

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

console.log('👤 Creating Test User...');

async function createTestUser() {
  try {
    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { id: 'test_user_123' }
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
      return existingUser;
    }
    
    // Tạo test user
    const testUser = await prisma.user.create({
      data: {
        id: 'test_user_123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'test_password_123',
        role: 'CUSTOMER'
      }
    });
    
    console.log('✅ Test user created successfully:');
    console.log('   ID:', testUser.id);
    console.log('   Email:', testUser.email);
    console.log('   Name:', testUser.name);
    console.log('   Role:', testUser.role);
    
    return testUser;
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
