/**
 * Test ZaloPay Gateway v2 Complete Flow
 * 
 * Script này test toàn bộ luồng ZaloPay v2 từ tạo đơn đến verify:
 * 1. Tạo đơn hàng với app_trans_id đúng format v2
 * 2. Simulate redirect với zp_trans_token
 * 3. Verify thanh toán với backend
 * 4. Kiểm tra callback handling
 */

import axios from 'axios';
import crypto from 'crypto';

// Test configuration
const BASE_URL = 'http://localhost:4000'; // Backend server
const FRONTEND_URL = 'http://localhost:3000'; // Frontend server

// ZaloPay v2 test credentials (sandbox)
const ZALOPAY_CONFIG = {
  appId: process.env.ZALOPAY_APP_ID || '2554',
  key1: process.env.ZALOPAY_KEY1 || 'sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn',
  key2: process.env.ZALOPAY_KEY2 || 'trMrHtvjo6myautxDUiAcYsVtaeQ8nhf',
  createEndpoint: process.env.ZALOPAY_CREATE_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create',
  callbackUrl: process.env.ZALOPAY_SANDBOX_CALLBACK_URL || 'https://yourdomain.com/api/payment/zalopay/callback'
};

console.log('🧪 Testing ZaloPay Gateway v2 Complete Flow...\n');

/**
 * Tạo app_trans_id theo chuẩn ZaloPay v2
 * Format: yyMMdd_randomNumber (6 số + 5 số)
 */
