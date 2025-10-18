import prisma from '../utils/database.js';
import { handleError, validateRequired } from '../utils/helpers.js';

export const getCart = async (req, res) => {
  try {
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
  } catch (error) {
    handleError(res, error);
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    const validation = validateRequired(req.body, ['productId']);
    if (validation) return res.status(400).json(validation);
    
    const qty = Math.max(1, Number(quantity || 1));
    
    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if item already in cart
    const existing = await prisma.cartItem.findFirst({ 
      where: { userId: req.user.id, productId } 
    });
    
    if (existing) {
      const updated = await prisma.cartItem.update({ 
        where: { id: existing.id }, 
        data: { quantity: existing.quantity + qty } 
      });
      return res.json({ ok: true, itemId: updated.id });
    }
    
    // Add new item to cart
    const created = await prisma.cartItem.create({ 
      data: { userId: req.user.id, productId, quantity: qty } 
    });
    
    res.status(201).json({ ok: true, itemId: created.id });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    const qty = Number(quantity);
    if (!Number.isFinite(qty)) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    
    const item = await prisma.cartItem.findFirst({ 
      where: { userId: req.user.id, productId } 
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    
    if (qty <= 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
      return res.json({ ok: true, deleted: true });
    }
    
    const updated = await prisma.cartItem.update({ 
      where: { id: item.id }, 
      data: { quantity: qty } 
    });
    
    res.json({ ok: true, itemId: updated.id });
  } catch (error) {
    handleError(res, error);
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const item = await prisma.cartItem.findFirst({ 
      where: { userId: req.user.id, productId } 
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    
    await prisma.cartItem.delete({ where: { id: item.id } });
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
};

export const clearCart = async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
};
