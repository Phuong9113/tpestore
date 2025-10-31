// Re-export or host common helpers after migration
export const noop = () => {};

export const isValidEmail = (email) => {
	if (typeof email !== "string") return false;
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(email.trim());
};

export const isValidPassword = (password) => {
	if (typeof password !== "string") return false;
	return password.length >= 6;
};

export const validateRequired = (obj, keys) => {
	if (!obj || !Array.isArray(keys)) return null;
	for (const key of keys) {
		const value = obj[key];
		const missing =
			value === undefined ||
			value === null ||
			(typeof value === "string" && value.trim() === "");
		if (missing) {
			return { error: `${key} is required` };
		}
	}
	return null;
};
