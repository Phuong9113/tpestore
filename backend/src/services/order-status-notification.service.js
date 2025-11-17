import prisma from "../utils/prisma.js";
import { generateId } from "../utils/generateId.js";
import { sendOrderStatusEmail } from "../utils/email.js";
import { ORDER_STATUS_LABELS, ORDER_STATUS_MESSAGES } from "../emails/OrderStatusUpdatedEmail.js";

function getStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status || "Được cập nhật";
}

function getStatusMessage(status) {
  return ORDER_STATUS_MESSAGES[status] || "";
}

function buildShippingAddress(order) {
  const parts = [
    order.shippingAddress,
    order.shippingWard,
    order.shippingDistrict,
    order.shippingProvince,
  ].filter(Boolean);
  return parts.join(", ");
}

function mapItems(order) {
  if (!Array.isArray(order.orderItems)) return [];
  return order.orderItems.map((item) => ({
    name: item.product?.name || "Sản phẩm",
    quantity: item.quantity,
    price: item.price,
    image: item.product?.image || "",
  }));
}

/**
 * Trigger email notification on order status change (idempotent per status)
 * @param {Object} params
 * @param {import("@prisma/client").Order & { user: Object, orderItems: Object[] }} params.order
 * @param {string} params.previousStatus
 * @param {string} [params.triggeredBy]
 * @returns {Promise<{sent?: boolean, skipped?: boolean, reason?: string}>}
 */
export async function notifyOrderStatusChange({ order, previousStatus, triggeredBy = "system" }) {
  if (!order) return { skipped: true, reason: "missing order" };
  const newStatus = order.status;
  if (!newStatus || newStatus === previousStatus) {
    return { skipped: true, reason: "status unchanged" };
  }
  if (!order.user?.email) {
    return { skipped: true, reason: "missing recipient email" };
  }

  const alreadySent = await prisma.orderStatusNotification.findUnique({
    where: {
      orderId_status: {
        orderId: order.id,
        status: newStatus,
      },
    },
  });
  if (alreadySent) {
    return { skipped: true, reason: "status already notified" };
  }

  const label = getStatusLabel(newStatus);
  const statusMessage = getStatusMessage(newStatus);
  const items = mapItems(order);
  const address = buildShippingAddress(order);

  const emailResult = await sendOrderStatusEmail({
    to: order.user.email,
    customerName: order.user.name,
    orderId: order.id,
    status: newStatus,
    statusLabel: label,
    statusMessage,
    updatedAt: order.updatedAt || new Date(),
    ghnCode: order.ghnOrderCode,
    totalPrice: order.totalPrice,
    shippingFee: order.shippingFee,
    address,
    items,
  });

  if (emailResult?.skipped) {
    return emailResult;
  }

  const recordId = await generateId("OSN", "OrderStatusNotification");
  await prisma.orderStatusNotification.create({
    data: {
      id: recordId,
      orderId: order.id,
      status: newStatus,
      email: order.user.email,
      subject: emailResult.subject,
      triggeredBy,
      sentAt: new Date(),
    },
  });

  return { sent: true };
}

