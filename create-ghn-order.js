/**
 * Create GHN Order Script
 * 
 * Script này để tạo đơn GHN cho đơn hàng ZaloPay đã được sửa
 */

import { PrismaClient } from './src/generated/prisma/index.js';
import ghnService from './backend/services/ghnService.js';

const prisma = new PrismaClient();

// Đơn hàng cần tạo GHN
const ORDER_ID = 'cmhaxnhd20009sqin1yc1tbqg';

console.log('🚚 Creating GHN Order for:', ORDER_ID);

async function createGHNOrder() {
  try {
    console.log('\n1️⃣ Finding order...');
    
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
      console.log('❌ Order not found');
      return;
    }
    
    console.log('✅ Order found:', {
      id: order.id,
      paymentStatus: order.paymentStatus,
      status: order.status,
      ghnOrderCode: order.ghnOrderCode,
      address: {
        ward: order.shippingWard,
        district: order.shippingDistrict,
        province: order.shippingProvince
      }
    });
    
    if (order.ghnOrderCode) {
      console.log('✅ GHN order already exists:', order.ghnOrderCode);
      return;
    }
    
    console.log('\n2️⃣ Creating GHN shipping order...');
    
    const shippingData = {
      toName: order.shippingName,
      toPhone: order.shippingPhone,
      toAddress: order.shippingAddress,
      toWardCode: order.shippingWard,
      toDistrictId: order.shippingDistrict,
      toProvinceId: order.shippingProvince,
      clientOrderCode: order.id,
      codAmount: 0, // No COD for ZaloPay orders
      insuranceValue: order.totalPrice,
      content: `Đơn hàng từ TPE Store - ${order.orderItems.length} sản phẩm`,
      weight: 200,
      serviceTypeId: order.orderItems.length >= 10 ? 5 : 2,
      length: 20,
      width: 20,
      height: 20,
      paymentTypeId: 1, // Prepaid
      items: order.orderItems.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        weight: 200,
        price: item.price
      }))
    };
    
    console.log('Shipping data:', JSON.stringify(shippingData, null, 2));
    
    const ghnResult = await ghnService.createShippingOrder(shippingData);
    
    console.log('GHN result:', JSON.stringify(ghnResult, null, 2));
    
    if (ghnResult.data && ghnResult.data.order_code) {
      // Cập nhật đơn hàng với mã GHN
      const finalOrder = await prisma.order.update({
        where: { id: order.id },
        data: { 
          ghnOrderCode: ghnResult.data.order_code,
          status: 'SHIPPING'
        }
      });
      
      console.log(`✅ GHN shipping order created successfully!`);
      console.log('GHN Order Code:', ghnResult.data.order_code);
      console.log('Final order status:', {
        id: finalOrder.id,
        paymentStatus: finalOrder.paymentStatus,
        status: finalOrder.status,
        ghnOrderCode: finalOrder.ghnOrderCode
      });
      
      console.log('\n🎉 SUCCESS! Order is now complete with GHN shipping code!');
      
    } else {
      console.error('❌ GHN order creation failed - no order_code in response');
      console.error('Response:', ghnResult);
    }
    
  } catch (error) {
    console.error('❌ Error creating GHN order:', error);
    console.error('Error details:', error.response?.data);
  } finally {
    await prisma.$disconnect();
  }
}

createGHNOrder();
