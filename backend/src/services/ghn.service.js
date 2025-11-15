// Use Node's built-in fetch (Node >=18)

async function httpRequest(url, options = {}, timeoutMs = 10000) {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, { ...options, signal: controller.signal });
		const contentType = res.headers.get("content-type") || "";
		const isJson = contentType.includes("application/json");
		const data = isJson ? await res.json() : await res.text();
		if (!res.ok) {
			const message = typeof data === "string" ? data : JSON.stringify(data);
			// eslint-disable-next-line no-console
			console.error(`HTTP ${res.status} Error:`, message);
			throw new Error(`HTTP ${res.status}: ${message}`);
		}
		return data;
	} finally {
		clearTimeout(id);
	}
}

class GHNService {
	constructor() {
		this.baseURL = process.env.GHN_BASE_URL || "https://dev-online-gateway.ghn.vn";
		this.token = process.env.GHN_TOKEN || "637170d5-942b-11ea-9821-0281a26fb5d4";
		this.shopId = process.env.GHN_SHOP_ID || "197687";
		this.timeout = 10000;
		this.fallbackFee = 50000;
		// Địa chỉ shop (nơi gửi hàng) - sẽ lấy từ API
		this.shopWardCode = null;
		this.shopDistrictId = null;
		this.shopProvinceId = null;
		this.shopAddress = null; // Địa chỉ đầy đủ từ API (không dùng trong payload)
		this.shopName = null; // Tên shop từ API
		this.shopPhone = null; // Số điện thoại shop từ API
		this.shopAddressInitialized = false;
		this.shopAddressInitializing = null; // Promise để tránh gọi API nhiều lần đồng thời
	}

	getHeaders() {
		return {
			"Content-Type": "application/json",
			Token: this.token,
			ShopId: this.shopId,
		};
	}

