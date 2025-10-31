import prisma from "../utils/prisma.js";
import { validateRequired } from "../utils/helpers.js";

export const getCart = async (userId) => {
	const items = await prisma.cartItem.findMany({ where: { userId }, include: { product: true } });
	return {
		items: items.map((ci) => ({
			productId: ci.productId,
			name: ci.product.name,
			price: ci.product.price,
			image: ci.product.image,
			quantity: ci.quantity,
		})),
	};
};

export const addToCart = async (userId, { productId, quantity }) => {
	const validation = validateRequired({ productId }, ["productId"]);
	if (validation) {
		const err = new Error(validation.error || "Validation error");
		err.status = 400;
		throw err;
	}
	const qty = Math.max(1, Number(quantity || 1));
	if (qty > 100) {
		const err = new Error("Quantity cannot exceed 100");
		err.status = 400;
		throw err;
	}
	const product = await prisma.product.findUnique({ where: { id: productId } });
	if (!product) {
		const err = new Error("Product not found");
		err.status = 404;
		throw err;
	}
	const existing = await prisma.cartItem.findFirst({ where: { userId, productId } });
	if (existing) {
		const newQuantity = existing.quantity + qty;
		if (newQuantity > 100) {
			const err = new Error("Total quantity cannot exceed 100");
			err.status = 400;
			throw err;
		}
		const updated = await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQuantity } });
		return { ok: true, itemId: updated.id };
	}
	const created = await prisma.cartItem.create({ data: { userId, productId, quantity: qty } });
	return { ok: true, itemId: created.id };
};

export const updateCartItem = async (userId, productId, quantity) => {
	const qty = Number(quantity);
	if (!Number.isFinite(qty)) {
		const err = new Error("Invalid quantity");
		err.status = 400;
		throw err;
	}
	if (qty > 100) {
		const err = new Error("Quantity cannot exceed 100");
		err.status = 400;
		throw err;
	}
	const item = await prisma.cartItem.findFirst({ where: { userId, productId } });
	if (!item) {
		const err = new Error("Item not found in cart");
		err.status = 404;
		throw err;
	}
	if (qty <= 0) {
		await prisma.cartItem.delete({ where: { id: item.id } });
		return { ok: true, deleted: true };
	}
	const updated = await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: qty } });
	return { ok: true, itemId: updated.id };
};

export const removeFromCart = async (userId, productId) => {
	const item = await prisma.cartItem.findFirst({ where: { userId, productId } });
	if (!item) {
		const err = new Error("Item not found in cart");
		err.status = 404;
		throw err;
	}
	await prisma.cartItem.delete({ where: { id: item.id } });
	return { ok: true };
};

export const clearCart = (userId) => prisma.cartItem.deleteMany({ where: { userId } }).then(() => ({ ok: true }));
