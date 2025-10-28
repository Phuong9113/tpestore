import axios from 'axios';
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000';

async function debugZaloPayVerification() {
  console.log('🔍 Debugging ZaloPay verification issue...\n');

  try {
    // Get the most recent ZaloPay order
    const order = await prisma.order.findFirst({
      where: { 
        paymentMethod: 'ZALOPAY',
        paymentStatus: 'PAID'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!order) {
      console.log('❌ No PAID ZaloPay orders found');
      return;
    }

    console.log(`Found order: ${order.id}`);
    console.log(`Transaction ID: ${order.transactionId}`);
    console.log(`Payment Status: ${order.paymentStatus}`);

    // Test verification with the transaction ID
    console.log('\n1️⃣ Testing verification endpoint...');
    try {
      const verifyResponse = await axios.post(`${BASE_URL}/api/payment/zalopay/verify`, {
        zp_trans_token: order.transactionId,
        orderId: order.id
      });

      console.log('✅ Verification Response:');
      console.log(JSON.stringify(verifyResponse.data, null, 2));
    } catch (verifyError) {
      console.log('❌ Verification Error:');
      console.log(verifyError.response?.data || verifyError.message);
    }

    // Test ZaloPay API directly
    console.log('\n2️⃣ Testing ZaloPay API directly...');
    try {
      const zalopayData = {
        app_id: 2554,
        zp_trans_token: order.transactionId
      };

      // Create MAC signature
      const crypto = await import('crypto');
      const mac = crypto.createHmac('sha256', 'trMrHtvjo6myautxDUiAcYsVtaeQ8nhf')
        .update(`${zalopayData.app_id}|${zalopayData.zp_trans_token}`)
        .digest('hex');
      
      zalopayData.mac = mac;

      console.log('ZaloPay API request data:', zalopayData);

      const formData = new URLSearchParams();
      Object.keys(zalopayData).forEach(key => {
        formData.append(key, zalopayData[key]);
      });

      const response = await axios.post('https://sb-openapi.zalopay.vn/v2/query', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('✅ ZaloPay API Response:');
      console.log(JSON.stringify(response.data, null, 2));

    } catch (apiError) {
      console.log('❌ ZaloPay API Error:');
      console.log(apiError.response?.data || apiError.message);
    }

    // Test with different token formats
    console.log('\n3️⃣ Testing different token formats...');
    const testTokens = [
      order.transactionId,
      order.transactionId.replace(/-/g, ''),
      order.transactionId.toUpperCase(),
      order.transactionId.toLowerCase()
    ];

    for (const token of testTokens) {
      try {
        console.log(`Testing token: ${token}`);
        
        const zalopayData = {
          app_id: 2554,
          zp_trans_token: token
        };

        const crypto = await import('crypto');
        const mac = crypto.createHmac('sha256', 'trMrHtvjo6myautxDUiAcYsVtaeQ8nhf')
          .update(`${zalopayData.app_id}|${zalopayData.zp_trans_token}`)
          .digest('hex');
        
        zalopayData.mac = mac;

        const formData = new URLSearchParams();
        Object.keys(zalopayData).forEach(key => {
          formData.append(key, zalopayData[key]);
        });

        const response = await axios.post('https://sb-openapi.zalopay.vn/v2/query', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        console.log(`✅ Token ${token} - Response:`, response.data.return_message);
        
        if (response.data.return_code === 1) {
          console.log(`🎉 SUCCESS with token: ${token}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Token ${token} failed:`, error.response?.data?.return_message || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugZaloPayVerification();
