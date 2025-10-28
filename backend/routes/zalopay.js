import express from 'express';
import { 
  createZaloPayOrder, 
  handleZaloPayCallback, 
  checkZaloPayStatus,
  verifyZaloPayPayment 
} from '../controllers/zalopayController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public callback endpoint (no auth required)
router.post('/callback', handleZaloPayCallback);

// Public verify endpoint (no auth required - called from frontend verify page)
router.post('/verify', verifyZaloPayPayment);

// Protected endpoints (require authentication)
router.use(requireAuth);

// Create ZaloPay order
router.post('/create-order', createZaloPayOrder);

// Check payment status
router.get('/status/:orderId', checkZaloPayStatus);

export default router;
