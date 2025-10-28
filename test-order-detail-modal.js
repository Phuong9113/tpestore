import axios from 'axios';
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000';

async function testOrderDetailModal() {
  console.log('🧪 Testing Order Detail Modal Status Mapping...\n');

  try {
    // Get a recent order from database
    const order = await prisma.order.findFirst({
      where: { status: { in: ['PROCESSING', 'SHIPPING'] } },
      orderBy: { createdAt: 'desc' }
    });

    if (!order) {
      console.log('❌ No orders found');
      return;
    }

    console.log(`Testing order: ${order.id}`);
    console.log(`Database status: ${order.status}`);
    console.log(`Payment status: ${order.paymentStatus}`);
    console.log(`Payment method: ${order.paymentMethod}`);

    // Test the API endpoint that modal uses
    console.log('\n1️⃣ Testing API endpoint /orders/:id...');
    try {
      const response = await axios.get(`${BASE_URL}/api/orders/${order.id}`, {
        headers: { 
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaDIxM2tncTAwMDdzcXhwY2Y3cnhmeW4iLCJlbWFpbCI6Im52YUBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjE2NzkwOTIsImV4cCI6MTc2MjI4Mzg5Mn0.FsX0Xu3tC-HWwipKMT9p8dPo3ub7X3bss9ymnL6OUig` 
        }
      });

      console.log('✅ API Response received');
      console.log(`   Order ID: ${response.data.id}`);
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Payment Status: ${response.data.paymentStatus}`);
      console.log(`   Payment Method: ${response.data.paymentMethod}`);

      // Test the mapping logic used in modal
      console.log('\n2️⃣ Testing Modal Status Mapping:');
      const mappedStatus = response.data.status === 'PENDING' ? 'Đang xử lý' : 
                          response.data.status === 'PROCESSING' ? 'Đang xử lý' :
                          response.data.status === 'PAID' ? 'Đã thanh toán' :
                          response.data.status === 'SHIPPING' ? 'Đang giao' :
                          response.data.status === 'SHIPPED' ? 'Đang giao' :
                          response.data.status === 'COMPLETED' ? 'Đã giao' :
                          response.data.status === 'CANCELLED' ? 'Đã hủy' : 'Đang xử lý';

      console.log(`   ${response.data.status} → ${mappedStatus}`);

      // Test getStatusColor function
      console.log('\n3️⃣ Testing getStatusColor Function:');
      const getStatusColor = (status) => {
        switch (status) {
          case "Đã giao":
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          case "Đang giao":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          case "Đang xử lý":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          case "Đã thanh toán":
            return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
          case "Đã hủy":
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
        }
      };

      const colorClass = getStatusColor(mappedStatus);
      console.log(`   Status: ${mappedStatus}`);
      console.log(`   Color Class: ${colorClass}`);

      console.log('\n🎯 Summary:');
      console.log(`✅ Database Status: ${order.status}`);
      console.log(`✅ API Status: ${response.data.status}`);
      console.log(`✅ Mapped Status: ${mappedStatus}`);
      console.log(`✅ Color Class: ${colorClass}`);

      console.log('\n📋 Expected Result:');
      if (order.status === 'PROCESSING') {
        console.log('   Modal should show: "Đang xử lý" with yellow color');
      } else if (order.status === 'SHIPPING') {
        console.log('   Modal should show: "Đang giao" with blue color');
      }

    } catch (apiError) {
      console.log('❌ API Error:', apiError.response?.data || apiError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOrderDetailModal();
