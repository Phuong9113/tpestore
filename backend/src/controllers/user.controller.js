import prisma from "../utils/prisma.js";
import { success } from "../utils/response.js";
import ghnService from "../services/ghn.service.js";

export const getUsers = async (req, res, next) => {
	try {
		const users = await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				address: true,
				city: true,
				role: true,
				isActive: true,
				createdAt: true,
			},
		});
		success(res, users);
	} catch (err) {
		next(err);
	}
};

export const updateProfile = async (req, res, next) => {
	try {
		const userId = req.user.id;
		const { name, phone, address, city } = req.body;
		const existingUser = await prisma.user.findUnique({ where: { id: userId } });
		if (!existingUser) {
			return res.status(404).json({ error: "User not found" });
		}
		const user = await prisma.user.update({
			where: { id: userId },
			data: {
				...(name !== undefined && { name }),
				...(phone !== undefined && { phone }),
				...(address !== undefined && { address }),
				...(city !== undefined && { city }),
			},
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				address: true,
				city: true,
				role: true,
				isActive: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		success(res, user);
	} catch (err) {
		next(err);
	}
};

export const getProfile = async (req, res, next) => {
	try {
		const userId = req.user.id;
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				address: true,
				city: true,
				role: true,
				isActive: true,
				createdAt: true,
				updatedAt: true,
				orders: {
					select: {
						id: true,
						totalPrice: true,
						status: true,
						createdAt: true,
						ghnOrderCode: true,
						orderItems: {
							select: {
								quantity: true,
								product: { select: { id: true, name: true, image: true, price: true } },
							},
						},
					},
					orderBy: { createdAt: "desc" },
					take: 10,
				},
			},
		});
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		success(res, user);
	} catch (err) {
		next(err);
	}
};

export const cancelUserOrder = async (req, res, next) => {
	try {
		const userId = req.user.id;
		const { orderId } = req.params;
		const order = await prisma.order.findFirst({
			where: { id: orderId, userId },
			select: { id: true, status: true, ghnOrderCode: true, createdAt: true, user: { select: { id: true, name: true, email: true } } },
		});
		if (!order) {
			return res.status(404).json({ error: "Đơn hàng không tồn tại hoặc không thuộc về bạn" });
		}
		if (order.status === "CANCELLED") {
			return res.status(400).json({ error: "Đơn hàng đã được hủy trước đó" });
		}
		if (order.status === "COMPLETED") {
			return res.status(400).json({ error: "Không thể hủy đơn hàng đã hoàn thành" });
		}
		if (order.status === "SHIPPING") {
			return res.status(400).json({ error: "Không thể hủy đơn hàng đang vận chuyển" });
		}
		const orderAge = Date.now() - new Date(order.createdAt).getTime();
		const maxCancelTime = 24 * 60 * 60 * 1000;
		if (orderAge > maxCancelTime) {
			return res.status(400).json({ error: "Chỉ có thể hủy đơn hàng trong vòng 24 giờ đầu" });
		}
		let ghnResult = null;
		if (order.ghnOrderCode) {
			try {
				ghnResult = await ghnService.cancelOrder(order.ghnOrderCode);
			} catch (ghnError) {
				ghnResult = { success: false, error: ghnError.message, message: "Lỗi khi hủy đơn hàng trên GHN" };
			}
		}
		const updatedOrder = await prisma.order.update({
			where: { id: orderId },
			data: { status: "CANCELLED", updatedAt: new Date() },
			include: {
				user: { select: { id: true, name: true, email: true, phone: true } },
				orderItems: { include: { product: { select: { id: true, name: true, image: true, price: true } } } },
			},
		});
		success(res, { success: true, message: "Đơn hàng đã được hủy thành công", order: updatedOrder, ghnResult });
	} catch (err) {
		next(err);
	}
};
