import prisma from "../utils/prisma.js";
import { success } from "../utils/response.js";
import zalopayService from "../services/zalopay.service.js";
import ghnService from "../services/ghn.service.js";

export const createZaloPayOrder = async (req, res, next) => {
	try {
		const { orderId, amount, description, returnUrl, preferredPaymentMethods, bankCode } = req.body;
		if (!orderId || !amount || !description) {
			return res.status(400).json({ error: "orderId, amount, description are required" });
		}
		if (amount <= 0) return res.status(400).json({ error: "Amount must be greater than 0" });
		if (!process.env.ZALOPAY_APP_ID || !process.env.ZALOPAY_KEY1 || !process.env.ZALOPAY_KEY2) {
			return res.status(500).json({ error: "ZaloPay is not configured", missing: {
				appId: !process.env.ZALOPAY_APP_ID,
				key1: !process.env.ZALOPAY_KEY1,
				key2: !process.env.ZALOPAY_KEY2,
				callbackUrl: !process.env.ZALOPAY_SANDBOX_CALLBACK_URL,
			}});
		}
		let order = await prisma.order.findFirst({
			where: { id: orderId, userId: req.user.id },
			include: { orderItems: { include: { product: { select: { id: true, name: true, price: true } } } } },
		});
		if (!order) return res.status(404).json({ error: "Order not found" });
		// Normalize payment method/status for ZaloPay flow
		if (order.paymentMethod !== "ZALOPAY" || order.paymentStatus !== "PENDING") {
			order = await prisma.order.update({
				where: { id: order.id },
				data: { paymentMethod: "ZALOPAY", paymentStatus: "PENDING", status: "PENDING" },
				include: { orderItems: { include: { product: { select: { id: true, name: true, price: true } } } } },
			});
		}
		const items = order.orderItems.map((item) => ({ itemid: item.product.id, itemname: item.product.name, itemprice: item.price, itemquantity: item.quantity }));
		const result = await zalopayService.createOrder({ orderId: order.id, amount, description: description || `Thanh toán đơn hàng ${order.id}`, returnUrl, item: items, preferredPaymentMethods, bankCode });
		if (!result.success) return res.status(500).json({ error: "Failed to create ZaloPay order", details: result.error });
		await prisma.order.update({ where: { id: order.id }, data: { transactionId: result.app_trans_id, paymentStatus: "PENDING" } });
		success(res, { success: true, ...result });
	} catch (err) {
		next(err);
	}
};

export const handleZaloPayCallback = async (req, res) => {
	try {
		// Debug log: incoming callback
		try {
			// eslint-disable-next-line no-console
			console.log("[ZLP][Callback] Received at", new Date().toISOString());
			// eslint-disable-next-line no-console
			console.log("[ZLP][Callback] Raw body keys:", Object.keys(req.body || {}));
			// eslint-disable-next-line no-console
			console.log("[ZLP][Callback] data length:", typeof req.body?.data === "string" ? req.body.data.length : 0);
		} catch {}
		const verification = zalopayService.verifyCallback(req.body);
		if (!verification.success) {
			try {
				// eslint-disable-next-line no-console
				console.warn("[ZLP][Callback] MAC verification failed");
			} catch {}
			return res.json({ return_code: -1, return_message: "mac not equal" });
		}
		const { orderData } = verification;
		try {
			// eslint-disable-next-line no-console
			console.log("[ZLP][Callback] Verified app_trans_id:", orderData?.app_trans_id);
		} catch {}
		const order = await prisma.order.findFirst({
			where: { transactionId: orderData.app_trans_id, paymentMethod: "ZALOPAY" },
			include: { orderItems: { include: { product: { select: { id: true, name: true, price: true } } } } },
		});
		if (!order) {
			try {
				// eslint-disable-next-line no-console
				console.warn("[ZLP][Callback] Order not found for app_trans_id:", orderData?.app_trans_id);
			} catch {}
			return res.json({ return_code: 0, return_message: "Order not found" });
		}
		await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID", paidAt: new Date(), status: "PROCESSING", transactionId: orderData.app_trans_id } });
		try {
			// eslint-disable-next-line no-console
			console.log("[ZLP][Callback] Order updated to PAID:", order.id);
		} catch {}
		try {
			// Coerce address fields to correct types; skip GHN if invalid
			const toWardCode = typeof order.shippingWard === "string" ? order.shippingWard : "";
			const toDistrictId = Number(order.shippingDistrict);
			const toProvinceId = Number(order.shippingProvince);
			if (!toWardCode || !Number.isFinite(toDistrictId) || !Number.isFinite(toProvinceId)) {
				try {
					// eslint-disable-next-line no-console
					console.warn("[ZLP][Callback] Skip GHN: invalid address", { toWardCode, toDistrictId, toProvinceId });
				} catch {}
				return res.json({ return_code: 1, return_message: "success" });
			}
			const shippingData = {
				toName: order.shippingName,
				toPhone: order.shippingPhone,
				toAddress: order.shippingAddress,
				toWardCode,
				toDistrictId,
				toProvinceId,
				clientOrderCode: order.id,
				codAmount: 0,
				insuranceValue: order.totalPrice,
				content: `Đơn hàng từ TPE Store - ${order.orderItems.length} sản phẩm`,
				weight: 200,
				serviceTypeId: order.orderItems.length >= 10 ? 5 : 2,
				length: 20,
				width: 20,
				height: 20,
				paymentTypeId: 1,
				items: order.orderItems.map((item) => ({ name: item.product.name, quantity: item.quantity, weight: 200, price: item.price })),
			};
			const ghnResult = await ghnService.createShippingOrder(shippingData);
			if (ghnResult?.data?.order_code) {
				await prisma.order.update({ where: { id: order.id }, data: { ghnOrderCode: ghnResult.data.order_code, status: "SHIPPING" } });
				try {
					// eslint-disable-next-line no-console
					console.log("[ZLP][Callback] GHN order created:", ghnResult.data.order_code);
				} catch {}
			} else {
				try {
					// eslint-disable-next-line no-console
					console.warn("[ZLP][Callback] GHN create response (no order_code):", ghnResult?.data || ghnResult);
				} catch {}
			}
		} catch (e) {
			try {
				// eslint-disable-next-line no-console
				console.error("[ZLP][Callback] GHN create error:", e?.message || e);
			} catch {}
		}
		return res.json({ return_code: 1, return_message: "success" });
	} catch (error) {
		try {
			// eslint-disable-next-line no-console
			console.error("[ZLP][Callback] Handler error:", error?.message || error);
		} catch {}
		return res.json({ return_code: 0, return_message: error.message || "Internal server error" });
	}
};

