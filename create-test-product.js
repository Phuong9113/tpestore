/**
 * Create Test Product Script
 * 
 * Script này để tạo test product cho testing
 */

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

console.log('🛍️ Creating Test Product...');

async function createTestProduct() {
  try {
    // Kiểm tra xem category đã tồn tại chưa
    let category = await prisma.category.findUnique({
      where: { id: 'test_category_1' }
    });
    
    if (!category) {
      // Tạo test category
      category = await prisma.category.create({
        data: {
          id: 'test_category_1',
          name: 'Test Category',
          description: 'Test category for integration testing'
        }
      });
      console.log('✅ Test category created:', category.name);
    }
    
    // Kiểm tra xem product đã tồn tại chưa
    const existingProduct = await prisma.product.findUnique({
      where: { id: 'test_product_1' }
    });
    
    if (existingProduct) {
      console.log('✅ Test product already exists:', existingProduct.name);
      return existingProduct;
    }
    
    // Tạo test product
    const testProduct = await prisma.product.create({
      data: {
        id: 'test_product_1',
        name: 'Test Product',
        description: 'Test product for integration testing',
        price: 100000,
        stock: 100,
        categoryId: 'test_category_1',
        image: 'test-image.jpg'
      }
    });
    
    console.log('✅ Test product created successfully:');
    console.log('   ID:', testProduct.id);
    console.log('   Name:', testProduct.name);
    console.log('   Price:', testProduct.price);
    console.log('   Stock:', testProduct.stock);
    
    return testProduct;
    
  } catch (error) {
    console.error('❌ Error creating test product:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

createTestProduct();
