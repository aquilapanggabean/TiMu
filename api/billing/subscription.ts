import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getSubscriptionPriceMinor } from '../../src/lib/domain';
import { resolvePaymentProvider } from '../../server/paymentProvider';
import { getWorkspace, randomId, resolveSessionKey } from '../_store';
import type { CurrencyCode, PlanType, WorkspaceMode } from '../../src/types/timu';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const parsed = z
    .object({
      planType: z.enum(['talent_premium', 'employer_premium', 'verification_badge']),
      currency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']),
      targetRole: z.enum(['talent', 'employer']),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid subscription request.' });

  const { planType, currency, targetRole } = parsed.data;
  const amountMinor = getSubscriptionPriceMinor(planType as PlanType, currency as CurrencyCode);
  const provider = resolvePaymentProvider(currency);
  const checkout = await provider.chargeCheckout({
    userId: ws.profile.id,
    amountMinor,
    currency,
    description: `TIMU Subscription: ${planType}`,
  });

  const periodEnd = new Date(Date.now() + 30 * 86400000).toISOString();
  const record = {
    id: randomId('sub'),
    userId: ws.profile.id,
    planType,
    status: 'active' as const,
    amountMinor,
    currency,
    currentPeriodEnd: periodEnd,
    providerSubscriptionId: checkout.providerIntentId,
  };
  ws.subscriptions.unshift(record);

  if (planType === 'talent_premium') {
    ws.talentProfile.isPremium = true;
  } else if (planType === 'employer_premium') {
    ws.employerProfile.isPremium = true;
    ws.employerProfile.premiumExpiresAt = periodEnd;
    ws.employerProfile.tokenBalance += 5;
    ws.tokenLedger.unshift({
      id: randomId('tl'),
      employerId: ws.profile.id,
      delta: 5,
      reason: 'Employer Premium Monthly Bonus Tokens',
      referenceId: record.id,
      createdAt: new Date().toISOString(),
    });
  } else if (planType === 'verification_badge') {
    if (targetRole === 'talent') ws.talentProfile.isVerified = true;
    else ws.employerProfile.isVerified = true;
  }

  return res.status(201).json({
    subscription: record,
    talentProfile: ws.talentProfile,
    employerProfile: ws.employerProfile,
    tokenLedger: ws.tokenLedger,
    checkout,
  });
}
