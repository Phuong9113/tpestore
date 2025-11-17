const STATUS_LABELS = {
  PENDING: "Chờ xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang vận chuyển",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const STATUS_MESSAGES = {
  PENDING: "Chúng tôi đã nhận được đơn và đang chờ xác nhận thông tin thanh toán/ghép đơn.",
  PROCESSING: "Đơn hàng đang được chuẩn bị để bàn giao cho đơn vị vận chuyển.",
  SHIPPING: "Đơn hàng đã được bàn giao cho đơn vị vận chuyển và đang trên đường tới bạn.",
  COMPLETED: "Đơn hàng đã được giao thành công. Cảm ơn bạn đã mua sắm tại TPE Store!",
  CANCELLED: "Đơn hàng đã được hủy theo yêu cầu hoặc do phát sinh sự cố. Nếu bạn cần hỗ trợ, hãy liên hệ chúng tôi.",
};

function formatCurrency(value) {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value ?? 0);
  } catch {
    return `${Number(value ?? 0).toLocaleString("vi-VN")} ₫`;
  }
}

function formatDate(value) {
  try {
    const date = typeof value === "string" ? new Date(value) : value;
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

export function renderOrderStatusUpdatedEmail({
  customerName,
  orderId,
  ghnCode,
  status,
  statusLabel,
  statusMessage,
  updatedAt,
  address,
  totalPrice,
  shippingFee = 0,
  items = [],
  cidMap = {},
}) {
  const safeName = customerName || "Quý khách";
  const label = statusLabel || STATUS_LABELS[status] || status || "";
  const message = statusMessage || STATUS_MESSAGES[status] || "";
  const formattedTotal = formatCurrency(totalPrice);
  const formattedShipping = formatCurrency(shippingFee);
  const formattedUpdatedAt = formatDate(updatedAt || new Date());
  const subtotal = (totalPrice ?? 0) - (shippingFee ?? 0);
  const formattedSubtotal = formatCurrency(subtotal);

  const getImageCid = (imagePath) => {
    if (!imagePath || imagePath.trim() === "") {
      return cidMap["__fallback__"] ? `cid:${cidMap["__fallback__"]}` : "";
    }
    const cid = cidMap[imagePath];
    if (cid) return `cid:${cid}`;
    return cidMap["__fallback__"] ? `cid:${cidMap["__fallback__"]}` : "";
  };

  const itemsHtml = items
    .map((item) => {
      const imageCid = getImageCid(item.image || "");
      return `
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="56" style="padding-right: 12px; vertical-align: top;">
                  ${
                    imageCid
                      ? `<img src="${imageCid}" alt="${item.name || "Product"}" width="56" height="56" style="border-radius: 8px; object-fit: cover; display: block; border: 1px solid #e5e7eb;" />`
                      : `<div style="width:56px;height:56px;border-radius:8px;background:#f3f4f6;border:1px solid #e5e7eb;"></div>`
                  }
                </td>
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #111827;">
                    ${item.name || "Sản phẩm"}
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #6b7280;">
                    Số lượng: x${item.quantity || 1}
                  </p>
                </td>
                <td align="right" style="vertical-align: top; text-align: right;">
                  <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">
                    ${formatCurrency(item.price || 0)}
                  </p>
                  <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">
                    ${formatCurrency((item.price || 0) * (item.quantity || 1))}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cập nhật trạng thái đơn hàng ${orderId}</title>
  </head>
  <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f8f8f8; margin: 0; padding: 0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8f8f8; padding: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding: 28px 32px; background: #000000; text-align: center;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">
                  TPE Store
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <p style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #111827;">
                  Xin chào ${safeName},
                </p>
                <p style="margin: 0 0 16px; font-size: 15px; color: #6b7280; line-height: 1.6;">
                  Đơn hàng <strong>${orderId || ""}</strong> của bạn đã được cập nhật trạng thái mới.
                </p>
                <div style="padding: 18px 20px; border-radius: 10px; background: #f9fafb; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                  <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">
                    Trạng thái hiện tại
                  </p>
                  <p style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #111827;">
                    ${label}
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                    ${message}
                  </p>
                  <p style="margin: 12px 0 0; font-size: 13px; color: #9ca3af;">
                    Cập nhật lúc ${formattedUpdatedAt}
                  </p>
                </div>
                ${
                  ghnCode
                    ? `<div style="margin-bottom: 24px; padding: 16px; border-radius: 8px; background: #f3f4f6;">
                        <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.4px;">Mã vận đơn GHN</p>
                        <p style="margin: 0; font-size: 18px; letter-spacing: 1px; font-weight: 700; color: #111827;">${ghnCode}</p>
                      </div>`
                    : ""
                }
                ${
                  items.length > 0
                    ? `<div style="margin-bottom: 24px;">
                        <h2 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #111827;">Sản phẩm trong đơn</h2>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
                          ${itemsHtml}
                        </table>
                      </div>`
                    : ""
                }
                <div style="margin-bottom: 24px; padding: 20px; border-radius: 10px; background: #f9fafb;">
                  <h2 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #111827;">Tóm tắt chi phí</h2>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Tạm tính</td>
                      <td align="right" style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 500;">${formattedSubtotal}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Phí vận chuyển</td>
                      <td align="right" style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 500;">${formattedShipping}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0 0; font-size: 15px; font-weight: 600; color: #111827;">Tổng cộng</td>
                      <td align="right" style="padding: 10px 0 0; font-size: 17px; font-weight: 700; color: #000000;">${formattedTotal}</td>
                    </tr>
                  </table>
                </div>
                ${
                  address
                    ? `<div style="margin-bottom: 24px; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
                         <h2 style="margin: 0 0 10px; font-size: 16px; font-weight: 600; color: #111827;">Địa chỉ giao hàng</h2>
                         <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                           ${address}
                         </p>
                       </div>`
                    : ""
                }
                <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                  Nếu bạn có thắc mắc, hãy phản hồi email này hoặc liên hệ đội ngũ CSKH của TPE Store.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  © ${new Date().getFullYear()} TPE Store. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

export const ORDER_STATUS_LABELS = { ...STATUS_LABELS };
export const ORDER_STATUS_MESSAGES = { ...STATUS_MESSAGES };

