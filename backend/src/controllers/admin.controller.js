import prisma from "../utils/prisma.js";
import xlsx from "xlsx";
import ghnService from "../services/ghn.service.js";

// Users
export const getAdminUsers = async (req, res, next) => {
	try {
		const { page = 1, limit = 10, search, role } = req.query;
		const skip = (page - 1) * limit;
		const where = {};
		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			];
		}
		if (role) where.role = role;
		const [users, total] = await Promise.all([
			prisma.user.findMany({
				where,
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
					orders: { where: { status: "COMPLETED" }, select: { totalPrice: true } },
					_count: { select: { orders: true, reviews: true } },
				},
				skip: parseInt(skip),
				take: parseInt(limit),
				orderBy: { createdAt: "desc" },
			}),
			prisma.user.count({ where }),
		]);
		res.json({ users, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
	} catch (err) {
		next(err);
	}
};

export const getAdminUserById = async (req, res, next) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.params.id },
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
				orders: { include: { orderItems: { include: { product: { select: { id: true, name: true, image: true, price: true } } } } }, orderBy: { createdAt: "desc" } },
				reviews: { include: { product: { select: { id: true, name: true, image: true } } }, orderBy: { createdAt: "desc" } },
			},
		});
		if (!user) return res.status(404).json({ error: "User not found" });
		res.json(user);
	} catch (err) {
		next(err);
	}
};

export const updateUser = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { name, email, phone, address, city } = req.body;
		const existingUser = await prisma.user.findUnique({ where: { id } });
		if (!existingUser) return res.status(404).json({ error: "User not found" });
		if (email && email !== existingUser.email) {
			const emailConflict = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" }, id: { not: id } } });
			if (emailConflict) return res.status(409).json({ error: "Email already exists" });
		}
		const user = await prisma.user.update({
			where: { id },
			data: { ...(name !== undefined && { name }), ...(email && { email }), ...(phone !== undefined && { phone }), ...(address !== undefined && { address }), ...(city !== undefined && { city }) },
			select: { id: true, name: true, email: true, phone: true, address: true, city: true, role: true, isActive: true, createdAt: true, updatedAt: true },
		});
		res.json(user);
	} catch (err) {
		next(err);
	}
};

export const deleteUser = async (req, res, next) => {
	try {
		const { id } = req.params;
		const user = await prisma.user.findUnique({ where: { id } });
		if (!user) return res.status(404).json({ error: "User not found" });
		if (user.id === req.user.id) return res.status(400).json({ error: "Cannot delete your own account" });
		const orderCount = await prisma.order.count({ where: { userId: id } });
		if (orderCount > 0) return res.status(400).json({ error: `Cannot delete user. They have ${orderCount} orders. Please handle orders first.` });
		await prisma.user.delete({ where: { id } });
		res.json({ message: "User deleted successfully" });
	} catch (err) {
		next(err);
	}
};

export const getUserStats = async (req, res, next) => {
	try {
		const [totalUsers, adminUsers, userUsers, recentUsers, usersWithOrders] = await Promise.all([
			prisma.user.count(),
			prisma.user.count({ where: { role: "ADMIN" } }),
			prisma.user.count({ where: { role: "CUSTOMER" } }),
			prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
			prisma.user.count({ where: { orders: { some: {} } } }),
		]);
		res.json({ totalUsers, adminUsers, userUsers, recentUsers, usersWithOrders, usersWithoutOrders: totalUsers - usersWithOrders });
	} catch (err) {
		next(err);
	}
};