	async getShops(offset = 0, limit = 50, clientPhone = "") {
		try {
			const payload = {
				offset: offset,
				limit: limit,
				client_phone: clientPhone,
			};
			return await httpRequest(
				`${this.baseURL}/shiip/public-api/v2/shop/all`,
				{ method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload) },
				this.timeout
			);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Error fetching shops:", error.message);
			throw new Error("Không thể lấy danh sách cửa hàng");
		}
	}

	async initializeShopAddress() {
		// Nếu đã khởi tạo, không cần gọi lại
		if (this.shopAddressInitialized) {
			return;
		}

		// Nếu đang khởi tạo, đợi promise hiện tại
		if (this.shopAddressInitializing) {
			await this.shopAddressInitializing;
			return;
		}

		// Bắt đầu khởi tạo
		this.shopAddressInitializing = (async () => {
			try {
				const result = await this.getShops(0, 50, "");
				if (result && result.code === 200 && result.data && result.data.shops && result.data.shops.length > 0) {
					// Lấy shop đầu tiên (hoặc có thể filter theo shopId nếu cần)
					const shop = result.data.shops.find((s) => String(s._id) === String(this.shopId)) || result.data.shops[0];
					
					if (shop && shop.ward_code && shop.district_id) {
						this.shopWardCode = shop.ward_code;
						this.shopDistrictId = parseInt(shop.district_id);
						// province_id có thể không có trong response
						this.shopProvinceId = shop.province_id ? parseInt(shop.province_id) : null;
						// Lưu địa chỉ đầy đủ nếu có (không dùng trong payload)
						this.shopAddress = shop.address || null;
						// Lưu tên và số điện thoại shop để truyền vào payload
						this.shopName = shop.name || null;
						this.shopPhone = shop.phone || null;
						this.shopAddressInitialized = true;
						// eslint-disable-next-line no-console
						console.log("[GHN] Shop address initialized from API - District:", this.shopDistrictId, "Ward:", this.shopWardCode, "Province:", this.shopProvinceId, "Name:", this.shopName, "Phone:", this.shopPhone);
					} else {
						throw new Error("Shop address không hợp lệ từ API response");
					}
				} else {
					throw new Error("Không tìm thấy cửa hàng trong response");
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error("[GHN] Error initializing shop address from API:", error.message);
				throw new Error("Không thể lấy địa chỉ cửa hàng từ API: " + error.message);
			} finally {
				this.shopAddressInitializing = null;
			}
		})();

		await this.shopAddressInitializing;
	}

	async getProvinces() {
		try {
			return await httpRequest(
				`${this.baseURL}/shiip/public-api/master-data/province`,
				{ method: "GET", headers: this.getHeaders() },
				this.timeout
			);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Error fetching provinces:", error.message);
			throw new Error("Không thể lấy danh sách tỉnh/thành phố");
		}
	}

	async getDistricts(provinceId) {
		try {
			const url = new URL(`${this.baseURL}/shiip/public-api/master-data/district`);
			url.searchParams.set("province_id", String(provinceId));
			return await httpRequest(
				url.toString(),
				{ method: "GET", headers: this.getHeaders() },
				this.timeout
			);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Error fetching districts:", error.message);
			throw new Error("Không thể lấy danh sách quận/huyện");
		}
	}

	async getWards(districtId) {
		try {
			const url = new URL(`${this.baseURL}/shiip/public-api/master-data/ward`);
			url.searchParams.set("district_id", String(districtId));
			return await httpRequest(
				url.toString(),
				{ method: "GET", headers: this.getHeaders() },
				this.timeout
			);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Error fetching wards:", error.message);
			throw new Error("Không thể lấy danh sách phường/xã");
		}
	}

	async calculateShippingFee(data) {
		try {
			// Khởi tạo shop address nếu chưa có
			if (!data.fromDistrictId) {
				await this.initializeShopAddress();
			}
			
			// Sử dụng fromDistrictId từ data nếu có, nếu không thì dùng shop address
			const fromDistrictId = data.fromDistrictId ? parseInt(data.fromDistrictId) : this.shopDistrictId;
			const fromWardCode = data.fromWardCode || this.shopWardCode;
			
			// Validate shop address nếu dùng
			if (!fromDistrictId && !this.shopDistrictId) {
				throw new Error("Không thể lấy địa chỉ cửa hàng từ API");
			}
			
			const payload = {
				// Chỉ truyền from_district_id và from_ward_code, không truyền from_address để tránh GHN gọi Google API
				...(fromDistrictId || this.shopDistrictId ? { from_district_id: fromDistrictId || this.shopDistrictId } : {}),
				...(fromWardCode ? { from_ward_code: fromWardCode } : {}),
				to_district_id: parseInt(data.toDistrictId),
				to_ward_code: data.toWardCode,
				service_type_id: parseInt(data.serviceTypeId) || 2,
				weight: parseInt(data.weight) || 200,
				length: parseInt(data.length) || 20,
				width: parseInt(data.width) || 20,
				height: parseInt(data.height) || 20,
				cod_amount: parseInt(data.codAmount) || 0,
				insurance_value: parseInt(data.insuranceValue) || 0,
			};
			if (parseInt(data.serviceTypeId) === 5 && data.items && data.items.length > 0) {
				payload.items = data.items.map((item) => ({
					name: item.name,
					quantity: parseInt(item.quantity) || 1,
					weight: parseInt(item.weight) || 30,
					length: parseInt(item.length) || 5,
					width: parseInt(item.width) || 5,
					height: parseInt(item.height) || 3,
					code: item.code || item.name || "PRODUCT",
				}));
			}
			const result = await httpRequest(
				`${this.baseURL}/shiip/public-api/v2/shipping-order/fee`,
				{ method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload) },
				this.timeout
			);
			return result;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Error calculating shipping fee:", error.message);
			return {
				code: 200,
				message: "Success",
				data: { total: this.fallbackFee, service_fee: this.fallbackFee },
			};
		}
	}

	async createShippingOrder(data) {
		// Khởi tạo shop address từ API nếu chưa có
		await this.initializeShopAddress();
		
		// Validate shop address đã được config
		if (!this.shopWardCode || !this.shopDistrictId) {
			throw new Error("Không thể lấy địa chỉ cửa hàng từ API. Vui lòng kiểm tra token và shop ID");
		}
		
		// Loại bỏ các trường địa chỉ dạng text để tránh GHN gọi Google API
		// Chỉ giữ lại ID (district_id, ward_code, province_id) và các trường khác
		const {
			fromAddress,
			from_address,
			fromName,
			from_name,
			fromPhone,
			from_phone,
			fromWardName,
			from_ward_name,
			fromDistrictName,
			from_district_name,
			fromProvinceName,
			from_province_name,
			toAddress,
			to_address, // Loại bỏ địa chỉ dạng text "Vietnam, Phường..., Quận..., Tỉnh..."
			returnAddress,
			return_address, // Loại bỏ địa chỉ trả hàng dạng text
			...cleanData
		} = data;
		
		let serviceId = parseInt(cleanData.serviceId) || 53320;
		try {
			const services = await this.getServices(this.shopDistrictId, parseInt(cleanData.toDistrictId));
			if (services && services.data && services.data.length > 0) {
				serviceId = services.data[0].service_id;
			}
		} catch {}
		try {
			const payload = {
				// CHỈ TRUYỀN ID - KHÔNG TRUYỀN ĐỊA CHỈ DẠNG TEXT
				// Để tránh GHN API gọi Google Geocoding API gây lỗi
				// Chỉ dùng: district_id, ward_code, province_id (ID số)
				// KHÔNG dùng: address (text như "Vietnam, Phường..., Quận..., Tỉnh...")
				
				// Địa chỉ người gửi: chỉ dùng ID, không dùng text
				from_district_id: this.shopDistrictId,
				from_ward_code: this.shopWardCode,
				...(this.shopProvinceId && { from_province_id: this.shopProvinceId }),
				// Truyền from_name và from_phone để GHN không cố lấy từ shop và gọi Google API
				...(this.shopName && { from_name: this.shopName }),
				...(this.shopPhone && { from_phone: this.shopPhone }),
				
				// Địa chỉ người nhận: chỉ dùng ID, không dùng to_address (text)
				to_ward_code: cleanData.toWardCode,
				to_district_id: parseInt(cleanData.toDistrictId),
				weight: parseInt(cleanData.weight) || 200,
				service_type_id: parseInt(cleanData.serviceTypeId) || 2,
				service_id: serviceId,
				items: (cleanData.items || []).map((it) => {
					const item = {
						name: it.name,
						quantity: parseInt(it.quantity) || 1,
						weight: parseInt(it.weight) || 30,
						code: it.code || it.name || "PRODUCT",
					};
					if (parseInt(cleanData.serviceTypeId) === 5) {
						item.length = parseInt(it.length) || 5;
						item.width = parseInt(it.width) || 5;
						item.height = parseInt(it.height) || 3;
					}
					return item;
				}),
				...(cleanData.clientOrderCode && { client_order_code: cleanData.clientOrderCode }),
				...(cleanData.toName && { to_name: cleanData.toName }),
				...(cleanData.toPhone && { to_phone: cleanData.toPhone }),
				// KHÔNG truyền to_address để tránh GHN gọi Google API (chỉ dùng ID: to_ward_code, to_district_id, to_province_id)
				...(cleanData.toProvinceId && { to_province_id: parseInt(cleanData.toProvinceId) }),
				...(cleanData.hamlet && { hamlet: cleanData.hamlet }),
				...(cleanData.returnName && { return_name: cleanData.returnName }),
				...(cleanData.returnPhone && { return_phone: cleanData.returnPhone }),
				// KHÔNG truyền return_address để tránh GHN gọi Google API (chỉ dùng ID: return_ward_code, return_district_id, return_province_id)
				...(cleanData.returnWardCode && { return_ward_code: cleanData.returnWardCode }),
				...(cleanData.returnDistrictId && { return_district_id: parseInt(cleanData.returnDistrictId) }),
				...(cleanData.returnProvinceId && { return_province_id: parseInt(cleanData.returnProvinceId) }),
				...(cleanData.codAmount && { cod_amount: parseInt(cleanData.codAmount) }),
				...(cleanData.length && { length: parseInt(cleanData.length) }),
				...(cleanData.width && { width: parseInt(cleanData.width) }),
				...(cleanData.height && { height: parseInt(cleanData.height) }),
				...(cleanData.insuranceValue && { insurance_value: parseInt(cleanData.insuranceValue) }),
				required_note: cleanData.requiredNote || "CHOTHUHANG",
				payment_type_id: cleanData.paymentTypeId || 1,
			};
			try {
				// Log toàn bộ payload để debug - kiểm tra xem có trường địa chỉ text nào không
				const payloadKeys = Object.keys(payload);
				const addressFields = payloadKeys.filter(key => 
					key.includes('address') || 
					key.includes('Address') ||
					key.includes('ward_name') ||
					key.includes('district_name') ||
					key.includes('province_name')
				);
				if (addressFields.length > 0) {
					// eslint-disable-next-line no-console
					console.warn("[GHN][CreateOrder] WARNING: Found address text fields in payload:", addressFields);
				}
				// eslint-disable-next-line no-console
				console.log("[GHN][CreateOrder] Full payload keys:", payloadKeys);
				// eslint-disable-next-line no-console
				console.log("[GHN][CreateOrder] Payload (no address text):", JSON.stringify(payload, null, 2));
				// eslint-disable-next-line no-console
				console.log("[GHN][CreateOrder] Shop address - District:", this.shopDistrictId, "Ward:", this.shopWardCode, "Province:", this.shopProvinceId);
			} catch {}
			const result = await httpRequest(
				`${this.baseURL}/shiip/public-api/v2/shipping-order/create`,
				{ method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload) },
				this.timeout
			);
			return result;
		} catch (error) {
			throw new Error("Không thể tạo đơn hàng vận chuyển: " + error.message);
		}
	}

	async getOrderDetail(orderCode) {
		try {
			const payload = { order_code: orderCode };
			return await httpRequest(
				`${this.baseURL}/shiip/public-api/v2/shipping-order/detail`,
				{ method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload) },
				this.timeout
			);
		} catch (error) {
			throw new Error("Không thể lấy chi tiết đơn hàng GHN");
		}
	}

	async trackOrder(orderCode) {
		try {
			const url = new URL(`${this.baseURL}/shiip/public-api/v2/shipping-order/detail`);
			url.searchParams.set("order_code", String(orderCode));
			return await httpRequest(url.toString(), { method: "GET", headers: this.getHeaders() }, this.timeout);
		} catch (error) {
			throw new Error("Không thể theo dõi đơn hàng");
		}
	}

	async cancelOrder(orderCode) {
		try {
			const payload = { order_codes: [orderCode] };
			const result = await httpRequest(
				`${this.baseURL}/shiip/public-api/v2/switch-status/cancel`,
				{ method: "POST", headers: this.getHeaders(), body: JSON.stringify(payload) },
				this.timeout
			);
			if (result && result.data && Array.isArray(result.data)) {
				const orderResult = result.data.find((item) => item.order_code === orderCode);
				if (orderResult) {
					return {
						success: orderResult.result === true,
						message:
							orderResult.message ||
							(orderResult.result ? "Đơn hàng đã được hủy thành công trên GHN" : "Không thể hủy đơn hàng trên GHN"),
						orderCode: orderResult.order_code,
						result: orderResult.result,
					};
				}
			}
			return { success: true, message: "Đơn hàng đã được hủy thành công trên GHN", orderCode, result: true };
		} catch (error) {
			throw new Error("Lỗi kết nối GHN API: " + error.message);
		}
	}

	async getServices(fromDistrictId, toDistrictId) {
		try {
			const url = new URL(
				`${this.baseURL}/shiip/public-api/v2/shipping-order/available-services`
			);
			url.searchParams.set("from_district", String(fromDistrictId));
			url.searchParams.set("to_district", String(toDistrictId));
			url.searchParams.set("shop_id", String(this.shopId));
			return await httpRequest(url.toString(), { method: "GET", headers: this.getHeaders() }, this.timeout);
		} catch (error) {
			throw new Error("Không thể lấy danh sách dịch vụ vận chuyển");
		}
	}
}

export default new GHNService();
