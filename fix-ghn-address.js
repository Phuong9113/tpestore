/**
 * Fix GHN Address Script
 * 
 * Script này để sửa địa chỉ shipping cho đơn hàng ZaloPay
 */

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

// Đơn hàng cần sửa
const ORDER_ID = 'cmhaxnhd20009sqin1yc1tbqg';

console.log('🔧 Fixing GHN Address for Order:', ORDER_ID);

async function fixGHNAddress() {
  try {
    console.log('\n1️⃣ Finding order...');
    
    const order = await prisma.order.findUnique({
      where: { id: ORDER_ID }
    });
    
    if (!order) {
      console.log('❌ Order not found');
      return;
    }
    
    console.log('Current address:', {
      ward: order.shippingWard,
      district: order.shippingDistrict,
      province: order.shippingProvince
    });
    
    console.log('\n2️⃣ Updating address with correct GHN codes...');
    
    // Cập nhật với mã GHN đúng cho Quận 1, TP.HCM
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        shippingWard: '1A0101', // Mã phường Bến Nghé, Quận 1
        shippingDistrict: '1442', // Mã Quận 1
        shippingProvince: '202' // Mã TP.HCM
      }
    });
    
    console.log('✅ Address updated:', {
      ward: updatedOrder.shippingWard,
      district: updatedOrder.shippingDistrict,
      province: updatedOrder.shippingProvince
    });
    
    console.log('\n3️⃣ Now you can run the GHN creation script again');
    
  } catch (error) {
    console.error('❌ Error fixing address:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixGHNAddress();
