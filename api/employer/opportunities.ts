import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { deductTokenAtomically, isSafeExternalUrl } from '../../src/lib/domain';
import { getWorkspace, randomId, resolveSessionKey } from '../_store';
import type { Opportunity } from '../../src/types/timu';

const createOpportunitySchema = z.object({
  opportunityType: z.enum(['escrow_gig', 'part_time', 'full_time']),
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().min(10).max(2000),
  deliverableScope: z.string().trim().min(5).max(1000),
  careerField: z.string().trim().min(2).max(100),
  workMode: z.enum(['remote', 'onsite', 'hybrid']),
  city: z.string().trim().min(2).max(80),
  timezone: z.string().trim().min(3).max(32),
  budgetMinor: z.number().int().positive(),
  currency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']),
  deadline: z.string().trim().min(4).max(40),
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const parsed = createOpportunitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid opportunity details.' });
  }

  const deduction = deductTokenAtomically(ws.employerProfile.tokenBalance, 1);
  if (!deduction.ok) return res.status(402).json({ error: deduction.error });

  const oppId = randomId('opp');
  const nowIso = new Date().toISOString();
  const opp: Opportunity = {
    id: oppId,
    employerId: ws.profile.id,
    businessName: ws.employerProfile.businessName,
    employerVerified: ws.employerProfile.isVerified,
    ...parsed.data,
    lat: ws.profile.lat,
    lng: ws.profile.lng,
    isPriority: ws.employerProfile.isPremium,
    status: 'open',
    createdAt: nowIso,
  };

  ws.employerProfile.tokenBalance = deduction.nextBalance;
  ws.opportunities.unshift(opp);
  ws.tokenLedger.unshift({
    id: randomId('tl'),
    employerId: ws.profile.id,
    delta: -1,
    reason: `Publish: ${opp.title.slice(0, 48)}`,
    referenceId: oppId,
    createdAt: nowIso,
  });

  return res.status(201).json({
    opportunity: opp,
    employerProfile: ws.employerProfile,
    tokenLedger: ws.tokenLedger,
  });
}
