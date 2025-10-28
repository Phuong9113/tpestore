import axios from 'axios';
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000';

async function createGHNOrdersForZaloPay() {
  console.log('🚚 Creating GHN orders for all PAID ZaloPay orders...\n');

  try {
    // Find all PAID ZaloPay orders without GHN order code
    const orders = await prisma.order.findMany({
      where: { 
        paymentMethod: 'ZALOPAY',
        paymentStatus: 'PAID',
        ghnOrderCode: null
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true }
            }
          }
        }
      }
    });

    console.log(`Found ${orders.length} PAID ZaloPay orders without GHN order code\n`);

    for (const order of orders) {
      console.log(`Processing order: ${order.id}`);
      
      // Create GHN shipping order
      const shippingData = {
        orderId: order.id,
        toName: order.shippingName,
        toPhone: order.shippingPhone,
        toAddress: order.shippingAddress,
        toWardCode: '20101', // Use correct ward code
        toDistrictId: 1442, // Use correct district ID
        toProvinceId: 202, // Use correct province ID
        codAmount: 0, // No COD for ZaloPay orders
        content: `Đơn hàng từ TPE Store - ${order.orderItems.length} sản phẩm`,
        weight: 200,
        length: 20,
        width: 20,
        height: 20,
        items: order.orderItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          weight: 200,
          price: item.price
        }))
      };

      try {
        console.log(`Creating GHN order for ${order.id}...`);
        const ghnResponse = await axios.post(`${BASE_URL}/api/shipping/create-order`, shippingData, {
          headers: { 
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaDIxM2tncTAwMDdzcXhwY2Y3cnhmeW4iLCJlbWFpbCI6Im52YUBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjE2NzkwOTIsImV4cCI6MTc2MjI4Mzg5Mn0.FsX0Xu3tC-HWwipKMT9p8dPo3ub7X3bss9ymnL6OUig` 
          }
        });

        if (ghnResponse.data.data?.order_code) {
          // Update order with GHN order code
          await prisma.order.update({
            where: { id: order.id },
            data: { 
              ghnOrderCode: ghnResponse.data.data.order_code,
              status: 'SHIPPING'
            }
          });
          
          console.log(`✅ GHN order created for ${order.id}: ${ghnResponse.data.data.order_code}`);
        } else {
          console.log(`❌ GHN order creation failed for ${order.id}: No order_code in response`);
        }

      } catch (ghnError) {
        console.log(`❌ GHN order creation failed for ${order.id}:`, ghnError.response?.data || ghnError.message);
      }
      
      console.log(''); // Empty line for readability
    }

    // Final check
    console.log('🔍 Final status check:');
    const finalOrders = await prisma.order.findMany({
      where: { 
        paymentMethod: 'ZALOPAY',
        paymentStatus: 'PAID'
      },
      select: { id: true, ghnOrderCode: true, status: true }
    });

    finalOrders.forEach(order => {
      console.log(`Order ${order.id}: GHN Code = ${order.ghnOrderCode || 'Not created'}, Status = ${order.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createGHNOrdersForZaloPay();
