import axios from 'axios';
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000';

async function testGHNOrderStatus() {
  console.log('🧪 Testing GHN Order Status...\n');

  try {
    // Get recent orders with GHN codes
    const orders = await prisma.order.findMany({
      where: { 
        ghnOrderCode: { not: null },
        status: { in: ['PROCESSING', 'SHIPPING'] }
      },
      select: { 
        id: true, 
        status: true, 
        paymentStatus: true, 
        paymentMethod: true,
        ghnOrderCode: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    if (orders.length === 0) {
      console.log('❌ No orders with GHN codes found');
      return;
    }

    console.log('1️⃣ Database Orders with GHN Codes:');
    orders.forEach(order => {
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Payment Method: ${order.paymentMethod}`);
      console.log(`   GHN Code: ${order.ghnOrderCode}`);
      console.log('');
    });

    // Test GHN API for each order
    console.log('2️⃣ Testing GHN API Status:');
    for (const order of orders) {
      if (order.ghnOrderCode) {
        try {
          console.log(`\nTesting GHN order: ${order.ghnOrderCode}`);
          
          const response = await axios.get(`${BASE_URL}/api/admin/orders/ghn/${order.ghnOrderCode}`, {
            headers: { 
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaDIxM2tncTAwMDdzcXhwY2Y3cnhmeW4iLCJlbWFpbCI6Im52YUBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjE2NzkwOTIsImV4cCI6MTc2MjI4Mzg5Mn0.FsX0Xu3tC-HWwipKMT9p8dPo3ub7X3bss9ymnL6OUig` 
            }
          });

          const ghnData = response.data.data;
          console.log(`   GHN Status: ${ghnData.status}`);
          console.log(`   GHN Status Text: ${ghnData.status_text || 'N/A'}`);
          console.log(`   Created Time: ${ghnData.created_time || 'N/A'}`);
          console.log(`   Updated Time: ${ghnData.updated_time || 'N/A'}`);

          // Map GHN status to Vietnamese
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

          const vietnameseStatus = statusMap[ghnData.status] || ghnData.status;
          console.log(`   Vietnamese Status: ${vietnameseStatus}`);

        } catch (apiError) {
          console.log(`   ❌ API Error: ${apiError.response?.data?.error || apiError.message}`);
        }
      }
    }

    console.log('\n🎯 Analysis:');
    console.log('If all orders show "ready_to_pick" (Sẵn sàng lấy hàng), this means:');
    console.log('1. GHN orders were created but not yet picked up by courier');
    console.log('2. This is normal for newly created orders');
    console.log('3. Status will change to "picking" → "picked" → "delivering" → "delivered"');
    console.log('\n📋 Expected GHN Status Flow:');
    console.log('   ready_to_pick → picking → picked → transporting → delivering → delivered');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testGHNOrderStatus();
