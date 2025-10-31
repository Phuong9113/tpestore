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

export const getReviews = async (productId) => {
	return prisma.review.findMany({
		where: { productId },
		include: { user: { select: { id: true, name: true } } },
		orderBy: { createdAt: "desc" },
	});
};

export const createReview = async ({ productId, userId, rating, comment }) => {
	const existing = await prisma.review.findFirst({ where: { productId, userId } });
	if (existing) {
		const err = new Error("You have already reviewed this product");
		err.status = 409;
		throw err;
	}
	return prisma.review.create({
		data: { productId, userId, rating, comment },
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
