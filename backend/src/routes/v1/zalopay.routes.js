import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { createZaloPayOrder, handleZaloPayCallback, checkZaloPayStatus, verifyZaloPayPayment } from "../../controllers/zalopay.controller.js";

const router = Router();

router.post("/callback", handleZaloPayCallback);
router.post("/verify", verifyZaloPayPayment);

router.use(authenticate);
router.post("/create-order", createZaloPayOrder);
router.get("/status/:orderId", checkZaloPayStatus);

export default router;
