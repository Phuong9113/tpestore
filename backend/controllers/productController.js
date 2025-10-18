import prisma from '../utils/database.js';
import { handleError } from '../utils/helpers.js';

export const getProducts = async (req, res) => {
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
  } catch (error) {
    handleError(res, error);
  }
};

export const getProductById = async (req, res) => {
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

export const getProductReviews = async (req, res) => {
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
  } catch (error) {
    handleError(res, error);
  }
};

export const createProductReview = async (req, res) => {
  try {
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
  } catch (error) {
    handleError(res, error);
  }
};

export const interactWithProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { action } = req.body;
    
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
  } catch (error) {
    handleError(res, error);
  }
};

export const getRecommendations = async (req, res) => {
  try {
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
  } catch (error) {
    handleError(res, error);
  }
};
