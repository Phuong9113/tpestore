/**
 * Test COD and ZaloPay Integration
 * 
 * Script này để test cả COD và ZaloPay integration
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:4000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3RfdXNlcl8xMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc2MTY3ODcyNiwiZXhwIjoxNzYxNjgyMzI2fQ.vAP5dHraqSuBOzoqa23MXtOGmiQcv336iVH5N8iSiGQ';

console.log('🧪 Testing COD and ZaloPay Integration...\n');

async function testCODOrder() {
  console.log('1️⃣ Testing COD Order Creation...');
  
  try {
    const orderData = {
      items: [
        {
          productId: 'test_product_1',
          quantity: 1,
          price: 100000
        }
      ],
      shippingInfo: {
        name: 'Test User',
        phone: '0376560307',
        address: 'Test Address',
        province: '202', // TP.HCM
        district: '1442', // Quận 1
        ward: '1A0101' // Phường Bến Nghé
      },
      paymentMethod: 'COD'
    };
    
    console.log('COD Order Data:', JSON.stringify(orderData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ COD Order created successfully:');
    console.log('   Order ID:', response.data.id);
    console.log('   Payment Status:', response.data.paymentStatus);
    console.log('   Status:', response.data.status);
    console.log('   Payment Method:', response.data.paymentMethod);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ COD Order creation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testZaloPayOrder() {
  console.log('\n2️⃣ Testing ZaloPay Order Creation...');
  
  try {
    const orderData = {
      items: [
        {
          productId: 'test_product_1',
          quantity: 1,
          price: 100000
        }
      ],
      shippingInfo: {
        name: 'Test User',
        phone: '0376560307',
        address: 'Test Address',
        province: '202', // TP.HCM
        district: '1442', // Quận 1
        ward: '1A0101' // Phường Bến Nghé
      },
      paymentMethod: 'ZALOPAY'
    };
    
    console.log('ZaloPay Order Data:', JSON.stringify(orderData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ ZaloPay Order created successfully:');
    console.log('   Order ID:', response.data.id);
    console.log('   Payment Status:', response.data.paymentStatus);
    console.log('   Status:', response.data.status);
    console.log('   Payment Method:', response.data.paymentMethod);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ ZaloPay Order creation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testZaloPayPaymentCreation(orderId) {
  console.log('\n3️⃣ Testing ZaloPay Payment Creation...');
  
  try {
    const paymentData = {
      orderId: orderId,
      amount: 100000,
      description: 'Test ZaloPay payment',
      returnUrl: 'http://localhost:3000/payment/verify?orderId=' + orderId
    };
    
    console.log('ZaloPay Payment Data:', JSON.stringify(paymentData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/payment/zalopay/create-order`, paymentData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ ZaloPay Payment created successfully:');
    console.log('   Order URL:', response.data.order_url);
    console.log('   App Trans ID:', response.data.app_trans_id);
    console.log('   ZP Trans Token:', response.data.zp_trans_token);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ ZaloPay Payment creation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGHNShipping(orderId) {
  console.log('\n4️⃣ Testing GHN Shipping Order Creation...');
  
  try {
    const shippingData = {
      orderId: orderId,
      toName: 'Test User',
      toPhone: '0376560307',
      toAddress: 'Test Address',
      toWardCode: '1A0101',
      toDistrictId: '1442',
      toProvinceId: '202',
      codAmount: 100000,
      content: 'Test COD order',
      weight: 200,
      length: 20,
      width: 20,
      height: 20,
      items: [
        {
          name: 'Test Product',
          quantity: 1,
          weight: 200,
          price: 100000
        }
      ]
    };
    
    console.log('GHN Shipping Data:', JSON.stringify(shippingData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/shipping/create-order`, shippingData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ GHN Shipping Order created successfully:');
    console.log('   GHN Order Code:', response.data.data?.order_code);
    console.log('   Total Fee:', response.data.data?.total_fee);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ GHN Shipping Order creation failed:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  try {
    // Test COD order
    const codOrder = await testCODOrder();
    
    if (codOrder) {
      // Test GHN shipping for COD
      await testGHNShipping(codOrder.id);
    }
    
    // Test ZaloPay order
    const zalopayOrder = await testZaloPayOrder();
    
    if (zalopayOrder) {
      // Test ZaloPay payment creation
      await testZaloPayPaymentCreation(zalopayOrder.id);
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('   ✅ COD Order:', codOrder ? 'PASS' : 'FAIL');
    console.log('   ✅ ZaloPay Order:', zalopayOrder ? 'PASS' : 'FAIL');
    
    if (codOrder && zalopayOrder) {
      console.log('\n🎉 All tests passed! Both COD and ZaloPay are working correctly!');
    } else {
      console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }
}

main();
