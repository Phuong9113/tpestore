import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { renderOrderCreatedEmail } from "../emails/OrderCreatedEmail.js";
import { renderOrderStatusUpdatedEmail } from "../emails/OrderStatusUpdatedEmail.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedTransporter = null;

function getTransporter() {
    if (cachedTransporter) return cachedTransporter;
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        // eslint-disable-next-line no-console
        console.warn("[Email] SMTP config missing. Emails will be skipped.");
        return null;
    }

    cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
    return cachedTransporter;
}

/**
 * Resolve file path from image path (relative or absolute URL)
 * @param {string} imagePath - Image path from database (e.g., "/uploads/xxx.jpg" or "http://localhost:4000/uploads/...")
 * @returns {string|null} - Absolute file path or null if not found
 */
function resolveImageFilePath(imagePath) {
    if (!imagePath || imagePath.trim() === "") {
        // eslint-disable-next-line no-console
        console.log("[Email] resolveImageFilePath: Empty image path");
        return null;
    }

    const originalPath = imagePath.trim();
    // eslint-disable-next-line no-console
    console.log("[Email] resolveImageFilePath: Original path =", originalPath);

    let relativePath = null;

    // Handle absolute URLs (http:// or https://)
    if (originalPath.startsWith("http://") || originalPath.startsWith("https://")) {
        try {
            const url = new URL(originalPath);
            const hostname = url.hostname;
            
            // Check if it's localhost or internal server (127.0.0.1, localhost, or same domain)
            const isLocalhost = hostname === "localhost" || 
                               hostname === "127.0.0.1" || 
                               hostname === "0.0.0.0" ||
                               hostname.includes("tpestore.site") ||
                               hostname.includes("ngrok");
            
            if (isLocalhost) {
                // Extract pathname from URL (e.g., "/uploads/xxx.png")
                relativePath = url.pathname;
                // eslint-disable-next-line no-console
                console.log("[Email] resolveImageFilePath: Detected localhost/internal URL, extracted pathname =", relativePath);
            } else {
                // External URL, skip
                // eslint-disable-next-line no-console
                console.log("[Email] resolveImageFilePath: Skipping external URL:", hostname);
                return null;
            }
        } catch (urlError) {
            // Invalid URL format, treat as relative path
            // eslint-disable-next-line no-console
            console.warn("[Email] resolveImageFilePath: Failed to parse URL, treating as relative path:", urlError.message);
            relativePath = originalPath;
        }
    } else {
        // Handle relative paths like "/uploads/xxx.jpg" or "uploads/xxx.jpg"
        relativePath = originalPath;
    }

    // Normalize path: ensure it starts with "/" then remove for path.join
    let cleanPath = relativePath;
    if (!cleanPath.startsWith("/")) {
        cleanPath = `/${cleanPath}`;
    }

    // Remove leading slash for path.join
    const finalRelativePath = cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath;
    // eslint-disable-next-line no-console
    console.log("[Email] resolveImageFilePath: Final relative path =", finalRelativePath);

    // Try multiple possible base directories
    // Priority: Use __dirname-based paths first (more reliable)
    const possibleBases = [
        { name: "backend/src/utils -> public", path: path.resolve(__dirname, "../../../public") },
        { name: "backend/src -> public", path: path.resolve(__dirname, "../../public") },
        { name: "project root -> public", path: path.resolve(process.cwd(), "public") },
        // Also try going up from process.cwd() if we're in backend directory
        { name: "process.cwd()/.. -> public", path: path.resolve(process.cwd(), "../public") },
    ];

    // eslint-disable-next-line no-console
    console.log("[Email] resolveImageFilePath: Trying base directories...");
    for (const base of possibleBases) {
        const fullPath = path.join(base.path, finalRelativePath);
        // eslint-disable-next-line no-console
        console.log("[Email] resolveImageFilePath: Trying", base.name, "→", fullPath, "exists:", fs.existsSync(fullPath));
        if (fs.existsSync(fullPath)) {
            // eslint-disable-next-line no-console
            console.log("[Email] ✓ Resolved image file:", originalPath, "→", fullPath);
            return fullPath;
        }
    }

    // eslint-disable-next-line no-console
    console.warn("[Email] ✗ Image file not found:", originalPath, "after trying all base directories");
    return null;
}

/**
 * Prepare attachments and CID map for email
 * @param {Array} items - Order items with image paths
 * @returns {Object} - { attachments: Array, cidMap: Object }
 */
