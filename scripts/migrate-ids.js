import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to convert all CUID IDs to new format: PREFIX + 4-digit number
 * 
 * Migration order (by dependency):
 * 1. Category (no FK)
 * 2. SpecField (FK: categoryId)
 * 3. User (no FK)
 * 4. Product (FK: categoryId)
 * 5. SpecValue (FK: productId, specFieldId)
 * 6. Address (FK: userId)
 * 7. CartItem (FK: userId, productId)
 * 8. Order (FK: userId)
 * 9. OrderItem (FK: orderId, productId)
 * 10. Review (FK: productId, userId, orderId?)
 * 11. ProductInteraction (FK: userId, productId)
 */

// Prefix mapping
const PREFIXES = {
  Category: 'CAT',
  SpecField: 'SPF',
  User: 'USR',
  Product: 'PRD',
  SpecValue: 'SPV',
  Address: 'ADD',
  CartItem: 'CRT', // Note: Changed from CIT to CRT as per requirement
  Order: 'ORD',
  OrderItem: 'ORI', // Note: Changed from OIT to ORI as per requirement
  Review: 'REV',
  ProductInteraction: 'PIN',
};

// ID mapping storage
const idMappings = {
  Category: new Map(),
  SpecField: new Map(),
  User: new Map(),
  Product: new Map(),
  SpecValue: new Map(),
  Address: new Map(),
  CartItem: new Map(),
  Order: new Map(),
  OrderItem: new Map(),
  Review: new Map(),
  ProductInteraction: new Map(),
};

/**
 * Generate new ID with prefix and sequential number
 */
function generateNewId(prefix, currentNumber) {
  return `${prefix}${String(currentNumber).padStart(4, '0')}`;
}

/**
 * Migrate Category table
 */
async function migrateCategories() {
  console.log('\n📦 Migrating Categories...');
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (categories.length === 0) {
    console.log('  No categories to migrate');
    return;
  }

  let counter = 1;
  for (const category of categories) {
    const newId = generateNewId(PREFIXES.Category, counter);
    idMappings.Category.set(category.id, newId);
    counter++;
  }

  // Update categories (no FK dependencies, safe to update directly)
  for (const [oldId, newId] of idMappings.Category) {
    if (oldId !== newId) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Category" SET id = $1 WHERE id = $2`,
        newId,
        oldId
      );
    }
  }

  console.log(`  ✅ Migrated ${categories.length} categories`);
}

/**
 * Migrate SpecField table
 */
async function migrateSpecFields() {
  console.log('\n📦 Migrating SpecFields...');
  const specFields = await prisma.specField.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (specFields.length === 0) {
    console.log('  No spec fields to migrate');
    return;
  }

  let counter = 1;
  for (const specField of specFields) {
    const newId = generateNewId(PREFIXES.SpecField, counter);
    idMappings.SpecField.set(specField.id, newId);
    counter++;
  }

  // Update specFields with new IDs and updated categoryId
  // First update categoryId, then update id to avoid FK constraint issues
  for (const specField of specFields) {
    const newId = idMappings.SpecField.get(specField.id);
    const newCategoryId = idMappings.Category.get(specField.categoryId);

    if (!newId || !newCategoryId) {
      console.error(`  ⚠️  Missing mapping for SpecField ${specField.id}`);
      continue;
    }

    // First update categoryId if it changed
    if (specField.categoryId !== newCategoryId) {
      await prisma.$executeRawUnsafe(
        `UPDATE "SpecField" SET "categoryId" = $1 WHERE id = $2`,
        newCategoryId,
        specField.id
      );
    }

    // Then update id if it changed
    if (specField.id !== newId) {
      await prisma.$executeRawUnsafe(
        `UPDATE "SpecField" SET id = $1 WHERE id = $2`,
        newId,
        specField.id
      );
    }
  }

  console.log(`  ✅ Migrated ${specFields.length} spec fields`);
}

/**
 * Migrate User table
 */
