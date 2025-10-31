import prisma from "../utils/prisma.js";

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

export const create = (data) => prisma.address.create({ data });

export const updateById = (id, data) => prisma.address.update({ where: { id }, data });

export const deleteById = (id) => prisma.address.delete({ where: { id } });
