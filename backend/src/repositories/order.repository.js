import prisma from "../utils/prisma.js";
import { generateId } from "../utils/generateId.js";

export const findAll = (args = {}) => prisma.order.findMany(args);
export const findById = (id) => prisma.order.findUnique({ where: { id } });
export const create = async (data) => {
	const id = await generateId("ORD", "Order");
	return prisma.order.create({ data: { ...data, id } });
};
export const updateById = (id, data) => prisma.order.update({ where: { id }, data });
