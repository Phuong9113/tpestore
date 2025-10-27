import ghnService from '../services/ghnService.js';
import { handleError, validateRequired } from '../utils/helpers.js';
import ghnConfig from '../config/ghn.js';
import prisma from '../utils/database.js';

// Lấy danh sách tỉnh/thành phố
export const getProvinces = async (req, res) => {
  try {
    const provinces = await ghnService.getProvinces();
    res.json(provinces);
  } catch (error) {
    handleError(res, error);
  }
};

// Lấy danh sách quận/huyện theo tỉnh
export const getDistricts = async (req, res) => {
  try {
    const { provinceId } = req.params;
    
    if (!provinceId) {
      return res.status(400).json({ error: 'Province ID is required' });
    }
    
    const districts = await ghnService.getDistricts(provinceId);
    res.json(districts);
  } catch (error) {
    handleError(res, error);
  }
};

// Lấy danh sách phường/xã theo quận
export const getWards = async (req, res) => {
  try {
    const { districtId } = req.params;
    
    if (!districtId) {
      return res.status(400).json({ error: 'District ID is required' });
    }
    
    const wards = await ghnService.getWards(districtId);
    res.json(wards);
  } catch (error) {
    handleError(res, error);
  }
};

// Tính phí vận chuyển
export const calculateShippingFee = async (req, res) => {
  try {
    console.log('Calculate shipping fee request body:', req.body);
    
    const { 
      fromDistrictId, 
      toDistrictId, 
      toWardCode, 
      weight, 
      codAmount,
      serviceTypeId,
      length,
      width,
      height,
      insuranceValue,
      value,
      weightUnit,
      items,
      products
    } = req.body;
    
    // Validate required fields
    if (!fromDistrictId || !toDistrictId || !toWardCode) {
      return res.status(400).json({ 
        error: 'Missing required fields: fromDistrictId, toDistrictId, toWardCode' 
      });
    }
    
    // Map items if provided
    const mappedItems = Array.isArray(products) && products.length > 0
      ? products.map(p => ({
          name: p.name,
          quantity: p.quantity || 1,
          weight: p.weight ? Math.round(Number(p.weight) * 1000) : undefined, // kg -> gram
          code: p.product_code
        }))
      : items || [];

    // Determine service type based on number of items
    const totalItems = mappedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const autoServiceTypeId = totalItems >= 10 ? 5 : 2; // 10+ items = Heavy goods, <10 items = Light goods
    
    console.log(`Calculate fee - Auto-selecting service type: ${autoServiceTypeId} (${totalItems} items - ${autoServiceTypeId === 5 ? 'Heavy goods' : 'Light goods'})`);

    // For heavy goods (service type 5), use optimized dimensions to keep shipping cost reasonable
    if (totalItems >= 10) {
      mappedItems.forEach(item => {
        // Use extremely minimal dimensions for heavy goods based on GHN formula
        // GHN calculates: Max(length), Max(width), Sum(height)
        // Electronics are typically lightweight and compact, so use extremely minimal dimensions
        item.length = item.length || 5; // Extremely minimal length for electronics
        item.width = item.width || 5;   // Extremely minimal width for electronics
        item.height = item.height || 3; // Extremely minimal height for electronics
        item.weight = item.weight || 30; // Very light weight for electronics (30g per item)
        
        console.log(`Calculate fee - Heavy goods item ${item.name}: ${item.length}x${item.width}x${item.height}cm, ${item.weight}g`);
      });
    }

    // Determine weight in grams for GHN
    let weightGrams = Number(weight || 200);
    const unit = (weightUnit || '').toLowerCase();
    if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') {
      weightGrams = Math.round(Number(weight) * 1000);
    } else if (!unit || unit === 'g' || unit === 'gram' || unit === 'grams') {
      // Heuristic: if no unit provided and weight is a small number (<= 50), treat as kg
      if (!unit && Number.isFinite(weightGrams) && weightGrams > 0 && weightGrams <= 50) {
        weightGrams = Math.round(weightGrams * 1000);
      }
      // else assume already grams
    }

    const feeData = {
      fromDistrictId: parseInt(fromDistrictId),
      toDistrictId: parseInt(toDistrictId),
      toWardCode: String(toWardCode),
      weight: weightGrams,
      codAmount: parseInt(codAmount) || 0,
      serviceTypeId: autoServiceTypeId, // Use auto-selected service type
      length: parseInt(length) || 20,
      width: parseInt(width) || 20,
      height: parseInt(height) || 20,
      insuranceValue: parseInt(value ?? insuranceValue) || 0,
      items: mappedItems // Include items for service type 5
    };
    
    console.log('Processed fee data:', feeData);
    
    // Use GHN API for both service types
    const result = await ghnService.calculateShippingFee(feeData);
    
    // Ensure response has proper structure
    if (result && result.data) {
      res.json({
        success: true,
        data: result.data,
        message: result.message || 'Phí vận chuyển đã được tính toán'
      });
    } else {
      res.json({
        success: true,
        data: {
          total: 50000,
          service_fee: 50000,
          insurance_fee: 0,
          time: { time_type: 'hour', leadtime: 24 }
        },
        message: 'Sử dụng phí vận chuyển mặc định'
      });
    }
  } catch (error) {
    console.error('Shipping fee calculation error:', error);
    
    // Return fallback fee on any error
    res.json({
      success: true,
      data: {
        total: 50000,
        service_fee: 50000,
        insurance_fee: 0,
        time: { time_type: 'hour', leadtime: 24 }
      },
      message: 'Sử dụng phí vận chuyển mặc định do lỗi hệ thống'
    });
  }
};

