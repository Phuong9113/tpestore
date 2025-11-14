import * as productService from "../services/product.service.js";
import { success } from "../utils/response.js";

export const getAllProducts = async (req, res, next) => {
	try {
		const products = await productService.getAll();
		success(res, products);
	} catch (err) {
		next(err);
	}
};

export const getProductById = async (req, res, next) => {
	try {
		const product = await productService.getById(req.params.id);
		if (!product) {
			return res.status(404).json({ success: false, message: "Product not found" });
		}
		success(res, product);
	} catch (err) {
		next(err);
	}
};

export const getProductReviews = async (req, res, next) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const result = await productService.getReviews(req.params.productId, page, limit);
		success(res, result);
	} catch (err) {
		next(err);
	}
};

export const createProductReview = async (req, res, next) => {
	try {
		const review = await productService.createReview({
			productId: req.params.productId,
			userId: req.user.id,
			rating: req.body.rating,
			comment: req.body.comment,
			orderId: req.body.orderId,
		});
		success(res, review, "Created", 201);
	} catch (err) {
		next(err);
	}
};

export const interactWithProduct = async (req, res, next) => {
	try {
		const result = await productService.recordInteraction({
			productId: req.params.productId,
			userId: req.user.id,
			action: req.body.action,
		});
		success(res, result);
	} catch (err) {
		next(err);
	}
};

export const getRecommendations = async (req, res, next) => {
	try {
		const products = await productService.getRecommendations(req.user.id);
		success(res, products);
	} catch (err) {
		next(err);
	}
};

export const checkUserPurchasedProduct = async (req, res, next) => {
	try {
		const orderId = req.query.orderId || null;
		const result = await productService.checkUserPurchasedProduct(
			req.params.productId,
			req.user.id,
			orderId
		);
		success(res, result);
	} catch (err) {
		next(err);
	}
};
