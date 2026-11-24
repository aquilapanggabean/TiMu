import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { isSafeExternalUrl } from '../../../src/lib/domain';
import { getWorkspace, randomId, resolveSessionKey } from '../../_store';
import type { ChatMessage } from '../../../src/types/timu';

const messageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  attachmentUrl: z
    .string()
    .trim()
    .max(400)
    .refine(isSafeExternalUrl, 'Invalid attachment URL')
    .optional(),
  shareContactOptIn: z.boolean().optional(),
  contactChannel: z.enum(['whatsapp', 'phone']).optional(),
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const { id: conversationId } = req.query as { id: string };
  const conv = ws.conversations.find((c) => c.id === conversationId);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Message cannot be empty.',
    });
  }

  const nowIso = new Date().toISOString();
  const senderName =
    ws.profile.activeMode === 'employer' ? ws.employerProfile.businessName : ws.profile.fullName;

  const message: ChatMessage = {
    id: randomId('msg'),
    conversationId: conv.id,
    senderId: ws.profile.id,
    senderName,
    body: parsed.data.body,
    attachmentUrl: parsed.data.attachmentUrl || undefined,
    sharedContactPayload: parsed.data.shareContactOptIn
      ? {
          phone: ws.talentPhonePrivate,
          channel: parsed.data.contactChannel || 'whatsapp',
          consentedAt: nowIso,
        }
      : undefined,
    createdAt: nowIso,
  };

  ws.messagesByConversation[conv.id] = [...(ws.messagesByConversation[conv.id] || []), message];
  conv.lastMessagePreview = message.body.slice(0, 120);
  conv.lastMessageAt = nowIso;

  return res.status(201).json({ message, conversation: conv });
}
