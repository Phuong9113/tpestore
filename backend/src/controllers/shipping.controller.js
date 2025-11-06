import ghnService from "../services/ghn.service.js";
import { sendOrderCreatedEmail } from "../utils/email.js";
import { success } from "../utils/response.js";
import prisma from "../utils/prisma.js";

export const getProvinces = async (req, res, next) => {
	try {
		success(res, await ghnService.getProvinces());
	} catch (err) {
		next(err);
	}
};

export const getDistricts = async (req, res, next) => {
	try {
		const { provinceId } = req.params;
		if (!provinceId) return res.status(400).json({ error: "Province ID is required" });
		success(res, await ghnService.getDistricts(provinceId));
	} catch (err) {
		next(err);
	}
};

export const getWards = async (req, res, next) => {
	try {
		const { districtId } = req.params;
		if (!districtId) return res.status(400).json({ error: "District ID is required" });
		success(res, await ghnService.getWards(districtId));
	} catch (err) {
		next(err);
	}
};

export const calculateShippingFee = async (req, res, next) => {
	try {
		const result = await ghnService.calculateShippingFee(req.body);
		if (result && result.data) return success(res, result.data);
		return success(res, { total: 50000, service_fee: 50000, insurance_fee: 0, time: { time_type: "hour", leadtime: 24 } });
	} catch (err) {
		return success(res, { total: 50000, service_fee: 50000, insurance_fee: 0, time: { time_type: "hour", leadtime: 24 } });
	}
};

export const getServices = async (req, res, next) => {
	try {
		const { fromDistrictId, toDistrictId } = req.query;
		if (!fromDistrictId || !toDistrictId)
			return res.status(400).json({ error: "fromDistrictId and toDistrictId are required" });
		success(res, await ghnService.getServices(fromDistrictId, toDistrictId));
	} catch (err) {
		next(err);
	}
};

export const createShippingOrder = async (req, res, next) => {
	try {
        let payload = { ...req.body };
		try {
			if (req.body?.orderId) {
				const order = await prisma.order.findUnique({ where: { id: req.body.orderId } });
				if (order) {
					// 1: người gửi trả phí (ZaloPay); 2: người nhận trả phí (COD)
					payload.paymentTypeId = order.paymentMethod === "COD" ? 2 : 1;
					// eslint-disable-next-line no-console
					console.log("[GHN][CreateOrder] orderId=", order.id, "paymentMethod=", order.paymentMethod, "=> paymentTypeId=", payload.paymentTypeId);
				}
			}
		} catch {}
        const result = await ghnService.createShippingOrder(payload);
        let updatedOrder = null;
		try {
			const orderCode = result?.data?.order_code;
			const orderId = req.body?.orderId;
			if (orderCode && orderId) {
                updatedOrder = await prisma.order.update({
                    where: { id: orderId },
                    data: { ghnOrderCode: orderCode, status: "PROCESSING" },
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        orderItems: { include: { product: { select: { id: true, name: true, image: true, price: true } } } },
                    },
                });
				// eslint-disable-next-line no-console
				console.log("[GHN][CreateOrder] Updated order status to PROCESSING:", orderId, "ghnOrderCode:", orderCode);
                try {
                    const ok = Number(result?.code) === 200;
                    // Use account email only (no shipping email required)
                    const toEmail = (updatedOrder?.user?.email || "").trim();
                    if (ok && toEmail) {
                        const customerName = updatedOrder.user.name || updatedOrder.shippingName || "Quý khách";
                        const addressParts = [
                            updatedOrder.shippingAddress,
                            updatedOrder.shippingWard,
                            updatedOrder.shippingDistrict,
                            updatedOrder.shippingProvince,
                        ].filter(Boolean);
                        const shippingAddress = addressParts.join(", ");
                        const items = (updatedOrder.orderItems || []).map((item) => {
                            const productImage = item.product?.image || "";
                            // eslint-disable-next-line no-console
                            console.log("[Email] Product image path:", productImage, "for product:", item.product?.name);
                            return {
                                name: item.product?.name || "Sản phẩm",
                                quantity: item.quantity || 1,
                                price: item.price || 0,
                                image: productImage, // Keep original path, will be converted in email template
                            };
                        });

                        const emailResult = await sendOrderCreatedEmail({
                            to: toEmail,
                            customerName,
                            ghnCode: orderCode,
                            shippingFee: updatedOrder.shippingFee || 0,
                            totalPrice: updatedOrder.totalPrice || 0,
                            createdAt: updatedOrder.createdAt,
                            address: shippingAddress,
                            items,
                        });
                        if (emailResult?.skipped) {
                            // eslint-disable-next-line no-console
                            console.warn("[Email] Email skipped - SMTP not configured. Email should be sent to:", toEmail);
                        } else {
                            // eslint-disable-next-line no-console
                            console.log("[Email] Sent order created email to", toEmail, "for order", orderId);
                        }
                    }
                } catch (mailErr) {
                    // eslint-disable-next-line no-console
                    console.error("[Email] Failed to send order created email:", mailErr?.message || mailErr);
                }
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error("[GHN][CreateOrder] Error updating order:", err);
		}
		// Return both GHN result and updated order info
		success(res, { ...result, order: updatedOrder });
	} catch (err) {
		return res.status(500).json({ error: "GHN API Error", message: err.message });
	}
};

