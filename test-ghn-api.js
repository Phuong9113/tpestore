// Test script for GHN API
// Run with: node test-ghn-api.js

const axios = require('axios');

// Cấu hình test
const config = {
  baseURL: 'https://dev-online-gateway.ghn.vn',
  token: 'YOUR_GHN_TOKEN', // Thay bằng token thực
  shopId: 'YOUR_SHOP_ID', // Thay bằng shop ID thực
  timeout: 10000
};

// Headers cho GHN API
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Token': config.token,
  'ShopId': config.shopId
});

// Test 1: Lấy danh sách tỉnh/thành phố
async function testGetProvinces() {
  try {
    console.log('🔍 Testing: Get Provinces...');
    const response = await axios.get(`${config.baseURL}/shiip/public-api/master-data/province`, {
      headers: getHeaders(),
      timeout: config.timeout
    });
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Test 2: Tạo đơn hàng test
async function testCreateOrder() {
  try {
    console.log('🔍 Testing: Create Order...');
    
    const payload = {
      to_name: "Nguyễn Văn Test",
      to_phone: "0912345678",
      to_address: "456 Nguyễn Huệ, Quận 1",
      to_ward_code: "WardCode123",
      to_district_id: 1442,
      to_province_id: 202,
      return_name: "TPE Store",
      return_phone: "0123456789",
      return_address: "123 Đường ABC, Quận 1",
      return_ward_code: "ReturnWardCode",
      return_district_id: 1442,
      return_province_id: 202,
      cod_amount: 15000000,
      content: "Đơn hàng test từ TPE Store",
      weight: 200,
      length: 20,
      width: 20,
      height: 20,
      service_type_id: 2,
      service_id: 0,
      payment_type_id: 1,
      required_note: "CHOTHUHANG",
      items: [{
        name: "Laptop Dell Test",
        quantity: 1,
        weight: 200,
        price: 15000000
      }]
    };

    const response = await axios.post(`${config.baseURL}/shiip/public-api/v2/shipping-order/create`, payload, {
      headers: getHeaders(),
      timeout: config.timeout
    });
    
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Test 3: Theo dõi đơn hàng
async function testTrackOrder(orderCode) {
  try {
    console.log(`🔍 Testing: Track Order ${orderCode}...`);
    const response = await axios.get(`${config.baseURL}/shiip/public-api/v2/shipping-order/detail`, {
      headers: getHeaders(),
      params: { order_code: orderCode },
      timeout: config.timeout
    });
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Test 4: Tính phí vận chuyển
async function testCalculateFee() {
  try {
    console.log('🔍 Testing: Calculate Shipping Fee...');
    
    const payload = {
      from_district_id: 1442,
      to_district_id: 1442,
      to_ward_code: "WardCode123",
      service_type_id: 2,
      weight: 200,
      length: 20,
      width: 20,
      height: 20,
      cod_amount: 15000000,
      insurance_value: 0
    };

    const response = await axios.post(`${config.baseURL}/shiip/public-api/v2/shipping-order/fee`, payload, {
      headers: getHeaders(),
      timeout: config.timeout
    });
    
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Chạy tất cả tests
async function runAllTests() {
  console.log('🚀 Starting GHN API Tests...\n');
  
  try {
    // Test 1: Get Provinces
    await testGetProvinces();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Calculate Fee
    await testCalculateFee();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Create Order
    const orderResult = await testCreateOrder();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 4: Track Order (nếu có order code)
    if (orderResult && orderResult.data && orderResult.data.order_code) {
      await testTrackOrder(orderResult.data.order_code);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Kiểm tra cấu hình trước khi chạy
if (config.token === 'YOUR_GHN_TOKEN' || config.shopId === 'YOUR_SHOP_ID') {
  console.error('❌ Please update the token and shop ID in the config section');
  console.log('📝 Edit this file and replace:');
  console.log('   - YOUR_GHN_TOKEN with your actual GHN token');
  console.log('   - YOUR_SHOP_ID with your actual shop ID');
  process.exit(1);
}

// Chạy tests
runAllTests();
