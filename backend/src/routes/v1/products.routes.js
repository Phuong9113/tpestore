import { Router } from "express";
import {
	getAllProducts,
	getProductById,
	getProductReviews,
	createProductReview,
	interactWithProduct,
	getRecommendations,
} from "../../controllers/product.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.get("/:productId/reviews", getProductReviews);

// Protected routes
router.post("/:productId/reviews", authenticate, createProductReview);
router.post("/:productId/interact", authenticate, interactWithProduct);
router.get("/recommendations", authenticate, getRecommendations);

export default router;
