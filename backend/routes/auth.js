import express from 'express';
import { register, login, getMe, updateMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);

export default router;
