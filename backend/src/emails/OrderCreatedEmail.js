/**
 * @typedef {Object} OrderCreatedEmailProps
 * @property {string} customerName
 * @property {string} ghnCode
 * @property {number} shippingFee
 * @property {number} totalPrice
 * @property {string|Date} createdAt
 * @property {string} address
 * @property {Array<{name: string, quantity: number, price: number, image: string}>} items
 * @property {Object<string, string>} cidMap - Map from image path to CID (e.g., { "/uploads/xxx.jpg": "product-0@tpestore" })
 */

/**
 * Format currency to Vietnamese format
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  } catch {
    return `${value.toLocaleString("vi-VN")} ₫`;
  }
}

/**
 * Format date to Vietnamese format (HH:mm · DD/MM/YYYY)
 * @param {string|Date} value
 * @returns {string}
 */
function formatDate(value) {
  try {
    const date = typeof value === "string" ? new Date(value) : value;
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${hours}:${minutes} · ${day}/${month}/${year}`;
  } catch {
    return String(value);
  }
}

/**
 * Render order created email HTML
 * @param {OrderCreatedEmailProps} props
 * @returns {string} HTML string
 */
export function renderOrderCreatedEmail({
  customerName,
  ghnCode,
  shippingFee,
  totalPrice,
  createdAt,
  address,
  items,
  cidMap = {},
}) {
  const safeName = customerName || "Quý khách";
  const formattedDate = formatDate(createdAt);
  const formattedShippingFee = formatCurrency(shippingFee);
  const formattedTotal = formatCurrency(totalPrice);
  const subtotal = totalPrice - shippingFee;
  const formattedSubtotal = formatCurrency(subtotal);

  /**
   * Get CID for image (attachment) or fallback
   * @param {string} imagePath - Image path from item
   * @returns {string} - CID string (e.g., "cid:product-0@tpestore")
   */
  const getImageCid = (imagePath) => {
    if (!imagePath || imagePath.trim() === "") {
      return cidMap["__fallback__"] ? `cid:${cidMap["__fallback__"]}` : "";
    }

    // First, check if this image path has a CID in the map (regardless of URL format)
    // This handles both relative paths and absolute URLs that were successfully attached
    const cid = cidMap[imagePath];
    if (cid) {
      // eslint-disable-next-line no-console
      console.log("[Email] Found CID for image:", imagePath, "→", cid);
      return `cid:${cid}`;
    }

    // If not in cidMap, check if it's an external URL that we couldn't attach
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      try {
        const url = new URL(imagePath);
        const hostname = url.hostname;
        // If it's localhost/internal but not in cidMap, it means file wasn't found
        const isLocalhost = hostname === "localhost" || 
                           hostname === "127.0.0.1" || 
                           hostname === "0.0.0.0" ||
                           hostname.includes("tpestore.site") ||
                           hostname.includes("ngrok");
        if (isLocalhost) {
          // eslint-disable-next-line no-console
          console.log("[Email] Localhost URL not in cidMap (file not found), using fallback:", imagePath);
        } else {
          // eslint-disable-next-line no-console
          console.log("[Email] External URL not in cidMap, using fallback:", imagePath);
        }
      } catch {
        // Invalid URL, treat as relative path not found
      }
      return cidMap["__fallback__"] ? `cid:${cidMap["__fallback__"]}` : "";
    }

    // Relative path not in cidMap (file not found)
    // eslint-disable-next-line no-console
    console.log("[Email] Relative path not in cidMap (file not found), using fallback:", imagePath);
    return cidMap["__fallback__"] ? `cid:${cidMap["__fallback__"]}` : "";
  };

  const itemsHtml = items
    .map((item) => {
      const itemTotal = item.price * item.quantity;
      const formattedPrice = formatCurrency(item.price);
      const formattedItemTotal = formatCurrency(itemTotal);
      
      const imagePath = item.image || "";
      const imageCid = getImageCid(imagePath);
      const imageAlt = item.name || "Product";

      return `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="60" style="padding-right: 12px; vertical-align: top;">
                  ${imageCid ? `<img
                    src="${imageCid}"
                    alt="${imageAlt}"
                    width="60"
                    height="60"
                    style="border-radius: 8px; object-fit: cover; display: block; border: 1px solid #e5e7eb; background: #f3f4f6;"
                  />` : `<div style="width: 60px; height: 60px; border-radius: 8px; background: #f3f4f6; border: 1px solid #e5e7eb; display: block;"></div>`}
                </td>
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 4px; font-size: 15px; font-weight: 500; color: #111827;">
                    ${item.name || "Sản phẩm"}
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #6b7280;">
                    Số lượng: <strong>x${item.quantity}</strong>
                  </p>
                </td>
                <td align="right" style="vertical-align: top; text-align: right;">
                  <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">
                    ${formattedPrice}
                  </p>
                  <p style="margin: 0; font-size: 15px; font-weight: 600; color: #111827;">
                    ${formattedItemTotal}
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
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Đơn hàng của bạn đã được tạo thành công</title>
  </head>
  <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f8f8f8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8f8f8; padding: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <tr>
              <td style="padding: 32px 32px 24px; background: #000000; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                  TPE Store
                </h1>
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding: 32px;">
                <!-- Greeting -->
                <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;">
                  Xin chào ${safeName}! 
                </p>
                <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #6b7280;">
                  Đơn hàng của bạn đã được tạo thành công trên hệ thống Giao hàng nhanh.
                </p>

                <!-- Order Code Card -->
                <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #000000;">
                  <p style="margin: 0 0 4px; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Mã đơn hàng GHN
                  </p>
                  <p style="margin: 0; font-size: 20px; font-weight: 700; color: #111827; font-family: 'Courier New', monospace;">
                    ${ghnCode || "N/A"}
                  </p>
                </div>

                <!-- Products Section -->
                <div style="margin-bottom: 24px;">
                  <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">
                    Sản phẩm đã đặt
                  </h2>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
                    ${itemsHtml}
                  </table>
                </div>

                <!-- Order Summary -->
                <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">
                    Tóm tắt đơn hàng
                  </h2>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 14px; color: #6b7280;">Tạm tính</p>
                      </td>
                      <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 500;">${formattedSubtotal}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 14px; color: #6b7280;">Phí vận chuyển</p>
                      </td>
                      <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 500;">${formattedShippingFee}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0 0;">
                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">Tổng tiền</p>
                      </td>
                      <td align="right" style="padding: 12px 0 0;">
                        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #000000;">${formattedTotal}</p>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Order Details -->
                <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">
                    Thông tin đơn hàng
                  </h2>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                        <p style="margin: 0; font-size: 13px; color: #6b7280;">Ngày tạo</p>
                      </td>
                      <td align="right" style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                        <p style="margin: 0; font-size: 13px; color: #111827; font-weight: 500;">${formattedDate}</p>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding: 12px 0 0;">
                        <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Địa chỉ giao hàng</p>
                        <p style="margin: 0; font-size: 14px; color: #111827; line-height: 1.5;">
                          ${address || "Chưa có địa chỉ"}
                        </p>
                      </td>
                    </tr>
                  </table>
                </div>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                  Cảm ơn bạn đã mua sắm tại <strong style="color: #000000;">TPE Store</strong>
                </p>
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.
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

