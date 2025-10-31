import prisma from "../utils/prisma.js";

export const findAll = () => prisma.category.findMany();
export const findById = (id) => prisma.category.findUnique({ where: { id } });
export const create = (data) => prisma.category.create({ data });
export const updateById = (id, data) => prisma.category.update({ where: { id }, data });
export const deleteById = (id) => prisma.category.delete({ where: { id } });
