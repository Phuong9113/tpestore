#!/usr/bin/env node

/**
 * Test script for ZaloPay Gateway v2 integration
 * Usage: node test-zalopay-v2.js
 */

import crypto from 'crypto';
import axios from 'axios';

// ZaloPay v2 configuration từ .env
const ZALOPAY_CONFIG = {
  appId: "2554",
  key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
  key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
  createEndpoint: "https://sb-openapi.zalopay.vn/v2/create",
  callbackUrl: "https://yourdomain.com/api/payment/zalopay/callback"
};

/**
 * Tạo app_trans_id theo chuẩn ZaloPay v2: yyMMdd_randomNumber
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
 * Test tạo đơn hàng ZaloPay v2
 */
async function testCreateZaloPayV2Order() {
  console.log('🧪 Testing ZaloPay Gateway v2 create order...');
  
  try {
    const timestamp = Date.now();
    const appTransId = createAppTransId();
    
    // Test data
    const testOrderData = {
      orderId: 'test_order_' + Date.now(),
      amount: 100000, // 100,000 VND
      description: 'Test ZaloPay v2 order',
      returnUrl: 'https://yourdomain.com/payment/success',
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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    console.log('📥 ZaloPay v2 response:', response.data);

    // Xử lý response
    if (response.data.return_code === 1) {
      console.log('✅ ZaloPay v2 order created successfully!');
      console.log('🔗 Order URL:', response.data.order_url);
      console.log('🎫 ZP Trans Token:', response.data.zp_trans_token);
      return {
        success: true,
        order_url: response.data.order_url,
        app_trans_id: appTransId
      };
    } else {
      console.log('❌ ZaloPay v2 order creation failed:');
      console.log('   Return Code:', response.data.return_code);
      console.log('   Return Message:', response.data.return_message);
      console.log('   Sub Return Code:', response.data.sub_return_code);
      console.log('   Sub Return Message:', response.data.sub_return_message);
      return {
        success: false,
        error: response.data.return_message,
        sub_return_code: response.data.sub_return_code
      };
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test MAC generation
 */
function testMACGeneration() {
  console.log('🔐 Testing MAC generation...');
  
  const testData = {
    app_id: 2554,
    app_trans_id: '250128_12345',
    app_user: 'TPE_Store',
    amount: 100000,
    app_time: 1761674161940,
    embed_data: '{"orderId":"test","redirecturl":"https://domain.com/success"}',
    item: '[{"itemid":"1","itemname":"Test","itemprice":100000,"itemquantity":1}]'
  };

  const rawData = `${testData.app_id}|${testData.app_trans_id}|${testData.app_user}|${testData.amount}|${testData.app_time}|${testData.embed_data}|${testData.item}`;
  const mac = crypto.createHmac('sha256', ZALOPAY_CONFIG.key1).update(rawData).digest('hex');

  console.log('📝 Raw data for MAC:', rawData);
  console.log('🔑 Generated MAC:', mac);
  
  return mac;
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting ZaloPay Gateway v2 Tests...');
  console.log('=====================================');

  // Test 1: MAC Generation
  console.log('\n1️⃣ Testing MAC Generation');
  testMACGeneration();

  // Test 2: Create Order
  console.log('\n2️⃣ Testing Create Order');
  const result = await testCreateZaloPayV2Order();

  console.log('\n📊 Test Results:');
  console.log('================');
  if (result.success) {
    console.log('✅ All tests passed!');
    console.log('🔗 Order URL:', result.order_url);
    console.log('🎫 App Trans ID:', result.app_trans_id);
  } else {
    console.log('❌ Tests failed:', result.error);
    if (result.sub_return_code) {
      console.log('🔍 Sub Return Code:', result.sub_return_code);
    }
  }

  console.log('\n📝 Next steps:');
  console.log('1. Update callback URL in ZaloPay Developer Portal');
  console.log('2. Test with real domain (use ngrok for local testing)');
  console.log('3. Integrate with your frontend checkout flow');
}

// Run tests
runTests().catch(console.error);
