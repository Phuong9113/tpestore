import prisma from "../utils/prisma.js";

export const findAll = () =>
	prisma.product.findMany({ include: { category: true } });

export const findById = (id) =>
	prisma.product.findUnique({ where: { id }, include: { category: true } });

export const create = (data) => prisma.product.create({ data });
export const updateById = (id, data) => prisma.product.update({ where: { id }, data });
export const deleteById = (id) => prisma.product.delete({ where: { id } });
