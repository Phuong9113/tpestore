import prisma from "../utils/prisma.js";
import { success } from "../utils/response.js";

// Helper function to sanitize strings - remove null bytes and control characters
const sanitizeString = (str) => {
	if (str === null || str === undefined) return null;
	if (typeof str !== 'string') {
		if (str && typeof str.toString === 'function') {
			str = str.toString();
		} else {
			return str;
		}
	}
	// Remove null bytes (0x00) and other control characters
	let cleaned = str.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim();
	return cleaned || null;
};

export const updateProfile = async (req, res, next) => {
	try {
		const userId = req.user.id;
		let { name, phone, address, city, birthDate, gender } = req.body;
		
		// Sanitize all string inputs
		name = name !== undefined ? sanitizeString(name) : undefined;
		phone = phone !== undefined ? sanitizeString(phone) : undefined;
		address = address !== undefined ? sanitizeString(address) : undefined;
		city = city !== undefined ? sanitizeString(city) : undefined;
		gender = gender !== undefined ? sanitizeString(gender) : undefined;
		
		// Validate user exists
		const existingUser = await prisma.user.findUnique({ where: { id: userId } });
		if (!existingUser) {
			return res.status(404).json({ error: "User not found" });
		}
		
		// Prepare update data
		const updateData = {};
		
		if (name !== undefined) updateData.name = name;
		if (phone !== undefined) updateData.phone = phone;
		if (address !== undefined) updateData.address = address;
		if (city !== undefined) updateData.city = city;
		
		// Handle birthDate
		if (birthDate !== undefined) {
			if (birthDate === null || birthDate === "" || (typeof birthDate === 'string' && birthDate.trim() === "")) {
				updateData.birthDate = null;
			} else {
				try {
					let dateStr = birthDate;
					if (typeof dateStr === 'string') {
						dateStr = sanitizeString(dateStr);
					}
					const dateValue = new Date(dateStr);
					if (isNaN(dateValue.getTime())) {
						return res.status(400).json({ error: "Invalid birthDate format" });
					}
					updateData.birthDate = dateValue;
				} catch (dateError) {
					return res.status(400).json({ error: "Invalid birthDate format", details: dateError.message });
				}
			}
		}
		
		// Handle gender
		if (gender !== undefined) {
			if (gender !== null && gender !== "" && !['Nam', 'Nữ', 'Khác'].includes(gender)) {
				return res.status(400).json({ error: "Invalid gender value. Must be 'Nam', 'Nữ', or 'Khác'" });
			}
			updateData.gender = (gender === "" || gender === null) ? null : gender;
		}
		
		// Final sanitization check
		for (const key in updateData) {
			if (updateData[key] === null || updateData[key] === undefined) continue;
			if (updateData[key] instanceof Date) {
				if (isNaN(updateData[key].getTime())) {
					delete updateData[key];
				}
			} else if (typeof updateData[key] === 'string') {
				updateData[key] = sanitizeString(updateData[key]);
				if (updateData[key] && updateData[key].includes('\0')) {
					updateData[key] = updateData[key].replace(/\0/g, '');
				}
			}
		}
		
		// Update user
		const user = await prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				address: true,
				city: true,
				birthDate: true,
				gender: true,
				role: true,
				isActive: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		
		// Disable caching
		res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
		res.setHeader('Pragma', 'no-cache');
		res.setHeader('Expires', '0');
		
		success(res, user);
	} catch (err) {
		console.error("Error updating profile:", err);
		if (err.code) {
			console.error("Prisma error code:", err.code);
		}
		if (err.meta) {
			console.error("Prisma error meta:", err.meta);
		}
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
				birthDate: true,
				gender: true,
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
		
		// Disable caching
		res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
		res.setHeader('Pragma', 'no-cache');
		res.setHeader('Expires', '0');
		
		success(res, user);
	} catch (err) {
		console.error('getProfile error:', err);
		next(err);
	}
};

