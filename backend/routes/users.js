import express from 'express';
import { getUsers, updateProfile, getProfile, cancelUserOrder } from '../controllers/userController.js';
import { 
  getAddresses, 
  getAddressById, 
  createAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress 
} from '../controllers/addressController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin only route
router.get('/', requireAdmin, getUsers);

// User profile routes
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

// User order management
router.post('/orders/:orderId/cancel', requireAuth, cancelUserOrder);

// User address management
router.get('/addresses', requireAuth, getAddresses);
router.get('/addresses/:id', requireAuth, getAddressById);
router.post('/addresses', requireAuth, createAddress);
router.put('/addresses/:id', requireAuth, updateAddress);
router.delete('/addresses/:id', requireAuth, deleteAddress);
router.post('/addresses/:id/default', requireAuth, setDefaultAddress);

export default router;
