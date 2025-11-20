import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthProvider } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { isValidEmail, isValidPassword, validateRequired } from "../utils/helpers.js";
import { generateId } from "../utils/generateId.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret";
const PUBLIC_USER_FIELDS = { id: true, name: true, email: true, role: true };

const buildAuthResponse = (user) => {
	const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
	return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

const formatNameFromEmail = (email) => email?.split("@")[0] || "Google User";

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
	const id = await generateId("USR", "User");
	const user = await prisma.user.create({
		data: { id, name: name || email.split("@")[0], email, password: passwordHash, provider: AuthProvider.CREDENTIALS },
	});
	return buildAuthResponse(user);
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
	if (!user.password) {
		const err = new Error("Tài khoản này được đăng nhập bằng Google");
		err.status = 400;
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
	return buildAuthResponse(user);
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

const ensureProviderPayload = ({ providerId, email }) => {
	if (!providerId) {
		const err = new Error("Thiếu providerId");
		err.status = 400;
		throw err;
	}
	if (!email) {
		const err = new Error("Thiếu email");
		err.status = 400;
		throw err;
	}
};

const upsertProviderUser = async ({ provider, providerId, email, name }) => {
	ensureProviderPayload({ providerId, email });
	let user = await prisma.user.findUnique({ where: { providerId } });
	if (!user) {
		user = await prisma.user.findUnique({ where: { email } });
	}
	if (!user) {
		const id = await generateId("USR", "User");
		user = await prisma.user.create({
			data: {
				id,
				email,
				name: name || formatNameFromEmail(email),
				provider,
				providerId,
			},
			select: PUBLIC_USER_FIELDS,
		});
		return user;
	}
	if (!user.providerId || user.provider !== provider) {
		user = await prisma.user.update({
			where: { id: user.id },
			data: { providerId, provider },
			select: PUBLIC_USER_FIELDS,
		});
	}
	return user;
};

export const loginWithGoogle = async ({ providerId, email, name }) => {
	const user = await upsertProviderUser({
		provider: AuthProvider.GOOGLE,
		providerId,
		email: email?.toLowerCase(),
		name,
	});
	return buildAuthResponse(user);
};
