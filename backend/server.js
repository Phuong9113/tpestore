import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../src/generated/prisma/index.js';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
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
  res.json({ endpoints: ['/api/users', '/api/products', '/api/products/:id', '/api/health', '/api/auth/register', '/api/auth/login', '/api/auth/me'] });
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
        seller: true
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
        seller: true,
        reviews: {
          include: { user: true }
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
// Start server
// ================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
