import ghnService from "../services/ghn.service.js";
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
		try {
			const orderCode = result?.data?.order_code;
			const orderId = req.body?.orderId;
			if (orderCode && orderId) {
				await prisma.order.update({ where: { id: orderId }, data: { ghnOrderCode: orderCode, status: "SHIPPING" } });
			}
		} catch {}
		success(res, result);
	} catch (err) {
		return res.status(500).json({ error: "GHN API Error", message: err.message });
	}
};

export const trackOrder = async (req, res, next) => {
	try {
		success(res, await ghnService.trackOrder(req.params.orderCode));
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
