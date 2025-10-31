import * as addressRepo from "../repositories/address.repository.js";

export const listForUser = (userId) => addressRepo.findAllByUser(userId);

export const getForUser = async (id, userId) => {
	const addr = await addressRepo.findByIdForUser(id, userId);
	if (!addr) {
		const err = new Error("Address not found");
		err.status = 404;
		throw err;
	}
	return addr;
};

export const createForUser = async (userId, data) => {
	if (data.isDefault) {
		await addressRepo.unsetDefaultForUser(userId);
	}
	return addressRepo.create({ ...data, userId, isDefault: data.isDefault || false });
};

export const updateForUser = async (id, userId, data) => {
	const existing = await addressRepo.findByIdForUser(id, userId);
	if (!existing) {
		const err = new Error("Address not found");
		err.status = 404;
		throw err;
	}
	if (data.isDefault && !existing.isDefault) {
		await addressRepo.unsetDefaultForUser(userId, id);
	}
	return addressRepo.updateById(id, data);
};

export const removeForUser = async (id, userId) => {
	const existing = await addressRepo.findByIdForUser(id, userId);
	if (!existing) {
		const err = new Error("Address not found");
		err.status = 404;
		throw err;
	}
	await addressRepo.deleteById(id);
	return { message: "Address deleted successfully" };
};

export const setDefaultForUser = async (id, userId) => {
	const existing = await addressRepo.findByIdForUser(id, userId);
	if (!existing) {
		const err = new Error("Address not found");
		err.status = 404;
		throw err;
	}
	await addressRepo.unsetDefaultForUser(userId);
	return addressRepo.updateById(id, { isDefault: true });
};
