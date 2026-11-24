import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import {
  buildBlindTalentCard,
  calculateDistanceKm,
  calculateEscrowBreakdown,
  calculateFirstQuestExp,
  calculateTimezoneOverlapHours,
  deductTokenAtomically,
  evaluateFirstQuestSteps,
  generateVerificationCode,
  getSubscriptionPriceMinor,
  getTierFromExp,
  getTokenPackPriceMinor,
  isSafeExternalUrl,
  POST_PAYOUT_EXP_REWARD,
  TOKEN_PACKS,
  validateTopSkills,
} from './src/lib/domain.ts';
import {
  getPaymentProviderSummary,
  resolvePaymentProvider,
} from './server/paymentProvider.ts';
import { createInitialSeedWorkspace, type WorkspaceState } from './server/seedData.ts';
import type {
  ChatMessage,
  CurrencyCode,
  EscrowContract,
  Opportunity,
  PlanType,
  VerifiableCertificate,
} from './src/types/timu.ts';

const PORT = 3000;

// Session-isolated workspaces keyed by session header or default demo workspace
const workspaces = new Map<string, WorkspaceState>();
const publicCertificatesIndex = new Map<string, VerifiableCertificate>();

function getWorkspace(sessionKey: string): WorkspaceState {
  const safeKey = sessionKey.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'demo_default';
  let ws = workspaces.get(safeKey);
  if (!ws) {
    ws = createInitialSeedWorkspace(safeKey === 'demo_default' ? 'demo_user_1' : safeKey);
    workspaces.set(safeKey, ws);
    for (const cert of ws.certificates) {
      publicCertificatesIndex.set(cert.verificationCode, cert);
    }
  }
  return ws;
}

// Seed default certificates immediately for public verification route
getWorkspace('demo_default');

// Validation Schemas
const firstQuestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phonePrivate: z.string().trim().min(6).max(40),
  city: z.string().trim().min(2).max(80),
  countryCode: z.string().trim().min(2).max(8),
  timezone: z.string().trim().min(3).max(32),
  workModes: z.array(z.enum(['remote', 'onsite', 'hybrid'])).min(1).max(3),
  category: z.string().trim().min(2).max(80),
  educationDetail: z.string().trim().min(3).max(200),
  hasNoFormalExperience: z.boolean(),
  experienceSummary: z.string().trim().max(500),
  bootcampHistory: z.string().trim().max(240),
  interests: z.array(z.string().trim().min(1).max(60)).min(1).max(10),
  careerField: z.string().trim().min(2).max(100),
  topSkills: z.array(z.string().trim().min(1).max(60)).length(3),
  portfolioUrl: z.string().trim().max(300).refine(isSafeExternalUrl, 'Invalid URL protocol'),
});

const createOpportunitySchema = z.object({
  opportunityType: z.enum(['escrow_gig', 'part_time', 'full_time']),
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().min(10).max(2000),
  deliverableScope: z.string().trim().min(5).max(1000),
  careerField: z.string().trim().min(2).max(100),
  workMode: z.enum(['remote', 'onsite', 'hybrid']),
  city: z.string().trim().min(2).max(80),
  timezone: z.string().trim().min(3).max(32),
  budgetMinor: z.number().int().positive(),
  currency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']),
  deadline: z.string().trim().min(4).max(40),
});

const applySchema = z.object({
  pitch: z.string().trim().min(10).max(1500),
  portfolioLink: z.string().trim().max(300).refine(isSafeExternalUrl, 'Portfolio link must be http or https'),
});

const fundContractSchema = z.object({
  conversationId: z.string().trim().min(1).max(128).optional(),
  opportunityId: z.string().trim().max(128).optional(),
  talentId: z.string().trim().min(1).max(128),
  title: z.string().trim().min(3).max(160),
  scopeSummary: z.string().trim().min(5).max(1000),
  grossAmountMinor: z.number().int().positive(),
  currency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']),
});

