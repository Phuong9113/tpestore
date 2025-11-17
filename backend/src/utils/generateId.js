import prisma from "./prisma.js";

/**
 * Generate a unique ID with prefix and auto-incrementing number
 * Format: PREFIX + padded number (e.g., USR0001, PRD0001)
 * 
 * Prefix mapping:
 * - User → USR
 * - Address → ADD
 * - Category → CAT
 * - SpecField → SPF
 * - Product → PRD
 * - SpecValue → SPV
 * - CartItem → CRT
 * - Order → ORD
 * - OrderItem → ORI
 * - Review → REV
 * - ProductInteraction → PIN
 * 
 * @param {string} prefix - The prefix for the ID (e.g., "USR", "PRD")
 * @param {string} tableName - The Prisma model name (e.g., "User", "Product")
 * @returns {Promise<string>} - The generated ID (e.g., "USR0001")
 * 
 * @example
 * const userId = await generateId("USR", "User");
 * // Returns: "USR0001" (or next available number)
 */
export async function generateId(prefix, tableName) {
	// Map table names to Prisma client methods
	const tableMap = {
		User: prisma.user,
		Address: prisma.address,
		Category: prisma.category,
		SpecField: prisma.specField,
		Product: prisma.product,
		SpecValue: prisma.specValue,
		CartItem: prisma.cartItem,
		Order: prisma.order,
		OrderItem: prisma.orderItem,
		Review: prisma.review,
		ProductInteraction: prisma.productInteraction,
		OrderStatusNotification: prisma.orderStatusNotification,
	};

	const model = tableMap[tableName];
	if (!model) {
		throw new Error(`Unknown table name: ${tableName}`);
	}

	// Use transaction to prevent race conditions
	return await prisma.$transaction(async (tx) => {
		// Find the maximum ID with this prefix
		const allRecords = await model.findMany({
			select: { id: true },
			orderBy: { id: "desc" },
		});

		// Filter records that match the prefix pattern
		const prefixPattern = new RegExp(`^${prefix}\\d+$`);
		const matchingIds = allRecords
			.map((r) => r.id)
			.filter((id) => prefixPattern.test(id));

		let nextNumber = 1;

		if (matchingIds.length > 0) {
			// Extract numbers from matching IDs and find the maximum
			const numbers = matchingIds.map((id) => {
				const numStr = id.replace(prefix, "");
				return parseInt(numStr, 10);
			});

			const maxNumber = Math.max(...numbers);
			nextNumber = maxNumber + 1;
		}

		// Generate ID with zero-padding (4 digits: 0001, 0002, etc.)
		const paddedNumber = String(nextNumber).padStart(4, "0");
		const newId = `${prefix}${paddedNumber}`;

		// Double-check uniqueness (in case of race condition)
		const existing = await model.findUnique({
			where: { id: newId },
		});

		if (existing) {
			// If ID exists, try next number
			nextNumber += 1;
			const paddedNumber2 = String(nextNumber).padStart(4, "0");
			return `${prefix}${paddedNumber2}`;
		}

		return newId;
	}, {
		// Increase timeout for transaction (default is 5s)
		timeout: 10000,
	});
}

/**
 * Generate multiple unique IDs in a single transaction
 * This is more efficient than calling generateId multiple times in parallel
 * 
 * @param {string} prefix - The prefix for the ID (e.g., "USR", "PRD")
 * @param {string} tableName - The Prisma model name (e.g., "User", "Product")
 * @param {number} count - Number of IDs to generate
 * @returns {Promise<string[]>} - Array of generated IDs
 * 
 * @example
 * const ids = await generateMultipleIds("SPF", "SpecField", 5);
 * // Returns: ["SPF0001", "SPF0002", "SPF0003", "SPF0004", "SPF0005"]
 */
export async function generateMultipleIds(prefix, tableName, count) {
	if (count <= 0) return [];
	if (count === 1) return [await generateId(prefix, tableName)];

	// Map table names to Prisma client methods
	const tableMap = {
		User: prisma.user,
		Address: prisma.address,
		Category: prisma.category,
		SpecField: prisma.specField,
		Product: prisma.product,
		SpecValue: prisma.specValue,
		CartItem: prisma.cartItem,
		Order: prisma.order,
		OrderItem: prisma.orderItem,
		Review: prisma.review,
		ProductInteraction: prisma.productInteraction,
		OrderStatusNotification: prisma.orderStatusNotification,
	};

	const model = tableMap[tableName];
	if (!model) {
		throw new Error(`Unknown table name: ${tableName}`);
	}

	// Use a single transaction to generate all IDs
	return await prisma.$transaction(async (tx) => {
		// Find the maximum ID with this prefix
		const allRecords = await model.findMany({
			select: { id: true },
			orderBy: { id: "desc" },
		});

		// Filter records that match the prefix pattern
		const prefixPattern = new RegExp(`^${prefix}\\d+$`);
		const matchingIds = allRecords
			.map((r) => r.id)
			.filter((id) => prefixPattern.test(id));

		let startNumber = 1;

		if (matchingIds.length > 0) {
			// Extract numbers from matching IDs and find the maximum
			const numbers = matchingIds.map((id) => {
				const numStr = id.replace(prefix, "");
				return parseInt(numStr, 10);
			});

			const maxNumber = Math.max(...numbers);
			startNumber = maxNumber + 1;
		}

		// Generate all IDs
		const ids = [];
		for (let i = 0; i < count; i++) {
			const number = startNumber + i;
			const paddedNumber = String(number).padStart(4, "0");
			const newId = `${prefix}${paddedNumber}`;
			ids.push(newId);
		}

		// Verify all IDs are unique (check if any exist)
		const existingIds = await model.findMany({
			where: { id: { in: ids } },
			select: { id: true },
		});

		if (existingIds.length > 0) {
			// If any IDs exist, find the next available range
			const existingIdSet = new Set(existingIds.map((r) => r.id));
			const availableIds = [];
			let currentNumber = startNumber;

			while (availableIds.length < count) {
				const paddedNumber = String(currentNumber).padStart(4, "0");
				const candidateId = `${prefix}${paddedNumber}`;
				if (!existingIdSet.has(candidateId)) {
					availableIds.push(candidateId);
				}
				currentNumber++;
			}

			return availableIds;
		}

		return ids;
	}, {
		// Increase timeout for transaction (default is 5s)
		timeout: 10000,
	});
}

