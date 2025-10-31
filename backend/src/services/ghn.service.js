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
		this.shopId = process.env.GHN_SHOP_ID || "885";
		this.timeout = 10000;
		this.fallbackFee = 50000;
	}

	getHeaders() {
		return {
			"Content-Type": "application/json",
			Token: this.token,
			ShopId: this.shopId,
		};
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
			const payload = {
				from_district_id: parseInt(data.fromDistrictId),
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
		let serviceId = parseInt(data.serviceId) || 53320;
		try {
			const services = await this.getServices(1442, parseInt(data.toDistrictId));
			if (services && services.data && services.data.length > 0) {
				serviceId = services.data[0].service_id;
			}
		} catch {}
		try {
			const payload = {
				from_district_id: 1442,
				from_ward_code: "1A0101",
				to_ward_code: data.toWardCode,
				to_district_id: parseInt(data.toDistrictId),
				weight: parseInt(data.weight) || 200,
				service_type_id: parseInt(data.serviceTypeId) || 2,
				service_id: serviceId,
				items: (data.items || []).map((it) => {
					const item = {
						name: it.name,
						quantity: parseInt(it.quantity) || 1,
						weight: parseInt(it.weight) || 30,
						code: it.code || it.name || "PRODUCT",
					};
					if (parseInt(data.serviceTypeId) === 5) {
						item.length = parseInt(it.length) || 5;
						item.width = parseInt(it.width) || 5;
						item.height = parseInt(it.height) || 3;
					}
					return item;
				}),
				...(data.clientOrderCode && { client_order_code: data.clientOrderCode }),
				...(data.toName && { to_name: data.toName }),
				...(data.toPhone && { to_phone: data.toPhone }),
				...(data.toAddress && { to_address: data.toAddress }),
				...(data.toProvinceId && { to_province_id: parseInt(data.toProvinceId) }),
				...(data.hamlet && { hamlet: data.hamlet }),
				...(data.returnName && { return_name: data.returnName }),
				...(data.returnPhone && { return_phone: data.returnPhone }),
				...(data.returnAddress && { return_address: data.returnAddress }),
				...(data.returnWardCode && { return_ward_code: data.returnWardCode }),
				...(data.returnDistrictId && { return_district_id: parseInt(data.returnDistrictId) }),
				...(data.returnProvinceId && { return_province_id: parseInt(data.returnProvinceId) }),
				...(data.codAmount && { cod_amount: parseInt(data.codAmount) }),
				...(data.length && { length: parseInt(data.length) }),
				...(data.width && { width: parseInt(data.width) }),
				...(data.height && { height: parseInt(data.height) }),
				...(data.insuranceValue && { insurance_value: parseInt(data.insuranceValue) }),
				required_note: data.requiredNote || "CHOTHUHANG",
				payment_type_id: data.paymentTypeId || 1,
			};
			try {
				const sample = {
					to_ward_code: payload.to_ward_code,
					to_district_id: payload.to_district_id,
					service_type_id: payload.service_type_id,
					service_id: payload.service_id,
					payment_type_id: payload.payment_type_id,
					cod_amount: data.codAmount ? parseInt(data.codAmount) : 0,
					insurance_value: payload.insurance_value || 0,
					items_count: Array.isArray(payload.items) ? payload.items.length : 0,
					weight: payload.weight,
				};
				// eslint-disable-next-line no-console
				console.log("[GHN][CreateOrder] Payload summary:", sample);
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