// Products
export const getAdminProducts = async (req, res, next) => {
	try {
		const { page = 1, limit = 10, search, categoryId } = req.query;
		const skip = (page - 1) * limit;
		const where = {};
		if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }];
		if (categoryId) where.categoryId = categoryId;
		const [products, total] = await Promise.all([
			prisma.product.findMany({
				where,
				include: {
					category: true,
					specs: { include: { specField: true } },
					reviews: { include: { user: { select: { id: true, name: true } } } },
				},
				skip: parseInt(skip),
				take: parseInt(limit),
				orderBy: { createdAt: "desc" },
			}),
			prisma.product.count({ where }),
		]);
		const normalized = products.map((p) => ({ ...p, categoryId: p.categoryId, inStock: typeof p.stock === "number" ? p.stock > 0 : false }));
		res.json({ products: normalized, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
	} catch (err) {
		next(err);
	}
};

export const getAdminProductById = async (req, res, next) => {
	try {
		const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { category: true, specs: { include: { specField: true } }, reviews: { include: { user: { select: { id: true, name: true } } } } } });
		if (!product) return res.status(404).json({ error: "Product not found" });
		const normalized = { ...product, categoryId: product.categoryId, inStock: typeof product.stock === "number" ? product.stock > 0 : !!product.inStock };
		res.json(normalized);
	} catch (err) {
		next(err);
	}
};

export const createProduct = async (req, res, next) => {
	try {
		const { name, description, price, image, categoryId, inStock, stock, specs = [] } = req.body;
		if (!name || price === undefined || !categoryId) return res.status(400).json({ error: "Missing required fields" });
		const category = await prisma.category.findUnique({ where: { id: categoryId } });
		if (!category) return res.status(400).json({ error: "Category not found" });
		const resolvedStock = stock !== undefined && stock !== null && !Number.isNaN(Number(stock)) ? parseInt(stock) : inStock !== undefined ? (inStock ? 1 : 0) : 1;
		const product = await prisma.product.create({
			data: {
				name,
				description,
				price: parseFloat(price),
				image,
				category: { connect: { id: categoryId } },
				stock: resolvedStock,
				specs: { create: specs.map((spec) => ({ specFieldId: spec.specFieldId, value: spec.value })) },
			},
			include: { category: true, specs: { include: { specField: true } } },
		});
		res.status(201).json(product);
	} catch (err) {
		next(err);
	}
};

export const updateProduct = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { name, description, price, image, categoryId, inStock, stock, specs = [] } = req.body;
		const existingProduct = await prisma.product.findUnique({ where: { id } });
		if (!existingProduct) return res.status(404).json({ error: "Product not found" });
		if (categoryId) {
			const category = await prisma.category.findUnique({ where: { id: categoryId } });
			if (!category) return res.status(400).json({ error: "Category not found" });
		}
		const product = await prisma.product.update({
			where: { id },
			data: {
				...(name && { name }),
				...(description !== undefined && { description }),
				...(price !== undefined && { price: parseFloat(price) }),
				...(image && { image }),
				...(categoryId && { category: { connect: { id: categoryId } } }),
				...((stock !== undefined && stock !== null && !Number.isNaN(Number(stock))) ? { stock: parseInt(stock) } : inStock !== undefined ? { stock: inStock ? 1 : 0 } : {}),
				...(specs.length > 0 ? { specs: { deleteMany: {}, create: specs.map((spec) => ({ specFieldId: spec.specFieldId, value: spec.value })) } } : {}),
			},
			include: { category: true, specs: { include: { specField: true } } },
		});
		res.json(product);
	} catch (err) {
		next(err);
	}
};

export const deleteProduct = async (req, res, next) => {
	try {
		const product = await prisma.product.findUnique({ where: { id: req.params.id } });
		if (!product) return res.status(404).json({ error: "Product not found" });
		await prisma.product.delete({ where: { id: req.params.id } });
		res.json({ message: "Product deleted successfully" });
	} catch (err) {
		next(err);
	}
};

