// Test PayPal Integration
// Run with: node test-paypal-integration.js

import { paypalClient, PAYPAL_CURRENCY } from './backend/services/paypalClient.js';

async function testPayPalConnection() {
  console.log('Testing PayPal connection...');
  console.log('Currency:', PAYPAL_CURRENCY);
  
  try {
    // Test creating a simple order
    const orderRequest = {
      intent: 'CAPTURE',
      purchaseUnits: [
        {
          amount: {
            currencyCode: PAYPAL_CURRENCY,
            value: '10.00'
          },
          description: 'Test order from TPE Store'
        }
      ]
    };

    console.log('Creating test order...');
    const response = await paypalClient.orders.create(orderRequest);
    console.log('✅ PayPal connection successful!');
    console.log('Order ID:', response.result.id);
    console.log('Status:', response.result.status);
    
    // Don't capture the order in test - just verify creation works
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ PayPal connection failed:');
    console.error(error.message);
    
    if (error.message.includes('CLIENT_ID')) {
      console.log('\n💡 Make sure to set PAYPAL_CLIENT_ID in your .env file');
    }
    if (error.message.includes('CLIENT_SECRET')) {
      console.log('\n💡 Make sure to set PAYPAL_CLIENT_SECRET in your .env file');
    }
  }
}

// Run test
testPayPalConnection();
