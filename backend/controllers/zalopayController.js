import prisma from '../utils/database.js';
import { handleError, validateRequired } from '../utils/helpers.js';
import zalopayService from '../services/zalopayService.js';
import ghnService from '../services/ghnService.js';

/**
 * Tạo đơn hàng ZaloPay
 */
export const createZaloPayOrder = async (req, res) => {
  try {
    console.log('Create ZaloPay order request:', req.body);
    
    const { orderId, amount, description, returnUrl } = req.body;
    
    // Validate required fields
    const validation = validateRequired(req.body, ['orderId', 'amount', 'description']);
    if (validation) return res.status(400).json(validation);
    
    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    // Check if order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId, 
        userId: req.user.id,
        paymentMethod: 'ZALOPAY'
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true }
            }
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found or invalid payment method' });
    }
    
    // Check if order is still pending
    if (order.paymentStatus !== 'PENDING') {
      return res.status(400).json({ error: 'Order is not in pending status' });
    }
    
    // Prepare items for ZaloPay
    const items = order.orderItems.map(item => ({
      itemid: item.product.id,
      itemname: item.product.name,
      itemprice: item.price,
      itemquantity: item.quantity
    }));
    
    // Create ZaloPay order
    const zalopayResult = await zalopayService.createOrder({
      orderId: order.id,
      amount: amount,
      description: description || `Thanh toán đơn hàng ${order.id}`,
      returnUrl: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
      item: items
    });
    
    if (!zalopayResult.success) {
      return res.status(500).json({ 
        error: 'Failed to create ZaloPay order',
        details: zalopayResult.error 
      });
    }
    
    // Update order with ZaloPay transaction info
    await prisma.order.update({
      where: { id: order.id },
      data: {
        transactionId: zalopayResult.app_trans_id,
        // Keep status as PENDING until payment is confirmed
        paymentStatus: 'PENDING' // Đảm bảo paymentStatus là PENDING
      }
    });
    
    res.json({
      success: true,
      order_url: zalopayResult.order_url,
      order_token: zalopayResult.order_token,
      zp_trans_token: zalopayResult.zp_trans_token,
      app_trans_id: zalopayResult.app_trans_id
    });
    
  } catch (error) {
    console.error('Create ZaloPay order error:', error);
    handleError(res, error);
  }
};

/**
 * Xử lý callback từ ZaloPay v2
 * 
 * Callback này được gọi từ ZaloPay server sau khi người dùng thanh toán.
 * Theo tài liệu ZaloPay, callback có format:
 * - data: JSON string chứa thông tin đơn hàng
 * - mac: chữ ký được tạo với ZALOPAY_KEY2
 * - type: loại callback (payment, refund, etc.)
 * - code: mã kết quả (1 = success)
 * - message: thông báo kết quả
 * 
 * Quy trình:
 * 1. Nhận callback data từ ZaloPay
 * 2. Verify MAC signature với ZALOPAY_KEY2
 * 3. Nếu thành công, cập nhật đơn hàng và tạo GHN order
 * 4. Trả response cho ZaloPay
 */
