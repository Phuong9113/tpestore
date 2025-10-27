// Test script để kiểm tra việc hiển thị order code
const testOrderCodeDisplay = () => {
  console.log('=== TEST ORDER CODE DISPLAY ===');
  
  // Test data mẫu
  const testOrder = {
    id: 'cm1234567890abcdef',
    ghnOrderCode: 'Z82T1',
    totalPrice: 500000,
    status: 'SHIPPING',
    createdAt: '2024-01-15T10:30:00Z',
    user: {
      name: 'Nguyễn Văn A',
      email: 'test@example.com'
    }
  };
  
  console.log('Test Order Data:', testOrder);
  
  // Test logic hiển thị
  const displayCode = testOrder.ghnOrderCode || testOrder.id;
  console.log('Display Code:', displayCode);
  
  // Test với order không có GHN code
  const testOrderNoGHN = {
    id: 'cm1234567890abcdef',
    ghnOrderCode: null,
    totalPrice: 300000,
    status: 'PENDING'
  };
  
  const displayCodeNoGHN = testOrderNoGHN.ghnOrderCode || testOrderNoGHN.id;
  console.log('Display Code (No GHN):', displayCodeNoGHN);
  
  console.log('=== TEST COMPLETED ===');
};

// Chạy test
testOrderCodeDisplay();
