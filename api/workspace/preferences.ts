import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getWorkspace, resolveSessionKey } from './_store';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const parsed = z
    .object({
      activeMode: z.enum(['talent', 'employer']).optional(),
      preferredLocale: z.enum(['en', 'id']).optional(),
      preferredCurrency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']).optional(),
      themePreference: z.enum(['light', 'dark']).optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: 'Invalid preferences payload.' });

  Object.assign(ws.profile, parsed.data);
  return res.json({ profile: ws.profile });
}
