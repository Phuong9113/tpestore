import prisma from "../utils/prisma.js";

export const findAll = (args = {}) => prisma.order.findMany(args);
export const findById = (id) => prisma.order.findUnique({ where: { id } });
export const create = (data) => prisma.order.create({ data });
export const updateById = (id, data) => prisma.order.update({ where: { id }, data });
