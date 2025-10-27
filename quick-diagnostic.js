// Quick diagnostic script for order cancellation issues
const API_BASE = 'http://localhost:4000/api';

async function quickDiagnostic() {
  console.log('🔍 Quick Diagnostic for Order Cancellation Issues');
  console.log('='.repeat(60));

  // Test 1: Check if server is running
  console.log('\n1️⃣ Testing server connectivity...');
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (response.ok) {
      console.log('✅ Server is running');
    } else {
      console.log(`⚠️ Server responded with status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Server is not accessible');
    console.log('💡 Make sure your backend server is running on port 4000');
    console.log('   Run: cd backend && npm start');
    return;
  }

  // Test 2: Check authentication
  console.log('\n2️⃣ Testing authentication...');
  const testToken = 'test-token';
  try {
    const response = await fetch(`${API_BASE}/admin/orders`, {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    if (response.status === 401) {
      console.log('✅ Authentication is working (401 Unauthorized expected)');
    } else if (response.status === 403) {
      console.log('✅ Authorization is working (403 Forbidden expected)');
    } else {
      console.log(`⚠️ Unexpected auth response: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Authentication test failed:', error.message);
  }

  // Test 3: Check routes
  console.log('\n3️⃣ Testing route availability...');
  const routes = [
    '/admin/orders',
    '/users/profile'
  ];

  for (const route of routes) {
    try {
      const response = await fetch(`${API_BASE}${route}`);
      if (response.status === 401 || response.status === 403) {
        console.log(`✅ Route ${route} is accessible (auth required)`);
      } else {
        console.log(`⚠️ Route ${route} returned: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Route ${route} failed: ${error.message}`);
    }
  }

  console.log('\n📋 Common Issues and Solutions:');
  console.log('='.repeat(60));
  
  console.log(`
🔧 Backend Issues:
1. Server not running: cd backend && npm start
2. Database connection: Check DATABASE_URL in .env
3. Missing dependencies: npm install
4. Port conflict: Change port in server.js

🔐 Authentication Issues:
1. Invalid token: Check localStorage.getItem('tpestore_token')
2. Expired token: Login again
3. Wrong user role: Check if user has ADMIN role for admin endpoints

📦 Order Issues:
1. Order not found: Check if order ID exists in database
2. Order already cancelled: Check order status
3. Order too old: User can only cancel within 24 hours
4. Wrong order status: Only PENDING/PROCESSING can be cancelled

🚚 GHN API Issues:
1. Invalid GHN credentials: Check GHN_TOKEN and GHN_SHOP_ID
2. Network issues: Check internet connection
3. GHN API down: Check GHN status page
4. Invalid order code: Check if ghnOrderCode exists

🌐 Frontend Issues:
1. CORS errors: Check backend CORS configuration
2. API base URL: Check NEXT_PUBLIC_API_BASE_URL
3. Network errors: Check browser console
4. Component errors: Check React error boundaries
`);

  console.log('\n🔍 Debug Steps:');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Check network tab for failed requests');
  console.log('3. Check backend console for server errors');
  console.log('4. Use the debug-cancel-order.js script for detailed testing');
  console.log('5. Check database for order status and details');
}

// Run diagnostic
quickDiagnostic();
