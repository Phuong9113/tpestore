import express from 'express';
import { 
  getAdminProducts, 
  getAdminProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  downloadProductTemplate,
  importProductsFromExcel
} from '../controllers/adminProductController.js';
import multer from 'multer';
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
import { 
  getAdminOrders, 
  getAdminOrderById, 
  updateAdminOrderStatus, 
  getOrderStats 
} from '../controllers/adminOrderController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: Excel template (no admin auth required)
router.get('/products/template/:categoryId', downloadProductTemplate);

// All admin routes require admin authentication
router.use(requireAdmin);

// Product management
router.get('/products', getAdminProducts);
router.get('/products/:id', getAdminProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
// Excel import (admin only)
const excelUpload = multer({ storage: multer.memoryStorage() });
router.post('/products/import', excelUpload.single('file'), importProductsFromExcel);

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

// Order management
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderById);
router.patch('/orders/:id/status', updateAdminOrderStatus);
router.get('/orders/stats', getOrderStats);

export default router;
