import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@tpestore.com';
    const password = 'admin123';
    const name = 'Administrator';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: 'ADMIN'
      }
    });

    console.log('Admin user created successfully:');
    console.log('Email:', admin.email);
    console.log('Password:', password);
    console.log('Role:', admin.role);
    console.log('\nYou can now login with these credentials to access the admin dashboard.');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
