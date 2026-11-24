import { createInitialSeedWorkspace, type WorkspaceState } from '../../server/seedData';
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
  POST_PAYOUT_EXP_REWARD,
  TOKEN_PACKS,
  validateTopSkills,
} from './domain';
import type {
  Application,
  ApplicationStatus,
  BlindTalentCardData,
  ChatMessage,
  Conversation,
  CurrencyCode,
  EscrowContract,
  FirstQuestDraft,
  Opportunity,
  OpportunityType,
  PlanType,
  SkillBadge,
  SubscriptionRecord,
  VerifiableCertificate,
  WorkspaceMode,
  WorkMode,
} from '../types/timu';

const STORAGE_PREFIX = 'timu_local_workspace_v2_';

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function getStorageKey(sessionKey: string): string {
  const safe = sessionKey.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'demo_default';
  return `${STORAGE_PREFIX}${safe}`;
}

function loadState(sessionKey: string): WorkspaceState {
  const key = getStorageKey(sessionKey);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspaceState;
      if (parsed && parsed.profile && parsed.talentProfile && parsed.employerProfile) {
        return parsed;
      }
    }
  } catch {
    // fall through to fresh seed workspace
  }
  const fresh = createInitialSeedWorkspace(sessionKey === 'demo_default' ? 'demo_user_1' : sessionKey);
  saveState(sessionKey, fresh);
  return fresh;
}

function saveState(sessionKey: string, state: WorkspaceState): void {
  try {
    localStorage.setItem(getStorageKey(sessionKey), JSON.stringify(state));
  } catch {
    // ignore quota/private-mode storage errors
  }
}

function buildCards(ws: WorkspaceState): BlindTalentCardData[] {
  return ws.candidates.map((cand) => {
    const isUnlocked = ws.unlockedTalentIds.includes(cand.publicProfile.userId);
    const conv = ws.conversations.find(
      (c) => c.talentId === cand.publicProfile.userId && c.employerId === ws.profile.id
    );
    return buildBlindTalentCard({
      talent: cand.publicProfile,
      identity: cand.identity,
      isUnlocked,
      distanceKm: calculateDistanceKm(
        ws.profile.lat,
        ws.profile.lng,
        cand.publicProfile.lat,
        cand.publicProfile.lng
      ),
      timezoneOverlapHours: calculateTimezoneOverlapHours(
        ws.employerProfile.timezone,
        cand.publicProfile.timezone
      ),
      conversationId: conv?.id,
    });
  });
}

