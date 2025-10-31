import * as addressService from "../services/address.service.js";
import { success } from "../utils/response.js";

export const getAddresses = async (req, res, next) => {
	try {
		const data = await addressService.listForUser(req.user.id);
		success(res, data);
	} catch (err) {
		next(err);
	}
};

export const getAddressById = async (req, res, next) => {
	try {
		const data = await addressService.getForUser(req.params.id, req.user.id);
		success(res, data);
	} catch (err) {
		next(err);
	}
};

export const createAddress = async (req, res, next) => {
	try {
		const data = await addressService.createForUser(req.user.id, req.body);
		success(res, data, "Created", 201);
	} catch (err) {
		next(err);
	}
};

export const updateAddress = async (req, res, next) => {
	try {
		const data = await addressService.updateForUser(req.params.id, req.user.id, req.body);
		success(res, data);
	} catch (err) {
		next(err);
	}
};

export const deleteAddress = async (req, res, next) => {
	try {
		const data = await addressService.removeForUser(req.params.id, req.user.id);
		success(res, data);
	} catch (err) {
		next(err);
	}
};

export const setDefaultAddress = async (req, res, next) => {
	try {
		const data = await addressService.setDefaultForUser(req.params.id, req.user.id);
		success(res, data);
	} catch (err) {
		next(err);
	}
};
