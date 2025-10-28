import crypto from 'crypto';
import axios from 'axios';

class ZaloPayService {
  constructor() {
    this.appId = process.env.ZALOPAY_APP_ID;
    this.key1 = process.env.ZALOPAY_KEY1;
    this.key2 = process.env.ZALOPAY_KEY2;
    this.createEndpoint = process.env.ZALOPAY_CREATE_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create';
    this.callbackUrl = process.env.ZALOPAY_SANDBOX_CALLBACK_URL;
  }


  /**
   * Tạo đơn hàng ZaloPay Gateway v2
   * 
   * ZaloPay v2 yêu cầu:
   * - app_trans_id: yyMMdd_randomNumber (2 số năm, 2 số tháng, 2 số ngày + random 5 chữ số)
   * - embed_data: sử dụng "redirecturl" thay vì "returnUrl"
   * - MAC: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
   * - callback_url: HTTPS hợp lệ từ environment
   */
  async createOrder(orderData) {
    try {
      const {
        orderId,
        amount,
        description,
        returnUrl,
        item = []
      } = orderData;

      // Tạo timestamp cho app_time
      const timestamp = Date.now();
      
      // Tạo app_trans_id theo chuẩn ZaloPay v2: yyMMdd_randomNumber
      // Ví dụ: 250128_12345 (28/01/2025 + random 5 số)
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2); // 2 số cuối năm
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const randomNumber = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const appTransId = `${year}${month}${day}_${randomNumber}`;

      // Chuẩn bị embed_data với "redirecturl" theo chuẩn v2
      // ZaloPay v2 sử dụng "redirecturl" để redirect sau khi thanh toán thành công
      // redirecturl sẽ chứa orderId để frontend có thể xác định đơn hàng
      const embedData = {
        orderId: orderId,
        redirecturl: returnUrl // returnUrl đã chứa orderId từ frontend
      };

      // Dữ liệu gửi đến ZaloPay Gateway v2
      const data = {
        app_id: parseInt(this.appId),
        app_time: timestamp,
        app_trans_id: appTransId,
        app_user: 'TPE_Store',
        bank_code: '',
        description: description,
        amount: amount,
        embed_data: JSON.stringify(embedData),
        item: JSON.stringify(item),
        callback_url: this.callbackUrl // HTTPS callback URL từ environment
      };

      // Tạo MAC theo chuẩn ZaloPay v2 với thứ tự cố định
      // Thứ tự: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
      // Sử dụng HmacSHA256 với ZALOPAY_KEY1
      const rawData = `${data.app_id}|${data.app_trans_id}|${data.app_user}|${data.amount}|${data.app_time}|${data.embed_data}|${data.item}`;
      data.mac = crypto.createHmac('sha256', this.key1).update(rawData).digest('hex');

      console.log('ZaloPay create order data:', data);

      // Convert data to URL-encoded format
      const formData = new URLSearchParams();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });

      // Gọi API ZaloPay
      const response = await axios.post(this.createEndpoint, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('ZaloPay v2 API response:', response.data);

      // Xử lý response theo chuẩn ZaloPay v2
      if (response.data.return_code === 1) {
        // Thành công - trả về order_url để redirect
        console.log('ZaloPay v2 order created successfully:', {
          app_trans_id: appTransId,
          order_url: response.data.order_url,
          zp_trans_token: response.data.zp_trans_token
        });
        
        return {
          success: true,
          order_url: response.data.order_url,
          order_token: response.data.order_token,
          zp_trans_token: response.data.zp_trans_token,
          app_trans_id: appTransId
        };
      } else {
        // Lỗi - log đầy đủ thông tin để debug
        console.error('ZaloPay v2 API error:', {
          return_code: response.data.return_code,
          return_message: response.data.return_message,
          sub_return_code: response.data.sub_return_code,
          sub_return_message: response.data.sub_return_message,
          app_trans_id: appTransId,
          request_data: {
            app_id: data.app_id,
            amount: data.amount,
            description: data.description
          }
        });
        
        return {
          success: false,
          error: response.data.return_message || 'ZaloPay v2 API error',
          sub_return_code: response.data.sub_return_code,
          sub_return_message: response.data.sub_return_message,
          app_trans_id: appTransId
        };
      }
    } catch (error) {
      // Log lỗi network hoặc exception
      console.error('ZaloPay v2 create order network error:', {
        message: error.message,
        stack: error.stack,
        app_trans_id: appTransId || 'unknown',
        endpoint: this.createEndpoint
      });
      
      return {
        success: false,
        error: error.message || 'Network error',
        app_trans_id: appTransId || 'unknown'
      };
    }
  }

  /**
   * Tạo MAC cho ZaloPay v2 Query API
   * 
   * Theo ZaloPay v2 documentation, MAC cho /v2/query chỉ cần:
   * app_id|zp_trans_token
   * 
   * @param {Object} data - Dữ liệu chứa app_id và zp_trans_token
   * @param {string} key - ZALOPAY_KEY2
   * @returns {string} MAC signature
   */
  createMacV2(data, key) {
    const str = `${data.app_id}|${data.zp_trans_token}`;
    return crypto.createHmac('sha256', key).update(str).digest('hex');
  }

  /**
   * Verify thanh toán ZaloPay v2 với zp_trans_token
   * 
   * Method này gọi ZaloPay API /v2/query để kiểm tra trạng thái thanh toán
   * sau khi người dùng hoàn thành thanh toán trên ZaloPay.
   * 
   * @param {string} zpTransToken - Token từ ZaloPay sau khi thanh toán
   * @returns {Object} Kết quả verify với success, data, error
   */
  async verifyPayment(zpTransToken) {
    try {
      console.log('Verifying ZaloPay payment with token:', zpTransToken);
      
      // Chuẩn bị dữ liệu cho API /v2/query theo chuẩn ZaloPay v2
      const data = {
        app_id: parseInt(this.appId),
        zp_trans_token: zpTransToken
      };
      
      // Tạo MAC cho request verify theo ZaloPay v2
      // Format: app_id|zp_trans_token (sử dụng KEY2)
      data.mac = this.createMacV2(data, this.key2);
      
      console.log('ZaloPay verify payment data:', data);
      
      // Convert data to URL-encoded format
      const formData = new URLSearchParams();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      
      // Gọi ZaloPay API /v2/query
      const queryEndpoint = this.createEndpoint.replace('/v2/create', '/v2/query');
      const response = await axios.post(queryEndpoint, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log('ZaloPay verify payment response:', response.data);
      
      if (response.data.return_code === 1) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response.data.return_message || 'Payment verification failed',
          data: response.data
        };
      }
      
    } catch (error) {
      console.error('ZaloPay verify payment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify payment'
      };
    }
  }

  /**
   * Xác thực callback từ ZaloPay v2
   * 
   * Callback từ ZaloPay v2 có format:
   * - data: JSON string chứa thông tin đơn hàng
   * - mac: chữ ký được tạo với ZALOPAY_KEY2
   * - type: loại callback (payment, refund, etc.)
   * - code: mã kết quả (1 = success)
   * - message: thông báo kết quả
   */
  verifyCallback(callbackData) {
    try {
      const {
        data,
        mac,
        type,
        code,
        message
      } = callbackData;

      console.log('ZaloPay callback data received:', callbackData);

      // Tạo chữ ký để xác thực theo ZaloPay v2
      // Format: data|type|code|message
      const rawData = `${data}|${type}|${code}|${message}`;
      const expectedMac = crypto.createHmac('sha256', this.key2).update(rawData).digest('hex');

      console.log('ZaloPay callback MAC verification:', {
        received: mac,
        expected: expectedMac,
        rawData: rawData
      });

      if (mac !== expectedMac) {
        console.error('ZaloPay callback signature verification failed');
        return {
          success: false,
          error: 'Invalid signature'
        };
      }

      // Parse data
      const orderData = JSON.parse(data);
      
      console.log('ZaloPay callback verified successfully:', {
        orderData: orderData,
        type: type,
        code: code,
        message: message
      });
      
      return {
        success: true,
        orderData: orderData,
        type: type,
        code: code,
        message: message
      };
    } catch (error) {
      console.error('ZaloPay callback verification error:', error);
      return {
        success: false,
        error: error.message || 'Callback verification failed'
      };
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán ZaloPay theo QueryOrder API
   * 
   * Theo tài liệu ZaloPay, QueryOrder API sử dụng:
   * - app_id: ID ứng dụng
   * - app_trans_id: ID giao dịch của ứng dụng
   * - mac: chữ ký với format app_id|app_trans_id|key1
   */
  async checkPaymentStatus(appTransId) {
    try {
      console.log('Checking ZaloPay payment status for app_trans_id:', appTransId);

      const data = {
        app_id: parseInt(this.appId),
        app_trans_id: appTransId
      };
      
      // Tạo MAC cho request query theo chuẩn ZaloPay
      // Format: app_id|app_trans_id|key1
      const macData = `${data.app_id}|${data.app_trans_id}|${this.key1}`;
      data.mac = crypto.createHmac('sha256', this.key1).update(macData).digest('hex');
      
      console.log('ZaloPay QueryOrder request data:', data);
      
      // Convert data to URL-encoded format
      const formData = new URLSearchParams();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      
      // Gọi ZaloPay QueryOrder API
      const response = await axios.post('https://sb-openapi.zalopay.vn/v2/query', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log('ZaloPay QueryOrder response:', response.data);
      
      return {
        success: true,
        data: response.data
      };
      
    } catch (error) {
      console.error('ZaloPay QueryOrder error:', error);
      return {
        success: false,
        error: error.message || 'Failed to check payment status'
      };
    }
  }
}

export default new ZaloPayService();
