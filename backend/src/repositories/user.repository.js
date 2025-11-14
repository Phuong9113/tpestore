import prisma from "../utils/prisma.js";
import { generateId } from "../utils/generateId.js";

export const findById = (id) => prisma.user.findUnique({ where: { id } });
export const findByEmail = (email) => prisma.user.findUnique({ where: { email } });
export const create = async (data) => {
	const id = await generateId("USR", "User");
	return prisma.user.create({ data: { ...data, id } });
};
export const updateById = (id, data) => prisma.user.update({ where: { id }, data });
export const findMany = (args = {}) => prisma.user.findMany(args);
