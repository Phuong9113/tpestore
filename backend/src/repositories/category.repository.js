import prisma from "../utils/prisma.js";
import { generateId } from "../utils/generateId.js";

export const findAll = () => prisma.category.findMany();
export const findById = (id) => prisma.category.findUnique({ where: { id } });
export const create = async (data) => {
	const id = await generateId("CAT", "Category");
	return prisma.category.create({ data: { ...data, id } });
};
export const updateById = (id, data) => prisma.category.update({ where: { id }, data });
export const deleteById = (id) => prisma.category.delete({ where: { id } });