const submitDeliverableSchema = z.object({
  deliverableUrl: z.string().trim().min(5).max(400).refine(isSafeExternalUrl, 'Deliverable URL must be http or https'),
  deliverableNote: z.string().trim().min(5).max(1000),
});

const messageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  attachmentUrl: z.string().trim().max(400).refine(isSafeExternalUrl, 'Invalid attachment URL').optional(),
  shareContactOptIn: z.boolean().optional(),
  contactChannel: z.enum(['whatsapp', 'phone']).optional(),
});

const withdrawSchema = z.object({
  amountMinor: z.number().int().positive(),
  currency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']),
  payoutDestination: z.string().trim().min(4).max(140),
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  const server = http.createServer(app);

  // Real-Time WebSocket Server for TIMU Chat & Live Escrow Updates
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname;
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });
  const rooms = new Map<string, Set<WebSocket>>();

  function broadcastToRoom(roomId: string, payload: unknown) {
    const sockets = rooms.get(roomId);
    if (!sockets) return;
    const raw = JSON.stringify(payload);
    for (const client of sockets) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  }

  wss.on('connection', (ws) => {
    const joinedRooms = new Set<string>();

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw)) as { type?: string; conversationId?: string };
        if (msg.type === 'room:join' && typeof msg.conversationId === 'string') {
          const roomId = msg.conversationId.slice(0, 128);
          if (!rooms.has(roomId)) rooms.set(roomId, new Set());
          rooms.get(roomId)!.add(ws);
          joinedRooms.add(roomId);
          ws.send(JSON.stringify({ type: 'room:joined', conversationId: roomId }));
        }
      } catch {
        // Ignore malformed websocket frames
      }
    });

    ws.on('close', () => {
      for (const roomId of joinedRooms) {
        rooms.get(roomId)?.delete(ws);
      }
    });
  });

  function resolveSessionKey(req: express.Request): string {
    const hdr = req.headers['x-timu-session'];
    if (typeof hdr === 'string' && hdr.trim()) return hdr.trim();
    return 'demo_default';
  }

  // Health & Provider Info
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, paymentProviders: getPaymentProviderSummary() });
  });

  // Full Workspace Bootstrap (never leaks locked candidate PII)
  app.get('/api/workspace', (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const blindCards = ws.candidates.map((cand) => {
      const isUnlocked = ws.unlockedTalentIds.includes(cand.publicProfile.userId);
      const conv = ws.conversations.find((c) => c.talentId === cand.publicProfile.userId && c.employerId === ws.profile.id);
      return buildBlindTalentCard({
        talent: cand.publicProfile,
        identity: cand.identity,
        isUnlocked,
        distanceKm: calculateDistanceKm(ws.profile.lat, ws.profile.lng, cand.publicProfile.lat, cand.publicProfile.lng),
        timezoneOverlapHours: calculateTimezoneOverlapHours(ws.employerProfile.timezone, cand.publicProfile.timezone),
        conversationId: conv?.id,
      });
    });

    res.json({
      profile: ws.profile,
      talentProfile: ws.talentProfile,
      employerProfile: ws.employerProfile,
      blindTalents: blindCards,
      opportunities: ws.opportunities,
      applications: ws.applications,
      tokenLedger: ws.tokenLedger,
      subscriptions: ws.subscriptions,
      contracts: ws.contracts,
      certificates: ws.certificates.filter((c) => c.talentId === ws.profile.id || c.employerId === ws.profile.id),
      skillBadges: ws.skillBadges.filter((b) => b.talentId === ws.profile.id),
      conversations: ws.conversations,
      messagesByConversation: ws.messagesByConversation,
      walletTransactions: ws.walletTransactions,
      paymentProviders: getPaymentProviderSummary(),
    });
  });

  // Server-enforced Blind Discovery endpoint
  app.get('/api/blind-talents', (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const cards = ws.candidates.map((cand) => {
      const isUnlocked = ws.unlockedTalentIds.includes(cand.publicProfile.userId);
      const conv = ws.conversations.find((c) => c.talentId === cand.publicProfile.userId && c.employerId === ws.profile.id);
      return buildBlindTalentCard({
        talent: cand.publicProfile,
        identity: cand.identity,
        isUnlocked,
        distanceKm: calculateDistanceKm(ws.profile.lat, ws.profile.lng, cand.publicProfile.lat, cand.publicProfile.lng),
        timezoneOverlapHours: calculateTimezoneOverlapHours(ws.employerProfile.timezone, cand.publicProfile.timezone),
        conversationId: conv?.id,
      });
    });
    res.json({ talents: cards });
  });

  // Switch active workspace mode / preferences
  app.post('/api/workspace/preferences', (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const parsed = z
      .object({
        activeMode: z.enum(['talent', 'employer']).optional(),
        preferredLocale: z.enum(['en', 'id']).optional(),
        preferredCurrency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']).optional(),
        themePreference: z.enum(['light', 'dark']).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid preferences payload.' });
    }
    Object.assign(ws.profile, parsed.data);
    return res.json({ profile: ws.profile });
  });

  // Complete or save Talent First Quest (awards 100 EXP -> Rookie Lv 1)
  app.post('/api/talent/first-quest', (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const parsed = firstQuestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Please complete all required First Quest fields.',
      });
    }
    const d = parsed.data;
    const skillCheck = validateTopSkills(d.topSkills);
    if (!skillCheck.valid) {
      return res.status(400).json({ error: skillCheck.error });
    }

    const steps = evaluateFirstQuestSteps(d);
    const questExp = calculateFirstQuestExp(steps);
    const nextExp = Math.max(ws.talentProfile.expPoints, questExp);
    const tier = getTierFromExp(nextExp);

    ws.profile.fullName = d.fullName;
    ws.profile.city = d.city;
    ws.profile.countryCode = d.countryCode;
    ws.profile.timezone = d.timezone;
    ws.talentPhonePrivate = d.phonePrivate;

    ws.talentProfile = {
      ...ws.talentProfile,
      category: d.category,
      educationDetail: d.educationDetail,
      hasNoFormalExperience: d.hasNoFormalExperience,
      experienceSummary: d.hasNoFormalExperience
        ? 'No formal work experience yet. Ready for mentored First Quest and SME Escrow projects.'
        : d.experienceSummary,
      bootcampHistory: d.bootcampHistory,
      interests: d.interests,
      careerField: d.careerField,
      topSkills: d.topSkills,
      workModes: d.workModes,
      portfolioUrl: d.portfolioUrl,
      city: d.city,
      countryCode: d.countryCode,
      timezone: d.timezone,
      expPoints: nextExp,
      tierLevel: tier.level,
      firstQuestCompleted: true,
    };

    return res.json({
      profile: ws.profile,
      talentProfile: ws.talentProfile,
      tier,
    });
  });

  // Update Talent Profile
  app.post('/api/talent/profile', (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const parsed = z
      .object({
        fullName: z.string().trim().min(2).max(120),
        educationDetail: z.string().trim().min(3).max(200),
        experienceSummary: z.string().trim().max(500),
        bootcampHistory: z.string().trim().max(240),
        portfolioUrl: z.string().trim().max(300).refine(isSafeExternalUrl, 'Invalid URL'),
        linkedinUrl: z.string().trim().max(300).refine(isSafeExternalUrl, 'Invalid URL'),
        city: z.string().trim().min(2).max(80),
        timezone: z.string().trim().min(3).max(32),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid profile data.' });
    }
    ws.profile.fullName = parsed.data.fullName;
    ws.profile.city = parsed.data.city;
    ws.profile.timezone = parsed.data.timezone;
    Object.assign(ws.talentProfile, {
      educationDetail: parsed.data.educationDetail,
      experienceSummary: parsed.data.experienceSummary,
      bootcampHistory: parsed.data.bootcampHistory,
      portfolioUrl: parsed.data.portfolioUrl,
      linkedinUrl: parsed.data.linkedinUrl,
      city: parsed.data.city,
      timezone: parsed.data.timezone,
    });
    return res.json({ profile: ws.profile, talentProfile: ws.talentProfile });
  });

  // Update Employer Profile
  app.post('/api/employer/profile', (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const parsed = z
      .object({
        businessName: z.string().trim().min(2).max(140),
        industry: z.string().trim().min(2).max(100),
        city: z.string().trim().min(2).max(80),
        timezone: z.string().trim().min(3).max(32),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid business profile fields.' });
    }
    Object.assign(ws.employerProfile, parsed.data);
    return res.json({ employerProfile: ws.employerProfile });
  });

  // Atomic: Unlock Talent with 1 Token -> Reveal identity + create conversation
  app.post('/api/employer/unlock-talent', (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const parsed = z.object({ talentId: z.string().trim().min(1).max(128) }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid talentId.' });
    }
    const candidate = ws.candidates.find((c) => c.publicProfile.userId === parsed.data.talentId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const alreadyUnlocked = ws.unlockedTalentIds.includes(candidate.publicProfile.userId);
    if (!alreadyUnlocked) {
      const deduction = deductTokenAtomically(ws.employerProfile.tokenBalance, 1);
      if (!deduction.ok) {
        return res.status(402).json({ error: deduction.error });
      }
      ws.employerProfile.tokenBalance = deduction.nextBalance;
      ws.unlockedTalentIds.push(candidate.publicProfile.userId);
      ws.tokenLedger.unshift({
        id: `tl_${crypto.randomBytes(4).toString('hex')}`,
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
      ws.messagesByConversation[convId] = [
        {
          id: `msg_${crypto.randomBytes(4).toString('hex')}`,
          conversationId: convId,
          senderId: candidate.publicProfile.userId,
          senderName: candidate.identity.fullName,
          body: `Hi ${ws.employerProfile.businessName}! Thanks for unlocking my profile. Let me know the deliverables and timeline you have in mind.`,
          createdAt: nowIso,
        },
      ];
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
  });

  // Atomic: Publish Opportunity (1 Token)
  app.post('/api/employer/opportunities', (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const parsed = createOpportunitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid opportunity details.' });
    }
    const deduction = deductTokenAtomically(ws.employerProfile.tokenBalance, 1);
    if (!deduction.ok) {
      return res.status(402).json({ error: deduction.error });
    }
    const oppId = `opp_${crypto.randomBytes(4).toString('hex')}`;
    const nowIso = new Date().toISOString();
    const opp: Opportunity = {
      id: oppId,
      employerId: ws.profile.id,
      businessName: ws.employerProfile.businessName,
      employerVerified: ws.employerProfile.isVerified,
      ...parsed.data,
      lat: ws.profile.lat,
      lng: ws.profile.lng,
      isPriority: ws.employerProfile.isPremium,
      status: 'open',
      createdAt: nowIso,
    };

    ws.employerProfile.tokenBalance = deduction.nextBalance;
    ws.opportunities.unshift(opp);
    ws.tokenLedger.unshift({
      id: `tl_${crypto.randomBytes(4).toString('hex')}`,
      employerId: ws.profile.id,
      delta: -1,
      reason: `Publish: ${opp.title.slice(0, 48)}`,
      referenceId: oppId,
      createdAt: nowIso,
    });

    return res.status(201).json({
      opportunity: opp,
      employerProfile: ws.employerProfile,
      tokenLedger: ws.tokenLedger,
    });
  });

  // Apply to Opportunity with Pitch (duplicate prevention)
  app.post('/api/opportunities/:id/apply', (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const opp = ws.opportunities.find((o) => o.id === req.params.id);
    if (!opp) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Please enter a pitch (min 10 chars).' });
    }
    const appId = `${opp.id}_${ws.profile.id}`;
    if (ws.applications.some((a) => a.id === appId)) {
      return res.status(409).json({ error: 'You have already applied to this opportunity.' });
    }
    const application = {
      id: appId,
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      employerId: opp.employerId,
      businessName: opp.businessName,
      talentId: ws.profile.id,
      candidateCode: ws.talentProfile.candidateCode,
      talentSkills: ws.talentProfile.topSkills,
      talentTierLevel: ws.talentProfile.tierLevel,
      talentVerified: ws.talentProfile.isVerified,
      pitch: parsed.data.pitch,
      portfolioLink: parsed.data.portfolioLink || ws.talentProfile.portfolioUrl,
      status: 'applied' as const,
      createdAt: new Date().toISOString(),
    };
    ws.applications.unshift(application);
    return res.status(201).json({ application });
  });

  // Update application status (Employer)
  app.patch('/api/applications/:id/status', (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const parsed = z.object({ status: z.enum(['applied', 'shortlisted', 'hired', 'closed']) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid status.' });
    const appRec = ws.applications.find((a) => a.id === req.params.id);
    if (!appRec) return res.status(404).json({ error: 'Application not found.' });
    appRec.status = parsed.data.status;
    return res.json({ application: appRec });
  });

  // Fund Escrow Contract via PaymentProvider (100% gross -> 10% platform admin fee, 90% net talent)
  app.post('/api/contracts/fund', async (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const parsed = fundContractSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid contract fields.' });
    }
    const d = parsed.data;
    const breakdown = calculateEscrowBreakdown(d.grossAmountMinor);
    const provider = resolvePaymentProvider(d.currency);
    const contractId = `ctr_${crypto.randomBytes(4).toString('hex')}`;
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

    // Attach to conversation if present
    const conv = d.conversationId
      ? ws.conversations.find((c) => c.id === d.conversationId)
      : ws.conversations.find((c) => c.talentId === d.talentId && c.employerId === ws.profile.id);
    if (conv) {
      conv.contractId = contractId;
      const sysMsg: ChatMessage = {
        id: `msg_${crypto.randomBytes(4).toString('hex')}`,
        conversationId: conv.id,
        senderId: ws.profile.id,
        senderName: ws.employerProfile.businessName,
        body: `Funded Escrow contract "${contract.title}" via ${payment.providerLabel}. Funds are protected until deliverable approval.`,
        createdAt: nowIso,
      };
      ws.messagesByConversation[conv.id] = [...(ws.messagesByConversation[conv.id] || []), sysMsg];
      conv.lastMessagePreview = sysMsg.body;
      conv.lastMessageAt = nowIso;
      broadcastToRoom(conv.id, { type: 'message:created', message: sysMsg, contract });
    }

    return res.status(201).json({ contract, payment });
  });

  // Submit Deliverable (Talent)
  app.post('/api/contracts/:id/deliverable', (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const contract = ws.contracts.find((c) => c.id === req.params.id);
    if (!contract) return res.status(404).json({ error: 'Contract not found.' });
    if (contract.escrowStatus === 'released') {
      return res.status(409).json({ error: 'Contract is already released.' });
    }
    const parsed = submitDeliverableSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Provide a valid deliverable link and summary.' });
    }
    contract.deliverableUrl = parsed.data.deliverableUrl;
    contract.deliverableNote = parsed.data.deliverableNote;
    contract.escrowStatus = 'deliverable_submitted';
    contract.updatedAt = new Date().toISOString();

    const conv = ws.conversations.find((c) => c.contractId === contract.id);
    if (conv) {
      broadcastToRoom(conv.id, { type: 'contract:updated', contract });
    }
    return res.json({ contract });
  });

  // Atomic Escrow Release -> 90% to Talent Wallet, 10% Admin Fee logged, +EXP, Skill Badge, Verifiable Certificate
  app.post('/api/contracts/:id/release', async (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const contract = ws.contracts.find((c) => c.id === req.params.id);
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

    // 1. Wallet credit (90%) + Platform Admin Fee log (10%)
    if (contract.talentId === ws.profile.id) {
      ws.walletTransactions.unshift(
        {
          id: `wtx_${crypto.randomBytes(4).toString('hex')}`,
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
          id: `wtx_${crypto.randomBytes(4).toString('hex')}`,
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

    // 2. Award EXP & promote tier
    const cand = ws.candidates.find((c) => c.publicProfile.userId === contract.talentId);
    const targetTalent = cand ? cand.publicProfile : ws.talentProfile;
    targetTalent.expPoints += POST_PAYOUT_EXP_REWARD;
    targetTalent.completedGigsCount += 1;
    targetTalent.tierLevel = getTierFromExp(targetTalent.expPoints).level;

    // 3. Award Skill Badge
    const badge = {
      id: `badge_${crypto.randomBytes(4).toString('hex')}`,
      talentId: contract.talentId,
      badgeName: `Verified ${targetTalent.topSkills[0] || targetTalent.careerField}`,
      careerField: targetTalent.careerField,
      earnedFromContractId: contract.id,
      awardedAt: nowIso,
    };
    ws.skillBadges.unshift(badge);

    // 4. Mint Verifiable Completion Certificate
    const verificationCode = generateVerificationCode(
      new Date().getFullYear(),
      crypto.randomBytes(4).toString('hex')
    );
    const certificate: VerifiableCertificate = {
      id: `cert_${crypto.randomBytes(4).toString('hex')}`,
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
    publicCertificatesIndex.set(verificationCode, certificate);

    const conv = ws.conversations.find((c) => c.contractId === contract.id);
    if (conv) {
      const releaseMsg: ChatMessage = {
        id: `msg_${crypto.randomBytes(4).toString('hex')}`,
        conversationId: conv.id,
        senderId: contract.employerId,
        senderName: contract.businessName,
        body: `Approved work and released Escrow payout. Verifiable Certificate ${verificationCode} has been minted.`,
        createdAt: nowIso,
      };
      ws.messagesByConversation[conv.id] = [...(ws.messagesByConversation[conv.id] || []), releaseMsg];
      conv.lastMessagePreview = releaseMsg.body;
      conv.lastMessageAt = nowIso;
      broadcastToRoom(conv.id, { type: 'message:created', message: releaseMsg, contract, certificate });
    }

    return res.json({
      contract,
      payment,
      certificate,
      badge,
      talentProfile: ws.talentProfile,
      walletTransactions: ws.walletTransactions,
    });
  });

  // Talent Wallet Withdrawal
  app.post('/api/wallet/withdraw', async (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const parsed = withdrawSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Provide a valid withdrawal amount and payout destination.' });
    }
    const { amountMinor, currency, payoutDestination } = parsed.data;
    const availableMinor = ws.walletTransactions
      .filter((t) => t.currency === currency && (t.type === 'escrow_release' || t.type === 'withdrawal'))
      .reduce((acc, t) => (t.type === 'escrow_release' ? acc + t.amountMinor : acc - t.amountMinor), 0);

    if (amountMinor > availableMinor) {
      return res.status(400).json({ error: 'Withdrawal exceeds available balance in this currency.' });
    }

    const provider = resolvePaymentProvider(currency);
    const payout = await provider.initiateWithdrawal({
      talentId: ws.profile.id,
      amountMinor,
      currency,
      destination: payoutDestination,
    });

    const tx = {
      id: `wtx_${crypto.randomBytes(4).toString('hex')}`,
      talentId: ws.profile.id,
      type: 'withdrawal' as const,
      description: `Payout to ${payoutDestination}`,
      amountMinor,
      currency,
      status: 'completed' as const,
      payoutDestination,
      createdAt: new Date().toISOString(),
    };
    ws.walletTransactions.unshift(tx);
    return res.status(201).json({ transaction: tx, payout, walletTransactions: ws.walletTransactions });
  });

  // Purchase Token Pack
  app.post('/api/billing/tokens', async (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const parsed = z
      .object({
        packId: z.enum(['pack_1', 'pack_5', 'pack_15']),
        currency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']),
      })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid token pack selection.' });

    const pack = TOKEN_PACKS.find((p) => p.id === parsed.data.packId)!;
    const priceMinor = getTokenPackPriceMinor(pack, parsed.data.currency);
    const provider = resolvePaymentProvider(parsed.data.currency);
    const checkout = await provider.chargeCheckout({
      userId: ws.profile.id,
      amountMinor: priceMinor,
      currency: parsed.data.currency,
      description: `TIMU Token Pack (${pack.tokens} Tokens)`,
    });

    ws.employerProfile.tokenBalance += pack.tokens;
    ws.tokenLedger.unshift({
      id: `tl_${crypto.randomBytes(4).toString('hex')}`,
      employerId: ws.profile.id,
      delta: pack.tokens,
      reason: `Token Pack Purchase (+${pack.tokens})`,
      referenceId: checkout.providerIntentId,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      employerProfile: ws.employerProfile,
      tokenLedger: ws.tokenLedger,
      checkout,
    });
  });

  // Activate or Toggle Subscription (Premium / Verification Badge)
  app.post('/api/billing/subscription', async (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const parsed = z
      .object({
        planType: z.enum(['talent_premium', 'employer_premium', 'verification_badge']),
        currency: z.enum(['USD', 'IDR', 'EUR', 'GBP', 'SGD']),
        targetRole: z.enum(['talent', 'employer']),
      })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid subscription request.' });

    const { planType, currency, targetRole } = parsed.data;
    const amountMinor = getSubscriptionPriceMinor(planType as PlanType, currency as CurrencyCode);
    const provider = resolvePaymentProvider(currency);
    const checkout = await provider.chargeCheckout({
      userId: ws.profile.id,
      amountMinor,
      currency,
      description: `TIMU Subscription: ${planType}`,
    });

    const periodEnd = new Date(Date.now() + 30 * 86400000).toISOString();
    const record = {
      id: `sub_${crypto.randomBytes(4).toString('hex')}`,
      userId: ws.profile.id,
      planType,
      status: 'active' as const,
      amountMinor,
      currency,
      currentPeriodEnd: periodEnd,
      providerSubscriptionId: checkout.providerIntentId,
    };
    ws.subscriptions.unshift(record);

    if (planType === 'talent_premium') {
      ws.talentProfile.isPremium = true;
    } else if (planType === 'employer_premium') {
      ws.employerProfile.isPremium = true;
      ws.employerProfile.premiumExpiresAt = periodEnd;
      ws.employerProfile.tokenBalance += 5;
      ws.tokenLedger.unshift({
        id: `tl_${crypto.randomBytes(4).toString('hex')}`,
        employerId: ws.profile.id,
        delta: 5,
        reason: 'Employer Premium Monthly Bonus Tokens',
        referenceId: record.id,
        createdAt: new Date().toISOString(),
      });
    } else if (planType === 'verification_badge') {
      if (targetRole === 'talent') ws.talentProfile.isVerified = true;
      else ws.employerProfile.isVerified = true;
    }

    return res.status(201).json({
      subscription: record,
      talentProfile: ws.talentProfile,
      employerProfile: ws.employerProfile,
      tokenLedger: ws.tokenLedger,
      checkout,
    });
  });

  // Send Real-Time Chat Message (+ optional explicit opt-in contact sharing)
  app.post('/api/conversations/:id/messages', (req, res) => {
    const ws = getWorkspace(resolveSessionKey(req));
    const conv = ws.conversations.find((c) => c.id === req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Message cannot be empty.' });
    }

    const nowIso = new Date().toISOString();
    const senderName = ws.profile.activeMode === 'employer' ? ws.employerProfile.businessName : ws.profile.fullName;
    const message: ChatMessage = {
      id: `msg_${crypto.randomBytes(4).toString('hex')}`,
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

    broadcastToRoom(conv.id, { type: 'message:created', message });

    return res.status(201).json({ message, conversation: conv });
  });

  // Public Certificate Verification (NO login required)
  app.get('/api/certificates/:code', (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const cert = publicCertificatesIndex.get(code);
    if (!cert) {
      return res.status(404).json({ error: 'Certificate verification code not found.' });
    }
    return res.json({ certificate: cert });
  });

  // Mount Vite dev middleware or production static bundle
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`TIMU fullstack server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TIMU server:', err);
  process.exit(1);
});
