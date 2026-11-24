import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { calculateEscrowBreakdown } from '../../src/lib/domain';
import { resolvePaymentProvider } from '../../server/paymentProvider';
import { getWorkspace, randomId, resolveSessionKey } from '../_store';
import type { ChatMessage, EscrowContract } from '../../src/types/timu';

const fundSchema = z.object({
  conversationId: z.string().trim().min(1).max(128).optional(),
  opportunityId: z.string().trim().max(128).optional(),
  talentId: z.string().trim().min(1).max(128),
  title: z.string().trim().min(3).max(160),
  scopeSummary: z.string().trim().min(5).max(1000),
  grossAmountMinor: z.number().int().positive(),
  currency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const parsed = fundSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid contract fields.' });
  }

  const d = parsed.data;
  const breakdown = calculateEscrowBreakdown(d.grossAmountMinor);
  const provider = resolvePaymentProvider(d.currency);
  const contractId = randomId('ctr');
  const payment = await provider.createEscrowHold({
    contractId,
    grossAmountMinor: breakdown.grossAmountMinor,
    currency: d.currency,
    employerId: ws.profile.id,
  });

  const candidate = ws.candidates.find((c) => c.publicProfile.userId === d.talentId);
  const talentName = candidate ? candidate.identity.fullName : ws.profile.fullName;
  const nowIso = new Date().toISOString();

  const contract: EscrowContract = {
    id: contractId,
    opportunityId: d.opportunityId || '',
    employerId: ws.profile.id,
    businessName: ws.employerProfile.businessName,
    talentId: d.talentId,
    talentName,
    title: d.title,
    scopeSummary: d.scopeSummary,
    grossAmountMinor: breakdown.grossAmountMinor,
    platformFeeMinor: breakdown.platformFeeMinor,
    netTalentMinor: breakdown.netTalentMinor,
    currency: d.currency,
    escrowProvider: payment.provider,
    escrowStatus: 'funded',
    providerPaymentIntentId: payment.providerIntentId,
    deliverableUrl: '',
    deliverableNote: '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  ws.contracts.unshift(contract);

  const conv = d.conversationId
    ? ws.conversations.find((c) => c.id === d.conversationId)
    : ws.conversations.find((c) => c.talentId === d.talentId && c.employerId === ws.profile.id);

  if (conv) {
    conv.contractId = contractId;
    const sysMsg: ChatMessage = {
      id: randomId('msg'),
      conversationId: conv.id,
      senderId: ws.profile.id,
      senderName: ws.employerProfile.businessName,
      body: `Funded Escrow contract "${contract.title}" via ${payment.providerLabel}. Funds are protected until deliverable approval.`,
      createdAt: nowIso,
    };
    ws.messagesByConversation[conv.id] = [...(ws.messagesByConversation[conv.id] || []), sysMsg];
    conv.lastMessagePreview = sysMsg.body;
    conv.lastMessageAt = nowIso;
  }

  return res.status(201).json({ contract, payment });
}