function prepareImageAttachments(items) {
    const attachments = [];
    const cidMap = {};
    const usedCids = new Set();
    let needsFallbackLogo = false;

    // Process item images first
    // eslint-disable-next-line no-console
    console.log("[Email] prepareImageAttachments: Processing", items.length, "items");
    items.forEach((item, index) => {
        if (!item.image) {
            // eslint-disable-next-line no-console
            console.log("[Email] Item", index, "(" + (item.name || "Unknown") + "): No image path");
            needsFallbackLogo = true; // Need logo for items without images
            return;
        }

        // eslint-disable-next-line no-console
        console.log("[Email] Item", index, "(" + (item.name || "Unknown") + "): Resolving image:", item.image);
        const filePath = resolveImageFilePath(item.image);
        if (!filePath) {
            // eslint-disable-next-line no-console
            console.warn("[Email] Item", index, "(" + (item.name || "Unknown") + "): Failed to resolve image path, will use fallback logo");
            needsFallbackLogo = true; // Need logo for items that couldn't resolve
            return;
        }

        // Generate unique CID
        const ext = path.extname(filePath) || ".png";
        const cid = `product-${index}@tpestore`;
        
        if (!usedCids.has(cid)) {
            attachments.push({
                filename: `product-${index}${ext}`,
                path: filePath,
                cid: cid,
            });
            cidMap[item.image] = cid;
            usedCids.add(cid);
            // eslint-disable-next-line no-console
            console.log("[Email] ✓ Added product image attachment:", item.image, "→", cid, "→", filePath);
        } else {
            // eslint-disable-next-line no-console
            console.log("[Email] CID already used:", cid, "for item", index);
        }
    });

    // Only add fallback logo if needed (when some items don't have images or couldn't resolve)
    if (needsFallbackLogo) {
        const logoPath = path.resolve(__dirname, "../../../public/logo/Logo.png");
        if (fs.existsSync(logoPath)) {
            const logoCid = "logo@tpestore";
            attachments.push({
                filename: "logo.png",
                path: logoPath,
                cid: logoCid,
            });
            cidMap["__fallback__"] = logoCid;
            // eslint-disable-next-line no-console
            console.log("[Email] Added fallback logo attachment:", logoCid, "(needed for items without images)");
        }
    } else {
        // eslint-disable-next-line no-console
        console.log("[Email] Skipping fallback logo attachment (all items have valid images)");
    }

    return { attachments, cidMap };
}

/**
 * Send order created email
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.customerName - Customer name
 * @param {string} params.ghnCode - GHN order code
 * @param {number} params.shippingFee - Shipping fee
 * @param {number} params.totalPrice - Total price
 * @param {string|Date} params.createdAt - Created date
 * @param {string} params.address - Shipping address
 * @param {Array} params.items - Order items array with {name, quantity, price, image}
 */
export async function sendOrderCreatedEmail({ to, customerName, ghnCode, shippingFee, totalPrice, createdAt, address, items = [] }) {
    const transporter = getTransporter();
    if (!transporter) {
        // eslint-disable-next-line no-console
        console.warn("[Email] Cannot send email - SMTP not configured. Required: SMTP_HOST, SMTP_USER, SMTP_PASS");
        return { skipped: true, reason: "SMTP not configured" };
    }

    // Prepare image attachments
    const { attachments, cidMap } = prepareImageAttachments(items);
    // eslint-disable-next-line no-console
    console.log("[Email] Prepared", attachments.length, "attachments for email");

    const subject = "Đơn hàng của bạn đã được tạo thành công";

    const html = renderOrderCreatedEmail({
        customerName,
        ghnCode,
        shippingFee,
        totalPrice,
        createdAt,
        address,
        items,
        cidMap,
    });

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    try {
        await transporter.sendMail({
            from,
            to,
            subject,
            html,
            attachments,
        });
        // eslint-disable-next-line no-console
        console.log("[Email] Email sent successfully with", attachments.length, "attachments");
        return { sent: true };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Email] Failed to send email:", error?.message || error);
        throw error;
    }
}

/**
 * Send order status updated email
 */
export async function sendOrderStatusEmail({
    to,
    customerName,
    orderId,
    status,
    statusLabel,
    statusMessage,
    updatedAt,
    ghnCode,
    totalPrice,
    shippingFee = 0,
    address,
    items = [],
}) {
    const transporter = getTransporter();
    if (!transporter) {
        // eslint-disable-next-line no-console
        console.warn("[Email] Cannot send status email - SMTP not configured.");
        return { skipped: true, reason: "SMTP not configured" };
    }

    const { attachments, cidMap } = prepareImageAttachments(items);
    const label = statusLabel || status || "Được cập nhật";
    const subject = `Đơn hàng ${orderId || ""} ${label}`.trim();
    const html = renderOrderStatusUpdatedEmail({
        customerName,
        orderId,
        status,
        statusLabel: label,
        statusMessage,
        updatedAt,
        ghnCode,
        totalPrice,
        shippingFee,
        address,
        items,
        cidMap,
    });

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    try {
        await transporter.sendMail({
            from,
            to,
            subject,
            html,
            attachments,
        });
        // eslint-disable-next-line no-console
        console.log("[Email] Status email sent successfully");
        return { sent: true, subject };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Email] Failed to send status email:", error?.message || error);
        throw error;
    }
}

export default { sendOrderCreatedEmail, sendOrderStatusEmail };


