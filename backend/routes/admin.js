import express from 'express';
import { 
  getAdminProducts, 
  getAdminProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/adminProductController.js';
import { 
  getAdminCategories, 
  getAdminCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/adminCategoryController.js';
import { 
  getAdminUsers, 
  getAdminUserById, 
  updateUser, 
  deleteUser, 
  getUserStats 
} from '../controllers/adminUserController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require admin authentication
router.use(requireAdmin);

// Product management
router.get('/products', getAdminProducts);
router.get('/products/:id', getAdminProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Category management
router.get('/categories', getAdminCategories);
router.get('/categories/:id', getAdminCategoryById);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// User management
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/users/stats', getUserStats);

export default router;