export const handleZaloPayCallback = async (req, res) => {
  try {
    console.log('ZaloPay callback received:', req.body);
    
    const { data, mac, type, code, message } = req.body;
    
    // Verify callback signature theo chuẩn ZaloPay
    const verification = zalopayService.verifyCallback(req.body);
    
    if (!verification.success) {
      console.error('ZaloPay callback verification failed:', verification.error);
      return res.json({ 
        return_code: -1,
        return_message: 'mac not equal'
      });
    }
    
    const { orderData } = verification;
    
    // Check if payment was successful
    if (code !== 1) {
      console.log('ZaloPay payment failed:', message);
      return res.json({ 
        return_code: 1,
        return_message: 'Payment failed - order status updated'
      });
    }
    
    // Find the order by app_trans_id
    const order = await prisma.order.findFirst({
      where: { 
        transactionId: orderData.app_trans_id,
        paymentMethod: 'ZALOPAY'
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true }
            }
          }
        }
      }
    });
    
    if (!order) {
      console.error('Order not found for ZaloPay callback:', orderData.app_trans_id);
      return res.json({ 
        return_code: 0,
        return_message: 'Order not found'
      });
    }
    
    // Update order status to PAID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        status: 'PROCESSING',
        transactionId: orderData.app_trans_id // Lưu app_trans_id từ ZaloPay callback data
      }
    });
    
    console.log(`Order ${order.id} payment confirmed via ZaloPay callback`);
    
    // Create GHN shipping order after successful payment
    try {
      console.log('Creating GHN shipping order for paid ZaloPay order...');
      
      const shippingData = {
        toName: order.shippingName,
        toPhone: order.shippingPhone,
        toAddress: order.shippingAddress,
        toWardCode: '20101', // Sử dụng mã số thay vì tên
        toDistrictId: 1442, // Sử dụng mã số thay vì tên
        toProvinceId: 202, // Sử dụng mã số thay vì tên
        clientOrderCode: order.id,
        codAmount: 0, // No COD for ZaloPay orders
        insuranceValue: order.totalPrice,
        content: `Đơn hàng từ TPE Store - ${order.orderItems.length} sản phẩm`,
        weight: 200,
        serviceTypeId: order.orderItems.length >= 10 ? 5 : 2, // Auto-select service type
        length: 20,
        width: 20,
        height: 20,
        paymentTypeId: 1, // Prepaid
        items: order.orderItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          weight: 200,
          price: item.price
        }))
      };
      
      const ghnResult = await ghnService.createShippingOrder(shippingData);
      
      if (ghnResult.data && ghnResult.data.order_code) {
        // Update order with GHN order code
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            ghnOrderCode: ghnResult.data.order_code,
            status: 'SHIPPING'
          }
        });
        
        console.log(`GHN shipping order created for order ${order.id}: ${ghnResult.data.order_code}`);
      }
      
    } catch (ghnError) {
      console.error('Error creating GHN shipping order:', ghnError);
      // Don't fail the callback if GHN fails - order is still paid
    }
    
    // Return success response to ZaloPay theo chuẩn
    res.json({ 
      return_code: 1,
      return_message: 'success'
    });
    
  } catch (error) {
    console.error('ZaloPay callback error:', error);
    res.json({ 
      return_code: 0,
      return_message: error.message || 'Internal server error'
    });
  }
};

/**
 * Verify thanh toán ZaloPay v2 với zp_trans_token
 * 
 * Endpoint này được gọi từ frontend sau khi người dùng thanh toán trên ZaloPay
 * và redirect về trang verify với zp_trans_token trong query params.
 * 
 * Quy trình:
 * 1. Nhận zp_trans_token từ frontend
 * 2. Gọi ZaloPay API /v2/query để kiểm tra trạng thái
 * 3. Nếu return_code === 1 && sub_return_code === 1 → thanh toán thành công
 * 4. Cập nhật database và trả kết quả cho frontend
 */
