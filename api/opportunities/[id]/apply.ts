import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { isSafeExternalUrl } from '../../../src/lib/domain';
import { getWorkspace, randomId, resolveSessionKey } from '../../_store';

const applySchema = z.object({
  pitch: z.string().trim().min(10).max(1500),
  portfolioLink: z
    .string()
    .trim()
    .max(300)
    .refine(isSafeExternalUrl, 'Portfolio link must be http or https'),
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const { id: opportunityId } = req.query as { id: string };
  const opp = ws.opportunities.find((o) => o.id === opportunityId);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found.' });

  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Please enter a pitch (min 10 chars).',
    });
  }

  const appId = `${opp.id}_${ws.profile.id}`;
  if (ws.applications.some((a) => a.id === appId)) {
    return res.status(409).json({ error: 'You have already applied to this opportunity.' });
  }

  const application = {
    id: appId,
    opportunityId: opp.id,
    opportunityTitle: opp.title,
    employerId: opp.employerId,
    businessName: opp.businessName,
    talentId: ws.profile.id,
    candidateCode: ws.talentProfile.candidateCode,
    talentSkills: ws.talentProfile.topSkills,
    talentTierLevel: ws.talentProfile.tierLevel,
    talentVerified: ws.talentProfile.isVerified,
    pitch: parsed.data.pitch,
    portfolioLink: parsed.data.portfolioLink || ws.talentProfile.portfolioUrl,
    status: 'applied' as const,
    createdAt: new Date().toISOString(),
  };
  ws.applications.unshift(application);
  return res.status(201).json({ application });
}
