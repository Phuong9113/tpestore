// Debug script for order cancellation issues
const API_BASE = 'http://localhost:4000/api';

// Debug function to check order status and details
async function debugOrderCancellation(orderId, token, isAdmin = false) {
  console.log(`\n🔍 Debugging Order Cancellation for Order ID: ${orderId}`);
  console.log(`👤 User Type: ${isAdmin ? 'Admin' : 'User'}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Check if order exists and get details
    console.log('\n1️⃣ Checking order details...');
    const orderEndpoint = isAdmin ? `/admin/orders/${orderId}` : `/users/profile`;
    const orderResponse = await fetch(`${API_BASE}${orderEndpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!orderResponse.ok) {
      console.error(`❌ Failed to fetch order details: ${orderResponse.status}`);
      const errorText = await orderResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const orderData = await orderResponse.json();
    console.log('✅ Order data retrieved successfully');
    
    if (isAdmin) {
      console.log('Order details:', JSON.stringify(orderData, null, 2));
    } else {
      // For user, find the specific order in their orders list
      const userOrder = orderData.orders?.find(order => order.id === orderId);
      if (!userOrder) {
        console.error('❌ Order not found in user\'s orders');
        return;
      }
      console.log('User order details:', JSON.stringify(userOrder, null, 2));
    }

    // Step 2: Check order status and cancellation eligibility
    console.log('\n2️⃣ Checking cancellation eligibility...');
    const order = isAdmin ? orderData : orderData.orders?.find(o => o.id === orderId);
    
    if (!order) {
      console.error('❌ Order not found');
      return;
    }

    console.log(`📊 Order Status: ${order.status}`);
    console.log(`📅 Created At: ${order.createdAt}`);
    console.log(`🚚 GHN Order Code: ${order.ghnOrderCode || 'N/A'}`);

    // Check if order can be cancelled
    const canCancel = checkCancellationEligibility(order, isAdmin);
    console.log(`✅ Can Cancel: ${canCancel.canCancel}`);
    if (!canCancel.canCancel) {
      console.log(`❌ Reason: ${canCancel.reason}`);
    }

    // Step 3: Test cancellation API
    if (canCancel.canCancel) {
      console.log('\n3️⃣ Testing cancellation API...');
      const cancelEndpoint = isAdmin ? `/admin/orders/${orderId}/cancel` : `/users/orders/${orderId}/cancel`;
      
      const cancelResponse = await fetch(`${API_BASE}${cancelEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`📡 Cancel API Status: ${cancelResponse.status}`);
      
      if (cancelResponse.ok) {
        const cancelResult = await cancelResponse.json();
        console.log('✅ Cancellation successful!');
        console.log('Result:', JSON.stringify(cancelResult, null, 2));
      } else {
        const errorText = await cancelResponse.text();
        console.error('❌ Cancellation failed');
        console.error('Error:', errorText);
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Helper function to check if order can be cancelled
function checkCancellationEligibility(order, isAdmin) {
  // Check order status
  if (order.status === 'CANCELLED') {
    return { canCancel: false, reason: 'Order already cancelled' };
  }
  
  if (order.status === 'COMPLETED') {
    return { canCancel: false, reason: 'Cannot cancel completed order' };
  }
  
  if (order.status === 'SHIPPING') {
    return { canCancel: false, reason: 'Cannot cancel order that is shipping' };
  }

  // For users, check time limit (24 hours)
  if (!isAdmin) {
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    const maxCancelTime = 24 * 60 * 60 * 1000; // 24 hours
    
    if (orderAge > maxCancelTime) {
      return { canCancel: false, reason: 'Order is older than 24 hours' };
    }
  }

  // Check if order is in cancellable status
  if (order.status === 'PENDING' || order.status === 'PROCESSING') {
    return { canCancel: true, reason: 'Order can be cancelled' };
  }

  return { canCancel: false, reason: 'Unknown order status' };
}

// Test GHN API directly
async function testGHNAPI(ghnOrderCode) {
  console.log(`\n🚚 Testing GHN API directly for order: ${ghnOrderCode}`);
  console.log('='.repeat(60));

  try {
    const GHN_BASE_URL = 'https://dev-online-gateway.ghn.vn';
    const GHN_TOKEN = '2bf42843-af1e-11f0-b040-4e257d8388b4';
    const GHN_SHOP_ID = '197687';

    const response = await fetch(`${GHN_BASE_URL}/shiip/public-api/v2/switch-status/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token': GHN_TOKEN,
        'ShopId': GHN_SHOP_ID
      },
      body: JSON.stringify({
        order_codes: [ghnOrderCode]
      })
    });

    console.log(`📡 GHN API Status: ${response.status}`);
    const result = await response.json();
    console.log('GHN Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('💥 GHN API Error:', error.message);
  }
}

// Check server status
async function checkServerStatus() {
  console.log('\n🖥️ Checking server status...');
  console.log('='.repeat(60));

  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log('✅ Server is running');
    } else {
      console.log(`⚠️ Server responded with status: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Server is not accessible:', error.message);
    console.log('💡 Make sure your backend server is running on port 4000');
  }
}

// Main debug function
async function debugOrderCancellationIssues() {
  console.log('🐛 Order Cancellation Debug Tool');
  console.log('================================');
  
  // Check server first
  await checkServerStatus();

  // Example usage - replace with your actual values
  const testCases = [
    {
      orderId: 'your-order-id-here',
      token: 'your-admin-token-here',
      isAdmin: true,
      description: 'Admin cancellation test'
    },
    {
      orderId: 'your-order-id-here',
      token: 'your-user-token-here',
      isAdmin: false,
      description: 'User cancellation test'
    }
  ];

  for (const testCase of testCases) {
    if (testCase.orderId !== 'your-order-id-here') {
      console.log(`\n🧪 ${testCase.description}`);
      await debugOrderCancellation(testCase.orderId, testCase.token, testCase.isAdmin);
    }
  }

  // Test GHN API if you have a GHN order code
  const ghnOrderCode = 'your-ghn-order-code-here';
  if (ghnOrderCode !== 'your-ghn-order-code-here') {
    await testGHNAPI(ghnOrderCode);
  }

  console.log('\n📋 Common Issues Checklist:');
  console.log('1. ✅ Server is running on port 4000');
  console.log('2. ✅ Order ID exists in database');
  console.log('3. ✅ User has permission to cancel the order');
  console.log('4. ✅ Order status allows cancellation');
  console.log('5. ✅ Token is valid and not expired');
  console.log('6. ✅ GHN credentials are correct');
  console.log('7. ✅ Network connectivity to GHN API');
}

// Usage instructions
console.log(`
🔧 Order Cancellation Debug Tool
================================

This tool helps debug order cancellation issues by:

1. Checking server status
2. Verifying order details and status
3. Testing cancellation eligibility
4. Testing the cancellation API
5. Testing GHN API directly

To use this tool:

1. Update the test cases below with your actual:
   - Order ID
   - Admin token
   - User token
   - GHN order code (optional)

2. Run: node debug-cancel-order.js

3. Check the console output for detailed error information

Common issues to check:
- Server not running
- Invalid order ID
- Order already cancelled
- Order status doesn't allow cancellation
- Expired or invalid token
- GHN API credentials
- Network connectivity
`);

// Uncomment to run the debug tool
// debugOrderCancellationIssues();
