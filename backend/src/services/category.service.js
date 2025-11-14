import prisma from "../utils/prisma.js";

export const list = async () => {
	try {
		return await prisma.category.findMany({
			include: {
				products: { select: { id: true, name: true, price: true, image: true } },
				specFields: true,
			},
			orderBy: { createdAt: "desc" },
		});
	} catch (error) {
		console.error("Error fetching categories:", error);
		throw error;
	}
};

export const getById = async (id) => {
	const category = await prisma.category.findUnique({
		where: { id },
		include: {
			products: { include: { specs: { include: { specField: true } } } },
			specFields: true,
		},
	});
	if (!category) {
		const err = new Error("Category not found");
		err.status = 404;
		throw err;
	}
	return category;
};
