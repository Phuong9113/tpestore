import prisma from "../utils/prisma.js";
import { generateId } from "../utils/generateId.js";

export const findAllByUser = (userId) =>
	prisma.address.findMany({
		where: { userId },
		orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
	});

export const findByIdForUser = (id, userId) =>
	prisma.address.findFirst({ where: { id, userId } });

export const unsetDefaultForUser = (userId, excludeId) =>
	prisma.address.updateMany({
		where: excludeId ? { userId, id: { not: excludeId } } : { userId },
		data: { isDefault: false },
	});

export const create = async (data) => {
	const id = await generateId("ADD", "Address");
	return prisma.address.create({ data: { ...data, id } });
};

export const updateById = (id, data) => prisma.address.update({ where: { id }, data });

export const deleteById = (id) => prisma.address.delete({ where: { id } });
