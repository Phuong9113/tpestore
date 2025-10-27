import prisma from '../utils/database.js';
import { handleError } from '../utils/helpers.js';
import ghnService from '../services/ghnService.js';

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    
    res.json(users);
  } catch (error) {
    handleError(res, error);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, city } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city })
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            totalPrice: true,
            status: true,
            createdAt: true,
            ghnOrderCode: true,
            orderItems: {
              select: {
                quantity: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    price: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
};

export const cancelUserOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    
    // Tìm đơn hàng của người dùng
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        userId: userId 
      },
      select: {
        id: true,
        status: true,
        ghnOrderCode: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại hoặc không thuộc về bạn' });
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
    
    // Kiểm tra thời gian hủy đơn hàng (chỉ cho phép hủy trong 24h đầu)
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    const maxCancelTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (orderAge > maxCancelTime) {
      return res.status(400).json({ error: 'Chỉ có thể hủy đơn hàng trong vòng 24 giờ đầu' });
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
      where: { id: orderId },
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
    console.error('Error canceling user order:', error);
    handleError(res, error);
  }
};
