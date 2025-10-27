// Test tạo đơn hàng mới với GHN integration
import { PrismaClient } from './src/generated/prisma/index.js';
import ghnService from './backend/services/ghnService.js';

const prisma = new PrismaClient();

async function testCreateOrderWithGHN() {
  console.log('🧪 Testing Order Creation with GHN Integration');
  console.log('='.repeat(60));
  
  try {
    // Tạo đơn hàng test
    const order = await prisma.order.create({
      data: {
        userId: 'cmh213kgq0007sqxpcf7rxfyn',
        totalPrice: 200000,
        status: 'PENDING',
        paymentMethod: 'COD',
        orderItems: {
          create: [{
            productId: 'cmh212v1n0003sqxp6dh284jq',
            quantity: 2,
            price: 100000
          }]
        }
      }
    });
    
    console.log('✅ Order created:', order.id);
    
    // Tạo GHN shipping order
    const shippingData = {
      toName: 'MAI THANH PHUONG',
      toPhone: '0376560307',
      toAddress: 'Ap 3, Thuong Tan, Bac Tan Uyen, Binh Duong',
      toWardCode: '640403',
      toDistrictId: 1824,
      toProvinceId: 250,
      codAmount: 200000,
      content: 'Đơn hàng test',
      weight: 200,
      length: 20,
      width: 20,
      height: 20,
      items: [{
        name: 'Test Product',
        quantity: 2,
        weight: 200,
        price: 100000
      }]
    };
    
    const ghnResult = await ghnService.createShippingOrder(shippingData);
    console.log('✅ GHN Order Code:', ghnResult.data?.order_code);
    
    if (ghnResult.data?.order_code) {
      await prisma.order.update({
        where: { id: order.id },
        data: { ghnOrderCode: ghnResult.data.order_code }
      });
      console.log('✅ Order updated with GHN code');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateOrderWithGHN();
