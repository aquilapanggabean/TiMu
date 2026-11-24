import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  calculateEscrowBreakdown,
  generateVerificationCode,
  getTierFromExp,
  isSafeExternalUrl,
  POST_PAYOUT_EXP_REWARD,
} from '../../../src/lib/domain';
import { resolvePaymentProvider } from '../../../server/paymentProvider';
import { getWorkspace, indexCertificate, randomId, resolveSessionKey } from '../../_store';
import type { EscrowContract, VerifiableCertificate } from '../../../src/types/timu';

const fundSchema = z.object({
  conversationId: z.string().trim().min(1).max(128).optional(),
  opportunityId: z.string().trim().max(128).optional(),
  talentId: z.string().trim().min(1).max(128),
  title: z.string().trim().min(3).max(160),
  scopeSummary: z.string().trim().min(5).max(1000),
  grossAmountMinor: z.number().int().positive(),
  currency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']),
});

const deliverableSchema = z.object({
  deliverableUrl: z
    .string()
    .trim()
    .min(5)
    .max(400)
    .refine(isSafeExternalUrl, 'Deliverable URL must be http or https'),
  deliverableNote: z.string().trim().min(5).max(1000),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ws = getWorkspace(resolveSessionKey(req));
  const { id: contractId } = req.query as { id: string };

  // POST /api/contracts/fund  — handled via routes below
  // POST /api/contracts/[id]/deliverable
  // POST /api/contracts/[id]/release

  // This file handles dynamic [id] routes dispatched by vercel.json rewrites
  // The actual action is determined by the sub-path; Vercel dynamic segments need separate files.
  // This file is a placeholder — see deliverable.ts and release.ts alongside this file.
  return res.status(404).json({ error: 'Not found.' });
}
