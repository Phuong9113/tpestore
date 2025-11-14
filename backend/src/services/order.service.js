import prisma from "../utils/prisma.js";
import { validateRequired } from "../utils/helpers.js";
import { generateId, generateMultipleIds } from "../utils/generateId.js";

export const listForUser = (userId) =>
	prisma.order.findMany({
		where: { userId },
		include: { orderItems: { include: { product: { select: { id: true, name: true, image: true, price: true } } } } },
		orderBy: { createdAt: "desc" },
	});

export const getForUser = async (id, userId) => {
	const order = await prisma.order.findFirst({
		where: { id, userId },
		include: { orderItems: { include: { product: { select: { id: true, name: true, image: true, price: true } } } } },
	});
	if (!order) {
		const err = new Error("Order not found");
		err.status = 404;
		throw err;
	}
	return order;
};

export const create = async (userId, body) => {
	const { items, shippingInfo, paymentMethod = "COD" } = body;
	const validation = validateRequired(body, ["items"]);
	if (validation) {
		const err = new Error(validation.error || "Validation error");
		err.status = 400;
		throw err;
	}
	const validPaymentMethods = ["COD", "ZALOPAY"];
	if (!validPaymentMethods.includes(paymentMethod)) {
		const err = new Error("Invalid payment method");
		err.status = 400;
		throw err;
	}
	if (!Array.isArray(items) || items.length === 0) {
		const err = new Error("Invalid order items");
		err.status = 400;
		throw err;
	}
	for (const item of items) {
		if (!item.productId || !item.quantity || !item.price) {
			const err = new Error("Each item must have productId, quantity, and price");
			err.status = 400;
			throw err;
		}
	}
	const productIds = items.map((i) => i.productId);
	const existingProducts = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
	if (existingProducts.length !== productIds.length) {
		const existingIds = existingProducts.map((p) => p.id);
		const missingIds = productIds.filter((id) => !existingIds.includes(id));
		const err = new Error(`Products not found: ${missingIds.join(", ")}`);
		err.status = 400;
		throw err;
	}
	const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
	const shippingFee = shippingInfo?.shippingFee || 0;
	const finalTotal = totalPrice + shippingFee;
	const orderId = await generateId("ORD", "Order");
	const orderItemIds = await generateMultipleIds("ORI", "OrderItem", items.length);
	const order = await prisma.order.create({
		data: {
			id: orderId,
			userId,
			totalPrice: finalTotal,
			status: paymentMethod === "ZALOPAY" ? "PENDING" : "PROCESSING",
			paymentStatus: paymentMethod === "ZALOPAY" ? "PENDING" : "PAID",
			paymentMethod,
			shippingName: shippingInfo?.name,
			shippingPhone: shippingInfo?.phone,
			shippingAddress: shippingInfo?.address,
			shippingProvince: shippingInfo?.province || shippingInfo?.provinceName,
			shippingDistrict: shippingInfo?.district || shippingInfo?.districtName,
			shippingWard: shippingInfo?.ward || shippingInfo?.wardName,
			shippingFee,
			orderItems: { 
				create: items.map((it, index) => ({ 
					id: orderItemIds[index],
					productId: it.productId, 
					quantity: it.quantity, 
					price: it.price 
				})) 
			},
		},
		include: { orderItems: { include: { product: { select: { id: true, name: true, image: true, price: true } } } } },
	});
	await prisma.cartItem.deleteMany({ where: { userId } });
	return order;
};

export const updateStatusForUser = async (id, userId, status) => {
	const valid = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];
	if (!valid.includes(status)) {
		const err = new Error("Invalid status");
		err.status = 400;
		throw err;
	}
	const existing = await prisma.order.findFirst({ where: { id, userId } });
	if (!existing) {
		const err = new Error("Order not found");
		err.status = 404;
		throw err;
	}
	return prisma.order.update({
		where: { id },
		data: { status },
		include: { orderItems: { include: { product: { select: { id: true, name: true, image: true, price: true } } } } },
	});
};

export const getReviewEligibility = async (orderId, userId) => {
	const order = await prisma.order.findFirst({
		where: { id: orderId, userId },
		include: {
			orderItems: {
				include: {
					product: { select: { id: true, name: true, image: true } },
				},
			},
		},
	});

	if (!order) {
		const err = new Error("Order not found");
		err.status = 404;
		throw err;
	}

	// Check if order is completed or delivered
	const isCompleted = order.status === "COMPLETED";
	let isDelivered = false;

	if (order.ghnOrderCode) {
		try {
			const ghnService = (await import("./ghn.service.js")).default;
			const ghnDetail = await ghnService.getOrderDetail(order.ghnOrderCode);
			const currentStatus = ghnDetail?.currentStatus || ghnDetail?.status || "";
			isDelivered = currentStatus.toLowerCase() === "delivered";
		} catch (e) {
			// If GHN check fails, rely on internal status
		}
	}

	const canReview = isCompleted || isDelivered;

	// Get existing reviews for products in this order
	const productIds = order.orderItems.map((item) => item.productId);
	const existingReviews = await prisma.review.findMany({
		where: {
			productId: { in: productIds },
			userId,
			orderId,
		},
		select: { productId: true },
	});

	const reviewedProductIds = new Set(existingReviews.map((r) => r.productId));

	// Map order items with review status
	const itemsWithReviewStatus = order.orderItems.map((item) => ({
		...item,
		canReview: canReview && !reviewedProductIds.has(item.productId),
		hasReviewed: reviewedProductIds.has(item.productId),
	}));

	return {
		orderId: order.id,
		canReview,
		isCompleted,
		isDelivered,
		items: itemsWithReviewStatus,
	};
};

export const getOrderProductsReviewStatus = async (orderId, userId) => {
	const order = await prisma.order.findFirst({
		where: { id: orderId, userId },
		include: {
			orderItems: {
				include: {
					product: { select: { id: true, name: true, image: true } },
				},
			},
		},
	});

	if (!order) {
		const err = new Error("Order not found");
		err.status = 404;
		throw err;
	}

	// Check if order is completed or delivered
	const isCompleted = order.status === "COMPLETED";
	let isDelivered = false;

	if (order.ghnOrderCode) {
		try {
			const ghnService = (await import("./ghn.service.js")).default;
			const ghnDetail = await ghnService.getOrderDetail(order.ghnOrderCode);
			const currentStatus = ghnDetail?.currentStatus || ghnDetail?.status || "";
			isDelivered = currentStatus.toLowerCase() === "delivered";
		} catch (e) {
			// If GHN check fails, rely on internal status
		}
	}

	const canReview = isCompleted || isDelivered;

	// Get existing reviews for products in this order
	const productIds = order.orderItems.map((item) => item.productId);
	const existingReviews = await prisma.review.findMany({
		where: {
			productId: { in: productIds },
			userId,
		},
		select: { productId: true },
	});

	const reviewedProductIds = new Set(existingReviews.map((r) => r.productId));

	// Map order items with review status
	const productsReviewStatus = order.orderItems.map((item) => ({
		productId: item.productId,
		hasReviewed: reviewedProductIds.has(item.productId),
	}));

	return {
		orderId: order.id,
		canReview,
		isDelivered,
		products: productsReviewStatus,
	};
};