function createAppTransId() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2); // 2 số cuối năm
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const randomNumber = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${year}${month}${day}_${randomNumber}`;
}

/**
 * Test 1: Tạo đơn hàng ZaloPay v2
 */
async function testCreateZaloPayV2Order() {
  console.log('1️⃣ Testing ZaloPay v2 Order Creation...');
  
  try {
    const timestamp = Date.now();
    const appTransId = createAppTransId();
    const testOrderId = 'test_order_' + Date.now();
    
    // Test data
    const testOrderData = {
      orderId: testOrderId,
      amount: 100000, // 100,000 VND
      description: 'Test ZaloPay v2 order',
      returnUrl: `${FRONTEND_URL}/payment/verify?orderId=${testOrderId}`, // Include orderId in redirect URL
      item: [
        {
          itemid: 'test_item_1',
          itemname: 'Test Product',
          itemprice: 100000,
          itemquantity: 1
        }
      ]
    };

    // Chuẩn bị embed_data với "redirecturl" theo chuẩn v2
    const embedData = {
      orderId: testOrderData.orderId,
      redirecturl: testOrderData.returnUrl
    };

    // Dữ liệu gửi đến ZaloPay Gateway v2
    const data = {
      app_id: parseInt(ZALOPAY_CONFIG.appId),
      app_time: timestamp,
      app_trans_id: appTransId,
      app_user: 'TPE_Store',
      bank_code: '',
      description: testOrderData.description,
      amount: testOrderData.amount,
      embed_data: JSON.stringify(embedData),
      item: JSON.stringify(testOrderData.item),
      callback_url: ZALOPAY_CONFIG.callbackUrl
    };

    // Tạo MAC theo chuẩn ZaloPay v2
    const rawData = `${data.app_id}|${data.app_trans_id}|${data.app_user}|${data.amount}|${data.app_time}|${data.embed_data}|${data.item}`;
    data.mac = crypto.createHmac('sha256', ZALOPAY_CONFIG.key1).update(rawData).digest('hex');

    console.log('📤 ZaloPay v2 request data:', {
      app_trans_id: data.app_trans_id,
      app_id: data.app_id,
      amount: data.amount,
      description: data.description,
      embed_data: data.embed_data,
      mac: data.mac.substring(0, 20) + '...'
    });

    // Gửi request
    const formData = new URLSearchParams();
    Object.keys(data).forEach(key => formData.append(key, data[key]));

    const response = await axios.post(ZALOPAY_CONFIG.createEndpoint, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('📥 ZaloPay v2 API response:', response.data);

    if (response.data.return_code === 1) {
      console.log('✅ ZaloPay v2 order created successfully!');
      console.log('   Order URL:', response.data.order_url);
      console.log('   ZP Trans Token:', response.data.zp_trans_token);
      console.log('   App Trans ID:', response.data.app_trans_id);
      
      return {
        success: true,
        order_url: response.data.order_url,
        zp_trans_token: response.data.zp_trans_token,
        app_trans_id: response.data.app_trans_id,
        orderId: testOrderId
      };
    } else {
      console.log('❌ ZaloPay v2 order creation failed:', {
        return_code: response.data.return_code,
        return_message: response.data.return_message,
        sub_return_code: response.data.sub_return_code,
        sub_return_message: response.data.sub_return_message
      });
      return { success: false, error: response.data.return_message };
    }

  } catch (error) {
    console.error('❌ ZaloPay v2 order creation error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Verify thanh toán với zp_trans_token
 */
async function testVerifyPayment(zpTransToken, orderId) {
  console.log('\n2️⃣ Testing Payment Verification...');
  
  try {
    console.log('Verifying payment with zp_trans_token:', zpTransToken);
    
    // Gọi backend verify endpoint
    const response = await axios.post(`${BASE_URL}/api/payment/zalopay/verify`, {
      zp_trans_token: zpTransToken,
      orderId: orderId
    });

    console.log('📥 Payment verification response:', response.data);

    if (response.data.success && response.data.paymentStatus === 'PAID') {
      console.log('✅ Payment verification successful!');
      console.log('   Order ID:', response.data.orderId);
      console.log('   Payment Status:', response.data.paymentStatus);
      console.log('   GHN Order Code:', response.data.ghnOrderCode);
      return { success: true, data: response.data };
    } else {
      console.log('❌ Payment verification failed:', response.data.error);
      return { success: false, error: response.data.error };
    }

  } catch (error) {
    console.error('❌ Payment verification error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Test callback handling
 */
async function testCallbackHandling(orderId, appTransId) {
  console.log('\n3️⃣ Testing Callback Handling...');
  
  try {
    // Simulate callback data từ ZaloPay
    const callbackData = {
      data: JSON.stringify({
        orderId: orderId,
        amount: 100000,
        redirecturl: `${FRONTEND_URL}/payment/verify`
      }),
      type: 'payment',
      code: 1,
      message: 'success'
    };

    // Tạo MAC cho callback theo ZaloPay v2
    const rawData = `${callbackData.data}|${callbackData.type}|${callbackData.code}|${callbackData.message}`;
    callbackData.mac = crypto.createHmac('sha256', ZALOPAY_CONFIG.key2).update(rawData).digest('hex');

    console.log('📤 Simulated callback data:', {
      data: callbackData.data,
      type: callbackData.type,
      code: callbackData.code,
      message: callbackData.message,
      mac: callbackData.mac.substring(0, 20) + '...'
    });

    // Gọi callback endpoint
    const response = await axios.post(`${BASE_URL}/api/payment/zalopay/callback`, callbackData);

    console.log('📥 Callback response:', response.data);

    if (response.data.return_code === 1) {
      console.log('✅ Callback handling successful!');
      return { success: true, data: response.data };
    } else {
      console.log('❌ Callback handling failed:', response.data.return_message);
      return { success: false, error: response.data.return_message };
    }

  } catch (error) {
    console.error('❌ Callback handling error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Kiểm tra trạng thái đơn hàng
 */
async function testOrderStatus(orderId) {
  console.log('\n4️⃣ Testing Order Status Check...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/payment/zalopay/status/${orderId}`, {
      headers: {
        'Authorization': 'Bearer test_token' // Cần token thật trong test thực tế
      }
    });

    console.log('📥 Order status response:', response.data);

    if (response.data.paymentStatus === 'PAID') {
      console.log('✅ Order status check successful!');
      console.log('   Payment Status:', response.data.paymentStatus);
      console.log('   Order Status:', response.data.status);
      return { success: true, data: response.data };
    } else {
      console.log('⚠️  Order not yet paid:', response.data.paymentStatus);
      return { success: false, error: 'Order not paid' };
    }

  } catch (error) {
    console.error('❌ Order status check error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Chạy toàn bộ test suite
 */
async function runCompleteTest() {
  try {
    // Test 1: Tạo đơn hàng
    const createResult = await testCreateZaloPayV2Order();
    
    if (!createResult.success) {
      console.log('\n❌ Test failed at order creation step');
      return;
    }

    // Test 2: Verify thanh toán (với zp_trans_token thật từ ZaloPay)
    // Trong test thực tế, zp_trans_token sẽ đến từ ZaloPay redirect
    const verifyResult = await testVerifyPayment(createResult.zp_trans_token, createResult.orderId);
    
    // Test 3: Callback handling
    const callbackResult = await testCallbackHandling(createResult.orderId, createResult.app_trans_id);
    
    // Test 4: Kiểm tra trạng thái đơn hàng
    const statusResult = await testOrderStatus(createResult.orderId);

    console.log('\n🎉 ZaloPay v2 Complete Flow Test Results:');
    console.log('   ✅ Order Creation:', createResult.success ? 'PASS' : 'FAIL');
    console.log('   ✅ Payment Verification:', verifyResult.success ? 'PASS' : 'FAIL');
    console.log('   ✅ Callback Handling:', callbackResult.success ? 'PASS' : 'FAIL');
    console.log('   ✅ Order Status Check:', statusResult.success ? 'PASS' : 'FAIL');

    if (createResult.success && verifyResult.success && callbackResult.success && statusResult.success) {
      console.log('\n🎊 All tests passed! ZaloPay v2 integration is working correctly!');
    } else {
      console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }
}

// Chạy test
runCompleteTest();
