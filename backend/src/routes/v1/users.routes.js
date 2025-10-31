import { Router } from "express";
import { authenticate, authorizeAdmin } from "../../middleware/auth.js";
import { getUsers, updateProfile, getProfile, cancelUserOrder } from "../../controllers/user.controller.js";
import {
	getAddresses,
	getAddressById,
	createAddress,
	updateAddress,
	deleteAddress,
	setDefaultAddress,
} from "../../controllers/address.controller.js";

const router = Router();

// Admin only
router.get("/", authenticate, authorizeAdmin, getUsers);

// Profile
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);

// Orders
router.post("/orders/:orderId/cancel", authenticate, cancelUserOrder);

// Addresses
router.get("/addresses", authenticate, getAddresses);
router.get("/addresses/:id", authenticate, getAddressById);
router.post("/addresses", authenticate, createAddress);
router.put("/addresses/:id", authenticate, updateAddress);
router.delete("/addresses/:id", authenticate, deleteAddress);
router.post("/addresses/:id/default", authenticate, setDefaultAddress);

export default router;