export const downloadProductTemplate = async (req, res, next) => {
	try {
		const { categoryId } = req.params;
		const category = await prisma.category.findUnique({ where: { id: categoryId }, include: { specFields: true } });
		if (!category) return res.status(404).json({ error: "Category not found" });
		const baseColumns = ["name", "description", "price", "stock", "image"];
		const specColumns = category.specFields.map((f) => `spec:${f.name}`);
		const headers = [...baseColumns, ...specColumns];
		const ws = xlsx.utils.json_to_sheet([{}], { header: headers });
		const wb = xlsx.utils.book_new();
		xlsx.utils.book_append_sheet(wb, ws, category.name.slice(0, 31));
		const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
		res.setHeader("Content-Disposition", `attachment; filename="template-${category.name}.xlsx"`);
		res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
		res.send(buffer);
	} catch (err) {
		next(err);
	}
};

export const importProductsFromExcel = async (req, res, next) => {
	try {
		const { categoryId } = req.body;
		if (!categoryId) return res.status(400).json({ error: "Missing categoryId" });
		if (!req.file) return res.status(400).json({ error: "No file uploaded" });
		const category = await prisma.category.findUnique({ where: { id: categoryId }, include: { specFields: true } });
		if (!category) return res.status(404).json({ error: "Category not found" });
		let workbook;
		try {
			workbook = xlsx.read(req.file.buffer, { type: "buffer" });
		} catch {
			return res.status(400).json({ error: "Invalid Excel file" });
		}
		const sheetName = workbook.SheetNames[0];
		if (!sheetName) return res.status(400).json({ error: "Empty workbook" });
		const worksheet = workbook.Sheets[sheetName];
		if (!worksheet) return res.status(400).json({ error: "Missing worksheet" });
		const rows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
		if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: "No data rows found" });
		const results = [];
		for (const row of rows) {
			const name = String(row.name || "").trim();
			const description = String(row.description || "");
			const price = Number(row.price || 0);
			const stock = Number(row.stock || 0);
			const image = String(row.image || "");
			if (!name || !Number.isFinite(price)) {
				results.push({ name, ok: false, error: "Missing required name or price" });
				continue;
			}
			const specValues = [];
			let missingRequired = null;
			for (const field of category.specFields) {
				const key = `spec:${field.name}`;
				const value = row[key];
				if ((value === undefined || value === "") && field.required) {
					missingRequired = field.name;
					break;
				}
				if (value !== undefined && value !== "") {
					specValues.push({ specFieldId: field.id, value: String(value) });
				}
			}
			if (missingRequired) {
				results.push({ name, ok: false, error: `Missing required spec ${missingRequired}` });
				continue;
			}
			const created = await prisma.product.create({
				data: {
					name,
					description,
					price,
					stock,
					image,
					category: { connect: { id: categoryId } },
					specs: { create: specValues.map((sv) => ({ specFieldId: sv.specFieldId, value: sv.value })) },
				},
				include: { category: true, specs: { include: { specField: true } } },
			});
			results.push({ name: created.name, ok: true, id: created.id });
		}
		res.json({ imported: results.filter((r) => r.ok).length, results });
	} catch (err) {
		next(err);
	}
};

// Categories
export const getAdminCategories = async (req, res, next) => {
	try {
		const { page = 1, limit = 10, search } = req.query;
		const skip = (page - 1) * limit;
		const where = {};
		if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }];
		const [categories, total] = await Promise.all([
			prisma.category.findMany({ where, include: { products: { select: { id: true, name: true, price: true, image: true } }, specFields: true }, skip: parseInt(skip), take: parseInt(limit), orderBy: { createdAt: "desc" } }),
			prisma.category.count({ where }),
		]);
		res.json({ categories, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
	} catch (err) {
		next(err);
	}
};

export const getAdminCategoryById = async (req, res, next) => {
	try {
		const category = await prisma.category.findUnique({ where: { id: req.params.id }, include: { products: { include: { specs: { include: { specField: true } } } }, specFields: true } });
		if (!category) return res.status(404).json({ error: "Category not found" });
		res.json(category);
	} catch (err) {
		next(err);
	}
};

