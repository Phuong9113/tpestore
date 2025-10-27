# 🔍 Order Cancellation Troubleshooting Guide

## Quick Checklist

### 1. Server Status ✅
- [ ] Backend server is running on port 4000
- [ ] Database connection is working
- [ ] No server errors in console

**Check:** Run `cd backend && npm start` and check for errors

### 2. Authentication ✅
- [ ] User is logged in
- [ ] Token is valid and not expired
- [ ] User has correct role (ADMIN for admin endpoints)

**Check:** 
```javascript
// In browser console
console.log(localStorage.getItem('tpestore_token'));
```

### 3. Order Status ✅
- [ ] Order exists in database
- [ ] Order status is PENDING or PROCESSING
- [ ] Order is not already CANCELLED
- [ ] Order is not COMPLETED or SHIPPING

**Check:** Look at order details in admin panel or user profile

### 4. User Permissions ✅
- [ ] User owns the order (for user cancellation)
- [ ] Order is within 24 hours (for user cancellation)
- [ ] User has ADMIN role (for admin cancellation)

### 5. GHN Integration ✅
- [ ] GHN credentials are correct
- [ ] GHN API is accessible
- [ ] Order has ghnOrderCode (if applicable)

**Check:** Test GHN API directly with curl:
```bash
curl -X POST 'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/switch-status/cancel' \
--header 'Content-Type: application/json' \
--header 'ShopId: 197687' \
--header 'Token: 2bf42843-af1e-11f0-b040-4e257d8388b4' \
--data-raw '{"order_codes":["YOUR_ORDER_CODE"]}'
```

## Common Error Messages and Solutions

### "Đơn hàng không tồn tại"
- **Cause:** Order ID is invalid or order doesn't exist
- **Solution:** Check if order ID is correct and exists in database

### "Đơn hàng đã được hủy trước đó"
- **Cause:** Order status is already CANCELLED
- **Solution:** Check order status, cannot cancel already cancelled orders

### "Không thể hủy đơn hàng đã hoàn thành"
- **Cause:** Order status is COMPLETED
- **Solution:** Completed orders cannot be cancelled

### "Không thể hủy đơn hàng đang vận chuyển"
- **Cause:** Order status is SHIPPING
- **Solution:** Orders in shipping cannot be cancelled

### "Chỉ có thể hủy đơn hàng trong vòng 24 giờ đầu"
- **Cause:** Order is older than 24 hours (user cancellation only)
- **Solution:** Only admins can cancel old orders

### "Đơn hàng không tồn tại hoặc không thuộc về bạn"
- **Cause:** User trying to cancel someone else's order
- **Solution:** Check if user owns the order

### "Failed to cancel order: 401"
- **Cause:** Authentication failed
- **Solution:** Check if user is logged in and token is valid

### "Failed to cancel order: 403"
- **Cause:** Authorization failed
- **Solution:** Check if user has correct permissions

### "Failed to cancel order: 404"
- **Cause:** Order not found
- **Solution:** Check if order ID exists

### "Failed to cancel order: 500"
- **Cause:** Server error
- **Solution:** Check server logs for detailed error

## Debug Steps

### Step 1: Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for JavaScript errors
4. Try to cancel order and check for error messages

### Step 2: Check Network Tab
1. Go to Network tab in Developer Tools
2. Try to cancel order
3. Look for failed requests (red status)
4. Check request/response details

### Step 3: Check Server Logs
1. Look at backend console
2. Check for error messages
3. Look for GHN API errors

### Step 4: Test API Directly
Use the debug scripts:
```bash
# Quick diagnostic
node quick-diagnostic.js

# Detailed debugging
node debug-cancel-order.js
```

### Step 5: Check Database
1. Connect to your database
2. Check if order exists:
   ```sql
   SELECT * FROM "Order" WHERE id = 'your-order-id';
   ```
3. Check order status and details

## Environment Variables Check

Make sure these are set in your `.env` file:
```env
DATABASE_URL=your-database-url
GHN_BASE_URL=https://dev-online-gateway.ghn.vn
GHN_TOKEN=your-ghn-token
GHN_SHOP_ID=your-shop-id
JWT_SECRET=your-jwt-secret
```

## Frontend Configuration Check

Make sure these are set in your frontend:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

## Testing Commands

### Test Server
```bash
curl http://localhost:4000/api/health
```

### Test Authentication
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/admin/orders
```

### Test Order Cancellation
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:4000/api/admin/orders/YOUR_ORDER_ID/cancel
```

## Still Having Issues?

If you're still experiencing issues after checking all the above:

1. **Share the exact error message** you're seeing
2. **Share the browser console logs**
3. **Share the server console logs**
4. **Share the order details** (ID, status, creation date)
5. **Share your environment setup** (OS, Node version, etc.)

This will help identify the specific issue you're facing.
