import * as cartService from "../services/cart.service.js";
import { success } from "../utils/response.js";

export const getCart = async (req, res, next) => {
	try {
		success(res, await cartService.getCart(req.user.id));
	} catch (err) {
		next(err);
	}
};

export const addToCart = async (req, res, next) => {
	try {
		success(res, await cartService.addToCart(req.user.id, req.body), "Created", 201);
	} catch (err) {
		next(err);
	}
};

export const updateCartItem = async (req, res, next) => {
	try {
		success(res, await cartService.updateCartItem(req.user.id, req.params.productId, req.body.quantity));
	} catch (err) {
		next(err);
	}
};

export const removeFromCart = async (req, res, next) => {
	try {
		success(res, await cartService.removeFromCart(req.user.id, req.params.productId));
	} catch (err) {
		next(err);
	}
};

export const clearCart = async (req, res, next) => {
	try {
		success(res, await cartService.clearCart(req.user.id));
	} catch (err) {
		next(err);
	}
};
