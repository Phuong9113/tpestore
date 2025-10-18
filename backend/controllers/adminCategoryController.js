import prisma from '../utils/database.js';
import { handleError, validateRequired } from '../utils/helpers.js';

export const getAdminCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          products: {
            select: { id: true, name: true, price: true, image: true }
          },
          specFields: true
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.category.count({ where })
    ]);
    
    res.json({
      categories,
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

export const getAdminCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
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
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    handleError(res, error);
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, image, specFields = [] } = req.body;
    
    const validation = validateRequired(req.body, ['name']);
    if (validation) return res.status(400).json(validation);
    
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
  } catch (error) {
    handleError(res, error);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, specFields = [] } = req.body;
    
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({ where: { id } });
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if new name conflicts with existing categories (excluding current)
    if (name && name !== existingCategory.name) {
      const nameConflict = await prisma.category.findFirst({
        where: { 
          name: { equals: name, mode: 'insensitive' },
          id: { not: id }
        }
      });
      
      if (nameConflict) {
        return res.status(409).json({ error: 'Category name already exists' });
      }
    }
    
    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(image && { image })
      },
      include: {
        specFields: true
      }
    });
    
    // Update spec fields if provided
    if (specFields.length > 0) {
      // Delete existing spec fields
      await prisma.specField.deleteMany({ where: { categoryId: id } });
      
      // Create new spec fields
      await prisma.specField.createMany({
        data: specFields.map(field => ({
          categoryId: id,
          name: field.name,
          type: field.type || 'TEXT',
          required: field.required || false
        }))
      });
    }
    
    // Fetch updated category with spec fields
    const updatedCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        specFields: true
      }
    });
    
    res.json(updatedCategory);
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteCategory = async (req, res) => {
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
  } catch (error) {
    handleError(res, error);
  }
};
