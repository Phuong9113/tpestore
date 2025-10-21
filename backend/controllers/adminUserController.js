import prisma from '../utils/database.js';
import { handleError, validateRequired } from '../utils/helpers.js';

export const getAdminUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) {
      where.role = role;
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
            where: {
              status: 'COMPLETED'
            },
            select: {
              totalPrice: true
            }
          },
          _count: {
            select: {
              orders: true,
              reviews: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);
    
    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getAdminUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
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
        },
        reviews: {
          include: {
            product: {
              select: { id: true, name: true, image: true }
            }
          },
          orderBy: { createdAt: 'desc' }
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

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, city } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if email conflicts with existing users (excluding current)
    if (email && email !== existingUser.email) {
      const emailConflict = await prisma.user.findFirst({
        where: { 
          email: { equals: email, mode: 'insensitive' },
          id: { not: id }
        }
      });
      
      if (emailConflict) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }
    
    // Note: Role and isActive changes are handled manually in database
    
    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email && { email }),
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

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Check if user has orders
    const orderCount = await prisma.order.count({ where: { userId: id } });
    if (orderCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete user. They have ${orderCount} orders. Please handle orders first.` 
      });
    }
    
    // Delete user (cascade will handle related records)
    await prisma.user.delete({ where: { id } });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

export const getUserStats = async (req, res) => {
  try {
    const [
      totalUsers,
      adminUsers,
      userUsers,
      recentUsers,
      usersWithOrders
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.user.count({
        where: {
          orders: {
            some: {}
          }
        }
      })
    ]);
    
    res.json({
      totalUsers,
      adminUsers,
      userUsers,
      recentUsers,
      usersWithOrders,
      usersWithoutOrders: totalUsers - usersWithOrders
    });
  } catch (error) {
    handleError(res, error);
  }
};
