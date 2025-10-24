import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { requireAdmin, authenticateToken } from './middleware/auth.js';
import {
  getAdminProducts,
  getAdminProductById,
  createProduct as createAdminProduct,
  updateProduct as updateAdminProduct,
  deleteProduct as deleteAdminProduct
} from './controllers/adminProductController.js';
import {
  getAdminCategories,
  getAdminCategoryById,
  createCategory as createAdminCategory,
  updateCategory as updateAdminCategory,
  deleteCategory as deleteAdminCategory
} from './controllers/adminCategoryController.js';
import {
  getAdminUsers,
  getAdminUserById,
  updateUser as updateAdminUser,
  deleteUser as deleteAdminUser,
  getUserStats
} from './controllers/adminUserController.js';
import {
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  getOrderStats
} from './controllers/adminOrderController.js';
import {
  getProvinces,
  getDistricts,
  getWards,
  calculateShippingFee,
  getServices,
  createShippingOrder,
  trackOrder,
  cancelOrder
} from './controllers/shippingController.js';
import paypalRouter from './routes/paypal.js';
import userRoutes from './routes/users.js';
import orderRoutes from './routes/orders.js';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../public/uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
// simple auth middleware will attach req.user if Authorization: Bearer <token>
const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret';
function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch {
    req.user = null;
  }
  next();
}
app.use(authMiddleware);

// Kiểm tra biến môi trường bắt buộc
if (!process.env.DATABASE_URL) {
  console.warn('Warning: DATABASE_URL không được thiết lập. Prisma sẽ không kết nối được DB.');
}
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET không được thiết lập. Sử dụng giá trị mặc định KHÔNG an toàn cho môi trường dev.');
}

// ================================
// Health & root routes
// ================================
app.get('/', (req, res) => {
  res.json({ service: 'tpestore-backend', status: 'ok', docs: '/api' });
});

app.get('/api', (req, res) => {
  res.json({ 
    endpoints: [
      '/api/health',
      '/api/auth/register', '/api/auth/login', '/api/auth/me',
      '/api/users',
      '/api/products', '/api/products/:id', 
      '/api/categories', '/api/categories/:id',
      '/api/cart', '/api/orders', '/api/orders/:id',
      '/api/products/:productId/reviews',
      '/api/products/:productId/interact', '/api/recommendations',
      // Excel import/export
      '/api/admin/products/template/:categoryId', '/api/admin/products/import'
    ] 
  });
});

app.get('/api/health', async (req, res) => {
  try {
    // Simple DB check: run a trivial query if possible
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'degraded', db: 'error', message: String(e) });
  }
});

