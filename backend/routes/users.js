import express from 'express';
import { getUsers, updateProfile, getProfile } from '../controllers/userController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin only route
router.get('/', requireAdmin, getUsers);

// User profile routes
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

export default router;
