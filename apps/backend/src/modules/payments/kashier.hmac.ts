import * as crypto from 'crypto';

// Kashier order hash — signed so the gateway knows the amount hasn't been tampered with.
// Range: `/` below because Kashier expects the total order amount.
export function generateKashierOrderHash(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string
): string {
  const key = process.env.KASHIER_SECRET_KEY || '';
  return crypto
    .createHmac('sha256', key)
    .update(`${merchantId}${orderId}${amount}${currency}`)
    .digest('hex');
}

// Kashier webhook HMAC — verifies the signature in the `x-kashier-signature` header.
export function verifyKashierHmac(req: {
  headers: Record<string, string | string[] | undefined>;
  body: any;
}): {
  verified: boolean;
  data: { status: string; transactionId: string; merchantOrderId: string };
} {
  const apiKey = process.env.KASHIER_PAYMENT_API_KEY || '';
  const signature =
    req.headers['x-kashier-signature'] ||
    req.headers['kashier-signature'] ||
    '';

  const raw = req.body;

  if (
    typeof raw !== 'object' ||
    raw === null ||
    typeof raw.data !== 'object' ||
    raw.data === null
  ) {
    return {
      verified: false,
      data: { status: '', transactionId: '', merchantOrderId: '' },
    };
  }

  const data = raw.data;
  const payload = `${data.amount}|${data.currency}|${data.merchantId}|${data.merchantOrderId}|${data.path}|${data.status == null ? '' : data.status}|${data.transactionId}`;

  const expected = crypto
    .createHmac('sha256', apiKeyToSecret(apiKey))
    .update(payload)
    .digest('hex');

  return {
    verified: expected === String(signature).toLowerCase(),
    data: {
      status: data.status,
      transactionId: String(data.transactionId),
      merchantOrderId: String(data.merchantOrderId),
    },
  };
}

function apiKeyToSecret(apiKey: string): string {
  // Kashier derives the webhook secret as a base64-decoded API key hash.
  try {
    return crypto.createHash('sha256').update(apiKey).digest('base64');
  } catch {
    return apiKey;
  }
}