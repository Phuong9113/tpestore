// Test script for order cancellation API
const API_BASE = 'http://localhost:4000/api';

// Test data - replace with actual order ID and token
const ORDER_ID = 'your-order-id-here';
const ADMIN_TOKEN = 'your-admin-token-here';
const USER_TOKEN = 'your-user-token-here';

async function testCancelOrder() {
  console.log('Testing Order Cancellation API...\n');

  // Test 1: Admin cancel order
  console.log('1. Testing Admin Cancel Order:');
  try {
    const response = await fetch(`${API_BASE}/admin/orders/${ORDER_ID}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: User cancel order
  console.log('2. Testing User Cancel Order:');
  try {
    const response = await fetch(`${API_BASE}/users/orders/${ORDER_ID}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USER_TOKEN}`
      }
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Test GHN API directly
  console.log('3. Testing GHN Cancel API directly:');
  try {
    const GHN_BASE_URL = 'https://dev-online-gateway.ghn.vn';
    const GHN_TOKEN = '2bf42843-af1e-11f0-b040-4e257d8388b4';
    const GHN_SHOP_ID = '197687';
    const GHN_ORDER_CODE = 'your-ghn-order-code-here';

    const response = await fetch(`${GHN_BASE_URL}/shiip/public-api/v2/switch-status/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token': GHN_TOKEN,
        'ShopId': GHN_SHOP_ID
      },
      body: JSON.stringify({
        order_codes: [GHN_ORDER_CODE]
      })
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Usage instructions
console.log(`
Order Cancellation API Test Script
==================================

Before running this test:

1. Update the following variables in this file:
   - ORDER_ID: Replace with an actual order ID from your database
   - ADMIN_TOKEN: Replace with a valid admin JWT token
   - USER_TOKEN: Replace with a valid user JWT token
   - GHN_ORDER_CODE: Replace with an actual GHN order code

2. Make sure your backend server is running on port 4000

3. Run this script with: node test-cancel-order.js

4. Check the console output for API responses

Note: This script tests both admin and user cancellation endpoints,
as well as direct GHN API integration.
`);

// Uncomment the line below to run the test
// testCancelOrder();
