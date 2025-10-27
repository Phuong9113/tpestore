import express from 'express';
import { 
  getOrders, 
  getOrderById, 
  createOrder, 
  updateOrderStatus 
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All order routes require authentication
router.use(requireAuth);

router.get('/', getOrders);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);
router.get('/:id', getOrderById);

export default router;
