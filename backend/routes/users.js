import express from 'express';
import { getUsers } from '../controllers/userController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin only route
router.get('/', requireAdmin, getUsers);

export default router;
