import axios from 'axios';
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkZaloPayOrders() {
  console.log('🔍 Checking all ZaloPay orders...\n');

  try {
    // Find all ZaloPay orders
    const zalopayOrders = await prisma.order.findMany({
      where: { paymentMethod: 'ZALOPAY' },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Get last 10 orders
    });

    console.log(`Found ${zalopayOrders.length} ZaloPay orders:\n`);

    zalopayOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order.id}`);
      console.log(`   Payment Status: ${order.paymentStatus}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Transaction ID: ${order.transactionId}`);
      console.log(`   GHN Order Code: ${order.ghnOrderCode || 'Not created'}`);
      console.log(`   Total Price: ${order.totalPrice}`);
      console.log(`   Created: ${order.createdAt}`);
      
      if (order.paymentStatus === 'PENDING' && !order.ghnOrderCode) {
        console.log('   ⚠️ ISSUE: Payment still pending, no GHN order created');
      } else if (order.paymentStatus === 'PAID' && !order.ghnOrderCode) {
        console.log('   ❌ ISSUE: Payment completed but no GHN order created');
      } else if (order.paymentStatus === 'PAID' && order.ghnOrderCode) {
        console.log('   ✅ SUCCESS: Payment completed and GHN order created');
      }
      console.log('');
    });

    // Check for problematic orders
    const problematicOrders = zalopayOrders.filter(order => 
      order.paymentStatus === 'PAID' && !order.ghnOrderCode
    );

    if (problematicOrders.length > 0) {
      console.log(`🚨 Found ${problematicOrders.length} problematic ZaloPay orders:\n`);
      
      for (const order of problematicOrders) {
        console.log(`Order ID: ${order.id}`);
        console.log(`Payment Status: ${order.paymentStatus}`);
        console.log(`Status: ${order.status}`);
        console.log(`Transaction ID: ${order.transactionId}`);
        console.log(`GHN Order Code: ${order.ghnOrderCode || 'Not created'}`);
        console.log(`Shipping Info: ${order.shippingName}, ${order.shippingPhone}`);
        console.log(`Address: ${order.shippingAddress}, Ward: ${order.shippingWard}, District: ${order.shippingDistrict}, Province: ${order.shippingProvince}`);
        console.log('');
      }
    } else {
      console.log('✅ No problematic ZaloPay orders found!');
    }

  } catch (error) {
    console.error('❌ Error checking ZaloPay orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkZaloPayOrders();