// Lấy danh sách dịch vụ vận chuyển
export const getServices = async (req, res) => {
  try {
    const { fromDistrictId, toDistrictId } = req.query;
    
    if (!fromDistrictId || !toDistrictId) {
      return res.status(400).json({ error: 'fromDistrictId and toDistrictId are required' });
    }
    
    const services = await ghnService.getServices(fromDistrictId, toDistrictId);
    res.json(services);
  } catch (error) {
    handleError(res, error);
  }
};

// Tạo đơn hàng vận chuyển
export const createShippingOrder = async (req, res) => {
  console.log('=== CREATE SHIPPING ORDER START ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers);
  console.log('Request user:', req.user);
  
  try {
    const {
      // Base address fields
      toName,
      toPhone,
      toAddress,
      toWardCode,
      toDistrictId,
      toProvinceId,
      // Sample-compatible fields
      orderId,
      products,
      value,
      pickMoney,
      pickOption,
      hamlet,
      transport,
      note,
      // Legacy/optional fields
      codAmount,
      content,
      weight,
      serviceTypeId,
      length,
      width,
      height,
      items
    } = req.body;
    
    const validation = validateRequired(req.body, [
      'toName', 'toPhone', 'toAddress', 'toWardCode', 'toDistrictId', 'toProvinceId'
    ]);
    if (validation) return res.status(400).json(validation);
    
    // Map sample format -> internal format
    const mappedItems = Array.isArray(products) && products.length > 0
      ? products.map(p => ({
          name: p.name,
          quantity: p.quantity || 1,
          weight: p.weight ? Math.round(Number(p.weight) * 1000) : undefined, // kg -> gram
          code: p.product_code
        }))
      : items || [];

    // Determine service type based on number of items
    const totalItems = mappedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const autoServiceTypeId = totalItems >= 10 ? 5 : 2; // 10+ items = Heavy goods, <10 items = Light goods
    
    console.log(`Auto-selecting service type: ${autoServiceTypeId} (${totalItems} items - ${autoServiceTypeId === 5 ? 'Heavy goods' : 'Light goods'})`);

    // For heavy goods (service type 5), use very small dimensions to keep shipping cost low
    if (totalItems >= 10) {
      mappedItems.forEach(item => {
        // Use extremely small dimensions for heavy goods to minimize shipping cost
        item.length = item.length || 10; // Extremely small length
        item.width = item.width || 10;   // Extremely small width  
        item.height = item.height || 5; // Extremely small height
        item.weight = item.weight || 100; // Extremely light weight per item
        
        console.log(`Heavy goods item ${item.name}: ${item.length}x${item.width}x${item.height}cm, ${item.weight}g`);
      });
    }
    
    const orderData = {
      toName,
      toPhone,
      toAddress,
      toWardCode,
      toDistrictId,
      toProvinceId,
      clientOrderCode: orderId,
      codAmount: (pickMoney ?? codAmount) || 0,
      insuranceValue: value || 0,
      content: content || note || 'Hàng điện tử',
      weight: weight || 200,
      serviceTypeId: autoServiceTypeId, // Auto-select based on item count
      length: length || 20,
      width: width || 20,
      height: height || 20,
      hamlet: hamlet,
      paymentTypeId: pickOption === 'cod' ? 2 : 1,
      transport,
      // Add ConfigFeeID and ExtraCostID only if they have valid values
      ...(ghnConfig.defaultShipping.configFeeId && { configFeeId: ghnConfig.defaultShipping.configFeeId }),
      ...(ghnConfig.defaultShipping.extraCostId && { extraCostId: ghnConfig.defaultShipping.extraCostId }),
      items: mappedItems
    };
    
    console.log('Creating shipping order with data:', JSON.stringify(orderData, null, 2));
    
    try {
      const result = await ghnService.createShippingOrder(orderData);
      console.log('Shipping order created successfully:', JSON.stringify(result, null, 2));
      
      // Update order with GHN order code if orderId is provided
      if (orderId && result.data && result.data.order_code) {
        try {
          await prisma.order.update({
            where: { id: orderId },
            data: { ghnOrderCode: result.data.order_code }
          });
          console.log(`Updated order ${orderId} with GHN order code: ${result.data.order_code}`);
        } catch (updateError) {
          console.error('Error updating order with GHN code:', updateError);
          // Don't fail the request if order update fails
        }
      }
      
      res.json(result);
    } catch (ghnError) {
      console.error('GHN Service Error Details:', {
        message: ghnError.message,
        stack: ghnError.stack,
        name: ghnError.name,
        response: ghnError.response?.data || ghnError.response
      });
      
      // Return specific error message instead of throwing
      return res.status(500).json({
        error: 'GHN API Error',
        message: ghnError.message,
        details: ghnError.response?.data || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Shipping order creation error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    // Return detailed error information
    return res.status(500).json({
      error: 'Shipping order creation failed',
      message: error.message,
      details: error.stack
    });
  }
};

// Theo dõi đơn hàng
export const trackOrder = async (req, res) => {
  try {
    const { orderCode } = req.params;
    
    if (!orderCode) {
      return res.status(400).json({ error: 'Order code is required' });
    }
    
    const result = await ghnService.trackOrder(orderCode);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

// Hủy đơn hàng
export const cancelOrder = async (req, res) => {
  try {
    const { orderCode } = req.params;
    const { reason } = req.body;
    
    if (!orderCode) {
      return res.status(400).json({ error: 'Order code is required' });
    }
    
    const result = await ghnService.cancelOrder(orderCode, reason);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
