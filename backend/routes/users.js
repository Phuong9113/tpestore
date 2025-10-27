import express from 'express';
import { getUsers, updateProfile, getProfile, cancelUserOrder } from '../controllers/userController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin only route
router.get('/', requireAdmin, getUsers);

// User profile routes
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

// User order management
router.post('/orders/:orderId/cancel', requireAuth, cancelUserOrder);

export default router;
