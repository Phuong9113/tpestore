import express from 'express';
import { 
  getProducts, 
  getProductById, 
  getProductReviews, 
  createProductReview, 
  interactWithProduct, 
  getRecommendations 
} from '../controllers/productController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:productId/reviews', getProductReviews);

// Protected routes
router.post('/:productId/reviews', requireAuth, createProductReview);
router.post('/:productId/interact', requireAuth, interactWithProduct);
router.get('/recommendations', requireAuth, getRecommendations);

export default router;
