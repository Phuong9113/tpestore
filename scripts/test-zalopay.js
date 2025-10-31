#!/usr/bin/env node
import 'dotenv/config'

const BASE = process.env.API_BASE || 'http://localhost:4000/api/v1'
const FRONT_BASE = process.env.FRONT_BASE || 'http://localhost:3000'
const METHOD = process.env.ZLP_METHOD || process.argv.find(a => a.startsWith('--method='))?.split('=')[1] || 'gateway'
const EMAIL = process.env.TEST_EMAIL || 'admin@tpestore.com'
const PASSWORD = process.env.TEST_PASSWORD || 'admin123'

async function httpJson(path, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data
  try { data = await res.json() } catch { data = null }
  if (!res.ok) {
    const status = res.status
    throw new Error(`HTTP ${status}: ${JSON.stringify(data || {})}`)
  }
  return data
}

function mask(v) { if (!v) return false; return v.length <= 6 ? '******' : v.slice(0,3) + '***' + v.slice(-2) }

async function main() {
  console.log('Testing ZaloPay create-order flow...')
  console.log('API_BASE =', BASE)
  console.log('FRONT_BASE =', FRONT_BASE)
  console.log('ZLP_METHOD =', METHOD)
  console.log('ZALOPAY_APP_ID present =', !!process.env.ZALOPAY_APP_ID)
  console.log('ZALOPAY_KEY1 present =', !!process.env.ZALOPAY_KEY1)
  console.log('ZALOPAY_KEY2 present =', !!process.env.ZALOPAY_KEY2)
  console.log('ZALOPAY_SANDBOX_CALLBACK_URL =', process.env.ZALOPAY_SANDBOX_CALLBACK_URL || '(missing)')

  // 1) Pick a product
  const productsRaw = await httpJson('/products')
  const products = Array.isArray(productsRaw?.data) ? productsRaw.data : (Array.isArray(productsRaw) ? productsRaw : [])
  if (products.length === 0) throw new Error('No products available to test')
  const first = products[0]
  console.log('Picked product:', { id: first.id, price: first.price })

  // 2) Login
  const login = await httpJson('/auth/login', { method: 'POST', body: { email: EMAIL, password: PASSWORD } })
  const token = login?.data?.token || login?.token
  if (!token) throw new Error('Login failed - no token')
  console.log('Login success; token length:', token.length)

  const authHeaders = { Authorization: `Bearer ${token}` }

  // 3) Create order with ZALOPAY
  const shippingFee = 30000
  const orderPayload = {
    items: [{ productId: first.id, quantity: 1, price: first.price }],
    shippingInfo: {
      name: 'Test User', phone: '0900000000', address: '1 Test St',
      province: '202', district: '1442', ward: '20101', shippingFee
    },
    paymentMethod: 'ZALOPAY'
  }
  const createOrderResp = await httpJson('/orders', { method: 'POST', headers: authHeaders, body: orderPayload })
  const order = createOrderResp?.data || createOrderResp
  if (!order?.id) throw new Error('Order creation failed: ' + JSON.stringify(createOrderResp))
  console.log('Order created:', order.id)

  // 4) Create ZaloPay order
  const amount = Math.round((first.price || 0) + shippingFee)
  const preferred = METHOD === 'gateway' ? []
    : METHOD === 'vietqr' ? ['vietqr']
    : METHOD === 'intl' || METHOD === 'international_card' ? ['international_card']
    : METHOD === 'domestic' || METHOD === 'domestic_card_account' ? ['domestic_card','account']
    : METHOD === 'wallet' || METHOD === 'zalopay_wallet' ? ['zalopay_wallet']
    : METHOD === 'bnpl' ? ['bnpl']
    : []
  const zpPayload = {
    orderId: order.id,
    amount,
    description: `Thanh toan don hang ${order.id}`,
    returnUrl: `${FRONT_BASE}/payment/success?orderId=${order.id}`,
    bankCode: '',
    preferredPaymentMethods: preferred
  }
  const zpResp = await httpJson('/zalopay/create-order', { method: 'POST', headers: authHeaders, body: zpPayload })
  const zpData = zpResp?.data || zpResp
  console.log('ZaloPay create-order response:', zpData)
  if (zpData?.order_url) {
    console.log('SUCCESS: Redirect user to:', zpData.order_url)
  } else {
    console.log('WARN: No order_url returned. Full response above.')
  }
}

main().catch((err) => {
  console.error('Test failed:', err.message)
  process.exit(1)
})


