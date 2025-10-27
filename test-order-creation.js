// Test tạo đơn hàng mới với GHN integration
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function testCreateOrderWithGHN() {
  console.log('🧪 Testing Order Creation with GHN Integration');
  console.log('='.repeat(60));
  
  try {
    // Tạo đơn hàng test với shipping info
    const orderData = {
      userId: 'cmh213kgq0007sqxpcf7rxfyn',
      totalPrice: 200000,
      status: 'PENDING',
      paymentMethod: 'COD',
      shippingInfo: {
        name: 'Test User',
        phone: '0123456789',
        address: '123 Test Street, Test Ward',
        ward: '640403',
        district: '1824',
        province: '250',
        shippingFee: 30000
      },
      orderItems: {
        create: [{
          productId: 'cmh212v1n0003sqxp6dh284jq',
          quantity: 2,
          price: 100000
        }]
      }
    };
    
    console.log('📦 Creating test order...');
    const order = await prisma.order.create({
      data: orderData,
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, image: true, price: true }
            }
          }
        }
      }
    });
    
    console.log('✅ Order created:');
    console.log('ID:', order.id);
    console.log('Total:', order.totalPrice);
    console.log('Status:', order.status);
    console.log('GHN Code:', order.ghnOrderCode || 'NULL');
    
    // Bây giờ cần gọi API để tạo GHN shipping order
    console.log('\n🚚 Creating GHN shipping order...');
    
    const shippingData = {
      toName: orderData.shippingInfo.name,
      toPhone: orderData.shippingInfo.phone,
      toAddress: orderData.shippingInfo.address,
      toWardCode: orderData.shippingInfo.ward,
      toDistrictId: parseInt(orderData.shippingInfo.district),
      toProvinceId: parseInt(orderData.shippingInfo.province),
      codAmount: orderData.totalPrice,
      content: 'Đơn hàng test từ TPE Store',
      weight: 200,
      length: 20,
      width: 20,
      height: 20,
      items: order.orderItems.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        weight: 200,
        price: item.price
      }))
    };
    
// Test tạo đơn hàng mới với GHN integration
import { PrismaClient } from './src/generated/prisma/index.js';
import ghnService from './backend/services/ghnService.js';

const prisma = new PrismaClient();

async function testCreateOrderWithGHN() {
  console.log('🧪 Testing Order Creation with GHN Integration');
  console.log('='.repeat(60));
  
  try {
    // Tạo đơn hàng test với shipping info
    const orderData = {
      userId: 'cmh213kgq0007sqxpcf7rxfyn',
      totalPrice: 200000,
      status: 'PENDING',
      paymentMethod: 'COD',
      shippingInfo: {
        name: 'Test User',
        phone: '0123456789',
        address: '123 Test Street, Test Ward',
        ward: '640403',
        district: '1824',
        province: '250',
        shippingFee: 30000
      },
      orderItems: {
        create: [{
          productId: 'cmh212v1n0003sqxp6dh284jq',
          quantity: 2,
          price: 100000
        }]
      }
    };
    
    console.log('📦 Creating test order...');
    const order = await prisma.order.create({
      data: orderData,
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, image: true, price: true }
            }
          }
        }
      }
    });
    
    console.log('✅ Order created:');
    console.log('ID:', order.id);
    console.log('Total:', order.totalPrice);
    console.log('Status:', order.status);
    console.log('GHN Code:', order.ghnOrderCode || 'NULL');
    
    // Bây giờ cần gọi API để tạo GHN shipping order
    console.log('\n🚚 Creating GHN shipping order...');
    
    const shippingData = {
      toName: orderData.shippingInfo.name,
      toPhone: orderData.shippingInfo.phone,
      toAddress: orderData.shippingInfo.address,
      toWardCode: orderData.shippingInfo.ward,
      toDistrictId: parseInt(orderData.shippingInfo.district),
      toProvinceId: parseInt(orderData.shippingInfo.province),
      codAmount: orderData.totalPrice,
      content: 'Đơn hàng test từ TPE Store',
      weight: 200,
      length: 20,
      width: 20,
      height: 20,
      items: order.orderItems.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        weight: 200,
        price: item.price
      }))
    };
    
    try {
      const ghnResult = await ghnService.createShippingOrder(shippingData);
      console.log('✅ GHN shipping order created:');
      console.log('GHN Order Code:', ghnResult.data?.order_code);
      
      if (ghnResult.data?.order_code) {
        // Cập nhật order với GHN code
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: { ghnOrderCode: ghnResult.data.order_code }
        });
        
        console.log('✅ Order updated with GHN code:');
        console.log('Final GHN Code:', updatedOrder.ghnOrderCode);
      }
      
    } catch (ghnError) {
      console.error('❌ GHN Error:', ghnError.message);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateOrderWithGHN();
