export function handleError(res, error, message = 'Internal Server Error') {
  console.error(error);
  res.status(500).json({ error: message });
}

export function validateRequired(body, fields) {
  const missing = fields.filter(field => !body[field]);
  if (missing.length > 0) {
    return { error: `Missing required fields: ${missing.join(', ')}` };
  }
  return null;
}

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password) {
  return password && password.length >= 6;
}
