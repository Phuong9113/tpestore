import { Router } from "express";
import multer from "multer";
import { authenticate, authorizeAdmin } from "../../middleware/auth.js";
import {
	getAdminProducts,
	getAdminProductById,
	createProduct,
	updateProduct,
	deleteProduct,
	downloadProductTemplate,
	importProductsFromExcel,
	getAdminCategories,
	getAdminCategoryById,
	createCategory,
	updateCategory,
	deleteCategory,
	getAdminUsers,
	getAdminUserById,
	updateUser,
	deleteUser,
	getUserStats,
	getAdminOrders,
	getAdminOrderById,
	updateAdminOrderStatus,
	getOrderStats,
	getGHNOrderDetail,
	cancelOrder,
} from "../../controllers/admin.controller.js";

const router = Router();

// Public: Excel template
router.get("/products/template/:categoryId", downloadProductTemplate);

router.use(authenticate, authorizeAdmin);

// Product management
router.get("/products", getAdminProducts);
router.get("/products/:id", getAdminProductById);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

const excelUpload = multer({ storage: multer.memoryStorage() });
router.post("/products/import", excelUpload.single("file"), importProductsFromExcel);

// Category management
router.get("/categories", getAdminCategories);
router.get("/categories/:id", getAdminCategoryById);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// User management
router.get("/users", getAdminUsers);
router.get("/users/:id", getAdminUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/users/stats", getUserStats);

// Orders (place specific routes BEFORE parameterized :id)
router.get("/orders/stats", getOrderStats);
router.get("/orders/ghn/:orderCode", getGHNOrderDetail);
router.get("/orders", getAdminOrders);
router.get("/orders/:id", getAdminOrderById);
router.patch("/orders/:id/status", updateAdminOrderStatus);
router.post("/orders/:id/cancel", cancelOrder);

export default router;
