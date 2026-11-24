import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getWorkspace, resolveSessionKey } from '../_store';

const employerProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(140),
  industry: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(80),
  timezone: z.string().trim().min(3).max(32),
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const parsed = employerProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid business profile fields.' });

  Object.assign(ws.employerProfile, parsed.data);
  return res.json({ employerProfile: ws.employerProfile });
}
