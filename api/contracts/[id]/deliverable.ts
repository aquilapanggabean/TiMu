import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { isSafeExternalUrl } from '../../../src/lib/domain';
import { getWorkspace, resolveSessionKey } from '../../_store';

const deliverableSchema = z.object({
  deliverableUrl: z
    .string()
    .trim()
    .min(5)
    .max(400)
    .refine(isSafeExternalUrl, 'Deliverable URL must be http or https'),
  deliverableNote: z.string().trim().min(5).max(1000),
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const { id: contractId } = req.query as { id: string };
  const contract = ws.contracts.find((c) => c.id === contractId);
  if (!contract) return res.status(404).json({ error: 'Contract not found.' });
  if (contract.escrowStatus === 'released') {
    return res.status(409).json({ error: 'Contract is already released.' });
  }

  const parsed = deliverableSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Provide a valid deliverable link and summary.',
    });
  }

  contract.deliverableUrl = parsed.data.deliverableUrl;
  contract.deliverableNote = parsed.data.deliverableNote;
  contract.escrowStatus = 'deliverable_submitted';
  contract.updatedAt = new Date().toISOString();

  return res.json({ contract });
}
