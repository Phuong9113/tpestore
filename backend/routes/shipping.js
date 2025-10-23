import express from 'express';
import {
  getProvinces,
  getDistricts,
  getWards,
  calculateShippingFee,
  getServices,
  createShippingOrder,
  trackOrder,
  cancelOrder
} from '../controllers/shippingController.js';

const router = express.Router();

// Master data
router.get('/provinces', getProvinces);
router.get('/districts/:provinceId', getDistricts);
router.get('/wards/:districtId', getWards);

// Fee + services
router.post('/fee', calculateShippingFee);
router.get('/services', getServices);

// Orders
router.post('/order', createShippingOrder);
router.get('/track/:orderCode', trackOrder);
router.post('/cancel/:orderCode', cancelOrder);

export default router;


