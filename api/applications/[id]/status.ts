import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getWorkspace, resolveSessionKey } from '../../_store';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const { id: applicationId } = req.query as { id: string };

  const parsed = z
    .object({ status: z.enum(['applied', 'shortlisted', 'hired', 'closed']) })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid status.' });

  const appRec = ws.applications.find((a) => a.id === applicationId);
  if (!appRec) return res.status(404).json({ error: 'Application not found.' });

  appRec.status = parsed.data.status;
  return res.json({ application: appRec });
}
