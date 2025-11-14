import prisma from "../backend/src/utils/prisma.js";

// Function to sanitize strings: remove null bytes and trim whitespace
const sanitizeString = (str) => {
	if (str === null || str === undefined) return null;
	if (typeof str !== 'string') return str;
	// Remove null bytes (0x00) and trim
	return str.replace(/\0/g, '').trim() || null;
};

async function cleanUserNullBytes() {
  try {
    const userId = "cmh0k4jml0000itxrh2eqt76t"; // User ID from logs
    
    console.log("Cleaning null bytes from user profile...");
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
      },
    });
    
    if (!user) {
      console.error("User not found!");
      return;
    }
    
    console.log("\n=== BEFORE CLEANING ===");
    console.log(JSON.stringify(user, null, 2));
    
    // Check for null bytes
    const hasNullBytes = (str) => {
      if (!str || typeof str !== 'string') return false;
      return str.includes('\0');
    };
    
    const needsCleaning = 
      hasNullBytes(user.name) ||
      hasNullBytes(user.phone) ||
      hasNullBytes(user.address) ||
      hasNullBytes(user.city) ||
      hasNullBytes(user.gender);
    
    if (!needsCleaning) {
      console.log("\nNo null bytes found. User data is clean.");
      return;
    }
    
    console.log("\n=== CLEANING NULL BYTES ===");
    
    const updateData = {};
    if (user.name && hasNullBytes(user.name)) {
      updateData.name = sanitizeString(user.name);
      console.log(`Cleaning name: "${user.name}" -> "${updateData.name}"`);
    }
    if (user.phone && hasNullBytes(user.phone)) {
      updateData.phone = sanitizeString(user.phone);
      console.log(`Cleaning phone: "${user.phone}" -> "${updateData.phone}"`);
    }
    if (user.address && hasNullBytes(user.address)) {
      updateData.address = sanitizeString(user.address);
      console.log(`Cleaning address: "${user.address}" -> "${updateData.address}"`);
    }
    if (user.city && hasNullBytes(user.city)) {
      updateData.city = sanitizeString(user.city);
      console.log(`Cleaning city: "${user.city}" -> "${updateData.city}"`);
    }
    if (user.gender && hasNullBytes(user.gender)) {
      updateData.gender = sanitizeString(user.gender);
      console.log(`Cleaning gender: "${user.gender}" -> "${updateData.gender}"`);
    }
    
    if (Object.keys(updateData).length > 0) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          birthDate: true,
          gender: true,
        },
      });
      
      console.log("\n=== AFTER CLEANING ===");
      console.log(JSON.stringify(updated, null, 2));
      console.log("\n✅ User data cleaned successfully!");
    } else {
      console.log("\nNo cleaning needed.");
    }
    
  } catch (error) {
    console.error("Error cleaning user profile:", error);
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

cleanUserNullBytes();

