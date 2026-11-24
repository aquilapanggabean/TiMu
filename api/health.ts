import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPaymentProviderSummary } from '../server/paymentProvider';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.json({ ok: true, paymentProviders: getPaymentProviderSummary() });
}