// ================================
// Auth routes
// ================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password: passwordHash } });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, role: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/auth/me', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { name } = req.body;
    const updated = await prisma.user.update({ where: { id: req.user.id }, data: { name } , select: { id: true, name: true, email: true, role: true }});
    res.json({ user: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ================================
// API endpoint lấy tất cả Users
// ================================
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ================================
// API endpoint lấy tất cả Products
// ================================
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        specs: {
          include: {
            specField: true
          }
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
    const normalized = products.map((p) => ({
      ...p,
      inStock: typeof p.stock === 'number' ? p.stock > 0 : false,
    }));
    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ================================
// API endpoint lấy product theo id
// ================================
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        specs: {
          include: {
            specField: true
          }
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const normalized = { ...product, inStock: typeof product.stock === 'number' ? product.stock > 0 : false };
    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ================================
// Categories API
// ================================
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          select: { id: true, name: true, price: true, image: true }
        },
        specFields: true
      }
    });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description, image, specFields = [] } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category name already exists
    const existingCategory = await prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    
    if (existingCategory) {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    
    const category = await prisma.category.create({
      data: {
        name,
        description,
        image,
        specFields: {
          create: specFields.map(field => ({
            name: field.name,
            type: field.type || 'TEXT',
            required: field.required || false
          }))
        }
      },
      include: {
        specFields: true
      }
    });
    
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if category has products
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. It has ${productCount} products. Please move or delete products first.` 
      });
    }
    
    // Delete category (cascade will handle related records)
    await prisma.category.delete({ where: { id } });
    
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            specs: {
              include: {
                specField: true
              }
            }
          }
        },
        specFields: true
      }
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ================================
// Cart routes (auth required)
// ================================
app.get('/api/cart', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true }
    });
    const mapped = items.map((ci) => ({
      productId: ci.productId,
      name: ci.product.name,
      price: ci.product.price,
      image: ci.product.image,
      quantity: ci.quantity,
    }));
    res.json({ items: mapped });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/cart', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { productId, quantity } = req.body;
    if (!productId) return res.status(400).json({ error: 'Missing productId' });
    const qty = Math.max(1, Number(quantity || 1));
    const existing = await prisma.cartItem.findFirst({ where: { userId: req.user.id, productId } });
    if (existing) {
      const updated = await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + qty } });
      return res.json({ ok: true, itemId: updated.id });
    }
    const created = await prisma.cartItem.create({ data: { userId: req.user.id, productId, quantity: qty } });
    res.status(201).json({ ok: true, itemId: created.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/api/cart/:productId', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { productId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);
    if (!Number.isFinite(qty)) return res.status(400).json({ error: 'Invalid quantity' });
    const item = await prisma.cartItem.findFirst({ where: { userId: req.user.id, productId } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (qty <= 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
      return res.json({ ok: true, deleted: true });
    }
    const updated = await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: qty } });
    res.json({ ok: true, itemId: updated.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/cart/:productId', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { productId } = req.params;
    const item = await prisma.cartItem.findFirst({ where: { userId: req.user.id, productId } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    await prisma.cartItem.delete({ where: { id: item.id } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/cart', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Merge cart endpoint
app.post('/api/cart/merge', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    
    const { items } = req.body; // items từ localStorage
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    // Lấy giỏ hàng hiện tại từ DB
    const existingCartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true }
    });

    const mergedItems = [];
    const processedProductIds = new Set();

    // Xử lý từng item từ localStorage
    for (const localItem of items) {
      const { id: productId, quantity } = localItem;
      
      // Kiểm tra sản phẩm có tồn tại không
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) continue;

      // Tìm item đã có trong DB
      const existingItem = existingCartItems.find(item => item.productId === productId);
      
      if (existingItem) {
        // Gộp số lượng: DB + localStorage
        const newQuantity = existingItem.quantity + quantity;
        const updatedItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity }
        });
        
        mergedItems.push({
          productId: updatedItem.productId,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: updatedItem.quantity
        });
      } else {
        // Tạo mới item trong DB
        const newItem = await prisma.cartItem.create({
          data: { userId: req.user.id, productId, quantity }
        });
        
        mergedItems.push({
          productId: newItem.productId,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: newItem.quantity
        });
      }
      
      processedProductIds.add(productId);
    }

    // Thêm các item chỉ có trong DB (không có trong localStorage)
    for (const dbItem of existingCartItems) {
      if (!processedProductIds.has(dbItem.productId)) {
        mergedItems.push({
          productId: dbItem.productId,
          name: dbItem.product.name,
          price: dbItem.product.price,
          image: dbItem.product.image,
          quantity: dbItem.quantity
        });
      }
    }

    res.json({ items: mergedItems });
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ================================
// Orders API (auth required)
// ================================
app.get('/api/orders', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, image: true, price: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, image: true, price: true }
            }
          }
        }
      }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Order routes are handled by the orders router below

// Order status updates are handled by the orders router below

// ================================
// Reviews API
// ================================
app.get('/api/products/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/products/:productId/reviews', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { productId } = req.params;
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: { productId, userId: req.user.id }
    });
    if (existingReview) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: req.user.id,
        rating,
        comment
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(review);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ================================
// Product Interactions API (for recommendations)
// ================================
app.post('/api/products/:productId/interact', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { productId } = req.params;
    const { action } = req.body; // 'view', 'like', 'addToCart', 'purchase'
    
    const validActions = ['view', 'like', 'addToCart', 'purchase'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Find existing interaction or create new one
    let interaction = await prisma.productInteraction.findFirst({
      where: { productId, userId: req.user.id }
    });

    if (!interaction) {
      interaction = await prisma.productInteraction.create({
        data: {
          productId,
          userId: req.user.id,
          viewedAt: new Date(),
          liked: action === 'like',
          addedToCart: action === 'addToCart',
          purchased: action === 'purchase'
        }
      });
    } else {
      // Update existing interaction
      const updateData = { viewedAt: new Date() };
      if (action === 'like') updateData.liked = true;
      if (action === 'addToCart') updateData.addedToCart = true;
      if (action === 'purchase') updateData.purchased = true;

      interaction = await prisma.productInteraction.update({
        where: { id: interaction.id },
        data: updateData
      });
    }

    res.json(interaction);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/recommendations', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    
    // Get user's interaction history
    const userInteractions = await prisma.productInteraction.findMany({
      where: { userId: req.user.id },
      include: { product: true }
    });

    // Simple recommendation: products from same categories as liked/purchased items
    const likedCategories = userInteractions
      .filter(i => i.liked || i.purchased)
      .map(i => i.product.categoryId);

    if (likedCategories.length === 0) {
      // If no interactions, return popular products
      const popularProducts = await prisma.product.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          specs: {
            include: { specField: true }
          }
        }
      });
      return res.json(popularProducts);
    }

    const recommendations = await prisma.product.findMany({
      where: {
        categoryId: { in: likedCategories },
        id: { notIn: userInteractions.map(i => i.productId) }
      },
      take: 10,
      include: {
        category: true,
        specs: {
          include: { specField: true }
        }
      }
    });

    res.json(recommendations);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ================================
// Upload endpoint
// ================================
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ================================
// Admin Router (single backend)
// ================================
const adminRouter = express.Router();

// Public: Excel template (no admin auth required)
adminRouter.get('/products/template/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { specFields: true }
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const baseColumns = ['name', 'description', 'price', 'stock', 'image'];
    const specColumns = category.specFields.map(f => `spec:${f.name}`);
    const headers = [...baseColumns, ...specColumns];

    const sampleRow = {
      name: 'Tên sản phẩm ví dụ',
      description: 'Mô tả',
      price: 1000000,
      stock: 10,
      image: '/uploads/sample.png',
    };
    const specSample = Object.fromEntries(category.specFields.map(f => [
      `spec:${f.name}`, f.unit ? `${f.name} (${f.unit})` : f.name
    ]));

    const data = [Object.assign({}, sampleRow, specSample)];
    const ws = xlsx.utils.json_to_sheet(data, { header: headers });
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, category.name.slice(0, 31));

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="template-${category.name}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// All other admin endpoints require ADMIN
adminRouter.use(requireAdmin);

// Product management
adminRouter.get('/products', getAdminProducts);
adminRouter.get('/products/:id', getAdminProductById);
adminRouter.post('/products', createAdminProduct);
adminRouter.put('/products/:id', updateAdminProduct);
adminRouter.delete('/products/:id', deleteAdminProduct);

// Excel import (admin only)
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ].includes(file.mimetype) || file.originalname.endsWith('.xlsx');
    if (!ok) return cb(new Error('Invalid file type'));
    cb(null, true);
  }
});
import { importProductsFromExcel } from './controllers/adminProductController.js';
adminRouter.post('/products/import', excelUpload.single('file'), importProductsFromExcel);

// Category management
adminRouter.get('/categories', getAdminCategories);
adminRouter.get('/categories/:id', getAdminCategoryById);
adminRouter.post('/categories', createAdminCategory);
adminRouter.put('/categories/:id', updateAdminCategory);
adminRouter.delete('/categories/:id', deleteAdminCategory);

// User management
adminRouter.get('/users', getAdminUsers);
adminRouter.get('/users/:id', getAdminUserById);
adminRouter.put('/users/:id', updateAdminUser);
adminRouter.delete('/users/:id', deleteAdminUser);
adminRouter.get('/users/stats', getUserStats);

// Order management
adminRouter.get('/orders/stats', getOrderStats);
adminRouter.get('/orders', getAdminOrders);
adminRouter.get('/orders/:id', getAdminOrderById);
adminRouter.patch('/orders/:id/status', updateAdminOrderStatus);

// ================================
// Shipping API (GHN Integration)
// ================================
app.get('/api/shipping/provinces', getProvinces);
app.get('/api/shipping/districts/:provinceId', getDistricts);
app.get('/api/shipping/wards/:districtId', getWards);
app.get('/api/shipping/services', getServices);
app.post('/api/shipping/calculate-fee', calculateShippingFee);
app.post('/api/shipping/create-order', authenticateToken, createShippingOrder);
app.get('/api/shipping/track/:orderCode', trackOrder);
app.post('/api/shipping/cancel/:orderCode', cancelOrder);

// PayPal routes
app.use('/api/paypal', paypalRouter);

// User routes
app.use('/api/users', userRoutes);

// Order routes
app.use('/api/orders', orderRoutes);

app.use('/api/admin', adminRouter);

// (Template + Import are handled inside adminRouter or controllers)

// ================================
// Start server
// ================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
