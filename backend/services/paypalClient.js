// Lightweight PayPal REST client using fetch (no SDK dependency)
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENV = process.env.PAYPAL_ENV || 'sandbox';
const PAYPAL_CURRENCY = process.env.PAYPAL_CURRENCY || 'USD';

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.warn('Warning: PayPal credentials not configured. PayPal integration will not work.');
}

const PAYPAL_BASE_URL = PAYPAL_ENV === 'live'
  ? 'https://api.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get PayPal access token: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function createOrderUSD(amountUSD, description, returnUrl, cancelUrl) {
  const accessToken = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: PAYPAL_CURRENCY,
            value: amountUSD
          },
          description
        }
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl
      }
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create PayPal order: ${res.status} ${text}`);
  }
  return res.json();
}

async function captureOrder(paypalOrderId) {
  const accessToken = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to capture PayPal order: ${res.status} ${text}`);
  }
  return res.json();
}

export { PAYPAL_CURRENCY, createOrderUSD, captureOrder };
