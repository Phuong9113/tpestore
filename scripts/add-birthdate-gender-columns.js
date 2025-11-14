import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addColumns() {
  try {
    console.log('Checking if birthDate and gender columns exist...');
    
    // Try to add columns if they don't exist
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "gender" TEXT;
    `;
    
    console.log('Columns added successfully (or already exist)');
  } catch (error) {
    console.error('Error adding columns:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addColumns();

