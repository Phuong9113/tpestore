import * as orderService from "../services/order.service.js";
import { success } from "../utils/response.js";

export const getOrders = async (req, res, next) => {
	try {
		const data = await orderService.listForUser(req.user.id);
		success(res, data);
	} catch (err) {
		next(err);
	}
};

export const getOrderById = async (req, res, next) => {
	try {
		const data = await orderService.getForUser(req.params.id, req.user.id);
		success(res, data);
	} catch (err) {
		next(err);
	}
};

export const createOrder = async (req, res, next) => {
	try {
		const data = await orderService.create(req.user.id, req.body);
		success(res, data, "Created", 201);
	} catch (err) {
		next(err);
	}
};

export const updateOrderStatus = async (req, res, next) => {
	try {
		const data = await orderService.updateStatusForUser(req.params.id, req.user.id, req.body.status);
		success(res, data);
	} catch (err) {
		next(err);
	}
};

export const getReviewEligibility = async (req, res, next) => {
	try {
		const data = await orderService.getReviewEligibility(req.params.id, req.user.id);
		success(res, data);
	} catch (err) {
		next(err);
	}
};

export const getOrderProductsReviewStatus = async (req, res, next) => {
	try {
		const data = await orderService.getOrderProductsReviewStatus(req.params.id, req.user.id);
		success(res, data);
	} catch (err) {
		next(err);
	}
};
