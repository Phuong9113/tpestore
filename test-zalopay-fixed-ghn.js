import axios from 'axios';
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000';

async function testZaloPayOrderWithFixedGHN() {
  console.log('🧪 Testing ZaloPay Order with Fixed GHN Address...\n');

  try {
    // Get the specific order from terminal log
    const orderId = 'cmhaz5wnh000bsqcxuh4ktbh8';
    
    console.log(`Testing order: ${orderId}`);

    // 1. Check current order status
    console.log('\n1️⃣ Checking current order status...');
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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

    console.log('✅ Order found:');
    console.log(`   Payment Status: ${order.paymentStatus}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   GHN Order Code: ${order.ghnOrderCode || 'Not created'}`);
    console.log(`   Transaction ID: ${order.transactionId}`);

    // 2. Try to create GHN order with fixed address codes
    if (order.paymentStatus === 'PAID' && !order.ghnOrderCode) {
      console.log('\n2️⃣ Creating GHN order with fixed address codes...');
      
      const shippingData = {
        orderId: order.id,
        toName: order.shippingName,
        toPhone: order.shippingPhone,
        toAddress: order.shippingAddress,
        toWardCode: '20101', // Fixed ward code
        toDistrictId: 1442, // Fixed district ID
        toProvinceId: 202, // Fixed province ID
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

        // Update order with GHN order code
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
    } else if (order.ghnOrderCode) {
      console.log(`✅ GHN Order already exists: ${order.ghnOrderCode}`);
    } else {
      console.log('⚠️ Order not in PAID status, cannot create GHN order');
    }

    // 3. Final status check
    console.log('\n3️⃣ Final order status:');
    const finalOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    console.log(`   Order ID: ${finalOrder.id}`);
    console.log(`   Payment Status: ${finalOrder.paymentStatus}`);
    console.log(`   Status: ${finalOrder.status}`);
    console.log(`   GHN Order Code: ${finalOrder.ghnOrderCode || 'Not created'}`);

    // 4. Test frontend polling
    console.log('\n4️⃣ Frontend polling URL:');
    console.log(`   http://localhost:3000/payment/verify?orderId=${orderId}`);
    console.log('\n🎯 Instructions:');
    console.log('1. Copy the URL above');
    console.log('2. Open it in your browser');
    console.log('3. Should now show GHN order code if created successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testZaloPayOrderWithFixedGHN();
