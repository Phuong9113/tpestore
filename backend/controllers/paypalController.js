import { PrismaClient } from '../../src/generated/prisma/index.js';
import { PAYPAL_CURRENCY, createOrderUSD, captureOrder } from '../services/paypalClient.js';

const prisma = new PrismaClient();

// Create PayPal order
export const createPayPalOrder = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId, totalAmount } = req.body;

    if (!orderId || !totalAmount) {
      return res.status(400).json({ error: 'Missing orderId or totalAmount' });
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId, 
        userId: req.user.id,
        paymentStatus: 'PENDING'
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or already processed' });
    }

    // Validate amount matches order total
    if (Math.abs(order.totalPrice - totalAmount) > 0.01) {
      return res.status(400).json({ error: 'Amount mismatch' });
    }

    // Convert VND to USD (assuming totalAmount is in VND)
    // You might want to use a real exchange rate API
    const exchangeRate = 24000; // 1 USD = 24000 VND (approximate)
    const usdAmount = (totalAmount / exchangeRate).toFixed(2);

    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout?success=true`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout?cancelled=true`;
    const response = await createOrderUSD(usdAmount, `Order #${orderId} from TPE Store`, returnUrl, cancelUrl);

    // Update order with PayPal order ID
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        paypalOrderId: response.id,
        paymentMethod: 'PAYPAL'
      }
    });

    res.json({
      paypalOrderId: response.id,
      approvalUrl: response.links?.find(link => link.rel === 'approve')?.href
    });

  } catch (error) {
    console.error('PayPal create order error:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
};

// Capture PayPal order
export const capturePayPalOrder = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { paypalOrderId, orderId } = req.body;

    if (!paypalOrderId || !orderId) {
      return res.status(400).json({ error: 'Missing paypalOrderId or orderId' });
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId, 
        userId: req.user.id,
        paypalOrderId: paypalOrderId,
        paymentStatus: 'PENDING'
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or already processed' });
    }

    const response = await captureOrder(paypalOrderId);

    if (response.status === 'COMPLETED') {
      const capture = response.purchase_units?.[0]?.payments?.captures?.[0];
      
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          transactionId: capture.id,
          paidAt: new Date(),
          status: 'PROCESSING' // Move to processing after payment
        }
      });

      // Clear user's cart
      await prisma.cartItem.deleteMany({
        where: { userId: req.user.id }
      });

      res.json({
        success: true,
        transactionId: capture.id,
        orderId: orderId
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }

  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({ error: 'Failed to capture PayPal payment' });
  }
};
