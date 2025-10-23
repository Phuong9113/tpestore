export default {
  // GHN API Configuration
  baseURL: process.env.GHN_BASE_URL || 'https://dev-online-gateway.ghn.vn',
  token: process.env.GHN_TOKEN,
  shopId: process.env.GHN_SHOP_ID,
  
  // Return address configuration
  returnAddress: {
    name: process.env.GHN_RETURN_NAME || 'TPE Store',
    phone: process.env.GHN_RETURN_PHONE || '0123456789',
    address: process.env.GHN_RETURN_ADDRESS || '123 Đường ABC, Quận 1',
    wardCode: process.env.GHN_RETURN_WARD_CODE,
    districtId: process.env.GHN_RETURN_DISTRICT_ID,
    provinceId: process.env.GHN_RETURN_PROVINCE_ID
  },

  // Default shipping configuration
  defaultShipping: {
    serviceTypeId: 2, // Standard service
    weight: 200, // grams
    length: 20, // cm
    width: 20, // cm
    height: 20, // cm
    paymentTypeId: 1, // Sender pays
    requiredNote: 'CHOTHUHANG', // Cho thu hộ hàng
    configFeeId: parseInt(process.env.GHN_CONFIG_FEE_ID) || 0, // Config fee ID for service type 1
    extraCostId: parseInt(process.env.GHN_EXTRA_COST_ID) || 0 // Extra cost ID for service type 1
  },

  // Service type mapping
  serviceTypes: {
    2: 'Hàng nhẹ (Light goods)',
    5: 'Hàng nặng (Heavy goods)'
  },

  // Payment type mapping
  paymentTypes: {
    1: 'Người gửi trả phí',
    2: 'Người nhận trả phí'
  }
};
