#!/usr/bin/env node

/**
 * Test script for ZaloPay integration
 * Usage: node test-zalopay-integration.js
 */

import axios from 'axios';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3000';

// Mock ZaloPay credentials (replace with real ones)
const ZALOPAY_CONFIG = {
  appId: process.env.ZALOPAY_APP_ID || 'your_app_id',
  key1: process.env.ZALOPAY_KEY1 || 'your_key1',
  key2: process.env.ZALOPAY_KEY2 || 'your_key2',
  createEndpoint: 'https://sb-openapi.zalopay.vn/v2/create'
};

// Test user credentials (replace with real ones)
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = '';

/**
 * Helper function to create HMAC signature
 */
function createSignature(data, key) {
  const dataStr = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('&');
  
  return crypto
    .createHmac('sha256', key)
    .update(dataStr)
    .digest('hex');
}

/**
 * Test 1: User authentication
 */
async function testAuthentication() {
  console.log('\n🔐 Testing authentication...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log('✅ Authentication successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 2: Create order with ZaloPay payment method
 */
async function testCreateOrder() {
  console.log('\n📦 Testing order creation with ZaloPay...');
  
  try {
    const orderData = {
      items: [
        {
          productId: 'test-product-id',
          quantity: 1,
          price: 100000
        }
      ],
      shippingInfo: {
        name: 'Test User',
        phone: '0123456789',
        address: '123 Test Street',
        province: '79',
        district: '760',
        ward: '26734',
        provinceName: 'TP. Hồ Chí Minh',
        districtName: 'Quận 1',
        wardName: 'Phường Bến Nghé',
        shippingFee: 30000
      },
      paymentMethod: 'ZALOPAY'
    };

    const response = await axios.post(`${BASE_URL}/api/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Order created successfully');
    console.log(`   Order ID: ${response.data.id}`);
    console.log(`   Payment Method: ${response.data.paymentMethod}`);
    console.log(`   Payment Status: ${response.data.paymentStatus}`);
    return response.data.id;
  } catch (error) {
    console.log('❌ Order creation failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 3: Create ZaloPay payment order
 */
async function testCreateZaloPayOrder(orderId) {
  console.log('\n💳 Testing ZaloPay order creation...');
  
  try {
    const zalopayData = {
      orderId: orderId,
      amount: 130000, // 100000 + 30000 shipping
      description: `Test ZaloPay order ${orderId}`,
      returnUrl: `${FRONTEND_URL}/payment/success`
    };

    const response = await axios.post(`${BASE_URL}/api/payment/zalopay/create-order`, zalopayData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ ZaloPay order created successfully');
    console.log(`   Order URL: ${response.data.order_url}`);
    console.log(`   Order Token: ${response.data.order_token}`);
    console.log(`   ZP Trans ID: ${response.data.zp_trans_id}`);
    return response.data;
  } catch (error) {
    console.log('❌ ZaloPay order creation failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 4: Check payment status
 */
async function testCheckPaymentStatus(orderId) {
  console.log('\n📊 Testing payment status check...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/payment/zalopay/status/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Payment status retrieved successfully');
    console.log(`   Order ID: ${response.data.orderId}`);
    console.log(`   Payment Status: ${response.data.paymentStatus}`);
    console.log(`   Order Status: ${response.data.status}`);
    if (response.data.ghnOrderCode) {
      console.log(`   GHN Order Code: ${response.data.ghnOrderCode}`);
    }
    return response.data;
  } catch (error) {
    console.log('❌ Payment status check failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 5: Simulate ZaloPay callback
 */
async function testZaloPayCallback(orderId) {
  console.log('\n🔄 Testing ZaloPay callback simulation...');
  
  try {
    // Simulate successful payment callback
    const callbackData = {
      data: JSON.stringify({
        orderId: orderId,
        amount: 130000,
        description: `Test ZaloPay order ${orderId}`
      }),
      type: 'payment',
      code: 1,
      message: 'success'
    };

    // Create signature
    callbackData.mac = createSignature(callbackData, ZALOPAY_CONFIG.key2);

    const response = await axios.post(`${BASE_URL}/api/payment/zalopay/callback`, callbackData);

    console.log('✅ ZaloPay callback processed successfully');
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    console.log('❌ ZaloPay callback failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 6: Verify order status after payment
 */
async function testOrderStatusAfterPayment(orderId) {
  console.log('\n✅ Testing order status after payment...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Order status retrieved successfully');
    console.log(`   Order ID: ${response.data.id}`);
    console.log(`   Payment Status: ${response.data.paymentStatus}`);
    console.log(`   Order Status: ${response.data.status}`);
    console.log(`   Payment Method: ${response.data.paymentMethod}`);
    if (response.data.ghnOrderCode) {
      console.log(`   GHN Order Code: ${response.data.ghnOrderCode}`);
    }
    return response.data;
  } catch (error) {
    console.log('❌ Order status check failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting ZaloPay Integration Tests...');
  console.log('=====================================');

  // Test 1: Authentication
  const authSuccess = await testAuthentication();
  if (!authSuccess) {
    console.log('\n❌ Authentication failed. Please check your test user credentials.');
    return;
  }

  // Test 2: Create order
  const orderId = await testCreateOrder();
  if (!orderId) {
    console.log('\n❌ Order creation failed. Please check your database and product data.');
    return;
  }

  // Test 3: Create ZaloPay order
  const zalopayOrder = await testCreateZaloPayOrder(orderId);
  if (!zalopayOrder) {
    console.log('\n❌ ZaloPay order creation failed. Please check your ZaloPay configuration.');
    return;
  }

  // Test 4: Check initial payment status
  await testCheckPaymentStatus(orderId);

  // Test 5: Simulate callback
  const callbackSuccess = await testZaloPayCallback(orderId);
  if (!callbackSuccess) {
    console.log('\n❌ Callback simulation failed. Please check your ZaloPay key2 configuration.');
    return;
  }

  // Test 6: Check final order status
  await testOrderStatusAfterPayment(orderId);

  console.log('\n🎉 All tests completed!');
  console.log('=====================================');
  console.log('\n📝 Next steps:');
  console.log('1. Configure real ZaloPay credentials in .env file');
  console.log('2. Set up ngrok for callback URL testing');
  console.log('3. Test with real ZaloPay sandbox environment');
  console.log('4. Deploy to production with production ZaloPay credentials');
}

// Run tests
runTests().catch(console.error);
