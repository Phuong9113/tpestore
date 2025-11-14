import * as categoryService from "../services/category.service.js";
import { success } from "../utils/response.js";

export const getCategories = async (req, res, next) => {
	try {
		const categories = await categoryService.list();
		success(res, categories);
	} catch (err) {
		console.error("Error in getCategories:", err);
		next(err);
	}
};

export const getCategoryById = async (req, res, next) => {
	try {
		success(res, await categoryService.getById(req.params.id));
	} catch (err) {
		next(err);
	}
};
