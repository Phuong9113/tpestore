import * as authService from "../services/auth.service.js";
import { success } from "../utils/response.js";

export const register = async (req, res, next) => {
	try {
		const result = await authService.register(req.body);
		success(res, result);
	} catch (err) {
		next(err);
	}
};

export const login = async (req, res, next) => {
	try {
		const result = await authService.login(req.body);
		success(res, result);
	} catch (err) {
		next(err);
	}
};

export const getMe = async (req, res, next) => {
	try {
		const result = await authService.getMe(req.user.id);
		success(res, result);
	} catch (err) {
		next(err);
	}
};

export const updateMe = async (req, res, next) => {
	try {
		const result = await authService.updateMe(req.user.id, req.body);
		success(res, result);
	} catch (err) {
		next(err);
	}
};

export const loginWithGoogle = async (req, res, next) => {
	try {
		const result = await authService.loginWithGoogle(req.body);
		success(res, result);
	} catch (err) {
		next(err);
	}
};