async function migrateUsers() {
  console.log('\n👥 Migrating Users...');
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (users.length === 0) {
    console.log('  No users to migrate');
    return;
  }

  let counter = 1;
  for (const user of users) {
    const newId = generateNewId(PREFIXES.User, counter);
    idMappings.User.set(user.id, newId);
    counter++;
  }

  // Update users (no FK dependencies, safe to update directly)
  for (const [oldId, newId] of idMappings.User) {
    if (oldId !== newId) {
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET id = $1 WHERE id = $2`,
        newId,
        oldId
      );
    }
  }

  console.log(`  ✅ Migrated ${users.length} users`);
}

/**
 * Migrate Product table
 */
async function migrateProducts() {
  console.log('\n🛍️  Migrating Products...');
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (products.length === 0) {
    console.log('  No products to migrate');
    return;
  }

  let counter = 1;
  for (const product of products) {
    const newId = generateNewId(PREFIXES.Product, counter);
    idMappings.Product.set(product.id, newId);
    counter++;
  }

  // Update products with new IDs and updated categoryId
  for (const product of products) {
    const newId = idMappings.Product.get(product.id);
    const newCategoryId = idMappings.Category.get(product.categoryId);

    if (!newId || !newCategoryId) {
      console.error(`  ⚠️  Missing mapping for Product ${product.id}`);
      continue;
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "Product" SET id = $1, "categoryId" = $2 WHERE id = $3`,
      newId,
      newCategoryId,
      product.id
    );
  }

  console.log(`  ✅ Migrated ${products.length} products`);
}

/**
 * Migrate SpecValue table
 */
async function migrateSpecValues() {
  console.log('\n📋 Migrating SpecValues...');
  const specValues = await prisma.specValue.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (specValues.length === 0) {
    console.log('  No spec values to migrate');
    return;
  }

  let counter = 1;
  for (const specValue of specValues) {
    const newId = generateNewId(PREFIXES.SpecValue, counter);
    idMappings.SpecValue.set(specValue.id, newId);
    counter++;
  }

  // Update specValues with new IDs and updated foreign keys
  for (const specValue of specValues) {
    const newId = idMappings.SpecValue.get(specValue.id);
    const newProductId = idMappings.Product.get(specValue.productId);
    const newSpecFieldId = idMappings.SpecField.get(specValue.specFieldId);

    if (!newId || !newProductId || !newSpecFieldId) {
      console.error(`  ⚠️  Missing mapping for SpecValue ${specValue.id}`);
      continue;
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "SpecValue" SET id = $1, "productId" = $2, "specFieldId" = $3 WHERE id = $4`,
      newId,
      newProductId,
      newSpecFieldId,
      specValue.id
    );
  }

  console.log(`  ✅ Migrated ${specValues.length} spec values`);
}

/**
 * Migrate Address table
 */
async function migrateAddresses() {
  console.log('\n📍 Migrating Addresses...');
  const addresses = await prisma.address.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (addresses.length === 0) {
    console.log('  No addresses to migrate');
    return;
  }

  let counter = 1;
  for (const address of addresses) {
    const newId = generateNewId(PREFIXES.Address, counter);
    idMappings.Address.set(address.id, newId);
    counter++;
  }

  // Update addresses with new IDs and updated userId
  for (const address of addresses) {
    const newId = idMappings.Address.get(address.id);
    const newUserId = idMappings.User.get(address.userId);

    if (!newId || !newUserId) {
      console.error(`  ⚠️  Missing mapping for Address ${address.id}`);
      continue;
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "Address" SET id = $1, "userId" = $2 WHERE id = $3`,
      newId,
      newUserId,
      address.id
    );
  }

  console.log(`  ✅ Migrated ${addresses.length} addresses`);
}

/**
 * Migrate CartItem table
 */
