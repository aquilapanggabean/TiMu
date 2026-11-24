import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { buildBlindTalentCard, calculateDistanceKm, calculateTimezoneOverlapHours, deductTokenAtomically } from '../../src/lib/domain';
import { getWorkspace, randomId, resolveSessionKey } from '../_store';
import type { ChatMessage } from '../../src/types/timu';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const parsed = z.object({ talentId: z.string().trim().min(1).max(128) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid talentId.' });

  const candidate = ws.candidates.find((c) => c.publicProfile.userId === parsed.data.talentId);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found.' });

  const alreadyUnlocked = ws.unlockedTalentIds.includes(candidate.publicProfile.userId);
  if (!alreadyUnlocked) {
    const deduction = deductTokenAtomically(ws.employerProfile.tokenBalance, 1);
    if (!deduction.ok) return res.status(402).json({ error: deduction.error });

    ws.employerProfile.tokenBalance = deduction.nextBalance;
    ws.unlockedTalentIds.push(candidate.publicProfile.userId);
    ws.tokenLedger.unshift({
      id: randomId('tl'),
      employerId: ws.profile.id,
      delta: -1,
      reason: `Unlock Talent ${candidate.publicProfile.candidateCode}`,
      referenceId: candidate.publicProfile.userId,
      createdAt: new Date().toISOString(),
    });
  }

  let conversation = ws.conversations.find(
    (c) => c.employerId === ws.profile.id && c.talentId === candidate.publicProfile.userId
  );
  if (!conversation) {
    const convId = `conv_${ws.profile.id}_${candidate.publicProfile.userId}`;
    const nowIso = new Date().toISOString();
    conversation = {
      id: convId,
      employerId: ws.profile.id,
      businessName: ws.employerProfile.businessName,
      talentId: candidate.publicProfile.userId,
      talentName: candidate.identity.fullName,
      talentAvatarUrl: candidate.identity.avatarUrl,
      talentCandidateCode: candidate.publicProfile.candidateCode,
      lastMessagePreview: 'Identity unlocked. Start discussing scope or fund an Escrow contract.',
      lastMessageAt: nowIso,
    };
    ws.conversations.unshift(conversation);
    const welcomeMsg: ChatMessage = {
      id: randomId('msg'),
      conversationId: convId,
      senderId: candidate.publicProfile.userId,
      senderName: candidate.identity.fullName,
      body: `Hi ${ws.employerProfile.businessName}! Thanks for unlocking my profile. Let me know the deliverables and timeline you have in mind.`,
      createdAt: nowIso,
    };
    ws.messagesByConversation[convId] = [welcomeMsg];
  }

  const revealedCard = buildBlindTalentCard({
    talent: candidate.publicProfile,
    identity: candidate.identity,
    isUnlocked: true,
    distanceKm: calculateDistanceKm(ws.profile.lat, ws.profile.lng, candidate.publicProfile.lat, candidate.publicProfile.lng),
    timezoneOverlapHours: calculateTimezoneOverlapHours(ws.employerProfile.timezone, candidate.publicProfile.timezone),
    conversationId: conversation.id,
  });

  return res.json({
    card: revealedCard,
    employerProfile: ws.employerProfile,
    tokenLedger: ws.tokenLedger,
    conversation,
    messages: ws.messagesByConversation[conversation.id],
  });
}
