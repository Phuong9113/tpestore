// Node >=18 required (global fetch)

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000") + "/api/v1";
const TOKEN = process.env.TPESTORE_TOKEN || process.env.TOKEN || process.env.AUTH_TOKEN || null;

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  };
}

function mapGhnStatusToVi(status) {
  const map = {
    ready_to_pick: "Sẵn sàng lấy hàng",
    picking: "Đang lấy hàng",
    picked: "Đã lấy hàng",
    storing: "Đang lưu kho",
    transporting: "Đang vận chuyển",
    sorting: "Đang phân loại",
    delivering: "Đang giao hàng",
    delivered: "Đã giao hàng",
    delivery_fail: "Giao hàng thất bại",
    waiting_to_return: "Chờ trả hàng",
    return: "Đang trả hàng",
    returned: "Đã trả hàng",
    exception: "Ngoại lệ",
    damage: "Hàng hóa bị hỏng",
    lost: "Hàng hóa bị mất",
    cancel: "Hủy đơn hàng",
  };
  return map[status] || status || "";
}

function mapOrderStatusToVi(orderStatus) {
  switch (orderStatus) {
    case 'PENDING':
    case 'PROCESSING':
      return 'Đang xử lý';
    case 'PAID':
      return 'Đã thanh toán';
    case 'SHIPPING':
    case 'SHIPPED':
      return 'Đang giao';
    case 'COMPLETED':
      return 'Đã giao';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return 'Đang xử lý';
  }
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...getHeaders(), ...(options.headers || {}) } });
  if (!res.ok) {
    let body = null;
    try { body = await res.json(); } catch {}
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${JSON.stringify(body || {})}`);
  }
  return await res.json();
}

async function getProfile() {
  return await fetchJson(`${API_BASE}/users/profile`);
}

async function getGhnDetail(orderCode) {
  const json = await fetchJson(`${API_BASE}/shipping/detail/${encodeURIComponent(orderCode)}`);
  const envelope = json?.data ?? json;
  const normalized = envelope?.data ?? envelope;
  const logs = Array.isArray(normalized?.log) ? normalized.log : [];
  const byTime = logs.slice().sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
  const current = normalized?.currentStatus || (byTime[0]?.status) || normalized?.status || null;
  return { currentStatus: current, raw: normalized };
}

function fmt(value) {
  return value == null ? '' : String(value);
}

async function run() {
  if (!TOKEN) {
    console.error('Missing auth token. Set env TPESTORE_TOKEN (or TOKEN/AUTH_TOKEN).');
    process.exit(2);
  }

  console.log(`[verify-ghn-status] API_BASE=${API_BASE}`);
  const profile = await getProfile();
  const orders = Array.isArray(profile?.orders) ? profile.orders : [];
  const withCodes = orders.filter(o => (o.ghnOrderCode || '').trim()).map(o => ({
    id: o.id,
    code: String(o.ghnOrderCode).trim().toUpperCase(),
    orderStatus: o.status,
    totalPrice: o.totalPrice,
    createdAt: o.createdAt,
  }));

  if (withCodes.length === 0) {
    console.log('No orders with GHN order code found for this user.');
    return;
  }

  const results = [];
  for (const o of withCodes) {
    try {
      const detail = await getGhnDetail(o.code);
      const ghnKey = fmt(detail.currentStatus);
      const ghnLabel = mapGhnStatusToVi(ghnKey);
      const localLabel = mapOrderStatusToVi(fmt(o.orderStatus));
      const mismatch = Boolean(ghnLabel) && ghnLabel !== localLabel;
      results.push({
        id: o.id,
        code: o.code,
        orderStatus: o.orderStatus,
        localLabel,
        ghnKey,
        ghnLabel,
        mismatch,
      });
    } catch (e) {
      results.push({ id: o.id, code: o.code, error: e.message, mismatch: true });
    }
  }

  // Print report
  const header = ['#', 'OrderId', 'GHN Code', 'GHN Key', 'GHN Label', 'Local Status', 'Local Label', 'Match?'];
  console.log(header.join('\t'));
  results.forEach((r, idx) => {
    if (r.error) {
      console.log([idx + 1, r.id, r.code, '-', '-', '-', '-', `ERROR: ${r.error}`].join('\t'));
    } else {
      console.log([
        idx + 1,
        r.id,
        r.code,
        r.ghnKey || '-',
        r.ghnLabel || '-',
        r.orderStatus || '-',
        r.localLabel || '-',
        r.mismatch ? 'NO' : 'YES',
      ].join('\t'));
    }
  });

  const mismatches = results.filter(r => r.mismatch).length;
  if (mismatches > 0) {
    console.error(`\nFound ${mismatches} mismatch(es).`);
    process.exit(1);
  } else {
    console.log('\nAll GHN statuses match local display mapping.');
  }
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(3);
});


