export default {
	baseURL: process.env.GHN_BASE_URL || "https://dev-online-gateway.ghn.vn",
	token: process.env.GHN_TOKEN,
	shopId: process.env.GHN_SHOP_ID,
	// Địa chỉ shop (nơi gửi hàng) - chỉ sử dụng code, không dùng address text
	shopAddress: {
		wardCode: process.env.GHN_SHOP_WARD_CODE,
		districtId: process.env.GHN_SHOP_DISTRICT_ID ? parseInt(process.env.GHN_SHOP_DISTRICT_ID) : null,
		provinceId: process.env.GHN_SHOP_PROVINCE_ID ? parseInt(process.env.GHN_SHOP_PROVINCE_ID) : null,
	},
	returnAddress: {
		name: process.env.GHN_RETURN_NAME || "TPE Store",
		phone: process.env.GHN_RETURN_PHONE || "0123456789",
		wardCode: process.env.GHN_RETURN_WARD_CODE,
		districtId: process.env.GHN_RETURN_DISTRICT_ID,
		provinceId: process.env.GHN_RETURN_PROVINCE_ID,
	},
	defaultShipping: {
		serviceTypeId: 2,
		weight: 200,
		length: 20,
		width: 20,
		height: 20,
		paymentTypeId: 1,
		requiredNote: "CHOTHUHANG",
		configFeeId: parseInt(process.env.GHN_CONFIG_FEE_ID) || 0,
		extraCostId: parseInt(process.env.GHN_EXTRA_COST_ID) || 0,
	},
	serviceTypes: {
		2: "Hàng nhẹ (Light goods)",
		5: "Hàng nặng (Heavy goods)",
	},
	paymentTypes: {
		1: "Người gửi trả phí",
		2: "Người nhận trả phí",
	},
};
