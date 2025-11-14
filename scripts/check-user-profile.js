import prisma from "../backend/src/utils/prisma.js";

async function checkUserProfile() {
  try {
    const userId = "cmh0k4jml0000itxrh2eqt76t"; // User ID from logs
    
    console.log("Checking user profile in database...");
    console.log("User ID:", userId);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        birthDate: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      console.error("User not found!");
      return;
    }
    
    console.log("\n=== USER PROFILE FROM DATABASE ===");
    console.log(JSON.stringify(user, null, 2));
    console.log("\n=== DETAILED VALUES ===");
    console.log("ID:", user.id);
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Phone:", user.phone, `(type: ${typeof user.phone})`);
    console.log("Address:", user.address, `(type: ${typeof user.address})`);
    console.log("City:", user.city, `(type: ${typeof user.city})`);
    console.log("BirthDate:", user.birthDate, `(type: ${typeof user.birthDate})`);
    console.log("Gender:", user.gender, `(type: ${typeof user.gender})`);
    console.log("CreatedAt:", user.createdAt);
    console.log("UpdatedAt:", user.updatedAt);
    
    // Check if columns exist
    console.log("\n=== CHECKING COLUMN EXISTENCE ===");
    const rawResult = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'User' 
      AND column_name IN ('phone', 'birthDate', 'gender')
      ORDER BY column_name;
    `;
    console.log("Columns info:", JSON.stringify(rawResult, null, 2));
    
  } catch (error) {
    console.error("Error checking user profile:", error);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.meta) {
      console.error("Error meta:", error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkUserProfile();

