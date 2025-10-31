export const success = (res, data, message = "Success", status = 200) => {
	return res.status(status).json({ success: true, message, data });
};

export const error = (res, message = "Error", status = 500, data = null) => {
	return res.status(status).json({ success: false, message, data });
};