export const createCategory = async (req, res, next) => {
	try {
		const { name, description, image, specFields = [] } = req.body;
		if (!name) return res.status(400).json({ error: "Missing name" });
		const existing = await prisma.category.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
		if (existing) return res.status(409).json({ error: "Category name already exists" });
		const category = await prisma.category.create({
			data: { name, description, image, specFields: { create: specFields.map((f) => ({ name: f.name, type: f.type || "TEXT", required: f.required || false })) } },
			include: { specFields: true },
		});
		res.status(201).json(category);
	} catch (err) {
		next(err);
	}
};

export const updateCategory = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { name, description, image, specFields = [] } = req.body;
		const existing = await prisma.category.findUnique({ where: { id } });
		if (!existing) return res.status(404).json({ error: "Category not found" });
		if (name && name !== existing.name) {
			const nameConflict = await prisma.category.findFirst({ where: { name: { equals: name, mode: "insensitive" }, id: { not: id } } });
			if (nameConflict) return res.status(409).json({ error: "Category name already exists" });
		}
		await prisma.category.update({ where: { id }, data: { ...(name && { name }), ...(description !== undefined && { description }), ...(image && { image }) } });
		if (specFields.length > 0) {
			await prisma.specField.deleteMany({ where: { categoryId: id } });
			await prisma.specField.createMany({ data: specFields.map((f) => ({ categoryId: id, name: f.name, type: f.type || "TEXT", required: f.required || false })) });
		}
		const updated = await prisma.category.findUnique({ where: { id }, include: { specFields: true } });
		res.json(updated);
	} catch (err) {
		next(err);
	}
};

export const deleteCategory = async (req, res, next) => {
	try {
		const { id } = req.params;
		const category = await prisma.category.findUnique({ where: { id } });
		if (!category) return res.status(404).json({ error: "Category not found" });
		const productCount = await prisma.product.count({ where: { categoryId: id } });
		if (productCount > 0) return res.status(400).json({ error: `Cannot delete category. It has ${productCount} products. Please move or delete products first.` });
		await prisma.category.delete({ where: { id } });
		res.json({ message: "Category deleted successfully" });
	} catch (err) {
		next(err);
	}
};

// Orders
export const getAdminOrders = async (req, res, next) => {
	try {
		const { status, payment, search, page = 1, limit = 10 } = req.query;
		const where = {};
		if (status && status !== "all") where.status = status.toUpperCase();
		if (payment && payment !== "all") where.paymentStatus = payment.toUpperCase();
		if (search) where.OR = [{ id: { contains: search, mode: "insensitive" } }, { user: { name: { contains: search, mode: "insensitive" } } }, { user: { email: { contains: search, mode: "insensitive" } } }];
		const orders = await prisma.order.findMany({
			where,
			select: {
				id: true,
				totalPrice: true,
				status: true,
				paymentStatus: true,
				paymentMethod: true,
				transactionId: true,
				paidAt: true,
				createdAt: true,
				ghnOrderCode: true,
				user: { select: { id: true, name: true, email: true, phone: true } },
				orderItems: { include: { product: { select: { id: true, name: true, image: true, price: true } } } },
			},
			orderBy: { createdAt: "desc" },
			skip: (parseInt(page) - 1) * parseInt(limit),
			take: parseInt(limit),
		});
		const total = await prisma.order.count({ where });
		res.json({ orders, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
	} catch (err) {
		next(err);
	}
};

export const getAdminOrderById = async (req, res, next) => {
	try {
		const order = await prisma.order.findUnique({
			where: { id: req.params.id },
			select: {
				id: true,
				totalPrice: true,
				status: true,
				paymentStatus: true,
				paymentMethod: true,
				transactionId: true,
				paidAt: true,
				createdAt: true,
				ghnOrderCode: true,
				user: { select: { id: true, name: true, email: true, phone: true } },
				orderItems: { include: { product: { select: { id: true, name: true, image: true, price: true } } } },
			},
		});
		if (!order) return res.status(404).json({ error: "Order not found" });
		res.json(order);
	} catch (err) {
		next(err);
	}
};

export const updateAdminOrderStatus = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { status, paymentStatus } = req.body;
		const validStatuses = ["PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELLED"];
		const validPaymentStatuses = ["PENDING", "PAID", "REFUNDED"];
		if (status && !validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });
		if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) return res.status(400).json({ error: "Invalid payment status" });
		const updateData = {};
		if (status) updateData.status = status;
		if (paymentStatus) updateData.paymentStatus = paymentStatus;
		const order = await prisma.order.findUnique({ where: { id } });
		if (!order) return res.status(404).json({ error: "Order not found" });
		const updatedOrder = await prisma.order.update({ where: { id }, data: updateData, include: { user: { select: { id: true, name: true, email: true, phone: true } }, orderItems: { include: { product: { select: { id: true, name: true, image: true, price: true } } } } } });
		res.json(updatedOrder);
	} catch (err) {
		next(err);
	}
};

