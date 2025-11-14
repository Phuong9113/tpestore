import prisma from "../utils/prisma.js";
import { generateId } from "../utils/generateId.js";

export const findAll = () =>
	prisma.product.findMany({ include: { category: true } });

export const findById = (id) =>
	prisma.product.findUnique({ where: { id }, include: { category: true } });

export const create = async (data) => {
	const id = await generateId("PRD", "Product");
	return prisma.product.create({ data: { ...data, id } });
};
export const updateById = (id, data) => prisma.product.update({ where: { id }, data });
export const deleteById = (id) => prisma.product.delete({ where: { id } });
