import * as productRepo from "../repositories/product.repository.js";
import prisma from "../utils/prisma.js";

export const getAll = async () => {
	return prisma.product.findMany({
		include: {
			category: true,
			specs: { include: { specField: true } },
			reviews: { include: { user: { select: { id: true, name: true } } } },
		},
	});
};

export const getById = async (id) => {
	return prisma.product.findUnique({
		where: { id },
		include: {
			category: true,
			specs: { include: { specField: true } },
			reviews: { include: { user: { select: { id: true, name: true } } } },
		},
	});
};

export const getReviews = async (productId, page = 1, limit = 10) => {
	const skip = (page - 1) * limit;
	const [reviews, total] = await Promise.all([
		prisma.review.findMany({
			where: { productId },
			include: { user: { select: { id: true, name: true } } },
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.review.count({ where: { productId } }),
	]);

	// Calculate average rating
	const avgRating = reviews.length > 0
		? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
		: 0;

	return {
		reviews,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
	};
};

export const createReview = async ({ productId, userId, rating, comment, orderId }) => {
	// Validate rating
	if (!rating || rating < 1 || rating > 5) {
		const err = new Error("Rating must be between 1 and 5");
		err.status = 400;
		throw err;
	}

	// If orderId is provided, validate order and check for duplicate review
	if (orderId) {
		// Check if order exists and belongs to user
		const order = await prisma.order.findFirst({
			where: { id: orderId, userId },
			include: { orderItems: true },
		});

		if (!order) {
			const err = new Error("Order not found");
			err.status = 404;
			throw err;
		}

		// Check if order is completed or delivered (GHN status = delivered or internal status = COMPLETED)
		const isCompleted = order.status === "COMPLETED";
		
		// Check GHN status if ghnOrderCode exists
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

		if (!isCompleted && !isDelivered) {
			const err = new Error("Order must be completed or delivered before reviewing");
			err.status = 400;
			throw err;
		}

		// Check if product is in the order
		const productInOrder = order.orderItems.some((item) => item.productId === productId);
		if (!productInOrder) {
			const err = new Error("Product is not in this order");
			err.status = 400;
			throw err;
		}

		// Check if user has already reviewed this product for this order
		const existing = await prisma.review.findFirst({
			where: { productId, userId, orderId },
		});
		if (existing) {
			const err = new Error("You have already reviewed this product for this order");
			err.status = 409;
			throw err;
		}
	} else {
		// If no orderId, check if user has reviewed this product before (backward compatibility)
		const existing = await prisma.review.findFirst({ where: { productId, userId } });
		if (existing) {
			const err = new Error("You have already reviewed this product");
			err.status = 409;
			throw err;
		}
	}

	return prisma.review.create({
		data: { productId, userId, rating, comment, orderId: orderId || null },
		include: { user: { select: { id: true, name: true } } },
	});
};

export const recordInteraction = async ({ productId, userId, action }) => {
	const valid = ["view", "like", "addToCart", "purchase"];
	if (!valid.includes(action)) {
		const err = new Error("Invalid action");
		err.status = 400;
		throw err;
	}
	let interaction = await prisma.productInteraction.findFirst({ where: { productId, userId } });
	if (!interaction) {
		interaction = await prisma.productInteraction.create({
			data: {
				productId,
				userId,
				viewedAt: new Date(),
				liked: action === "like",
				addedToCart: action === "addToCart",
				purchased: action === "purchase",
			},
		});
		return interaction;
	}
	const updateData = { viewedAt: new Date() };
	if (action === "like") updateData.liked = true;
	if (action === "addToCart") updateData.addedToCart = true;
	if (action === "purchase") updateData.purchased = true;
	return prisma.productInteraction.update({ where: { id: interaction.id }, data: updateData });
};

export const checkUserPurchasedProduct = async (productId, userId, orderId = null) => {
	try {
		// If orderId is provided, check that specific order regardless of status
		// This allows checking orders that might be delivered via GHN but status not updated
		// Otherwise, only check COMPLETED or SHIPPING orders
		const whereClause = orderId
			? {
					userId,
					id: orderId,
					// Don't filter by status when orderId is provided - check GHN status instead
			  }
			: {
					userId,
					status: { in: ["COMPLETED", "SHIPPING"] },
			  };

		// Check if user has any completed orders containing this product
		const orders = await prisma.order.findMany({
			where: whereClause,
			include: {
				orderItems: {
					where: { productId },
					select: { id: true, orderId: true },
				},
			},
		});

		// Filter orders that contain this product
		const relevantOrders = orders.filter((order) => order.orderItems.length > 0);

		if (relevantOrders.length === 0) {
			return {
				hasPurchased: false,
				canReview: false,
				hasReviewed: false,
				reviewId: null,
				orders: [],
			};
		}

		// Check GHN status for orders with ghnOrderCode
		// Use Promise.allSettled to handle individual failures gracefully
		// When orderId is provided, always check GHN status regardless of internal status
		const ordersWithStatusResults = await Promise.allSettled(
			relevantOrders.map(async (order) => {
				// Start with internal status check
				let isDelivered = order.status === "COMPLETED";

				// If orderId is provided or order has GHN code, always check GHN status
				// This handles cases where order might be delivered but status not updated
				if (order.ghnOrderCode) {
					try {
						const ghnService = (await import("./ghn.service.js")).default;
						const ghnDetail = await ghnService.getOrderDetail(order.ghnOrderCode);
						const currentStatus = ghnDetail?.currentStatus || ghnDetail?.status || ghnDetail?.data?.currentStatus || "";
						const statusLower = currentStatus.toLowerCase();
						// Check if GHN status indicates delivered
						isDelivered = statusLower === "delivered" || order.status === "COMPLETED";
					} catch (e) {
						// If GHN check fails, rely on internal status
						// Don't log error to avoid noise - GHN failures are expected sometimes
						// When orderId is provided, if GHN check fails, still allow if status is COMPLETED
						if (orderId && order.status === "COMPLETED") {
							isDelivered = true;
						}
					}
				}

				return {
					orderId: order.id,
					status: order.status,
					isDelivered,
				};
			})
		);

		// Extract successful results, fallback to internal status for failed ones
		const ordersWithStatus = ordersWithStatusResults.map((result, index) => {
			if (result.status === "fulfilled") {
				return result.value;
			}
			// Fallback: use internal status if GHN check failed
			const order = relevantOrders[index];
			return {
				orderId: order.id,
				status: order.status,
				isDelivered: order.status === "COMPLETED",
			};
		});

		// Check if user has already reviewed this product
		// If orderId is provided and valid, check review for that specific order
		const reviewWhere = orderId && orderId.trim()
			? { 
				productId, 
				userId, 
				orderId: orderId.trim() 
			}
			: { 
				productId, 
				userId 
			};
		
		const existingReview = await prisma.review.findFirst({
			where: reviewWhere,
			select: { id: true, orderId: true },
		});

		const canReview = ordersWithStatus.some((o) => o.isDelivered) && !existingReview;

		return {
			hasPurchased: true,
			canReview,
			hasReviewed: !!existingReview,
			reviewId: existingReview?.id || null,
			orders: ordersWithStatus,
		};
	} catch (error) {
		console.error("Error in checkUserPurchasedProduct:", error);
		// Return safe default instead of throwing to prevent 500 errors
		// This allows the UI to still function even if there's a database or service issue
		return {
			hasPurchased: false,
			canReview: false,
			hasReviewed: false,
			reviewId: null,
			orders: [],
		};
	}
};

export const getRecommendations = async (userId) => {
	const interactions = await prisma.productInteraction.findMany({
		where: { userId },
		include: { product: true },
	});
	const likedCategories = interactions
		.filter((i) => i.liked || i.purchased)
		.map((i) => i.product.categoryId);
	if (likedCategories.length === 0) {
		return prisma.product.findMany({
			take: 10,
			orderBy: { createdAt: "desc" },
			include: { category: true, specs: { include: { specField: true } } },
		});
	}
	return prisma.product.findMany({
		where: {
			categoryId: { in: likedCategories },
			id: { notIn: interactions.map((i) => i.productId) },
		},
		take: 10,
		include: { category: true, specs: { include: { specField: true } } },
	});
};