export const localWorkspaceEngine = {
  getWorkspaceSnapshot(sessionKey: string) {
    const ws = loadState(sessionKey);
    return {
      profile: ws.profile,
      talentProfile: ws.talentProfile,
      employerProfile: ws.employerProfile,
      blindTalents: buildCards(ws),
      opportunities: ws.opportunities,
      applications: ws.applications,
      tokenLedger: ws.tokenLedger,
      subscriptions: ws.subscriptions,
      contracts: ws.contracts,
      certificates: ws.certificates.filter(
        (c) => c.talentId === ws.profile.id || c.employerId === ws.profile.id
      ),
      skillBadges: ws.skillBadges,
      conversations: ws.conversations,
      messagesByConversation: ws.messagesByConversation,
      walletTransactions: ws.walletTransactions,
      paymentProviders: {
        isSandbox: true,
        internationalProvider: 'Sandbox Payment Simulator (Offline / Static Mode)',
        regionalProvider: 'Sandbox Payment Simulator (Offline / Static Mode)',
      },
    };
  },

  findCertificateByCode(sessionKey: string, code: string): VerifiableCertificate | null {
    const cleaned = code.trim().toUpperCase();
    const ws = loadState(sessionKey);
    const localMatch = ws.certificates.find((c) => c.verificationCode.toUpperCase() === cleaned);
    if (localMatch) return localMatch;
    const seed = createInitialSeedWorkspace('demo_user_1');
    return seed.certificates.find((c) => c.verificationCode.toUpperCase() === cleaned) || null;
  },

  updateActiveMode(sessionKey: string, activeMode: WorkspaceMode) {
    const ws = loadState(sessionKey);
    ws.profile.activeMode = activeMode;
    saveState(sessionKey, ws);
    return { profile: ws.profile };
  },

  completeFirstQuest(sessionKey: string, draft: FirstQuestDraft) {
    const ws = loadState(sessionKey);
    const skillCheck = validateTopSkills(draft.topSkills);
    if (!skillCheck.valid) {
      return { ok: false as const, error: skillCheck.error || 'Select exactly 3 Top Skills.' };
    }
    const steps = evaluateFirstQuestSteps(draft);
    const questExp = calculateFirstQuestExp(steps);

    ws.profile.fullName = draft.fullName.trim();
    ws.profile.city = draft.city.trim();
    ws.profile.countryCode = draft.countryCode.trim();
    ws.profile.timezone = draft.timezone.trim();
    ws.talentPhonePrivate = draft.phonePrivate.trim();

    ws.talentProfile = {
      ...ws.talentProfile,
      category: draft.category.trim(),
      educationDetail: draft.educationDetail.trim(),
      hasNoFormalExperience: draft.hasNoFormalExperience,
      experienceSummary: draft.hasNoFormalExperience
        ? 'No formal work experience yet. Ready for mentored First Quest and SME Escrow projects.'
        : draft.experienceSummary.trim(),
      bootcampHistory: draft.bootcampHistory.trim(),
      interests: draft.interests,
      careerField: draft.careerField.trim(),
      topSkills: draft.topSkills,
      workModes: draft.workModes,
      portfolioUrl: draft.portfolioUrl.trim(),
      city: draft.city.trim(),
      countryCode: draft.countryCode.trim(),
      timezone: draft.timezone.trim(),
      expPoints: Math.max(ws.talentProfile.expPoints, questExp),
      tierLevel: getTierFromExp(Math.max(ws.talentProfile.expPoints, questExp)).level,
      firstQuestCompleted: questExp >= 100,
    };

    saveState(sessionKey, ws);
    return { ok: true as const, profile: ws.profile, talentProfile: ws.talentProfile };
  },

  saveTalentProfile(
    sessionKey: string,
    payload: {
      fullName: string;
      educationDetail: string;
      experienceSummary: string;
      bootcampHistory: string;
      portfolioUrl: string;
      linkedinUrl: string;
      city: string;
      timezone: string;
    }
  ) {
    const ws = loadState(sessionKey);
    ws.profile.fullName = payload.fullName.trim() || ws.profile.fullName;
    ws.profile.city = payload.city.trim() || ws.profile.city;
    ws.profile.timezone = payload.timezone.trim() || ws.profile.timezone;
    ws.talentProfile = {
      ...ws.talentProfile,
      educationDetail: payload.educationDetail.trim(),
      experienceSummary: payload.experienceSummary.trim(),
      bootcampHistory: payload.bootcampHistory.trim(),
      portfolioUrl: payload.portfolioUrl.trim(),
      linkedinUrl: payload.linkedinUrl.trim(),
      city: payload.city.trim() || ws.talentProfile.city,
      timezone: payload.timezone.trim() || ws.talentProfile.timezone,
    };
    saveState(sessionKey, ws);
    return { ok: true as const, profile: ws.profile, talentProfile: ws.talentProfile };
  },

  saveEmployerProfile(
    sessionKey: string,
    payload: { businessName: string; industry: string; city: string; timezone: string }
  ) {
    const ws = loadState(sessionKey);
    ws.employerProfile = {
      ...ws.employerProfile,
      businessName: payload.businessName.trim() || ws.employerProfile.businessName,
      industry: payload.industry.trim() || ws.employerProfile.industry,
      city: payload.city.trim() || ws.employerProfile.city,
      timezone: payload.timezone.trim() || ws.employerProfile.timezone,
    };
    saveState(sessionKey, ws);
    return { ok: true as const, employerProfile: ws.employerProfile };
  },

  unlockTalent(sessionKey: string, talentId: string) {
    const ws = loadState(sessionKey);
    const cand = ws.candidates.find((c) => c.publicProfile.userId === talentId);
    if (!cand) return { ok: false as const, error: 'Candidate not found.' };

    const alreadyUnlocked = ws.unlockedTalentIds.includes(talentId);
    if (!alreadyUnlocked) {
      const deduction = deductTokenAtomically(ws.employerProfile.tokenBalance, 1);
      if (!deduction.ok) {
        return { ok: false as const, error: 'Insufficient Token balance. Top up Tokens to unlock.' };
      }
      ws.employerProfile.tokenBalance = deduction.nextBalance;
      ws.unlockedTalentIds.push(talentId);
      ws.tokenLedger.unshift({
        id: randomId('tl'),
        employerId: ws.profile.id,
        delta: -1,
        reason: `Unlock Talent (${cand.publicProfile.candidateCode})`,
        referenceId: talentId,
        createdAt: new Date().toISOString(),
      });
    }

    let conv = ws.conversations.find(
      (c) => c.talentId === talentId && c.employerId === ws.profile.id
    );
    const nowIso = new Date().toISOString();
    if (!conv) {
      conv = {
        id: randomId('conv'),
        employerId: ws.profile.id,
        businessName: ws.employerProfile.businessName,
        talentId,
        talentName: cand.identity.fullName,
        talentAvatarUrl: cand.identity.avatarUrl,
        talentCandidateCode: cand.publicProfile.candidateCode,
        lastMessagePreview: 'Profile unlocked. Start discussing project scope and Escrow.',
        lastMessageAt: nowIso,
      };
      ws.conversations.unshift(conv);
      ws.messagesByConversation[conv.id] = [
        {
          id: randomId('msg'),
          conversationId: conv.id,
          senderId: 'system',
          senderName: 'TIMU',
          body: `${cand.identity.fullName} unlocked (1 Token). Private WhatsApp/phone remains protected until the talent opts in.`,
          createdAt: nowIso,
        },
      ];
    }

    const card = buildBlindTalentCard({
      talent: cand.publicProfile,
      identity: cand.identity,
      isUnlocked: true,
      distanceKm: calculateDistanceKm(
        ws.profile.lat,
        ws.profile.lng,
        cand.publicProfile.lat,
        cand.publicProfile.lng
      ),
      timezoneOverlapHours: calculateTimezoneOverlapHours(
        ws.employerProfile.timezone,
        cand.publicProfile.timezone
      ),
      conversationId: conv.id,
    });

    saveState(sessionKey, ws);
    return {
      ok: true as const,
      employerProfile: ws.employerProfile,
      tokenLedger: ws.tokenLedger,
      card,
      conversation: conv,
      messages: ws.messagesByConversation[conv.id] || [],
    };
  },

  publishOpportunity(
    sessionKey: string,
    payload: {
      opportunityType: OpportunityType;
      title: string;
      description: string;
      deliverableScope: string;
      careerField: string;
      workMode: WorkMode;
      city: string;
      timezone: string;
      budgetMinor: number;
      currency: CurrencyCode;
      deadline: string;
    }
  ) {
    const ws = loadState(sessionKey);
    const deduction = deductTokenAtomically(ws.employerProfile.tokenBalance, 1);
    if (!deduction.ok) {
      return { ok: false as const, error: 'Insufficient Token balance. Top up 1 Token to post.' };
    }
    ws.employerProfile.tokenBalance = deduction.nextBalance;
    const opportunity: Opportunity = {
      id: randomId('opp'),
      employerId: ws.profile.id,
      businessName: ws.employerProfile.businessName,
      employerVerified: ws.employerProfile.isVerified,
      opportunityType: payload.opportunityType,
      title: payload.title.trim(),
      description: payload.description.trim(),
      deliverableScope: payload.deliverableScope.trim(),
      careerField: payload.careerField.trim(),
      workMode: payload.workMode,
      city: payload.city.trim(),
      lat: ws.profile.lat,
      lng: ws.profile.lng,
      timezone: payload.timezone.trim(),
      budgetMinor: Math.max(1, Math.round(payload.budgetMinor)),
      currency: payload.currency,
      deadline: payload.deadline,
      isPriority: ws.employerProfile.isPremium,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    ws.opportunities.unshift(opportunity);
    ws.tokenLedger.unshift({
      id: randomId('tl'),
      employerId: ws.profile.id,
      delta: -1,
      reason: `Post Project: ${opportunity.title}`,
      referenceId: opportunity.id,
      createdAt: new Date().toISOString(),
    });
    saveState(sessionKey, ws);
    return {
      ok: true as const,
      opportunity,
      employerProfile: ws.employerProfile,
      tokenLedger: ws.tokenLedger,
    };
  },

  applyToOpportunity(sessionKey: string, opportunityId: string, pitch: string, portfolioLink: string) {
    const ws = loadState(sessionKey);
    const opp = ws.opportunities.find((o) => o.id === opportunityId);
    if (!opp) return { ok: false as const, error: 'Project not found.' };
    const existing = ws.applications.find(
      (a) => a.opportunityId === opportunityId && a.talentId === ws.profile.id
    );
    if (existing) {
      return { ok: false as const, error: 'You have already applied to this project.' };
    }
    const application: Application = {
      id: `${opportunityId}_${ws.profile.id}`,
      opportunityId,
      opportunityTitle: opp.title,
      employerId: opp.employerId,
      businessName: opp.businessName,
      talentId: ws.profile.id,
      candidateCode: ws.talentProfile.candidateCode,
      talentSkills: ws.talentProfile.topSkills,
      talentTierLevel: ws.talentProfile.tierLevel,
      talentVerified: ws.talentProfile.isVerified,
      pitch: pitch.trim(),
      portfolioLink: portfolioLink.trim(),
      status: 'applied',
      createdAt: new Date().toISOString(),
    };
    ws.applications.unshift(application);
    saveState(sessionKey, ws);
    return { ok: true as const, application };
  },

  updateApplicationStatus(sessionKey: string, applicationId: string, status: ApplicationStatus) {
    const ws = loadState(sessionKey);
    const app = ws.applications.find((a) => a.id === applicationId);
    if (!app) return { ok: false as const, error: 'Application not found.' };
    app.status = status;
    saveState(sessionKey, ws);
    return { ok: true as const, application: app };
  },

  fundContract(
    sessionKey: string,
    payload: {
      conversationId?: string;
      opportunityId?: string;
      talentId: string;
      title: string;
      scopeSummary: string;
      grossAmountMinor: number;
      currency: CurrencyCode;
    }
  ) {
    const ws = loadState(sessionKey);
    const breakdown = calculateEscrowBreakdown(payload.grossAmountMinor);
    const cand = ws.candidates.find((c) => c.publicProfile.userId === payload.talentId);
    const talentName =
      payload.talentId === ws.profile.id
        ? ws.profile.fullName
        : cand?.identity.fullName || 'TIMU Talent';
    const nowIso = new Date().toISOString();
    const contract: EscrowContract = {
      id: randomId('ctr'),
      opportunityId: payload.opportunityId || 'direct_hire',
      employerId: ws.profile.id,
      businessName: ws.employerProfile.businessName,
      talentId: payload.talentId,
      talentName,
      title: payload.title.trim(),
      scopeSummary: payload.scopeSummary.trim(),
      grossAmountMinor: breakdown.grossAmountMinor,
      platformFeeMinor: breakdown.platformFeeMinor,
      netTalentMinor: breakdown.netTalentMinor,
      currency: payload.currency,
      escrowProvider: 'sandbox_simulator',
      escrowStatus: 'funded',
      providerPaymentIntentId: `escrow_sbx_${Math.random().toString(36).slice(2, 10)}`,
      deliverableUrl: '',
      deliverableNote: '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    ws.contracts.unshift(contract);
    if (payload.conversationId) {
      const conv = ws.conversations.find((c) => c.id === payload.conversationId);
      if (conv) conv.contractId = contract.id;
    }
    saveState(sessionKey, ws);
    return { ok: true as const, contract };
  },

  submitDeliverable(sessionKey: string, contractId: string, deliverableUrl: string, deliverableNote: string) {
    const ws = loadState(sessionKey);
    const contract = ws.contracts.find((c) => c.id === contractId);
    if (!contract) return { ok: false as const, error: 'Escrow contract not found.' };
    contract.deliverableUrl = deliverableUrl.trim();
    contract.deliverableNote = deliverableNote.trim();
    contract.escrowStatus = 'deliverable_submitted';
    contract.updatedAt = new Date().toISOString();
    saveState(sessionKey, ws);
    return { ok: true as const, contract };
  },

  releaseContract(sessionKey: string, contractId: string) {
    const ws = loadState(sessionKey);
    const contract = ws.contracts.find((c) => c.id === contractId);
    if (!contract) return { ok: false as const, error: 'Escrow contract not found.' };
    if (contract.escrowStatus === 'released') {
      return { ok: false as const, error: 'Escrow funds have already been released.' };
    }

    const nowIso = new Date().toISOString();
    contract.escrowStatus = 'released';
    contract.updatedAt = nowIso;

    ws.walletTransactions.unshift(
      {
        id: randomId('wtx'),
        talentId: contract.talentId,
        contractId: contract.id,
        type: 'escrow_release',
        description: `Escrow Release (90%) - ${contract.title}`,
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
        description: `Platform Admin Fee (10%) - ${contract.title}`,
        amountMinor: contract.platformFeeMinor,
        currency: contract.currency,
        status: 'completed',
        createdAt: nowIso,
      }
    );

    const cand = ws.candidates.find((c) => c.publicProfile.userId === contract.talentId);
    const validatedSkills =
      contract.talentId === ws.profile.id
        ? ws.talentProfile.topSkills
        : cand?.publicProfile.topSkills || ['Verified Skill'];

    const certificate: VerifiableCertificate = {
      id: randomId('cert'),
      verificationCode: generateVerificationCode(new Date().getFullYear(), Math.random().toString(36).slice(2, 8)),
      contractId: contract.id,
      talentId: contract.talentId,
      talentName: contract.talentName,
      employerId: contract.employerId,
      businessName: contract.businessName,
      projectTitle: contract.title,
      skillsValidated: validatedSkills,
      issuedAt: nowIso,
    };
    ws.certificates.unshift(certificate);

    const badge: SkillBadge = {
      id: randomId('badge'),
      talentId: contract.talentId,
      badgeName: `Verified ${ws.talentProfile.careerField}`,
      careerField: ws.talentProfile.careerField,
      earnedFromContractId: contract.id,
      awardedAt: nowIso,
    };
    ws.skillBadges.unshift(badge);

    if (contract.talentId === ws.profile.id) {
      ws.talentProfile.completedGigsCount += 1;
      ws.talentProfile.expPoints += POST_PAYOUT_EXP_REWARD;
      ws.talentProfile.tierLevel = getTierFromExp(ws.talentProfile.expPoints).level;
    }

    saveState(sessionKey, ws);
    return {
      ok: true as const,
      contract,
      certificate,
      badge,
      talentProfile: ws.talentProfile,
      walletTransactions: ws.walletTransactions,
    };
  },

  withdrawWallet(sessionKey: string, amountMinor: number, currency: CurrencyCode, payoutDestination: string) {
    const ws = loadState(sessionKey);
    const available = ws.walletTransactions
      .filter((t) => t.currency === currency && t.type === 'escrow_release' && t.status === 'available')
      .reduce((acc, t) => acc + t.amountMinor, 0);
    const withdrawn = ws.walletTransactions
      .filter((t) => t.currency === currency && t.type === 'withdrawal')
      .reduce((acc, t) => acc + t.amountMinor, 0);
    if (amountMinor > Math.max(0, available - withdrawn)) {
      return { ok: false as const, error: 'Withdrawal amount exceeds available wallet balance.' };
    }
    ws.walletTransactions.unshift({
      id: randomId('wtx'),
      talentId: ws.profile.id,
      type: 'withdrawal',
      description: `Withdrawal to ${payoutDestination.trim()}`,
      amountMinor,
      currency,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });
    saveState(sessionKey, ws);
    return { ok: true as const, walletTransactions: ws.walletTransactions };
  },

  buyTokenPack(sessionKey: string, packId: 'pack_1' | 'pack_5' | 'pack_15', currency: CurrencyCode) {
    const ws = loadState(sessionKey);
    const pack = TOKEN_PACKS.find((p) => p.id === packId);
    if (!pack) return { ok: false as const, error: 'Invalid Token pack.' };
    const price = getTokenPackPriceMinor(pack, currency);
    ws.employerProfile.tokenBalance += pack.tokens;
    ws.tokenLedger.unshift({
      id: randomId('tl'),
      employerId: ws.profile.id,
      delta: pack.tokens,
      reason: `Token Top-Up (${pack.tokens} Tokens · ${currency} ${price})`,
      referenceId: randomId('chk'),
      createdAt: new Date().toISOString(),
    });
    saveState(sessionKey, ws);
    return { ok: true as const, employerProfile: ws.employerProfile, tokenLedger: ws.tokenLedger };
  },

  activateSubscription(sessionKey: string, planType: PlanType, currency: CurrencyCode, targetRole: WorkspaceMode) {
    const ws = loadState(sessionKey);
    const amountMinor = getSubscriptionPriceMinor(planType, currency);
    const periodEnd = new Date(Date.now() + 30 * 86400000).toISOString();
    const subscription: SubscriptionRecord = {
      id: randomId('sub'),
      userId: ws.profile.id,
      planType,
      status: 'active',
      amountMinor,
      currency,
      currentPeriodEnd: periodEnd,
      providerSubscriptionId: randomId('sbx_sub'),
    };
    ws.subscriptions.unshift(subscription);

    if (planType === 'talent_premium') {
      ws.talentProfile.isPremium = true;
    } else if (planType === 'employer_premium') {
      ws.employerProfile.isPremium = true;
      ws.employerProfile.premiumExpiresAt = periodEnd;
      ws.employerProfile.tokenBalance += 5;
      ws.tokenLedger.unshift({
        id: randomId('tl'),
        employerId: ws.profile.id,
        delta: 5,
        reason: 'Employer Priority Monthly Bonus Tokens',
        referenceId: subscription.id,
        createdAt: new Date().toISOString(),
      });
    } else if (planType === 'verification_badge') {
      if (targetRole === 'talent') ws.talentProfile.isVerified = true;
      else ws.employerProfile.isVerified = true;
    }

    saveState(sessionKey, ws);
    return {
      ok: true as const,
      subscription,
      talentProfile: ws.talentProfile,
      employerProfile: ws.employerProfile,
      tokenLedger: ws.tokenLedger,
    };
  },

  sendMessage(
    sessionKey: string,
    conversationId: string,
    body: string,
    options?: { attachmentUrl?: string; shareContactOptIn?: boolean; contactChannel?: 'whatsapp' | 'phone' }
  ) {
    const ws = loadState(sessionKey);
    const conv = ws.conversations.find((c) => c.id === conversationId);
    if (!conv) return { ok: false as const, error: 'Conversation not found.' };
    const nowIso = new Date().toISOString();
    const senderName =
      ws.profile.activeMode === 'employer' ? ws.employerProfile.businessName : ws.profile.fullName;
    const message: ChatMessage = {
      id: randomId('msg'),
      conversationId,
      senderId: ws.profile.id,
      senderName,
      body: body.trim(),
      attachmentUrl: options?.attachmentUrl || undefined,
      sharedContactPayload: options?.shareContactOptIn
        ? {
            phone: ws.talentPhonePrivate,
            channel: options.contactChannel || 'whatsapp',
            consentedAt: nowIso,
          }
        : undefined,
      createdAt: nowIso,
    };
    ws.messagesByConversation[conversationId] = [
      ...(ws.messagesByConversation[conversationId] || []),
      message,
    ];
    conv.lastMessagePreview = message.body.slice(0, 120);
    conv.lastMessageAt = nowIso;
    saveState(sessionKey, ws);
    return { ok: true as const, message, conversation: conv };
  },
};
