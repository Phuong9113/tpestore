// Test tính năng hủy đơn hàng với GHN order code
import { PrismaClient } from './src/generated/prisma/index.js';
import ghnService from './backend/services/ghnService.js';

const prisma = new PrismaClient();

async function testCancelOrder() {
  console.log('🧪 Testing Cancel Order Feature');
  console.log('='.repeat(50));
  
  try {
    // Lấy đơn hàng có GHN order code
    const order = await prisma.order.findFirst({
      where: {
        ghnOrderCode: {
          not: null
        },
        status: {
          in: ['PENDING', 'PROCESSING']
        }
      },
      select: {
        id: true,
        ghnOrderCode: true,
        status: true,
        totalPrice: true,
        createdAt: true
      }
    });
    
    if (!order) {
      console.log('❌ Không tìm thấy đơn hàng có GHN order code để test');
      return;
    }
    
    console.log('📦 Order found:');
    console.log('   - ID:', order.id);
    console.log('   - GHN Code:', order.ghnOrderCode);
    console.log('   - Status:', order.status);
    console.log('   - Total:', order.totalPrice);
    
    // Test hủy đơn hàng trên GHN
    console.log('\n🚚 Testing GHN cancellation...');
    try {
      const ghnResult = await ghnService.cancelOrder(order.ghnOrderCode);
      console.log('✅ GHN Result:', ghnResult);
      
      if (ghnResult.success) {
        // Cập nhật trạng thái đơn hàng trong database
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: { 
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });
        
        console.log('✅ Order updated in database:', updatedOrder.status);
        console.log('🎉 Cancel order feature working perfectly!');
      } else {
        console.log('❌ GHN cancellation failed:', ghnResult.message);
      }
      
    } catch (ghnError) {
      console.error('❌ GHN Error:', ghnError.message);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCancelOrder();