export const verifyZaloPayPayment = async (req, res) => {
	try {
		const { zp_trans_token, orderId } = req.body;
		if (!zp_trans_token) return res.status(400).json({ success: false, error: "zp_trans_token is required" });
		const verificationResult = await zalopayService.verifyPayment(zp_trans_token);
		if (!verificationResult.success) return res.status(400).json({ success: false, error: verificationResult.error || "Payment verification failed" });
		const data = verificationResult.data;
		if (data.return_code === 1 && data.sub_return_code === 1) {
			let order;
			if (orderId) {
				order = await prisma.order.findFirst({ where: { id: orderId, paymentMethod: "ZALOPAY" }, include: { orderItems: { include: { product: { select: { id: true, name: true, price: true } } } } } });
			} else {
				order = await prisma.order.findFirst({ where: { transactionId: data.app_trans_id, paymentMethod: "ZALOPAY" }, include: { orderItems: { include: { product: { select: { id: true, name: true, price: true } } } } } });
			}
			if (!order) return res.status(404).json({ success: false, error: "Order not found" });
			await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID", paidAt: new Date(), status: "PROCESSING", transactionId: zp_trans_token } });
			try {
				if (!order.ghnOrderCode) {
					const shippingData = {
						toName: order.shippingName,
						toPhone: order.shippingPhone,
						toAddress: order.shippingAddress,
						toWardCode: order.shippingWard,
						toDistrictId: order.shippingDistrict,
						toProvinceId: order.shippingProvince,
						clientOrderCode: order.id,
						codAmount: 0,
						insuranceValue: order.totalPrice,
						content: `Đơn hàng từ TPE Store - ${order.orderItems.length} sản phẩm`,
						weight: 200,
						serviceTypeId: order.orderItems.length >= 10 ? 5 : 2,
						length: 20,
						width: 20,
						height: 20,
						paymentTypeId: 1,
						items: order.orderItems.map((item) => ({ name: item.product.name, quantity: item.quantity, weight: 200, price: item.price })),
					};
					const ghnResult = await ghnService.createShippingOrder(shippingData);
					if (ghnResult.data?.order_code)
						await prisma.order.update({ where: { id: order.id }, data: { ghnOrderCode: ghnResult.data.order_code, status: "SHIPPING" } });
				}
			} catch {}
			return success(res, {
				success: true,
				message: "Payment verified",
				paymentStatus: "PAID",
				orderId: order.id,
				ghnOrderCode: order.ghnOrderCode,
				order: {
					id: order.id,
					totalPrice: order.totalPrice,
					paymentStatus: order.paymentStatus,
					status: order.status,
					ghnOrderCode: order.ghnOrderCode,
					shippingName: order.shippingName,
					shippingPhone: order.shippingPhone,
					shippingAddress: order.shippingAddress,
					orderItems: order.orderItems,
				},
			});
		}
		return success(res, { success: false, message: "Payment not verified", result: data });
	} catch (err) {
		return res.status(500).json({ success: false, message: "Server error", error: err.message });
	}
};

export const checkZaloPayStatus = async (req, res, next) => {
	try {
		const { orderId } = req.params;
		if (!orderId) return res.status(400).json({ error: "Order ID is required" });
		const order = await prisma.order.findFirst({ where: { id: orderId, userId: req.user.id, paymentMethod: "ZALOPAY" } });
		if (!order) return res.status(404).json({ error: "Order not found" });
		if (order.transactionId) {
			const statusResult = await zalopayService.checkPaymentStatus(order.transactionId);
			if (statusResult.success) {
				const z = statusResult.data;
				if (z.return_code === 1 && order.paymentStatus === "PENDING") {
					await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID", paidAt: new Date(), status: "PROCESSING" } });
				}
				return success(res, {
					orderId: order.id,
					paymentStatus: z.return_code === 1 ? "PAID" : order.paymentStatus,
					status: order.status,
					ghnOrderCode: order.ghnOrderCode,
					app_trans_id: order.transactionId,
				});
			}
		}
		return success(res, { orderId: order.id, paymentStatus: order.paymentStatus, status: order.status, ghnOrderCode: order.ghnOrderCode, app_trans_id: order.transactionId });
	} catch (err) {
		next(err);
	}
};
