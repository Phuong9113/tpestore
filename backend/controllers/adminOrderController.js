import prisma from '../utils/database.js';
import { handleError } from '../utils/helpers.js';
import ghnService from '../services/ghnService.js';

export const getAdminOrders = async (req, res) => {
  try {
    const { status, payment, search, page = 1, limit = 10 } = req.query;
    
    // Build where clause
    const where = {};
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    if (payment && payment !== 'all') {
      where.paymentStatus = payment.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        totalPrice: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        transactionId: true,
        paypalOrderId: true,
        paidAt: true,
        createdAt: true,
        ghnOrderCode: true,
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, image: true, price: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });
    
    // Get total count for pagination
    const total = await prisma.order.count({ where });
    
    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        totalPrice: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        transactionId: true,
        paypalOrderId: true,
        paidAt: true,
        createdAt: true,
        ghnOrderCode: true,
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
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

export const updateAdminOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
    const validPaymentStatuses = ['PENDING', 'PAID', 'REFUNDED'];
    
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }
    
    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    
    const order = await prisma.order.findUnique({
      where: { id }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
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

export const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await prisma.order.count();
    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
    const processingOrders = await prisma.order.count({ where: { status: 'PROCESSING' } });
    const shippingOrders = await prisma.order.count({ where: { status: 'SHIPPING' } });
    const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });
    const cancelledOrders = await prisma.order.count({ where: { status: 'CANCELLED' } });
    
    const totalRevenue = await prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalPrice: true }
    });
    
    res.json({
      totalOrders,
      pendingOrders,
      processingOrders,
      shippingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getGHNOrderDetail = async (req, res) => {
  try {
    const { orderCode } = req.params;
    
    if (!orderCode) {
      return res.status(400).json({ error: 'Order code is required' });
    }
    
    const ghnDetail = await ghnService.getOrderDetail(orderCode);
    
    res.json({
      success: true,
      data: ghnDetail
    });
  } catch (error) {
    console.error('Error getting GHN order detail:', error);
    res.status(500).json({ 
      error: 'Không thể lấy chi tiết đơn hàng GHN',
      details: error.message 
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm đơn hàng trong database
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        ghnOrderCode: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }
    
    // Kiểm tra trạng thái đơn hàng
    if (order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Đơn hàng đã được hủy trước đó' });
    }
    
    if (order.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Không thể hủy đơn hàng đã hoàn thành' });
    }
    
    if (order.status === 'SHIPPING') {
      return res.status(400).json({ error: 'Không thể hủy đơn hàng đang vận chuyển' });
    }
    
    let ghnResult = null;
    
    // Nếu có mã đơn hàng GHN, hủy trên GHN trước
    if (order.ghnOrderCode) {
      try {
        ghnResult = await ghnService.cancelOrder(order.ghnOrderCode);
        console.log('GHN cancel result:', ghnResult);
        
        // Kiểm tra kết quả từ GHN
        if (ghnResult && !ghnResult.success) {
          console.warn(`GHN cancellation failed for order ${order.ghnOrderCode}: ${ghnResult.message}`);
          // Vẫn tiếp tục hủy đơn hàng trong database
        }
      } catch (ghnError) {
        console.error('Error canceling GHN order:', ghnError);
        ghnResult = {
          success: false,
          error: ghnError.message,
          message: 'Lỗi khi hủy đơn hàng trên GHN'
        };
        // Vẫn tiếp tục hủy đơn hàng trong database nếu GHN API lỗi
      }
    }
    
    // Cập nhật trạng thái đơn hàng trong database
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, image: true, price: true }
            }
          }
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Đơn hàng đã được hủy thành công',
      order: updatedOrder,
      ghnResult: ghnResult
    });
  } catch (error) {
    console.error('Error canceling order:', error);
    handleError(res, error);
  }
};
