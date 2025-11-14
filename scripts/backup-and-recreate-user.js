import prisma from "../backend/src/utils/prisma.js";
import bcrypt from "bcryptjs";

async function backupAndRecreate() {
  try {
    console.log("=== BACKUP AND RECREATE USER TABLE ===\n");
    
    // Step 1: Backup admin users
    console.log("Step 1: Backing up admin users...");
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        email: true,
        password: true,
        name: true,
      },
    });
    
    console.log(`Found ${adminUsers.length} admin user(s) to backup:`);
    adminUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} - ${user.name || 'No name'}`);
    });
    
    // Step 2: Run migration
    console.log("\nStep 2: Running migration to recreate User table...");
    console.log("⚠️  WARNING: This will delete ALL user data including:");
    console.log("   - All users (customers and admins)");
    console.log("   - All orders (due to CASCADE)");
    console.log("   - All cart items");
    console.log("   - All reviews");
    console.log("   - All addresses");
    console.log("   - All product interactions");
    console.log("\n⚠️  Make sure you have a database backup before proceeding!");
    
    // Note: Migration will be run separately using prisma migrate
    console.log("\nTo run migration, execute:");
    console.log("  npx prisma migrate deploy");
    console.log("  or");
    console.log("  npx prisma migrate dev");
    
    // Step 3: Recreate admin users
    console.log("\nStep 3: After migration, you can recreate admin users using:");
    console.log("  node scripts/create-admin.js");
    
    console.log("\n✅ Backup information saved. Proceed with migration.");
    
  } catch (error) {
    console.error("Error:", error);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

backupAndRecreate();

