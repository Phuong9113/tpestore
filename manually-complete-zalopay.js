import axios from 'axios';
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000';

async function manuallyCompleteZaloPayOrder() {
  console.log('🔧 Manually completing a ZaloPay order to test GHN creation...\n');

  try {
    // Get the most recent ZaloPay order
    const order = await prisma.order.findFirst({
      where: { 
        paymentMethod: 'ZALOPAY',
        paymentStatus: 'PENDING'
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!order) {
      console.log('❌ No pending ZaloPay orders found');
      return;
    }

    console.log(`Found order: ${order.id}`);
    console.log(`Transaction ID: ${order.transactionId}`);
    console.log(`Total Price: ${order.totalPrice}`);

    // 1. Update order to PAID status
    console.log('\n1️⃣ Updating order to PAID status...');
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        status: 'PROCESSING'
      }
    });
    console.log('✅ Order updated to PAID');

    // 2. Create GHN shipping order
    console.log('\n2️⃣ Creating GHN shipping order...');
    const shippingData = {
      orderId: order.id,
      toName: order.shippingName,
      toPhone: order.shippingPhone,
      toAddress: order.shippingAddress,
      toWardCode: '20101', // Use ward code instead of name
      toDistrictId: 1442, // Use district ID instead of name  
      toProvinceId: 202, // Use province ID instead of name
      codAmount: 0, // No COD for ZaloPay orders
      content: `Đơn hàng từ TPE Store - ${order.orderItems.length} sản phẩm`,
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

    console.log('Shipping data:', JSON.stringify(shippingData, null, 2));

    try {
      const ghnResponse = await axios.post(`${BASE_URL}/api/shipping/create-order`, shippingData, {
        headers: { 
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaDIxM2tncTAwMDdzcXhwY2Y3cnhmeW4iLCJlbWFpbCI6Im52YUBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjE2NzkwOTIsImV4cCI6MTc2MjI4Mzg5Mn0.FsX0Xu3tC-HWwipKMT9p8dPo3ub7X3bss9ymnL6OUig` 
        }
      });

      console.log('✅ GHN Order Created Successfully:');
      console.log(`   GHN Order Code: ${ghnResponse.data.data?.order_code || 'Not found'}`);
      console.log(`   Total Fee: ${ghnResponse.data.data?.total_fee || 'Not found'}`);

      // 3. Update order with GHN order code
      if (ghnResponse.data.data?.order_code) {
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            ghnOrderCode: ghnResponse.data.data.order_code,
            status: 'SHIPPING'
          }
        });
        console.log(`✅ Order ${order.id} updated with GHN code: ${ghnResponse.data.data.order_code}`);
      }

    } catch (ghnError) {
      console.log('❌ GHN order creation failed:', ghnError.response?.data || ghnError.message);
    }

    // 4. Verify final order status
    console.log('\n3️⃣ Final order status:');
    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id }
    });

    console.log(`   Order ID: ${finalOrder.id}`);
    console.log(`   Payment Status: ${finalOrder.paymentStatus}`);
    console.log(`   Status: ${finalOrder.status}`);
    console.log(`   GHN Order Code: ${finalOrder.ghnOrderCode || 'Not created'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the manual completion
manuallyCompleteZaloPayOrder();
