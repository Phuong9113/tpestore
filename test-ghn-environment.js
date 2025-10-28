import axios from 'axios';
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000';

async function testGHNEnvironment() {
  console.log('🧪 Testing GHN Environment and Order Status...\n');

  try {
    // Get the most recent order with GHN code
    const order = await prisma.order.findFirst({
      where: { 
        ghnOrderCode: { not: null }
      },
      select: { 
        id: true, 
        status: true, 
        paymentStatus: true, 
        paymentMethod: true,
        ghnOrderCode: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!order) {
      console.log('❌ No orders with GHN codes found');
      return;
    }

    console.log(`Testing order: ${order.id}`);
    console.log(`GHN Code: ${order.ghnOrderCode}`);
    console.log(`Created: ${new Date(order.createdAt).toLocaleString('vi-VN')}`);

    // Test both sandbox and production environments
    const environments = [
      {
        name: 'Sandbox',
        baseUrl: 'https://dev-online-gateway.ghn.vn',
        token: '637170d5-942b-11ea-9821-0281a26fb5d4',
        shopId: '885'
      },
      {
        name: 'Production',
        baseUrl: 'https://online-gateway.ghn.vn',
        token: '637170d5-942b-11ea-9821-0281a26fb5d4',
        shopId: '885'
      }
    ];

    for (const env of environments) {
      console.log(`\n🔍 Testing ${env.name} Environment:`);
      console.log(`   Base URL: ${env.baseUrl}`);
      
      try {
        // Test GHN order detail API
        const payload = {
          order_code: order.ghnOrderCode
        };

        const response = await axios.post(`${env.baseUrl}/shiip/public-api/v2/shipping-order/detail`, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Token': env.token,
            'ShopId': env.shopId
          },
          timeout: 10000
        });

        console.log(`   ✅ Order found in ${env.name}!`);
        console.log(`   Status: ${response.data.data.status}`);
        console.log(`   Status Text: ${response.data.data.status_text || 'N/A'}`);
        console.log(`   Created Time: ${response.data.data.created_time || 'N/A'}`);
        console.log(`   Updated Time: ${response.data.data.updated_time || 'N/A'}`);

        // Map status to Vietnamese
        const statusMap = {
          'ready_to_pick': 'Sẵn sàng lấy hàng',
          'picking': 'Đang lấy hàng',
          'picked': 'Đã lấy hàng',
          'storing': 'Đang lưu kho',
          'transporting': 'Đang vận chuyển',
          'sorting': 'Đang phân loại',
          'delivering': 'Đang giao hàng',
          'delivered': 'Đã giao hàng',
          'delivery_failed': 'Giao hàng thất bại',
          'waiting_to_return': 'Chờ trả hàng',
          'return': 'Đang trả hàng',
          'returned': 'Đã trả hàng',
          'exception': 'Ngoại lệ',
          'damage': 'Hàng hóa bị hỏng',
          'lost': 'Hàng hóa bị mất',
          'cancel': 'Hủy đơn hàng'
        };

        const vietnameseStatus = statusMap[response.data.data.status] || response.data.data.status;
        console.log(`   Vietnamese Status: ${vietnameseStatus}`);

        // If found in production, suggest updating environment
        if (env.name === 'Production') {
          console.log(`\n🎯 Recommendation:`);
          console.log(`   Update GHN_BASE_URL to: ${env.baseUrl}`);
          console.log(`   Orders are being created in production environment`);
        }

      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`   ❌ Order not found in ${env.name}`);
        } else {
          console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
        }
      }
    }

    console.log('\n📋 Summary:');
    console.log('1. If order found in Production but not Sandbox:');
    console.log('   → Update GHN_BASE_URL to production URL');
    console.log('2. If order not found in both:');
    console.log('   → Check if GHN order was actually created');
    console.log('   → Verify GHN credentials');
    console.log('3. If order shows "ready_to_pick":');
    console.log('   → This is normal for newly created orders');
    console.log('   → Status will update as courier picks up and delivers');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testGHNEnvironment();