async function migrateCartItems() {
  console.log('\n🛒 Migrating CartItems...');
  const cartItems = await prisma.cartItem.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (cartItems.length === 0) {
    console.log('  No cart items to migrate');
    return;
  }

  let counter = 1;
  for (const cartItem of cartItems) {
    const newId = generateNewId(PREFIXES.CartItem, counter);
    idMappings.CartItem.set(cartItem.id, newId);
    counter++;
  }

  // Update cartItems with new IDs and updated foreign keys
  for (const cartItem of cartItems) {
    const newId = idMappings.CartItem.get(cartItem.id);
    const newUserId = idMappings.User.get(cartItem.userId);
    const newProductId = idMappings.Product.get(cartItem.productId);

    if (!newId || !newUserId || !newProductId) {
      console.error(`  ⚠️  Missing mapping for CartItem ${cartItem.id}`);
      continue;
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "CartItem" SET id = $1, "userId" = $2, "productId" = $3 WHERE id = $4`,
      newId,
      newUserId,
      newProductId,
      cartItem.id
    );
  }

  console.log(`  ✅ Migrated ${cartItems.length} cart items`);
}

/**
 * Migrate Order table
 */
async function migrateOrders() {
  console.log('\n📦 Migrating Orders...');
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (orders.length === 0) {
    console.log('  No orders to migrate');
    return;
  }

  let counter = 1;
  for (const order of orders) {
    const newId = generateNewId(PREFIXES.Order, counter);
    idMappings.Order.set(order.id, newId);
    counter++;
  }

  // Update orders with new IDs and updated userId
  for (const order of orders) {
    const newId = idMappings.Order.get(order.id);
    const newUserId = idMappings.User.get(order.userId);

    if (!newId || !newUserId) {
      console.error(`  ⚠️  Missing mapping for Order ${order.id}`);
      continue;
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "Order" SET id = $1, "userId" = $2 WHERE id = $3`,
      newId,
      newUserId,
      order.id
    );
  }

  console.log(`  ✅ Migrated ${orders.length} orders`);
}

/**
 * Migrate OrderItem table
 */
