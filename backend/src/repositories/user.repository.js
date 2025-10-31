import prisma from "../utils/prisma.js";

export const findById = (id) => prisma.user.findUnique({ where: { id } });
export const findByEmail = (email) => prisma.user.findUnique({ where: { email } });
export const create = (data) => prisma.user.create({ data });
export const updateById = (id, data) => prisma.user.update({ where: { id }, data });
export const findMany = (args = {}) => prisma.user.findMany(args);
