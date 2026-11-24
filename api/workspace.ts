import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPaymentProviderSummary } from '../server/paymentProvider';
import { buildBlindCards, getWorkspace, resolveSessionKey } from './_store';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const ws = getWorkspace(resolveSessionKey(req));

  return res.json({
    profile: ws.profile,
    talentProfile: ws.talentProfile,
    employerProfile: ws.employerProfile,
    blindTalents: buildBlindCards(ws),
    opportunities: ws.opportunities,
    applications: ws.applications,
    tokenLedger: ws.tokenLedger,
    subscriptions: ws.subscriptions,
    contracts: ws.contracts,
    certificates: ws.certificates.filter(
      (c) => c.talentId === ws.profile.id || c.employerId === ws.profile.id
    ),
    skillBadges: ws.skillBadges.filter((b) => b.talentId === ws.profile.id),
    conversations: ws.conversations,
    messagesByConversation: ws.messagesByConversation,
    walletTransactions: ws.walletTransactions,
    paymentProviders: getPaymentProviderSummary(),
  });
}
