import express from 'express';
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart
} from '../controllers/cartController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All cart routes require authentication
router.use(requireAuth);

router.get('/', getCart);
router.post('/', addToCart);
router.patch('/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);
router.delete('/', clearCart);

export default router;
