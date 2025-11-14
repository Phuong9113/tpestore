import prisma from "./prisma.js";

/**
 * Generate a unique ID with prefix and auto-incrementing number
 * Format: PREFIX + padded number (e.g., USR0001, PRD0001)
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