export const trackOrder = async (req, res, next) => {
	try {
        const raw = await ghnService.trackOrder(req.params.orderCode);
        // GHN returns { code, message, data } and data can be an array
        const payload = raw?.data !== undefined ? raw.data : raw;
        const record = Array.isArray(payload) ? payload[0] : payload;
        const logs = Array.isArray(record?.log) ? record.log : [];
        const latestLog = logs
            .slice()
            .sort((a, b) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime())[0];
        const currentStatus = latestLog?.status || record?.status || null;
        success(res, { ...record, currentStatus, latestLog, logsCount: logs.length });
	} catch (err) {
		next(err);
	}
};

export const cancelOrder = async (req, res, next) => {
	try {
		success(res, await ghnService.cancelOrder(req.params.orderCode, req.body?.reason));
	} catch (err) {
		next(err);
	}
};

export const getOrderDetail = async (req, res, next) => {
    try {
        const { orderCode } = req.params;
        if (!orderCode) return res.status(400).json({ error: "Order code is required" });
        const raw = await ghnService.getOrderDetail(orderCode);
        try {
            // eslint-disable-next-line no-console
            console.log(`[GHN][Detail][Request] orderCode=${orderCode}`);
            // eslint-disable-next-line no-console
            console.log(`[GHN][Detail][Raw] code=${raw?.code || 'N/A'} message=${raw?.message || 'N/A'}`);
        } catch {}
        const payload = raw?.data !== undefined ? raw.data : raw;
        const record = Array.isArray(payload) ? payload[0] : payload;
        const logs = Array.isArray(record?.log) ? record.log : [];
        const latestLog = logs
            .slice()
            .sort((a, b) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime())[0];
        const currentStatus = latestLog?.status || record?.status || null;
        try {
            // eslint-disable-next-line no-console
            console.log(`[GHN][Detail][Normalized] orderCode=${orderCode} status=${record?.status || 'N/A'} currentStatus=${currentStatus || 'N/A'} logsCount=${logs.length}`);
            if (logs.length > 0) {
                const preview = logs.slice(0, 3).map(l => ({ status: l.status, updated_date: l.updated_date }));
                // eslint-disable-next-line no-console
                console.log(`[GHN][Detail][LogsPreview]`, preview);
            }
        } catch {}
        const responseData = { ...record, currentStatus, latestLog, logsCount: logs.length };
        try {
            // eslint-disable-next-line no-console
            console.log(`[GHN][Detail][Response] orderCode=${orderCode} send.currentStatus=${currentStatus || 'N/A'} send.logsCount=${logs.length}`);
        } catch {}
        success(res, responseData);
    } catch (err) {
        const msg = err?.message || "";
        const unauthorized = /HTTP\s*401/i.test(msg);
        const status = unauthorized ? 401 : 502;
        try {
            // eslint-disable-next-line no-console
            console.error(`[GHN][Detail][Error]`, msg);
        } catch {}
        return res.status(status).json({ error: unauthorized ? "GHN token invalid" : "GHN API error", message: msg });
    }
};