async function migrateOrderItems() {
  console.log('\n📋 Migrating OrderItems...');
  const orderItems = await prisma.orderItem.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (orderItems.length === 0) {
    console.log('  No order items to migrate');
    return;
  }

  let counter = 1;
  for (const orderItem of orderItems) {
    const newId = generateNewId(PREFIXES.OrderItem, counter);
    idMappings.OrderItem.set(orderItem.id, newId);
    counter++;
  }

  // Update orderItems with new IDs and updated foreign keys
  for (const orderItem of orderItems) {
    const newId = idMappings.OrderItem.get(orderItem.id);
    const newOrderId = idMappings.Order.get(orderItem.orderId);
    const newProductId = idMappings.Product.get(orderItem.productId);

    if (!newId || !newOrderId || !newProductId) {
      console.error(`  ⚠️  Missing mapping for OrderItem ${orderItem.id}`);
      continue;
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "OrderItem" SET id = $1, "orderId" = $2, "productId" = $3 WHERE id = $4`,
      newId,
      newOrderId,
      newProductId,
      orderItem.id
    );
  }

  console.log(`  ✅ Migrated ${orderItems.length} order items`);
}

/**
 * Migrate Review table
 */
async function migrateReviews() {
  console.log('\n⭐ Migrating Reviews...');
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (reviews.length === 0) {
    console.log('  No reviews to migrate');
    return;
  }

  let counter = 1;
  for (const review of reviews) {
    const newId = generateNewId(PREFIXES.Review, counter);
    idMappings.Review.set(review.id, newId);
    counter++;
  }

  // Update reviews with new IDs and updated foreign keys
  for (const review of reviews) {
    const newId = idMappings.Review.get(review.id);
    const newProductId = idMappings.Product.get(review.productId);
    const newUserId = idMappings.User.get(review.userId);
    const newOrderId = review.orderId ? idMappings.Order.get(review.orderId) : null;

    if (!newId || !newProductId || !newUserId) {
      console.error(`  ⚠️  Missing mapping for Review ${review.id}`);
      continue;
    }

    if (newOrderId) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Review" SET id = $1, "productId" = $2, "userId" = $3, "orderId" = $4 WHERE id = $5`,
        newId,
        newProductId,
        newUserId,
        newOrderId,
        review.id
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "Review" SET id = $1, "productId" = $2, "userId" = $3, "orderId" = NULL WHERE id = $4`,
        newId,
        newProductId,
        newUserId,
        review.id
      );
    }
  }

  console.log(`  ✅ Migrated ${reviews.length} reviews`);
}

/**
 * Migrate ProductInteraction table
 */
async function migrateProductInteractions() {
  console.log('\n👆 Migrating ProductInteractions...');
  const interactions = await prisma.productInteraction.findMany({
    orderBy: { viewedAt: 'asc' },
  });

  if (interactions.length === 0) {
    console.log('  No product interactions to migrate');
    return;
  }

  let counter = 1;
  for (const interaction of interactions) {
    const newId = generateNewId(PREFIXES.ProductInteraction, counter);
    idMappings.ProductInteraction.set(interaction.id, newId);
    counter++;
  }

  // Update interactions with new IDs and updated foreign keys
  for (const interaction of interactions) {
    const newId = idMappings.ProductInteraction.get(interaction.id);
    const newUserId = idMappings.User.get(interaction.userId);
    const newProductId = idMappings.Product.get(interaction.productId);

    if (!newId || !newUserId || !newProductId) {
      console.error(`  ⚠️  Missing mapping for ProductInteraction ${interaction.id}`);
      continue;
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "ProductInteraction" SET id = $1, "userId" = $2, "productId" = $3 WHERE id = $4`,
      newId,
      newUserId,
      newProductId,
      interaction.id
    );
  }

  console.log(`  ✅ Migrated ${interactions.length} product interactions`);
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting ID Migration...');
  console.log('⚠️  This will convert all CUID IDs to new format (PREFIX + 4-digit number)');
  console.log('⚠️  Make sure you have a database backup before proceeding!\n');

  try {
    // Step 1: Migrate independent tables first (no FK dependencies)
    console.log('\n📋 Step 1: Migrating independent tables...');
    await migrateCategories();
    await migrateUsers();

    // Step 2: Migrate tables that depend on Category
    console.log('\n📋 Step 2: Migrating Category-dependent tables...');
    await migrateSpecFields();
    await migrateProducts();

    // Step 3: Migrate tables that depend on Product
    console.log('\n📋 Step 3: Migrating Product-dependent tables...');
    await migrateSpecValues();

    // Step 4: Migrate tables that depend on User
    console.log('\n📋 Step 4: Migrating User-dependent tables...');
    await migrateAddresses();
    await migrateCartItems();
    await migrateOrders();

    // Step 5: Migrate tables that depend on Order
    console.log('\n📋 Step 5: Migrating Order-dependent tables...');
    await migrateOrderItems();

    // Step 6: Migrate tables that depend on multiple tables
    console.log('\n📋 Step 6: Migrating multi-dependent tables...');
    await migrateReviews();
    await migrateProductInteractions();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  Categories: ${idMappings.Category.size}`);
    console.log(`  SpecFields: ${idMappings.SpecField.size}`);
    console.log(`  Users: ${idMappings.User.size}`);
    console.log(`  Products: ${idMappings.Product.size}`);
    console.log(`  SpecValues: ${idMappings.SpecValue.size}`);
    console.log(`  Addresses: ${idMappings.Address.size}`);
    console.log(`  CartItems: ${idMappings.CartItem.size}`);
    console.log(`  Orders: ${idMappings.Order.size}`);
    console.log(`  OrderItems: ${idMappings.OrderItem.size}`);
    console.log(`  Reviews: ${idMappings.Review.size}`);
    console.log(`  ProductInteractions: ${idMappings.ProductInteraction.size}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n💡 Tip: If migration failed, restore from backup and check the error above.');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
main()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

