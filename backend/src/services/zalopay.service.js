import crypto from "crypto";
import axios from "axios";

class ZaloPayService {
	constructor() {
		this.appId = process.env.ZALOPAY_APP_ID;
		this.key1 = process.env.ZALOPAY_KEY1;
		this.key2 = process.env.ZALOPAY_KEY2;
		this.createEndpoint =
			process.env.ZALOPAY_CREATE_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create";
		this.callbackUrl = process.env.ZALOPAY_SANDBOX_CALLBACK_URL;
	}

	async createOrder(orderData) {
		try {
			const { orderId, amount, description, returnUrl, item = [], preferredPaymentMethods, bankCode } = orderData;
			const timestamp = Date.now();
			const date = new Date();
			const year = date.getFullYear().toString().slice(-2);
			const month = (date.getMonth() + 1).toString().padStart(2, "0");
			const day = date.getDate().toString().padStart(2, "0");
			const randomNumber = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
			const appTransId = `${year}${month}${day}_${randomNumber}`;
			const embedData = { orderId, redirecturl: returnUrl, preferred_payment_method: Array.isArray(preferredPaymentMethods) ? preferredPaymentMethods : [] };
			const data = {
				app_id: parseInt(this.appId),
				app_time: timestamp,
				app_trans_id: appTransId,
				app_user: "TPE_Store",
				bank_code: typeof bankCode === "string" ? bankCode : "",
				description,
				amount,
				embed_data: JSON.stringify(embedData),
				item: JSON.stringify(item),
				callback_url: this.callbackUrl,
			};
			const rawData = `${data.app_id}|${data.app_trans_id}|${data.app_user}|${data.amount}|${data.app_time}|${data.embed_data}|${data.item}`;
			data.mac = crypto.createHmac("sha256", this.key1).update(rawData).digest("hex");
			const formData = new URLSearchParams();
			Object.keys(data).forEach((key) => {
				formData.append(key, data[key]);
			});
			const response = await axios.post(this.createEndpoint, formData, {
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
			});
			if (response.data.return_code === 1) {
				return {
					success: true,
					order_url: response.data.order_url,
					order_token: response.data.order_token,
					zp_trans_token: response.data.zp_trans_token,
					app_trans_id: appTransId,
				};
			}
			return {
				success: false,
				error: response.data.return_message || "ZaloPay v2 API error",
				sub_return_code: response.data.sub_return_code,
				sub_return_message: response.data.sub_return_message,
				app_trans_id: appTransId,
			};
		} catch (error) {
			return { success: false, error: error.message || "Network error" };
		}
	}

	createMacV2(data, key) {
		const str = `${data.app_id}|${data.zp_trans_token}`;
		return crypto.createHmac("sha256", key).update(str).digest("hex");
	}

	async verifyPayment(zpTransToken) {
		try {
			const data = { app_id: parseInt(this.appId), zp_trans_token: zpTransToken };
			data.mac = this.createMacV2(data, this.key2);
			const formData = new URLSearchParams();
			Object.keys(data).forEach((key) => {
				formData.append(key, data[key]);
			});
			const queryEndpoint = this.createEndpoint.replace("/v2/create", "/v2/query");
			const response = await axios.post(queryEndpoint, formData, {
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
			});
			if (response.data.return_code === 1) {
				return { success: true, data: response.data };
			}
			return { success: false, error: response.data.return_message || "Payment verification failed", data: response.data };
		} catch (error) {
			return { success: false, error: error.message || "Failed to verify payment" };
		}
	}

	verifyCallback(callbackData) {
		try {
			const { data, mac } = callbackData;
			// Per ZaloPay docs: mac = HMAC_SHA256(data, key2)
			const expectedMac = crypto.createHmac("sha256", this.key2).update(data).digest("hex");
			if (mac !== expectedMac) {
				return { success: false, error: "Invalid signature" };
			}
			const orderData = JSON.parse(data);
			return { success: true, orderData };
		} catch (error) {
			return { success: false, error: error.message || "Callback verification failed" };
		}
	}

	async checkPaymentStatus(appTransId) {
		try {
			const data = { app_id: parseInt(this.appId), app_trans_id: appTransId };
			const macData = `${data.app_id}|${data.app_trans_id}|${this.key1}`;
			data.mac = crypto.createHmac("sha256", this.key1).update(macData).digest("hex");
			const formData = new URLSearchParams();
			Object.keys(data).forEach((key) => {
				formData.append(key, data[key]);
			});
			const response = await axios.post("https://sb-openapi.zalopay.vn/v2/query", formData, {
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
			});
			return { success: true, data: response.data };
		} catch (error) {
			return { success: false, error: error.message || "Failed to check payment status" };
		}
	}
}

export default new ZaloPayService();
