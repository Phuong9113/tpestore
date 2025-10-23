import express from 'express';
import { createPayPalOrder, capturePayPalOrder } from '../controllers/paypalController.js';

const router = express.Router();

// Create PayPal order
router.post('/create-order', createPayPalOrder);

// Capture PayPal order
router.post('/capture-order', capturePayPalOrder);

export default router;
