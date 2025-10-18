import express from 'express';
import authRoutes from './auth.js';
import productRoutes from './products.js';
import cartRoutes from './cart.js';
import orderRoutes from './orders.js';
import categoryRoutes from './categories.js';
import userRoutes from './users.js';
import adminRoutes from './admin.js';

const router = express.Router();

// Health check
router.get('/health', async (req, res) => {
  try {
    const prisma = (await import('../utils/database.js')).default;
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'degraded', db: 'error', message: String(e) });
  }
});

// API documentation
router.get('/', (req, res) => {
  res.json({ 
    service: 'tpestore-backend', 
    status: 'ok', 
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/auth/register', '/api/auth/login', '/api/auth/me',
      '/api/users',
      '/api/products', '/api/products/:id', 
      '/api/categories', '/api/categories/:id',
      '/api/cart', '/api/orders', '/api/orders/:id',
      '/api/products/:productId/reviews',
      '/api/products/:productId/interact', '/api/recommendations'
    ] 
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
