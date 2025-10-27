// Script để test GHN cancel với order code thực tế
const GHN_BASE_URL = 'https://dev-online-gateway.ghn.vn';
const GHN_TOKEN = '2bf42843-af1e-11f0-b040-4e257d8388b4';
const GHN_SHOP_ID = '197687';

async function testWithRealOrderCode(orderCode) {
  console.log(`🧪 Testing GHN Cancel với order code thực tế: ${orderCode}`);
  console.log('='.repeat(60));
  
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
    console.log(`📡 Status: ${response.status}`);
    console.log('📋 Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Success!');
      if (result.data && Array.isArray(result.data)) {
        const orderResult = result.data.find(item => item.order_code === orderCode);
        if (orderResult) {
          console.log(`📦 Order ${orderCode}:`);
          console.log(`   - Result: ${orderResult.result}`);
          console.log(`   - Message: ${orderResult.message}`);
        }
      }
    } else {
      console.log('❌ Failed!');
      console.log(`Error: ${result.message}`);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Usage
console.log(`
🔧 GHN Cancel Test với Order Code thực tế
==========================================

Credentials:
- Token: ${GHN_TOKEN}
- Shop ID: ${GHN_SHOP_ID}

Usage:
testWithRealOrderCode('YOUR_REAL_ORDER_CODE')

Ví dụ:
testWithRealOrderCode('ABC123XYZ')
`);

// Export function để có thể gọi từ console
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testWithRealOrderCode };
}
