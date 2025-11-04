import cron from "node-cron";
import prisma from "../utils/prisma.js";
import ghnService from "../services/ghn.service.js";

function mapGhnToOrderStatus(currentStatus) {
  const s = (currentStatus || "").toString().toLowerCase();
  if (!s) return null;
  if (s === "delivered") return "COMPLETED";
  if (s === "cancel" || s === "returned" || s === "return") return "CANCELLED";
  if (
    s === "delivering" ||
    s === "transporting" ||
    s === "sorting" ||
    s === "picked" ||
    s === "storing"
  ) return "SHIPPING";
  if (s === "ready_to_pick" || s === "picking") return "PROCESSING";
  return null;
}

async function syncOneOrder(order) {
  const code = (order.ghnOrderCode || "").trim();
  if (!code) return;
  try {
    const raw = await ghnService.getOrderDetail(code);
    const payload = raw?.data !== undefined ? raw.data : raw;
    const record = Array.isArray(payload) ? payload[0] : payload;
    const logs = Array.isArray(record?.log) ? record.log : [];
    const latestLog = logs
      .slice()
      .sort((a, b) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime())[0];
    const currentStatus = latestLog?.status || record?.status || null;

    const mapped = mapGhnToOrderStatus(currentStatus);
    if (!mapped) {
      // eslint-disable-next-line no-console
      console.warn(`[Cron][GHN] Unknown status for order ${order.id} code=${code} currentStatus=${currentStatus}`);
      return;
    }

    if (order.status !== mapped) {
      await prisma.order.update({ where: { id: order.id }, data: { status: mapped } });
      // eslint-disable-next-line no-console
      console.log(`[Cron][GHN] Updated order ${order.id} (${code}) status ${order.status} -> ${mapped}`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[Cron][GHN] Sync failed for order ${order.id} code=${code}:`, err?.message || err);
  }
}

export function startGhnSyncJob() {
  const enabled = process.env.GHN_SYNC_ENABLED !== "false"; // default enabled
  if (!enabled) {
    // eslint-disable-next-line no-console
    console.log("[Cron][GHN] Sync job disabled by GHN_SYNC_ENABLED=false");
    return;
  }
  // Every 10 minutes
  cron.schedule("* * * * *", async () => {
    try {
      // eslint-disable-next-line no-console
      console.log("[Cron][GHN] Start syncing statuses...");
      const orders = await prisma.order.findMany({
        where: { ghnOrderCode: { not: null } },
        select: { id: true, status: true, ghnOrderCode: true },
      });
      for (const order of orders) {
        // eslint-disable-next-line no-await-in-loop
        await syncOneOrder(order);
      }
      // eslint-disable-next-line no-console
      console.log("[Cron][GHN] Sync done.");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[Cron][GHN] Batch failed:", e?.message || e);
    }
  });
  // eslint-disable-next-line no-console
  console.log("[Cron][GHN] Scheduled job: every 10 minutes");
}


