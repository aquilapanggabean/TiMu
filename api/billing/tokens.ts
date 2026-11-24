import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getTokenPackPriceMinor, TOKEN_PACKS } from '../../src/lib/domain';
import { resolvePaymentProvider } from '../../server/paymentProvider';
import { getWorkspace, randomId, resolveSessionKey } from '../_store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const parsed = z
    .object({
      packId: z.enum(['pack_1', 'pack_5', 'pack_15']),
      currency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid token pack selection.' });

  const pack = TOKEN_PACKS.find((p) => p.id === parsed.data.packId)!;
  const priceMinor = getTokenPackPriceMinor(pack, parsed.data.currency);
  const provider = resolvePaymentProvider(parsed.data.currency);
  const checkout = await provider.chargeCheckout({
    userId: ws.profile.id,
    amountMinor: priceMinor,
    currency: parsed.data.currency,
    description: `TIMU Token Pack (${pack.tokens} Tokens)`,
  });

  ws.employerProfile.tokenBalance += pack.tokens;
  ws.tokenLedger.unshift({
    id: randomId('tl'),
    employerId: ws.profile.id,
    delta: pack.tokens,
    reason: `Token Pack Purchase (+${pack.tokens})`,
    referenceId: checkout.providerIntentId,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({
    employerProfile: ws.employerProfile,
    tokenLedger: ws.tokenLedger,
    checkout,
  });
}
