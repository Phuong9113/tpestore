import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../src/generated/prisma/index.js';

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
      '/api/products/:productId/interact', '/api/recommendations'
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
    res.json(products);
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
    res.json(product);
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

app.post('/api/orders', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { items } = req.body; // [{ productId, quantity, price }]
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order items' });
    }

    // Calculate total price
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalPrice,
        status: 'PENDING',
        orderItems: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
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

    // Clear cart after successful order
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });

    res.status(201).json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
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

    res.json(updatedOrder);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

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
// Start server
// ================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
