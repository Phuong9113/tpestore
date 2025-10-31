import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productsRoutes from "./products.routes.js";
import ordersRoutes from "./orders.routes.js";
import usersRoutes from "./users.routes.js";
import adminRoutes from "./admin.routes.js";
import categoriesRoutes from "./categories.routes.js";
import cartRoutes from "./cart.routes.js";
import shippingRoutes from "./shipping.routes.js";
import zalopayRoutes from "./zalopay.routes.js";
import uploadRoutes from "./upload.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productsRoutes);
router.use("/orders", ordersRoutes);
router.use("/users", usersRoutes);
router.use("/admin", adminRoutes);
router.use("/categories", categoriesRoutes);
router.use("/cart", cartRoutes);
router.use("/shipping", shippingRoutes);
router.use("/zalopay", zalopayRoutes);
router.use("/upload", uploadRoutes);

export default router;
