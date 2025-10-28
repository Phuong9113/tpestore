/**
 * Fix ZaloPay Order Script
 * 
 * Script này để sửa đơn hàng ZaloPay đã thanh toán thành công nhưng chưa được verify
 */

import { PrismaClient } from './src/generated/prisma/index.js';
import ghnService from './backend/services/ghnService.js';

const prisma = new PrismaClient();

// Đơn hàng cần sửa
const ORDER_ID = 'cmhaxnhd20009sqin1yc1tbqg';

console.log('🔧 Fixing ZaloPay Order:', ORDER_ID);

async function fixZaloPayOrder() {
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
      totalPrice: order.totalPrice,
      transactionId: order.transactionId
    });
    
    console.log('\n2️⃣ Updating payment status to PAID...');
    
    // Cập nhật trạng thái thanh toán
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        status: 'PROCESSING'
      }
    });
    
    console.log('✅ Payment status updated:', {
      paymentStatus: updatedOrder.paymentStatus,
      status: updatedOrder.status,
      paidAt: updatedOrder.paidAt
    });
    
    console.log('\n3️⃣ Creating GHN shipping order...');
    
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
    
    try {
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
        
        console.log(`✅ GHN shipping order created: ${ghnResult.data.order_code}`);
        console.log('Final order status:', {
          id: finalOrder.id,
          paymentStatus: finalOrder.paymentStatus,
          status: finalOrder.status,
          ghnOrderCode: finalOrder.ghnOrderCode
        });
      } else {
        console.error('❌ GHN order creation failed - no order_code in response');
      }
      
    } catch (ghnError) {
      console.error('❌ GHN Error:', ghnError.message);
      console.error('GHN Error details:', ghnError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Error fixing order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixZaloPayOrder();
