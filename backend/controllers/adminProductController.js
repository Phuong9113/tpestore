import prisma from '../utils/database.js';
import { handleError, validateRequired } from '../utils/helpers.js';

export const getAdminProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoryId } = req.query;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);
    
    res.json({
      products,
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

export const getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
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
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    handleError(res, error);
  }
};

export const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      originalPrice, 
      image, 
      categoryId, 
      inStock, 
      specs = [] 
    } = req.body;
    
    const validation = validateRequired(req.body, ['name', 'price', 'categoryId']);
    if (validation) return res.status(400).json(validation);
    
    // Check if category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        image,
        categoryId,
        inStock: inStock !== undefined ? inStock : true,
        specs: {
          create: specs.map(spec => ({
            specFieldId: spec.specFieldId,
            value: spec.value
          }))
        }
      },
      include: {
        category: true,
        specs: {
          include: {
            specField: true
          }
        }
      }
    });
    
    res.status(201).json(product);
  } catch (error) {
    handleError(res, error);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      originalPrice, 
      image, 
      categoryId, 
      inStock, 
      specs = [] 
    } = req.body;
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if category exists (if provided)
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return res.status(400).json({ error: 'Category not found' });
      }
    }
    
    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseFloat(originalPrice) : null }),
        ...(image && { image }),
        ...(categoryId && { categoryId }),
        ...(inStock !== undefined && { inStock })
      },
      include: {
        category: true,
        specs: {
          include: {
            specField: true
          }
        }
      }
    });
    
    // Update specs if provided
    if (specs.length > 0) {
      // Delete existing specs
      await prisma.productSpec.deleteMany({ where: { productId: id } });
      
      // Create new specs
      await prisma.productSpec.createMany({
        data: specs.map(spec => ({
          productId: id,
          specFieldId: spec.specFieldId,
          value: spec.value
        }))
      });
    }
    
    // Fetch updated product with specs
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        specs: {
          include: {
            specField: true
          }
        }
      }
    });
    
    res.json(updatedProduct);
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Delete product (cascade will handle related records)
    await prisma.product.delete({ where: { id } });
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};
