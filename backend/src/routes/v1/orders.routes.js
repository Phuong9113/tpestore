import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { getOrders, getOrderById, createOrder, updateOrderStatus, getReviewEligibility, getOrderProductsReviewStatus } from "../../controllers/order.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", getOrders);
router.post("/", createOrder);
router.patch("/:id/status", updateOrderStatus);
router.get("/:id/review-eligibility", getReviewEligibility);
router.get("/:id/products-review-status", getOrderProductsReviewStatus);
router.get("/:id", getOrderById);

export default router;