export const getOrderStats = async (req, res, next) => {
	try {
		const totalOrders = await prisma.order.count();
		const pendingOrders = await prisma.order.count({ where: { status: "PENDING" } });
		const processingOrders = await prisma.order.count({ where: { status: "PROCESSING" } });
		const shippingOrders = await prisma.order.count({ where: { status: "SHIPPING" } });
		const completedOrders = await prisma.order.count({ where: { status: "COMPLETED" } });
		const cancelledOrders = await prisma.order.count({ where: { status: "CANCELLED" } });
		const totalRevenue = await prisma.order.aggregate({ where: { status: "COMPLETED" }, _sum: { totalPrice: true } });
		res.json({ totalOrders, pendingOrders, processingOrders, shippingOrders, completedOrders, cancelledOrders, totalRevenue: totalRevenue._sum.totalPrice || 0 });
	} catch (err) {
		next(err);
	}
};

export const getGHNOrderDetail = async (req, res, next) => {
	try {
		const { orderCode } = req.params;
		if (!orderCode) return res.status(400).json({ error: "Order code is required" });
		const ghnDetail = await ghnService.getOrderDetail(orderCode);
		res.json({ success: true, data: ghnDetail });
	} catch (err) {
		return res.status(500).json({ error: "Không thể lấy chi tiết đơn hàng GHN", details: err.message });
	}
};

export const cancelOrder = async (req, res, next) => {
	try {
		const { id } = req.params;
		const order = await prisma.order.findUnique({ where: { id }, select: { id: true, status: true, ghnOrderCode: true, user: { select: { id: true, name: true, email: true } } } });
		if (!order) return res.status(404).json({ error: "Đơn hàng không tồn tại" });
		if (order.status === "CANCELLED") return res.status(400).json({ error: "Đơn hàng đã được hủy trước đó" });
		if (order.status === "COMPLETED") return res.status(400).json({ error: "Không thể hủy đơn hàng đã hoàn thành" });
		if (order.status === "SHIPPING") return res.status(400).json({ error: "Không thể hủy đơn hàng đang vận chuyển" });
		let ghnResult = null;
		if (order.ghnOrderCode) {
			try {
				ghnResult = await ghnService.cancelOrder(order.ghnOrderCode);
			} catch (ghnError) {
				ghnResult = { success: false, error: ghnError.message, message: "Lỗi khi hủy đơn hàng trên GHN" };
			}
		}
		const updatedOrder = await prisma.order.update({ where: { id }, data: { status: "CANCELLED", updatedAt: new Date() }, include: { user: { select: { id: true, name: true, email: true, phone: true } }, orderItems: { include: { product: { select: { id: true, name: true, image: true, price: true } } } } } });
		res.json({ success: true, message: "Đơn hàng đã được hủy thành công", order: updatedOrder, ghnResult });
	} catch (err) {
		next(err);
	}
};
