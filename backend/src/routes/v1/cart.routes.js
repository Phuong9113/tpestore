import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from "../../controllers/cart.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", getCart);
router.post("/", addToCart);
router.patch("/:productId", updateCartItem);
router.delete("/:productId", removeFromCart);
router.delete("/", clearCart);

export default router;
