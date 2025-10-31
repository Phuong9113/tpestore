import { Router } from "express";
import {
	getProvinces,
	getDistricts,
	getWards,
	calculateShippingFee,
	getServices,
	createShippingOrder,
	trackOrder,
	cancelOrder,
} from "../../controllers/shipping.controller.js";

const router = Router();

router.get("/provinces", getProvinces);
router.get("/districts/:provinceId", getDistricts);
router.get("/wards/:districtId", getWards);
router.post("/fee", calculateShippingFee);
router.get("/services", getServices);
router.post("/order", createShippingOrder);
router.get("/track/:orderCode", trackOrder);
router.post("/cancel/:orderCode", cancelOrder);

export default router;
