import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { resolvePaymentProvider } from '../../server/paymentProvider';
import { getWorkspace, randomId, resolveSessionKey } from '../_store';

const withdrawSchema = z.object({
  amountMinor: z.number().int().positive(),
  currency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']),
  payoutDestination: z.string().trim().min(4).max(140),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const parsed = withdrawSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Provide a valid withdrawal amount and payout destination.' });
  }

  const { amountMinor, currency, payoutDestination } = parsed.data;
  const availableMinor = ws.walletTransactions
    .filter((t) => t.currency === currency && (t.type === 'escrow_release' || t.type === 'withdrawal'))
    .reduce((acc, t) => (t.type === 'escrow_release' ? acc + t.amountMinor : acc - t.amountMinor), 0);

  if (amountMinor > availableMinor) {
    return res.status(400).json({ error: 'Withdrawal exceeds available balance in this currency.' });
  }

  const provider = resolvePaymentProvider(currency);
  const payout = await provider.initiateWithdrawal({
    talentId: ws.profile.id,
    amountMinor,
    currency,
    destination: payoutDestination,
  });

  const tx = {
    id: randomId('wtx'),
    talentId: ws.profile.id,
    type: 'withdrawal' as const,
    description: `Payout to ${payoutDestination}`,
    amountMinor,
    currency,
    status: 'completed' as const,
    payoutDestination,
    createdAt: new Date().toISOString(),
  };
  ws.walletTransactions.unshift(tx);
  return res.status(201).json({ transaction: tx, payout, walletTransactions: ws.walletTransactions });
}
