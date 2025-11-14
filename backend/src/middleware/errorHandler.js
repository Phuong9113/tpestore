export const errorHandler = (err, req, res, next) => {
	const status = err.status || 500;
	const message = err.message || "Internal Server Error";
	if (process.env.NODE_ENV !== "test") {
		// eslint-disable-next-line no-console
		console.error("Error Handler:", {
			status,
			message,
			stack: err.stack,
			path: req.path,
			method: req.method,
		});
	}
	res.status(status).json({ success: false, message, ...(process.env.NODE_ENV === "development" && { stack: err.stack }) });
};
