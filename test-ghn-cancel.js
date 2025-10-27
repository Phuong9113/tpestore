// Test GHN Cancel Order API với credentials chính xác
const GHN_BASE_URL = 'https://dev-online-gateway.ghn.vn';
const GHN_TOKEN = '637170d5-942b-11ea-9821-0281a26fb5d4';
const GHN_SHOP_ID = '885';

async function testGHNCancelAPI() {
  console.log('🧪 Testing GHN Cancel Order API');
  console.log('='.repeat(50));
  
  // Test với order code mẫu từ documentation
  const testOrderCode = '5E3NK3RS';
  
  console.log(`📦 Testing with order code: ${testOrderCode}`);
  console.log(`🔑 Using Token: ${GHN_TOKEN}`);
  console.log(`🏪 Using ShopId: ${GHN_SHOP_ID}`);
  
  try {
    const response = await fetch(`${GHN_BASE_URL}/shiip/public-api/v2/switch-status/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token': GHN_TOKEN,
        'ShopId': GHN_SHOP_ID
      },
      body: JSON.stringify({
        order_codes: [testOrderCode]
      })
    });

    console.log(`\n📡 Response Status: ${response.status}`);
    console.log(`📡 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log(`\n📋 Response Body:`);
    console.log(JSON.stringify(result, null, 2));
    
    // Phân tích response
    if (response.ok) {
      console.log('\n✅ API call successful!');
      
      if (result.data && Array.isArray(result.data)) {
        const orderResult = result.data.find(item => item.order_code === testOrderCode);
        if (orderResult) {
          console.log(`📦 Order ${testOrderCode}:`);
          console.log(`   - Result: ${orderResult.result}`);
          console.log(`   - Message: ${orderResult.message}`);
          
          if (orderResult.result === true) {
            console.log('🎉 Order cancelled successfully on GHN!');
          } else {
            console.log('❌ Order cancellation failed on GHN');
          }
        }
      }
    } else {
      console.log('\n❌ API call failed!');
      console.log(`Error Code: ${result.code}`);
      console.log(`Error Message: ${result.message}`);
      console.log(`Error Code Message: ${result.code_message}`);
    }
    
  } catch (error) {
    console.error('\n💥 Network Error:', error.message);
  }
}

// Test với order code khác (nếu có)
async function testWithCustomOrderCode(orderCode) {
  console.log(`\n🧪 Testing with custom order code: ${orderCode}`);
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${GHN_BASE_URL}/shiip/public-api/v2/switch-status/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token': GHN_TOKEN,
        'ShopId': GHN_SHOP_ID
      },
      body: JSON.stringify({
        order_codes: [orderCode]
      })
    });

    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Usage instructions
console.log(`
🔧 GHN Cancel Order API Test
===========================

This script tests the GHN cancel order API with the correct credentials:

- Base URL: ${GHN_BASE_URL}
- Token: ${GHN_TOKEN}
- Shop ID: ${GHN_SHOP_ID}

The script will test with the sample order code from the documentation: 5E3NK3RS

To test with your own order code, call:
testWithCustomOrderCode('YOUR_ORDER_CODE')

Run the test:
node test-ghn-cancel.js
`);

// Run the test
testGHNCancelAPI();