export const verifyZaloPayPayment = async (req, res) => {
  try {
    console.log('Verify ZaloPay payment request:', req.body);
    
    const { zp_trans_token, orderId } = req.body;
    
    // Validate required fields
    if (!zp_trans_token) {
      return res.status(400).json({ 
        success: false,
        error: 'zp_trans_token is required' 
      });
    }
    
    // Gọi ZaloPay API để verify thanh toán
    const verificationResult = await zalopayService.verifyPayment(zp_trans_token);
    
    if (!verificationResult.success) {
      console.error('ZaloPay verification failed:', verificationResult.error);
      return res.status(400).json({
        success: false,
        error: verificationResult.error || 'Payment verification failed'
      });
    }
    
    const { data: zalopayData } = verificationResult;
    
    // Kiểm tra trạng thái thanh toán theo chuẩn ZaloPay v2
    if (zalopayData.return_code === 1 && zalopayData.sub_return_code === 1) {
      // Thanh toán thành công - tìm đơn hàng và cập nhật
      let order;
      
      if (orderId) {
        // Tìm đơn hàng theo orderId nếu có
        order = await prisma.order.findFirst({
          where: { 
            id: orderId,
            paymentMethod: 'ZALOPAY'
          },
          include: {
            orderItems: {
              include: {
                product: {
                  select: { id: true, name: true, price: true }
                }
              }
            }
          }
        });
      } else {
        // Tìm đơn hàng theo app_trans_id từ ZaloPay response
        order = await prisma.order.findFirst({
          where: { 
            transactionId: zalopayData.app_trans_id,
            paymentMethod: 'ZALOPAY'
          },
          include: {
            orderItems: {
              include: {
                product: {
                  select: { id: true, name: true, price: true }
                }
              }
            }
          }
        });
      }
      
      if (!order) {
        console.error('Order not found for verification:', { orderId, app_trans_id: zalopayData.app_trans_id });
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      // Cập nhật trạng thái đơn hàng thành PAID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
          status: 'PROCESSING',
          transactionId: zp_trans_token // Lưu zp_trans_token thay vì app_trans_id
        }
      });
      
      console.log(`Order ${order.id} payment verified and updated to PAID`);
      
      // Tạo đơn GHN sau khi thanh toán thành công
      try {
        console.log('Creating GHN shipping order for verified ZaloPay order...');
        console.log('Order details:', {
          id: order.id,
          shippingName: order.shippingName,
          shippingPhone: order.shippingPhone,
          shippingAddress: order.shippingAddress,
          shippingWard: order.shippingWard,
          shippingDistrict: order.shippingDistrict,
          shippingProvince: order.shippingProvince,
          totalPrice: order.totalPrice,
          orderItemsCount: order.orderItems.length
        });
        
        const shippingData = {
          toName: order.shippingName,
          toPhone: order.shippingPhone,
          toAddress: order.shippingAddress,
          toWardCode: order.shippingWard,
          toDistrictId: order.shippingDistrict,
          toProvinceId: order.shippingProvince,
          clientOrderCode: order.id,
          codAmount: 0, // No COD for ZaloPay orders
          insuranceValue: order.totalPrice,
          content: `Đơn hàng từ TPE Store - ${order.orderItems.length} sản phẩm`,
          weight: 200,
          serviceTypeId: order.orderItems.length >= 10 ? 5 : 2, // Auto-select service type
          length: 20,
          width: 20,
          height: 20,
          paymentTypeId: 1, // Prepaid
          items: order.orderItems.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            weight: 200,
            price: item.price
          }))
        };
        
        console.log('GHN shipping data:', JSON.stringify(shippingData, null, 2));
        
        const ghnResult = await ghnService.createShippingOrder(shippingData);
        
        console.log('GHN result:', JSON.stringify(ghnResult, null, 2));
        
        if (ghnResult.data && ghnResult.data.order_code) {
          // Cập nhật đơn hàng với mã GHN
          await prisma.order.update({
            where: { id: order.id },
            data: { 
              ghnOrderCode: ghnResult.data.order_code,
              status: 'SHIPPING'
            }
          });
          
          console.log(`✅ GHN shipping order created for order ${order.id}: ${ghnResult.data.order_code}`);
        } else {
          console.error('❌ GHN order creation failed - no order_code in response:', ghnResult);
        }
        
      } catch (ghnError) {
        console.error('❌ Error creating GHN shipping order:', ghnError);
        console.error('GHN Error details:', {
          message: ghnError.message,
          stack: ghnError.stack,
          response: ghnError.response?.data
        });
        // Không fail request nếu GHN lỗi - đơn hàng vẫn đã thanh toán thành công
      }
      
      // Trả kết quả thành công với thông tin đầy đủ
      res.json({
        success: true,
        message: 'Payment verified',
        paymentStatus: 'PAID',
        orderId: order.id,
        ghnOrderCode: order.ghnOrderCode,
        order: {
          id: order.id,
          totalPrice: order.totalPrice,
          paymentStatus: order.paymentStatus,
          status: order.status,
          ghnOrderCode: order.ghnOrderCode,
          shippingName: order.shippingName,
          shippingPhone: order.shippingPhone,
          shippingAddress: order.shippingAddress,
          orderItems: order.orderItems
        }
      });
      
    } else {
      // Thanh toán thất bại
      console.log('ZaloPay payment verification failed:', {
        return_code: zalopayData.return_code,
        sub_return_code: zalopayData.sub_return_code,
        return_message: zalopayData.return_message,
        sub_return_message: zalopayData.sub_return_message
      });
      
      res.json({
        success: false,
        message: 'Payment not verified',
        error: zalopayData.return_message || 'Payment verification failed',
        result: zalopayData
      });
    }
    
  } catch (error) {
    console.error('Verify ZaloPay payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Kiểm tra trạng thái thanh toán ZaloPay theo chuẩn QueryOrder API
 * 
 * Theo tài liệu ZaloPay, endpoint này sử dụng QueryOrder API để kiểm tra trạng thái
 * với app_trans_id thay vì zp_trans_token.
 */
export const checkZaloPayStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    // Find order
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId, 
        userId: req.user.id,
        paymentMethod: 'ZALOPAY'
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // If we have transaction ID (app_trans_id), check with ZaloPay QueryOrder API
    if (order.transactionId) {
      console.log(`Checking ZaloPay status for app_trans_id: ${order.transactionId}`);
      
      const statusResult = await zalopayService.checkPaymentStatus(order.transactionId);
      
      if (statusResult.success) {
        const zalopayData = statusResult.data;
        
        // Nếu ZaloPay báo thanh toán thành công nhưng DB chưa update
        if (zalopayData.return_code === 1 && order.paymentStatus === 'PENDING') {
          console.log(`Updating order ${order.id} to PAID based on ZaloPay status`);
          
          // Update order status
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'PAID',
              paidAt: new Date(),
              status: 'PROCESSING'
            }
          });
          
          // Create GHN order if not exists
          if (!order.ghnOrderCode) {
            try {
              const orderWithItems = await prisma.order.findUnique({
                where: { id: order.id },
                include: {
                  orderItems: {
                    include: {
                      product: {
                        select: { id: true, name: true, price: true }
                      }
                    }
                  }
                }
              });
              
              const shippingData = {
                toName: orderWithItems.shippingName,
                toPhone: orderWithItems.shippingPhone,
                toAddress: orderWithItems.shippingAddress,
                toWardCode: '20101', // Sử dụng mã số thay vì tên
                toDistrictId: 1442, // Sử dụng mã số thay vì tên
                toProvinceId: 202, // Sử dụng mã số thay vì tên
                clientOrderCode: orderWithItems.id,
                codAmount: 0,
                insuranceValue: orderWithItems.totalPrice,
                content: `Đơn hàng từ TPE Store - ${orderWithItems.orderItems.length} sản phẩm`,
                weight: 200,
                serviceTypeId: orderWithItems.orderItems.length >= 10 ? 5 : 2,
                length: 20,
                width: 20,
                height: 20,
                paymentTypeId: 1,
                items: orderWithItems.orderItems.map(item => ({
                  name: item.product.name,
                  quantity: item.quantity,
                  weight: 200,
                  price: item.price
                }))
              };
              
              const ghnResult = await ghnService.createShippingOrder(shippingData);
              
              if (ghnResult.data && ghnResult.data.order_code) {
                await prisma.order.update({
                  where: { id: order.id },
                  data: { 
                    ghnOrderCode: ghnResult.data.order_code,
                    status: 'SHIPPING'
                  }
                });
                
                console.log(`GHN order created for order ${order.id}: ${ghnResult.data.order_code}`);
              }
            } catch (ghnError) {
              console.error('Error creating GHN order:', ghnError);
            }
          }
        }
        
        return res.json({
          orderId: order.id,
          paymentStatus: zalopayData.return_code === 1 ? 'PAID' : order.paymentStatus,
          status: order.status,
          zalopayStatus: zalopayData,
          ghnOrderCode: order.ghnOrderCode,
          app_trans_id: order.transactionId
        });
      }
    }
    
    // Return current order status
    res.json({
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      status: order.status,
      ghnOrderCode: order.ghnOrderCode,
      app_trans_id: order.transactionId
    });
    
  } catch (error) {
    console.error('Check ZaloPay status error:', error);
    handleError(res, error);
  }
};
