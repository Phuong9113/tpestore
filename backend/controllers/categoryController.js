import prisma from '../utils/database.js';
import { handleError } from '../utils/helpers.js';

export const getCategories = async (req, res) => {
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
  } catch (error) {
    handleError(res, error);
  }
};

export const getCategoryById = async (req, res) => {
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
