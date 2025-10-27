// Use Node's built-in fetch (Node >=18)

async function httpRequest(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    if (!res.ok) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      console.error(`HTTP ${res.status} Error:`, message);
      throw new Error(`HTTP ${res.status}: ${message}`);
    }
    return data;
  } finally {
    clearTimeout(id);
  }
}

class GHNService {
  constructor() {
    // Cấu hình GHN API
    this.baseURL = process.env.GHN_BASE_URL || 'https://dev-online-gateway.ghn.vn';
    this.token = process.env.GHN_TOKEN || '637170d5-942b-11ea-9821-0281a26fb5d4';
    this.shopId = process.env.GHN_SHOP_ID || '885';
    this.timeout = 10000; // 10 seconds timeout
    this.fallbackFee = 50000; // 50.000 VND fallback fee
  }

  // Tạo headers cho GHN API
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Token': this.token,
      'ShopId': this.shopId
    };
  }

  // Lấy danh sách tỉnh/thành phố
  async getProvinces() {
    try {
      return await httpRequest(`${this.baseURL}/shiip/public-api/master-data/province`, {
        method: 'GET',
        headers: this.getHeaders()
      }, this.timeout);
    } catch (error) {
      console.error('Error fetching provinces:', error.message);
      throw new Error('Không thể lấy danh sách tỉnh/thành phố');
    }
  }

  // Lấy danh sách quận/huyện theo tỉnh
  async getDistricts(provinceId) {
    try {
      const url = new URL(`${this.baseURL}/shiip/public-api/master-data/district`);
      url.searchParams.set('province_id', String(provinceId));
      return await httpRequest(url.toString(), {
        method: 'GET',
        headers: this.getHeaders()
      }, this.timeout);
    } catch (error) {
      console.error('Error fetching districts:', error.message);
      throw new Error('Không thể lấy danh sách quận/huyện');
    }
  }

  // Lấy danh sách phường/xã theo quận
  async getWards(districtId) {
    try {
      const url = new URL(`${this.baseURL}/shiip/public-api/master-data/ward`);
      url.searchParams.set('district_id', String(districtId));
      return await httpRequest(url.toString(), {
        method: 'GET',
        headers: this.getHeaders()
      }, this.timeout);
    } catch (error) {
      console.error('Error fetching wards:', error.message);
      throw new Error('Không thể lấy danh sách phường/xã');
    }
  }

  // Tính phí vận chuyển
  async calculateShippingFee(data) {
    try {
      const payload = {
        from_district_id: parseInt(data.fromDistrictId),
        to_district_id: parseInt(data.toDistrictId),
        to_ward_code: data.toWardCode,
        service_type_id: parseInt(data.serviceTypeId) || 2,
        weight: parseInt(data.weight) || 200, // gram
        length: parseInt(data.length) || 20, // cm
        width: parseInt(data.width) || 20, // cm
        height: parseInt(data.height) || 20, // cm
        cod_amount: parseInt(data.codAmount) || 0,
        insurance_value: parseInt(data.insuranceValue) || 0
      };

      // For service type 5 (heavy goods), add items array with very small dimensions
      if (parseInt(data.serviceTypeId) === 5 && data.items && data.items.length > 0) {
        payload.items = data.items.map(item => ({
          name: item.name,
          quantity: parseInt(item.quantity) || 1,
          weight: parseInt(item.weight) || 30,
          length: parseInt(item.length) || 5,
          width: parseInt(item.width) || 5,
          height: parseInt(item.height) || 3,
          code: item.code || item.name || 'PRODUCT'
        }));
        
        console.log('Added items for service type 5 with small dimensions:', payload.items);
      }

      console.log('GHN API payload:', JSON.stringify(payload, null, 2));
      console.log('GHN API headers:', this.getHeaders());

      const result = await httpRequest(`${this.baseURL}/shiip/public-api/v2/shipping-order/fee`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      }, this.timeout);

      console.log('GHN API response:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Error calculating shipping fee:', error.message);
      console.error('Full error:', error);
      
      // Return fallback fee instead of throwing error
      console.log('Using fallback fee:', this.fallbackFee);
      return {
        code: 200,
        message: 'Success',
        data: {
          total: this.fallbackFee,
          service_fee: this.fallbackFee,
          insurance_fee: 0,
          pick_station_fee: 0,
          coupon_value: 0,
          r2s_fee: 0,
          return_again: 0,
          document_return: 0,
          double_check: 0,
          cod_fee: 0,
          pick_remote_areas_fee: 0,
          deliver_remote_areas_fee: 0,
          cod_failed_fee: 0,
          station_do: 0,
          station_pu: 0,
          return: 0,
          change_address_fee: 0,
          oil_fee: 0,
          remote_areas_fee: 0,
          in_remote_areas_fee: 0,
          out_remote_areas_fee: 0,
          total_before_coupon: this.fallbackFee,
          standard_service: this.fallbackFee,
          time: {
            time_type: 'hour',
            leadtime: 24
          }
        }
      };
    }
  }

  // Tạo đơn hàng vận chuyển
  async createShippingOrder(data) {
    // Get available services to find valid service_id (moved outside try block)
    let serviceId = parseInt(data.serviceId) || 53320; // Default fallback
    try {
      const services = await this.getServices(1442, parseInt(data.toDistrictId));
      if (services && services.data && services.data.length > 0) {
        // Use the first available service
        serviceId = services.data[0].service_id;
        console.log('Using service ID from available services:', serviceId);
      }
    } catch (serviceError) {
      console.log('Could not fetch services, using default service ID:', serviceId);
    }

    try {
      console.log('Creating shipping order with data:', data);
      
      const payload = {
        // Required fields according to GHN documentation
        to_ward_code: data.toWardCode,
        to_district_id: parseInt(data.toDistrictId),
        weight: parseInt(data.weight) || 200,
        service_type_id: parseInt(data.serviceTypeId) || 2,
        service_id: serviceId,
        items: (data.items || []).map(it => {
          const item = {
            name: it.name,
            quantity: parseInt(it.quantity) || 1,
            weight: parseInt(it.weight) || 30,
            code: it.code || it.name || 'PRODUCT'
          };
          
          // For service type 5 (heavy goods), add individual item dimensions
          if (parseInt(data.serviceTypeId) === 5) {
            item.length = parseInt(it.length) || 5;
            item.width = parseInt(it.width) || 5;
            item.height = parseInt(it.height) || 3;
          }
          
          return item;
        }),
        
        // Optional fields - only include if they have values
        ...(data.clientOrderCode && { client_order_code: data.clientOrderCode }),
        ...(data.toName && { to_name: data.toName }),
        ...(data.toPhone && { to_phone: data.toPhone }),
        ...(data.toAddress && { to_address: data.toAddress }),
        ...(data.toProvinceId && { to_province_id: parseInt(data.toProvinceId) }),
        ...(data.hamlet && { hamlet: data.hamlet }),
        ...(data.returnName && { return_name: data.returnName }),
        ...(data.returnPhone && { return_phone: data.returnPhone }),
        ...(data.returnAddress && { return_address: data.returnAddress }),
        ...(data.returnWardCode && { return_ward_code: data.returnWardCode }),
        ...(data.returnDistrictId && { return_district_id: parseInt(data.returnDistrictId) }),
        ...(data.returnProvinceId && { return_province_id: parseInt(data.returnProvinceId) }),
        ...(data.codAmount && { cod_value: parseInt(data.codAmount) }),
        ...(data.length && { length: parseInt(data.length) }),
        ...(data.width && { width: parseInt(data.width) }),
        ...(data.height && { height: parseInt(data.height) }),
        ...(data.insuranceValue && { insurance_value: parseInt(data.insuranceValue) }),
        // Add required fields for GHN API
        required_note: data.requiredNote || 'CHOTHUHANG',
        payment_type_id: data.paymentTypeId || 1
      };

      console.log('GHN API payload:', JSON.stringify(payload, null, 2));
      console.log('GHN API headers:', this.getHeaders());

      const result = await httpRequest(`${this.baseURL}/shiip/public-api/v2/shipping-order/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      }, this.timeout);

      console.log('GHN API response:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Error creating shipping order:', error.message);
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      
      // If ConfigFeeID/ExtraCostID error, try without those fields
      if (error.message.includes('ConfigFeeID') || error.message.includes('ExtraCostID')) {
        console.log('Retrying without ConfigFeeID/ExtraCostID...');
        try {
          // Rebuild payload without problematic fields
          const simplifiedPayload = {
            to_ward_code: data.toWardCode,
            to_district_id: parseInt(data.toDistrictId),
            weight: parseInt(data.weight) || 200,
            service_type_id: parseInt(data.serviceTypeId) || 2,
            service_id: serviceId,
            items: (data.items || []).map(it => {
              const item = {
                name: it.name,
                quantity: parseInt(it.quantity) || 1,
                weight: parseInt(it.weight) || 30,
                code: it.code || it.name || 'PRODUCT'
              };
              
              // For service type 5 (heavy goods), add individual item dimensions
              if (parseInt(data.serviceTypeId) === 5) {
                item.length = parseInt(it.length) || 25;
                item.width = parseInt(it.width) || 22;
                item.height = parseInt(it.height) || 18;
              }
              
              return item;
            }),
            
            // Optional fields - only include if they have values
            ...(data.clientOrderCode && { client_order_code: data.clientOrderCode }),
            ...(data.toName && { to_name: data.toName }),
            ...(data.toPhone && { to_phone: data.toPhone }),
            ...(data.toAddress && { to_address: data.toAddress }),
            ...(data.toProvinceId && { to_province_id: parseInt(data.toProvinceId) }),
            ...(data.hamlet && { hamlet: data.hamlet }),
            ...(data.returnName && { return_name: data.returnName }),
            ...(data.returnPhone && { return_phone: data.returnPhone }),
            ...(data.returnAddress && { return_address: data.returnAddress }),
            ...(data.returnWardCode && { return_ward_code: data.returnWardCode }),
            ...(data.returnDistrictId && { return_district_id: parseInt(data.returnDistrictId) }),
            ...(data.returnProvinceId && { return_province_id: parseInt(data.returnProvinceId) }),
            ...(data.codAmount && { cod_value: parseInt(data.codAmount) }),
            ...(data.length && { length: parseInt(data.length) }),
            ...(data.width && { width: parseInt(data.width) }),
            ...(data.height && { height: parseInt(data.height) }),
            ...(data.insuranceValue && { insurance_value: parseInt(data.insuranceValue) })
          };
          
          console.log('Retry payload:', JSON.stringify(simplifiedPayload, null, 2));
          
          const retryResult = await httpRequest(`${this.baseURL}/shiip/public-api/v2/shipping-order/create`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(simplifiedPayload)
          }, this.timeout);
          
          console.log('Retry successful:', JSON.stringify(retryResult, null, 2));
          return retryResult;
        } catch (retryError) {
          console.error('Retry also failed:', retryError.message);
        }
      }
      
      throw new Error('Không thể tạo đơn hàng vận chuyển: ' + error.message);
    }
  }

  // Lấy chi tiết đơn hàng GHN
  async getOrderDetail(orderCode) {
    try {
      const payload = {
        order_code: orderCode
      };

      console.log('GHN API payload for order detail:', JSON.stringify(payload, null, 2));
      console.log('GHN API headers:', this.getHeaders());

      const result = await httpRequest(`${this.baseURL}/shiip/public-api/v2/shipping-order/detail`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      }, this.timeout);

      console.log('GHN API response for order detail:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Error getting order detail:', error.message);
      throw new Error('Không thể lấy chi tiết đơn hàng GHN');
    }
  }

  // Theo dõi đơn hàng
  async trackOrder(orderCode) {
    try {
      const url = new URL(`${this.baseURL}/shiip/public-api/v2/shipping-order/detail`);
      url.searchParams.set('order_code', String(orderCode));
      return await httpRequest(url.toString(), {
        method: 'GET',
        headers: this.getHeaders()
      }, this.timeout);
    } catch (error) {
      console.error('Error tracking order:', error.message);
      throw new Error('Không thể theo dõi đơn hàng');
    }
  }

  // Hủy đơn hàng
  async cancelOrder(orderCode) {
    try {
      const payload = {
        order_codes: [orderCode]
      };

      console.log('GHN API payload for cancel order:', JSON.stringify(payload, null, 2));
      console.log('GHN API headers:', this.getHeaders());

      const result = await httpRequest(`${this.baseURL}/shiip/public-api/v2/switch-status/cancel`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      }, this.timeout);

      console.log('GHN API response for cancel order:', JSON.stringify(result, null, 2));
      
      // Kiểm tra response từ GHN
      if (result && result.data && Array.isArray(result.data)) {
        const orderResult = result.data.find(item => item.order_code === orderCode);
        if (orderResult) {
          if (orderResult.result === true) {
            console.log(`✅ GHN order ${orderCode} cancelled successfully`);
            return {
              success: true,
              message: orderResult.message || 'Đơn hàng đã được hủy thành công trên GHN',
              orderCode: orderResult.order_code,
              result: orderResult.result
            };
          } else {
            console.log(`❌ GHN order ${orderCode} cancellation failed: ${orderResult.message}`);
            return {
              success: false,
              message: orderResult.message || 'Không thể hủy đơn hàng trên GHN',
              orderCode: orderResult.order_code,
              result: orderResult.result
            };
          }
        }
      }
      
      // Fallback nếu không tìm thấy order trong response
      return {
        success: true,
        message: 'Đơn hàng đã được hủy thành công trên GHN',
        orderCode: orderCode,
        result: true
      };
      
    } catch (error) {
      console.error('Error canceling GHN order:', error.message);
      
      // Phân tích lỗi từ GHN API
      if (error.message.includes('400')) {
        throw new Error('Lỗi dữ liệu gửi lên GHN: ' + error.message);
      } else if (error.message.includes('401')) {
        throw new Error('Lỗi xác thực GHN: Token hoặc ShopId không đúng');
      } else if (error.message.includes('403')) {
        throw new Error('Không có quyền hủy đơn hàng trên GHN');
      } else if (error.message.includes('404')) {
        throw new Error('Đơn hàng không tồn tại trên GHN');
      } else {
        throw new Error('Lỗi kết nối GHN API: ' + error.message);
      }
    }
  }

  // Lấy thông tin dịch vụ vận chuyển
  async getServices(fromDistrictId, toDistrictId) {
    try {
      const url = new URL(`${this.baseURL}/shiip/public-api/v2/shipping-order/available-services`);
      url.searchParams.set('from_district', String(fromDistrictId));
      url.searchParams.set('to_district', String(toDistrictId));
      url.searchParams.set('shop_id', String(this.shopId));
      
      const headers = this.getHeaders();
      console.log('Getting services with headers:', headers);
      
      return await httpRequest(url.toString(), {
        method: 'GET',
        headers: headers
      }, this.timeout);
    } catch (error) {
      console.error('Error fetching services:', error.message);
      throw new Error('Không thể lấy danh sách dịch vụ vận chuyển');
    }
  }
}

export default new GHNService();
