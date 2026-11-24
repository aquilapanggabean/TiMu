import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { isSafeExternalUrl } from '../../src/lib/domain';
import { getWorkspace, resolveSessionKey } from '../_store';

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  educationDetail: z.string().trim().min(3).max(200),
  experienceSummary: z.string().trim().max(500),
  bootcampHistory: z.string().trim().max(240),
  portfolioUrl: z.string().trim().max(300).refine(isSafeExternalUrl, 'Invalid URL'),
  linkedinUrl: z.string().trim().max(300).refine(isSafeExternalUrl, 'Invalid URL'),
  city: z.string().trim().min(2).max(80),
  timezone: z.string().trim().min(3).max(32),
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid profile data.' });
  }

  ws.profile.fullName = parsed.data.fullName;
  ws.profile.city = parsed.data.city;
  ws.profile.timezone = parsed.data.timezone;
  Object.assign(ws.talentProfile, {
    educationDetail: parsed.data.educationDetail,
    experienceSummary: parsed.data.experienceSummary,
    bootcampHistory: parsed.data.bootcampHistory,
    portfolioUrl: parsed.data.portfolioUrl,
    linkedinUrl: parsed.data.linkedinUrl,
    city: parsed.data.city,
    timezone: parsed.data.timezone,
  });

  return res.json({ profile: ws.profile, talentProfile: ws.talentProfile });
}
