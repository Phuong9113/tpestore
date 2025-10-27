import prisma from '../utils/database.js';
import { handleError, validateRequired } from '../utils/helpers.js';
import ghnService from '../services/ghnService.js';

export const getOrders = async (req, res) => {
  try {
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
  } catch (error) {
    handleError(res, error);
  }
};

export const getOrderById = async (req, res) => {
  try {
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
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    handleError(res, error);
  }
};

export const createOrder = async (req, res) => {
  try {
    console.log('Create order request body:', req.body);
    console.log('User ID:', req.user?.id);
    
    const { 
      items, 
      shippingInfo, 
      paymentMethod = 'COD', 
      deliverOption = 'xfast' 
    } = req.body;
    
    // Check if user is authenticated
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const validation = validateRequired(req.body, ['items']);
    if (validation) return res.status(400).json(validation);
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order items' });
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return res.status(400).json({ error: 'Each item must have productId, quantity, and price' });
      }
    }
    
    // Validate that all products exist
    const productIds = items.map(item => item.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true }
    });
    
    if (existingProducts.length !== productIds.length) {
      const existingIds = existingProducts.map(p => p.id);
      const missingIds = productIds.filter(id => !existingIds.includes(id));
      return res.status(400).json({ 
        error: `Products not found: ${missingIds.join(', ')}` 
      });
    }
    
    // Calculate total price
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = shippingInfo?.shippingFee || 0;
    const finalTotal = totalPrice + shippingFee;
    
    console.log('Calculated totals:', { totalPrice, shippingFee, finalTotal });
    
    // Create order with items and shipping info
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalPrice: finalTotal,
        status: 'PENDING',
        paymentMethod: paymentMethod,
        // Store shipping information
        shippingName: shippingInfo?.name,
        shippingPhone: shippingInfo?.phone,
        shippingAddress: shippingInfo?.address,
        shippingProvince: shippingInfo?.provinceName || shippingInfo?.province,
        shippingDistrict: shippingInfo?.districtName || shippingInfo?.district,
        shippingWard: shippingInfo?.wardName || shippingInfo?.ward,
        shippingFee: shippingFee,
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
    
    console.log('Order created successfully:', order.id);
    
    // Note: GHN shipping order is now created by the frontend for COD payments
    // to avoid duplicate order creation on GHN's platform
    
    // Clear cart after successful order
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    handleError(res, error);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
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
  } catch (error) {
    handleError(res, error);
  }
};
