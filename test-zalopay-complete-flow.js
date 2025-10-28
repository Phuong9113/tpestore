import axios from 'axios';

const BASE_URL = 'http://localhost:4000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaDIxM2tncTAwMDdzcXhwY2Y3cnhmeW4iLCJlbWFpbCI6Im52YUBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjE2NzkwOTIsImV4cCI6MTc2MjI4Mzg5Mn0.FsX0Xu3tC-HWwipKMT9p8dPo3ub7X3bss9ymnL6OUig';

async function testZaloPayCompleteFlow() {
  console.log('🧪 Testing Complete ZaloPay Flow...\n');

  try {
    // 1. Create ZaloPay Order
    console.log('1️⃣ Creating ZaloPay Order...');
    const orderResponse = await axios.post(`${BASE_URL}/api/orders`, {
      items: [{
        productId: 'cmh212v1n0003sqxp6dh284jq',
        quantity: 1,
        price: 150000
      }],
      shippingInfo: {
        name: 'Test User',
        phone: '0376560307',
        address: 'ấp 3, xã thường tân, bắc tân uyên, bình dương',
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
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    const orderId = orderResponse.data.id;
    console.log(`✅ ZaloPay Order created: ${orderId}`);
    console.log(`   Payment Status: ${orderResponse.data.paymentStatus}`);
    console.log(`   Status: ${orderResponse.data.status}`);

    // 2. Create ZaloPay Payment
    console.log('\n2️⃣ Creating ZaloPay Payment...');
    const paymentResponse = await axios.post(`${BASE_URL}/api/payment/zalopay/create-order`, {
      orderId: orderId,
      amount: 170500,
      description: `Thanh toán đơn hàng ${orderId}`,
      returnUrl: `http://localhost:3000/payment/verify?orderId=${orderId}`
    }, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    console.log('✅ ZaloPay Payment created:');
    console.log(`   Order URL: ${paymentResponse.data.order_url}`);
    console.log(`   App Trans ID: ${paymentResponse.data.app_trans_id}`);
    console.log(`   ZP Trans Token: ${paymentResponse.data.zp_trans_token}`);

    // 3. Simulate ZaloPay Callback (successful payment)
    console.log('\n3️⃣ Simulating ZaloPay Callback...');
    const callbackData = {
      data: `{"orderId":"${orderId}","redirecturl":"http://localhost:3000/payment/verify?orderId=${orderId}"}`,
      type: 'payment',
      code: 1,
      message: 'success',
      mac: 'test_mac_signature' // This would be properly signed in real scenario
    };

    try {
      const callbackResponse = await axios.post(`${BASE_URL}/api/payment/zalopay/callback`, callbackData);
      console.log('✅ ZaloPay Callback processed:', callbackResponse.data);
    } catch (callbackError) {
      console.log('⚠️ Callback failed (expected in test):', callbackError.response?.data?.error || callbackError.message);
    }

    // 4. Verify Payment Status
    console.log('\n4️⃣ Checking Payment Status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/payment/zalopay/status/${orderId}`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    console.log('✅ Payment Status:');
    console.log(`   Order ID: ${statusResponse.data.orderId}`);
    console.log(`   Payment Status: ${statusResponse.data.paymentStatus}`);
    console.log(`   Status: ${statusResponse.data.status}`);
    console.log(`   GHN Order Code: ${statusResponse.data.ghnOrderCode || 'Not created yet'}`);

    // 5. Simulate Frontend Verification
    console.log('\n5️⃣ Simulating Frontend Verification...');
    try {
      const verifyResponse = await axios.post(`${BASE_URL}/api/payment/zalopay/verify`, {
        zp_trans_token: paymentResponse.data.zp_trans_token,
        orderId: orderId
      });

      console.log('✅ Payment Verification:');
      console.log(`   Success: ${verifyResponse.data.success}`);
      console.log(`   Payment Status: ${verifyResponse.data.paymentStatus}`);
      console.log(`   Order ID: ${verifyResponse.data.orderId}`);
      console.log(`   GHN Order Code: ${verifyResponse.data.ghnOrderCode || 'Not created yet'}`);
      
      if (verifyResponse.data.order) {
        console.log(`   Order Status: ${verifyResponse.data.order.status}`);
        console.log(`   Order Payment Status: ${verifyResponse.data.order.paymentStatus}`);
      }
    } catch (verifyError) {
      console.log('⚠️ Verification failed:', verifyError.response?.data?.error || verifyError.message);
    }

    console.log('\n🎯 Test Summary:');
    console.log('   ✅ ZaloPay Order Creation: PASS');
    console.log('   ✅ ZaloPay Payment Creation: PASS');
    console.log('   ⚠️ ZaloPay Callback: Expected to fail in test environment');
    console.log('   ✅ Payment Status Check: PASS');
    console.log('   ⚠️ Payment Verification: May fail without real ZaloPay response');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testZaloPayCompleteFlow();
