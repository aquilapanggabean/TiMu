import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  generateVerificationCode,
  getTierFromExp,
  POST_PAYOUT_EXP_REWARD,
} from '../../../src/lib/domain';
import { resolvePaymentProvider } from '../../../server/paymentProvider';
import { getWorkspace, indexCertificate, randomId, resolveSessionKey } from '../../_store';
import type { ChatMessage, VerifiableCertificate } from '../../../src/types/timu';
import crypto from 'node:crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const { id: contractId } = req.query as { id: string };
  const contract = ws.contracts.find((c) => c.id === contractId);
  if (!contract) return res.status(404).json({ error: 'Contract not found.' });
  if (contract.escrowStatus === 'released') {
    return res.status(409).json({ error: 'Escrow funds were already released.' });
  }

  const provider = resolvePaymentProvider(contract.currency);
  const payment = await provider.releaseEscrowPayout({
    contractId: contract.id,
    providerIntentId: contract.providerPaymentIntentId,
    netTalentMinor: contract.netTalentMinor,
    platformFeeMinor: contract.platformFeeMinor,
    currency: contract.currency,
    talentId: contract.talentId,
  });

  const nowIso = new Date().toISOString();
  contract.escrowStatus = 'released';
  contract.updatedAt = nowIso;

  // Credit 90% to talent wallet
  if (contract.talentId === ws.profile.id) {
    ws.walletTransactions.unshift(
      {
        id: randomId('wtx'),
        talentId: contract.talentId,
        contractId: contract.id,
        type: 'escrow_release',
        description: `Escrow payout (90%) - ${contract.title}`,
        amountMinor: contract.netTalentMinor,
        currency: contract.currency,
        status: 'available',
        createdAt: nowIso,
      },
      {
        id: randomId('wtx'),
        talentId: contract.talentId,
        contractId: contract.id,
        type: 'platform_fee',
        description: `Platform Admin Fee (10%) - ${contract.businessName}`,
        amountMinor: contract.platformFeeMinor,
        currency: contract.currency,
        status: 'completed',
        createdAt: nowIso,
      }
    );
  }

  // Award EXP & promote tier
  const cand = ws.candidates.find((c) => c.publicProfile.userId === contract.talentId);
  const targetTalent = cand ? cand.publicProfile : ws.talentProfile;
  targetTalent.expPoints += POST_PAYOUT_EXP_REWARD;
  targetTalent.completedGigsCount += 1;
  targetTalent.tierLevel = getTierFromExp(targetTalent.expPoints).level;

  // Award Skill Badge
  const badge = {
    id: randomId('badge'),
    talentId: contract.talentId,
    badgeName: `Verified ${targetTalent.topSkills[0] || targetTalent.careerField}`,
    careerField: targetTalent.careerField,
    earnedFromContractId: contract.id,
    awardedAt: nowIso,
  };
  ws.skillBadges.unshift(badge);

  // Mint Verifiable Certificate
  const verificationCode = generateVerificationCode(
    new Date().getFullYear(),
    crypto.randomBytes(4).toString('hex')
  );
  const certificate: VerifiableCertificate = {
    id: randomId('cert'),
    verificationCode,
    contractId: contract.id,
    talentId: contract.talentId,
    talentName: contract.talentName,
    employerId: contract.employerId,
    businessName: contract.businessName,
    projectTitle: contract.title,
    skillsValidated: targetTalent.topSkills.slice(0, 3),
    issuedAt: nowIso,
  };
  ws.certificates.unshift(certificate);
  indexCertificate(certificate);

  const conv = ws.conversations.find((c) => c.contractId === contract.id);
  if (conv) {
    const releaseMsg: ChatMessage = {
      id: randomId('msg'),
      conversationId: conv.id,
      senderId: contract.employerId,
      senderName: contract.businessName,
      body: `Approved work and released Escrow payout. Verifiable Certificate ${verificationCode} has been minted.`,
      createdAt: nowIso,
    };
    ws.messagesByConversation[conv.id] = [...(ws.messagesByConversation[conv.id] || []), releaseMsg];
    conv.lastMessagePreview = releaseMsg.body;
    conv.lastMessageAt = nowIso;
  }

  return res.json({
    contract,
    payment,
    certificate,
    badge,
    talentProfile: ws.talentProfile,
    walletTransactions: ws.walletTransactions,
  });
}
