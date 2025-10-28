/**
 * Debug ZaloPay Order Script
 * 
 * Script này để debug đơn hàng ZaloPay cụ thể và kiểm tra:
 * 1. Trạng thái đơn hàng trong database
 * 2. Thông tin GHN order
 * 3. Lỗi có thể xảy ra
 */

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

// Thay đổi orderId này thành mã đơn hàng thực tế bạn muốn kiểm tra
const ORDER_ID = 'cmhaxnhd20009sqin1yc1tbqg'; // Mã đơn hàng bạn đề cập

console.log('🔍 Debugging ZaloPay Order:', ORDER_ID);

async function debugZaloPayOrder() {
  try {
    console.log('\n1️⃣ Checking order in database...');
    
    // Tìm đơn hàng theo ID
    const order = await prisma.order.findUnique({
      where: { id: ORDER_ID },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true }
            }
          }
        }
      }
    });
    
    if (!order) {
      console.log('❌ Order not found in database');
      
      // Thử tìm theo transactionId (có thể là zp_trans_token)
      console.log('\n🔍 Searching by transactionId...');
      const orderByTransaction = await prisma.order.findFirst({
        where: { transactionId: ORDER_ID },
        include: {
          orderItems: {
            include: {
              product: {
                select: { id: true, name: true, price: true }
              }
            }
          }
        }
      });
      
      if (orderByTransaction) {
        console.log('✅ Found order by transactionId:');
        console.log('   Order ID:', orderByTransaction.id);
        console.log('   Transaction ID:', orderByTransaction.transactionId);
        console.log('   Payment Status:', orderByTransaction.paymentStatus);
        console.log('   Status:', orderByTransaction.status);
        console.log('   GHN Order Code:', orderByTransaction.ghnOrderCode);
        console.log('   Payment Method:', orderByTransaction.paymentMethod);
        console.log('   Total Price:', orderByTransaction.totalPrice);
        console.log('   Created At:', orderByTransaction.createdAt);
        console.log('   Paid At:', orderByTransaction.paidAt);
        
        if (orderByTransaction.orderItems.length > 0) {
          console.log('   Order Items:');
          orderByTransaction.orderItems.forEach((item, index) => {
            console.log(`     ${index + 1}. ${item.product.name} x${item.quantity} - ${item.price} VND`);
          });
        }
        
        // Kiểm tra thông tin shipping
        console.log('\n📦 Shipping Information:');
        console.log('   Name:', orderByTransaction.shippingName);
        console.log('   Phone:', orderByTransaction.shippingPhone);
        console.log('   Address:', orderByTransaction.shippingAddress);
        console.log('   Ward:', orderByTransaction.shippingWard);
        console.log('   District:', orderByTransaction.shippingDistrict);
        console.log('   Province:', orderByTransaction.shippingProvince);
        
        return orderByTransaction;
      } else {
        console.log('❌ Order not found by transactionId either');
        return null;
      }
    }
    
    console.log('✅ Order found:');
    console.log('   Order ID:', order.id);
    console.log('   Transaction ID:', order.transactionId);
    console.log('   Payment Status:', order.paymentStatus);
    console.log('   Status:', order.status);
    console.log('   GHN Order Code:', order.ghnOrderCode);
    console.log('   Payment Method:', order.paymentMethod);
    console.log('   Total Price:', order.totalPrice);
    console.log('   Created At:', order.createdAt);
    console.log('   Paid At:', order.paidAt);
    
    if (order.orderItems.length > 0) {
      console.log('   Order Items:');
      order.orderItems.forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.product.name} x${item.quantity} - ${item.price} VND`);
      });
    }
    
    // Kiểm tra thông tin shipping
    console.log('\n📦 Shipping Information:');
    console.log('   Name:', order.shippingName);
    console.log('   Phone:', order.shippingPhone);
    console.log('   Address:', order.shippingAddress);
    console.log('   Ward:', order.shippingWard);
    console.log('   District:', order.shippingDistrict);
    console.log('   Province:', order.shippingProvince);
    
    return order;
    
  } catch (error) {
    console.error('❌ Error debugging order:', error);
    return null;
  }
}

async function checkRecentZaloPayOrders() {
  try {
    console.log('\n2️⃣ Checking recent ZaloPay orders...');
    
    const recentOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'ZALOPAY',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true }
            }
          }
        }
      }
    });
    
    console.log(`Found ${recentOrders.length} ZaloPay orders in last 24 hours:`);
    
    recentOrders.forEach((order, index) => {
      console.log(`\n   ${index + 1}. Order ID: ${order.id}`);
      console.log(`      Transaction ID: ${order.transactionId}`);
      console.log(`      Payment Status: ${order.paymentStatus}`);
      console.log(`      Status: ${order.status}`);
      console.log(`      GHN Order Code: ${order.ghnOrderCode || 'N/A'}`);
      console.log(`      Total Price: ${order.totalPrice} VND`);
      console.log(`      Created: ${order.createdAt}`);
      console.log(`      Paid: ${order.paidAt || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking recent orders:', error);
  }
}

async function main() {
  try {
    const order = await debugZaloPayOrder();
    await checkRecentZaloPayOrders();
    
    console.log('\n🎯 Summary:');
    if (order) {
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Payment Status: ${order.paymentStatus}`);
      console.log(`   GHN Order Code: ${order.ghnOrderCode || 'NOT CREATED'}`);
      
      if (!order.ghnOrderCode) {
        console.log('\n⚠️  GHN Order Code is missing!');
        console.log('   Possible causes:');
        console.log('   1. GHN API error during order creation');
        console.log('   2. Missing shipping information');
        console.log('   3. GHN service configuration issue');
        console.log('   4. Payment verification failed');
      }
    } else {
      console.log('   Order not found');
    }
    
  } catch (error) {
    console.error('❌ Main error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
