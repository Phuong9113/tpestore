import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";
import { isValidEmail, isValidPassword, validateRequired } from "../utils/helpers.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret";

export const register = async ({ name, email, password }) => {
	const validation = validateRequired({ email, password }, ["email", "password"]);
	if (validation) {
		const err = new Error(validation.error || "Validation error");
		err.status = 400;
		throw err;
	}
	if (!isValidEmail(email)) {
		const err = new Error("Invalid email format");
		err.status = 400;
		throw err;
	}
	if (!isValidPassword(password)) {
		const err = new Error("Password must be at least 6 characters");
		err.status = 400;
		throw err;
	}
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		const err = new Error("Email already registered");
		err.status = 409;
		throw err;
	}
	const passwordHash = await bcrypt.hash(password, 10);
	const user = await prisma.user.create({
		data: { name: name || email.split("@")[0], email, password: passwordHash },
	});
	const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
	return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

export const login = async ({ email, password }) => {
	const validation = validateRequired({ email, password }, ["email", "password"]);
	if (validation) {
		const err = new Error(validation.error || "Validation error");
		err.status = 400;
		throw err;
	}
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		const err = new Error("Invalid credentials");
		err.status = 401;
		throw err;
	}
	let isValid = false;
	try {
		isValid = await bcrypt.compare(password, user.password);
	} catch {}
	if (!isValid) {
		// Fallback for legacy plaintext passwords: migrate to bcrypt on-the-fly
		if (user.password === password) {
			const passwordHash = await bcrypt.hash(password, 10);
			await prisma.user.update({ where: { id: user.id }, data: { password: passwordHash } });
			isValid = true;
		}
	}
	if (!isValid) {
		const err = new Error("Invalid credentials");
		err.status = 401;
		throw err;
	}
	const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
	return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

export const getMe = async (userId) => {
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } });
	if (!user) {
		const err = new Error("User not found");
		err.status = 404;
		throw err;
	}
	return { user };
};

export const updateMe = async (userId, { name }) => {
	const updated = await prisma.user.update({ where: { id: userId }, data: { name }, select: { id: true, name: true, email: true, role: true } });
	return { user: updated };
};
