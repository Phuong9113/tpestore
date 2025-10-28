import axios from 'axios';
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000';

async function debugSpecificOrder() {
  console.log('🔍 Debugging specific order: cmhaxnhd20009sqin1yc1tbqg\n');

  try {
    // 1. Check order in database
    console.log('1️⃣ Checking order in database...');
    const order = await prisma.order.findUnique({
      where: { id: 'cmhaxnhd20009sqin1yc1tbqg' },
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
      return;
    }

    console.log('✅ Order found:');
    console.log(`   ID: ${order.id}`);
    console.log(`   Payment Method: ${order.paymentMethod}`);
    console.log(`   Payment Status: ${order.paymentStatus}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Transaction ID: ${order.transactionId}`);
    console.log(`   GHN Order Code: ${order.ghnOrderCode}`);
    console.log(`   Total Price: ${order.totalPrice}`);
    console.log(`   Shipping Name: ${order.shippingName}`);
    console.log(`   Shipping Phone: ${order.shippingPhone}`);
    console.log(`   Shipping Address: ${order.shippingAddress}`);
    console.log(`   Shipping Ward: ${order.shippingWard}`);
    console.log(`   Shipping District: ${order.shippingDistrict}`);
    console.log(`   Shipping Province: ${order.shippingProvince}`);

    // 2. Check if it's a ZaloPay order
    if (order.paymentMethod === 'ZALOPAY') {
      console.log('\n2️⃣ This is a ZaloPay order. Checking payment status...');
      
      if (order.transactionId) {
        try {
          const statusResponse = await axios.get(`${BASE_URL}/api/payment/zalopay/status/${order.id}`);
          console.log('✅ ZaloPay Status Check:');
          console.log(`   Payment Status: ${statusResponse.data.paymentStatus}`);
          console.log(`   Status: ${statusResponse.data.status}`);
          console.log(`   GHN Order Code: ${statusResponse.data.ghnOrderCode || 'Not created yet'}`);
        } catch (error) {
          console.log('⚠️ Status check failed:', error.response?.data?.error || error.message);
        }
      }

      // 3. Try to manually verify payment if it's still PENDING
      if (order.paymentStatus === 'PENDING' && order.transactionId) {
        console.log('\n3️⃣ Attempting manual payment verification...');
        try {
          const verifyResponse = await axios.post(`${BASE_URL}/api/payment/zalopay/verify`, {
            zp_trans_token: order.transactionId,
            orderId: order.id
          });

          console.log('✅ Manual Verification Result:');
          console.log(`   Success: ${verifyResponse.data.success}`);
          console.log(`   Payment Status: ${verifyResponse.data.paymentStatus}`);
          console.log(`   GHN Order Code: ${verifyResponse.data.ghnOrderCode || 'Not created yet'}`);
        } catch (error) {
          console.log('⚠️ Manual verification failed:', error.response?.data?.error || error.message);
        }
      }
    } else if (order.paymentMethod === 'COD') {
      console.log('\n2️⃣ This is a COD order. Checking GHN order creation...');
      
      if (!order.ghnOrderCode) {
        console.log('⚠️ COD order without GHN order code - this should not happen');
        
        // Try to create GHN order manually
        console.log('\n3️⃣ Attempting to create GHN order manually...');
        try {
          const shippingData = {
            orderId: order.id,
            toName: order.shippingName,
            toPhone: order.shippingPhone,
            toAddress: order.shippingAddress,
            toWardCode: order.shippingWard,
            toDistrictId: order.shippingDistrict,
            toProvinceId: order.shippingProvince,
            codAmount: order.totalPrice,
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

          const ghnResponse = await axios.post(`${BASE_URL}/api/shipping/create`, shippingData, {
            headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaDIxM2tncTAwMDdzcXhwY2Y3cnhmeW4iLCJlbWFpbCI6Im52YUBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjE2NzkwOTIsImV4cCI6MTc2MjI4Mzg5Mn0.FsX0Xu3tC-HWwipKMT9p8dPo3ub7X3bss9ymnL6OUig` }
          });

          console.log('✅ GHN Order Created:');
          console.log(`   GHN Order Code: ${ghnResponse.data.data?.order_code || 'Not found'}`);
          console.log(`   Total Fee: ${ghnResponse.data.data?.total_fee || 'Not found'}`);
        } catch (error) {
          console.log('❌ GHN order creation failed:', error.response?.data || error.message);
        }
      } else {
        console.log(`✅ GHN Order Code already exists: ${order.ghnOrderCode}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugSpecificOrder();
