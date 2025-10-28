import axios from 'axios';
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000';

async function testZaloPayRedirect() {
  console.log('🧪 Testing ZaloPay redirect behavior...\n');

  try {
    // 1. Create a new ZaloPay order
    console.log('1️⃣ Creating new ZaloPay order...');
    const orderResponse = await axios.post(`${BASE_URL}/api/orders`, {
      items: [{
        productId: 'cmh212v1n0003sqxp6dh284jq',
        quantity: 1,
        price: 150000
      }],
      shippingInfo: {
        name: 'Test User Redirect',
        phone: '0376560307',
        address: 'Test Address',
        province: '202',
        district: '1442',
        ward: '20101',
        hamlet: '',
        email: '',
        provinceName: 'Hồ Chí Minh',
        districtName: 'Quận 1',
        wardName: 'Phường Bến Nghé',
        shippingFee: 20500
      },
      paymentMethod: 'ZALOPAY',
      deliverOption: 'xfast'
    }, {
      headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaDIxM2tncTAwMDdzcXhwY2Y3cnhmeW4iLCJlbWFpbCI6Im52YUBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjE2NzkwOTIsImV4cCI6MTc2MjI4Mzg5Mn0.FsX0Xu3tC-HWwipKMT9p8dPo3ub7X3bss9ymnL6OUig` }
    });

    const orderId = orderResponse.data.id;
    console.log(`✅ Order created: ${orderId}`);

    // 2. Create ZaloPay payment
    console.log('\n2️⃣ Creating ZaloPay payment...');
    const paymentResponse = await axios.post(`${BASE_URL}/api/payment/zalopay/create-order`, {
      orderId: orderId,
      amount: 170500,
      description: `Thanh toán đơn hàng ${orderId}`,
      returnUrl: `http://localhost:3000/payment/verify?orderId=${orderId}`
    }, {
      headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaDIxM2tncTAwMDdzcXhwY2Y3cnhmeW4iLCJlbWFpbCI6Im52YUBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjE2NzkwOTIsImV4cCI6MTc2MjI4Mzg5Mn0.FsX0Xu3tC-HWwipKMT9p8dPo3ub7X3bss9ymnL6OUig` }
    });

    console.log('✅ ZaloPay Payment created:');
    console.log(`   Order URL: ${paymentResponse.data.order_url}`);
    console.log(`   App Trans ID: ${paymentResponse.data.app_trans_id}`);
    console.log(`   ZP Trans Token: ${paymentResponse.data.zp_trans_token}`);

    // 3. Simulate successful payment by manually updating order
    console.log('\n3️⃣ Simulating successful payment...');
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        status: 'PROCESSING',
        transactionId: paymentResponse.data.zp_trans_token
      }
    });
    console.log('✅ Order updated to PAID status');

    // 4. Test verification endpoint directly
    console.log('\n4️⃣ Testing verification endpoint...');
    try {
      const verifyResponse = await axios.post(`${BASE_URL}/api/payment/zalopay/verify`, {
        zp_trans_token: paymentResponse.data.zp_trans_token,
        orderId: orderId
      });

      console.log('✅ Verification successful:');
      console.log(`   Success: ${verifyResponse.data.success}`);
      console.log(`   Payment Status: ${verifyResponse.data.paymentStatus}`);
      console.log(`   Order ID: ${verifyResponse.data.orderId}`);
      console.log(`   GHN Order Code: ${verifyResponse.data.ghnOrderCode || 'Not created yet'}`);
    } catch (verifyError) {
      console.log('❌ Verification failed:', verifyError.response?.data || verifyError.message);
    }

    // 5. Test different redirect URL formats
    console.log('\n5️⃣ Testing different redirect URL formats...');
    const testUrls = [
      `http://localhost:3000/payment/verify?orderId=${orderId}&zp_trans_token=${paymentResponse.data.zp_trans_token}`,
      `http://localhost:3000/payment/verify?orderId=${orderId}&zptranstoken=${paymentResponse.data.zp_trans_token}`,
      `http://localhost:3000/payment/verify?orderId=${orderId}&token=${paymentResponse.data.zp_trans_token}`,
      `http://localhost:3000/payment/verify?orderId=${orderId}&zp_trans_id=${paymentResponse.data.zp_trans_token}`,
      `http://localhost:3000/payment/verify?app_trans_id=${paymentResponse.data.app_trans_id}&zp_trans_token=${paymentResponse.data.zp_trans_token}`
    ];

    console.log('Test URLs for manual testing:');
    testUrls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
    });

    console.log('\n🎯 Instructions:');
    console.log('1. Copy one of the URLs above');
    console.log('2. Open it in your browser');
    console.log('3. Check browser console for debug logs');
    console.log('4. See which parameter format works');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testZaloPayRedirect();
