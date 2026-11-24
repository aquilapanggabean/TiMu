import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getDictionary, type Dictionary } from '../lib/i18n';
import { localWorkspaceEngine } from '../lib/localWorkspaceEngine';
import type {
  Application,
  ApplicationStatus,
  BlindTalentCardData,
  ChatMessage,
  Conversation,
  CurrencyCode,
  DistanceUnit,
  EmployerProfile,
  EscrowContract,
  FirstQuestDraft,
  LocaleCode,
  Opportunity,
  OpportunityType,
  PlanType,
  SkillBadge,
  SubscriptionRecord,
  TalentPublicProfile,
  ThemeMode,
  TokenLedgerEntry,
  UserProfile,
  VerifiableCertificate,
  WalletTransaction,
  WorkMode,
  WorkspaceMode,
} from '../types/timu';

interface PaymentProvidersSummary {
  isSandbox: boolean;
  internationalProvider: string;
  regionalProvider: string;
}

interface WorkspaceContextValue {
  firebaseUser: User | null;
  accountEmail: string | null;
  authReady: boolean;
  isDemoWorkspace: boolean;
  demoBannerDismissed: boolean;
  dismissDemoBanner: () => void;
  loading: boolean;
  error: string | null;
  retryLoad: () => Promise<void>;

  locale: LocaleCode;
  setLocale: (loc: LocaleCode) => void;
  dict: Dictionary;
  currency: CurrencyCode;
  setCurrency: (cur: CurrencyCode) => void;
  distanceUnit: DistanceUnit;
  setDistanceUnit: (u: DistanceUnit) => void;
  theme: ThemeMode;
  toggleTheme: () => void;

  profile: UserProfile | null;
  talentProfile: TalentPublicProfile | null;
  employerProfile: EmployerProfile | null;
  blindTalents: BlindTalentCardData[];
  opportunities: Opportunity[];
  applications: Application[];
  tokenLedger: TokenLedgerEntry[];
  subscriptions: SubscriptionRecord[];
  contracts: EscrowContract[];
  certificates: VerifiableCertificate[];
  skillBadges: SkillBadge[];
  conversations: Conversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  walletTransactions: WalletTransaction[];
  paymentProviders: PaymentProvidersSummary;

  activeMode: WorkspaceMode;
  switchMode: (mode: WorkspaceMode) => Promise<void>;
  signInWithAccount: (payload: {
    fullName?: string;
    email: string;
    role?: WorkspaceMode;
  }) => Promise<boolean>;
  enterDemoWorkspace: (mode: WorkspaceMode) => void;
  logout: () => Promise<void>;

  completeFirstQuest: (draft: FirstQuestDraft) => Promise<{ ok: boolean; error?: string }>;
  saveTalentProfile: (payload: {
    fullName: string;
    educationDetail: string;
    experienceSummary: string;
    bootcampHistory: string;
    portfolioUrl: string;
    linkedinUrl: string;
    city: string;
    timezone: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  saveEmployerProfile: (payload: {
    businessName: string;
    industry: string;
    city: string;
    timezone: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  unlockTalent: (talentId: string) => Promise<{ ok: boolean; card?: BlindTalentCardData; conversationId?: string; error?: string }>;
  publishOpportunity: (payload: {
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
  }) => Promise<{ ok: boolean; opportunity?: Opportunity; error?: string }>;
  applyToOpportunity: (opportunityId: string, pitch: string, portfolioLink: string) => Promise<{ ok: boolean; error?: string }>;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => Promise<{ ok: boolean; error?: string }>;
  fundContract: (payload: {
    conversationId?: string;
    opportunityId?: string;
    talentId: string;
    title: string;
    scopeSummary: string;
    grossAmountMinor: number;
    currency: CurrencyCode;
  }) => Promise<{ ok: boolean; contract?: EscrowContract; error?: string }>;
  submitDeliverable: (contractId: string, deliverableUrl: string, deliverableNote: string) => Promise<{ ok: boolean; error?: string }>;
  releaseContract: (contractId: string) => Promise<{ ok: boolean; certificate?: VerifiableCertificate; error?: string }>;
  withdrawWallet: (amountMinor: number, currency: CurrencyCode, payoutDestination: string) => Promise<{ ok: boolean; error?: string }>;
  buyTokenPack: (packId: 'pack_1' | 'pack_5' | 'pack_15', currency: CurrencyCode) => Promise<{ ok: boolean; error?: string }>;
  activateSubscription: (planType: PlanType, currency: CurrencyCode, targetRole: WorkspaceMode) => Promise<{ ok: boolean; error?: string }>;
  sendMessage: (
    conversationId: string,
    body: string,
    options?: { attachmentUrl?: string; shareContactOptIn?: boolean; contactChannel?: 'whatsapp' | 'phone' }
  ) => Promise<{ ok: boolean; error?: string }>;
  joinConversationSocket: (conversationId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem('timu_session_id');
    if (existing) return existing;
    const generated = `sess_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('timu_session_id', generated);
    return generated;
  } catch {
    return 'demo_default';
  }
}

async function fetchJsonSafe(input: RequestInfo | URL, init?: RequestInit): Promise<{ ok: boolean; status: number; isJson: boolean; data: any }> {
  try {
    const res = await fetch(input, init);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const rawText = await res.text();
    const trimmed = rawText.trim();
    if (!contentType.includes('application/json') || !trimmed || trimmed.startsWith('<')) {
      return { ok: false, status: res.status, isJson: false, data: null };
    }
    const data = JSON.parse(trimmed);
    return { ok: res.ok, status: res.status, isJson: true, data };
  } catch {
    return { ok: false, status: 0, isJson: false, data: null };
  }
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem('timu_account_v1');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { email?: string };
      return typeof parsed.email === 'string' && parsed.email.includes('@') ? parsed.email : null;
    } catch {
      return null;
    }
  });
  const [authReady, setAuthReady] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const [remoteBackendAvailable, setRemoteBackendAvailable] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [locale, setLocaleState] = useState<LocaleCode>(() => {
    try {
      return localStorage.getItem('timu_locale') === 'en' ? 'en' : 'id';
    } catch {
      return 'id';
    }
  });
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem('timu_currency') as CurrencyCode | null;
      return saved && ['USD', 'IDR', 'EUR', 'GBP', 'SGD'].includes(saved) ? saved : 'IDR';
    } catch {
      return 'IDR';
    }
  });
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      return localStorage.getItem('timu_theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [talentProfile, setTalentProfile] = useState<TalentPublicProfile | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [blindTalents, setBlindTalents] = useState<BlindTalentCardData[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tokenLedger, setTokenLedger] = useState<TokenLedgerEntry[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [contracts, setContracts] = useState<EscrowContract[]>([]);
  const [certificates, setCertificates] = useState<VerifiableCertificate[]>([]);
  const [skillBadges, setSkillBadges] = useState<SkillBadge[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvidersSummary>({
    isSandbox: true,
    internationalProvider: 'Sandbox Payment Simulator',
    regionalProvider: 'Sandbox Payment Simulator',
  });

  const wsRef = useRef<WebSocket | null>(null);
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  const backendModeRef = useRef<'remote' | 'local'>('remote');

  const activeSessionKey = firebaseUser?.uid || sessionId;

  const apiHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-timu-session': activeSessionKey,
    }),
    [activeSessionKey]
  );

  // Sync theme to documentElement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('timu_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setLocale = useCallback((loc: LocaleCode) => {
    setLocaleState(loc);
    try {
      localStorage.setItem('timu_locale', loc);
    } catch {
      // ignore
    }
  }, []);

  const setCurrency = useCallback((cur: CurrencyCode) => {
    setCurrencyState(cur);
    try {
      localStorage.setItem('timu_currency', cur);
    } catch {
      // ignore
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (user) {
        setSessionId(user.uid);
        if (user.email && user.emailVerified) {
          try {
            await setDoc(
              doc(db, 'users', user.uid, 'private', 'info'),
              {
                userId: user.uid,
                email: user.email,
                activeMode: 'talent',
                preferredCurrency: currency,
                preferredLocale: locale,
                themePreference: theme,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          } catch (err) {
            try {
              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/private/info`);
            } catch {
              // handled gracefully
            }
          }
        }
      }
    });
    return () => unsub();
  }, [currency, locale, theme]);

  const applyWorkspacePayload = useCallback((data: any) => {
    setProfile(data.profile);
    setTalentProfile(data.talentProfile);
    setEmployerProfile(data.employerProfile);
    setBlindTalents(data.blindTalents || []);
    setOpportunities(data.opportunities || []);
    setApplications(data.applications || []);
    setTokenLedger(data.tokenLedger || []);
    setSubscriptions(data.subscriptions || []);
    setContracts(data.contracts || []);
    setCertificates(data.certificates || []);
    setSkillBadges(data.skillBadges || []);
    setConversations(data.conversations || []);
    setMessagesByConversation(data.messagesByConversation || {});
    setWalletTransactions(data.walletTransactions || []);
    if (data.paymentProviders) setPaymentProviders(data.paymentProviders);
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJsonSafe('/api/workspace', { headers: apiHeaders() });
      if (result.ok && result.isJson && result.data?.profile) {
        backendModeRef.current = 'remote';
        setRemoteBackendAvailable(true);
        applyWorkspacePayload(result.data);
      } else {
        // Static deployment (e.g. Vercel) or offline PWA: activate resilient local engine seamlessly
        backendModeRef.current = 'local';
        setRemoteBackendAvailable(false);
        const localData = localWorkspaceEngine.getWorkspaceSnapshot(activeSessionKey);
        applyWorkspacePayload(localData);
      }
    } catch {
      backendModeRef.current = 'local';
      setRemoteBackendAvailable(false);
      const localData = localWorkspaceEngine.getWorkspaceSnapshot(activeSessionKey);
      applyWorkspacePayload(localData);
    } finally {
      setLoading(false);
    }
  }, [activeSessionKey, apiHeaders, applyWorkspacePayload]);

  useEffect(() => {
    if (authReady) {
      void loadWorkspace();
    }
  }, [authReady, loadWorkspace]);

  // Real-time WebSocket connection ONLY when the live Express server is reachable
  useEffect(() => {
    if (typeof window === 'undefined' || !remoteBackendAvailable) return;
    let active = true;
    let reconnectTimer: number | undefined;

    const connect = () => {
      if (!active) return;
      try {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${proto}//${window.location.host}/ws`);
        wsRef.current = socket;

        socket.onopen = () => {
          for (const roomId of joinedRoomsRef.current) {
            socket.send(JSON.stringify({ type: 'room:join', conversationId: roomId }));
          }
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as {
              type?: string;
              message?: ChatMessage;
              contract?: EscrowContract;
              certificate?: VerifiableCertificate;
            };
            if (payload.type === 'message:created' && payload.message) {
              const msg = payload.message;
              setMessagesByConversation((prev) => {
                const list = prev[msg.conversationId] || [];
                if (list.some((m) => m.id === msg.id)) return prev;
                return { ...prev, [msg.conversationId]: [...list, msg] };
              });
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === msg.conversationId
                    ? { ...c, lastMessagePreview: msg.body.slice(0, 120), lastMessageAt: msg.createdAt }
                    : c
                )
              );
            }
            if (payload.contract) {
              const updatedContract = payload.contract;
              setContracts((prev) => {
                const exists = prev.some((c) => c.id === updatedContract.id);
                return exists
                  ? prev.map((c) => (c.id === updatedContract.id ? updatedContract : c))
                  : [updatedContract, ...prev];
              });
            }
            if (payload.certificate) {
              const cert = payload.certificate;
              setCertificates((prev) => (prev.some((c) => c.id === cert.id) ? prev : [cert, ...prev]));
            }
          } catch {
            // ignore invalid frames
          }
        };

        socket.onerror = () => {
          // Silently handled by onclose reconnect or static fallback
        };

        socket.onclose = () => {
          if (active && backendModeRef.current === 'remote') {
            reconnectTimer = window.setTimeout(connect, 4000);
          }
        };
      } catch {
        // Ignore websocket construction issues
      }
    };

    connect();
    return () => {
      active = false;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [remoteBackendAvailable]);

  const joinConversationSocket = useCallback((conversationId: string) => {
    joinedRoomsRef.current.add(conversationId);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'room:join', conversationId }));
    }
  }, []);

  const switchMode = useCallback(
    async (mode: WorkspaceMode) => {
      setProfile((prev) => (prev ? { ...prev, activeMode: mode } : prev));
      if (backendModeRef.current === 'local') {
        const res = localWorkspaceEngine.updateActiveMode(activeSessionKey, mode);
        setProfile(res.profile);
        return;
      }
      try {
        const res = await fetchJsonSafe('/api/workspace/preferences', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ activeMode: mode }),
        });
        if (res.ok && res.data?.profile) {
          setProfile(res.data.profile);
        }
      } catch {
        // local state already updated
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const signInWithAccount = useCallback(
    async (payload: { fullName?: string; email: string; role?: WorkspaceMode }) => {
      const normalizedEmail = payload.email.trim().toLowerCase();
      if (!normalizedEmail.includes('@')) return false;
      const initialMode: WorkspaceMode = payload.role || 'talent';
      const fallbackName = normalizedEmail
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
      const resolvedName = (payload.fullName || '').trim() || fallbackName || 'TIMU Member';

      try {
        localStorage.setItem(
          'timu_account_v1',
          JSON.stringify({ email: normalizedEmail, fullName: resolvedName })
        );
      } catch {
        // ignore storage errors
      }
      setAccountEmail(normalizedEmail);
      setProfile((prev) =>
        prev
          ? { ...prev, fullName: resolvedName, email: normalizedEmail, activeMode: initialMode }
          : prev
      );

      if (backendModeRef.current === 'local') {
        localWorkspaceEngine.updateActiveMode(activeSessionKey, initialMode);
        if (profile && talentProfile) {
          const updated = localWorkspaceEngine.saveTalentProfile(activeSessionKey, {
            fullName: resolvedName,
            educationDetail: talentProfile.educationDetail,
            experienceSummary: talentProfile.experienceSummary,
            bootcampHistory: talentProfile.bootcampHistory,
            portfolioUrl: talentProfile.portfolioUrl,
            linkedinUrl: talentProfile.linkedinUrl,
            city: profile.city,
            timezone: profile.timezone,
          });
          setProfile({ ...updated.profile, email: normalizedEmail, activeMode: initialMode });
          setTalentProfile(updated.talentProfile);
        }
        return true;
      }

      try {
        const res = await fetchJsonSafe('/api/workspace/preferences', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ activeMode: initialMode }),
        });
        if (res.ok && res.isJson && res.data?.profile) {
          setProfile({ ...res.data.profile, fullName: resolvedName, email: normalizedEmail });
        }
      } catch {
        localWorkspaceEngine.updateActiveMode(activeSessionKey, initialMode);
      }
      return true;
    },
    [activeSessionKey, apiHeaders, profile, talentProfile]
  );

  const enterDemoWorkspace = useCallback(
    (mode: WorkspaceMode) => {
      void switchMode(mode);
    },
    [switchMode]
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore if not signed into firebase
    }
    try {
      localStorage.removeItem('timu_account_v1');
    } catch {
      // ignore storage errors
    }
    setFirebaseUser(null);
    setAccountEmail(null);
  }, []);

  const completeFirstQuest = useCallback(
    async (draft: FirstQuestDraft) => {
      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.completeFirstQuest(activeSessionKey, draft);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setProfile(localRes.profile);
        setTalentProfile(localRes.talentProfile);
        return { ok: true };
      }
      try {
        const res = await fetchJsonSafe('/api/talent/first-quest', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify(draft),
        });
        if (!res.isJson) {
          backendModeRef.current = 'local';
          const localRes = localWorkspaceEngine.completeFirstQuest(activeSessionKey, draft);
          if (!localRes.ok) return { ok: false, error: localRes.error };
          setProfile(localRes.profile);
          setTalentProfile(localRes.talentProfile);
          return { ok: true };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Could not save First Quest.' };
        setProfile(res.data.profile);
        setTalentProfile(res.data.talentProfile);
        return { ok: true };
      } catch {
        const localRes = localWorkspaceEngine.completeFirstQuest(activeSessionKey, draft);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setProfile(localRes.profile);
        setTalentProfile(localRes.talentProfile);
        return { ok: true };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const saveTalentProfile = useCallback(
    async (payload: {
      fullName: string;
      educationDetail: string;
      experienceSummary: string;
      bootcampHistory: string;
      portfolioUrl: string;
      linkedinUrl: string;
      city: string;
      timezone: string;
    }) => {
      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.saveTalentProfile(activeSessionKey, payload);
        setProfile(localRes.profile);
        setTalentProfile(localRes.talentProfile);
        return { ok: true };
      }
      try {
        const res = await fetchJsonSafe('/api/talent/profile', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.saveTalentProfile(activeSessionKey, payload);
          setProfile(localRes.profile);
          setTalentProfile(localRes.talentProfile);
          return { ok: true };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Failed to save profile.' };
        setProfile(res.data.profile);
        setTalentProfile(res.data.talentProfile);
        return { ok: true };
      } catch {
        const localRes = localWorkspaceEngine.saveTalentProfile(activeSessionKey, payload);
        setProfile(localRes.profile);
        setTalentProfile(localRes.talentProfile);
        return { ok: true };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const saveEmployerProfile = useCallback(
    async (payload: { businessName: string; industry: string; city: string; timezone: string }) => {
      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.saveEmployerProfile(activeSessionKey, payload);
        setEmployerProfile(localRes.employerProfile);
        return { ok: true };
      }
      try {
        const res = await fetchJsonSafe('/api/employer/profile', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.saveEmployerProfile(activeSessionKey, payload);
          setEmployerProfile(localRes.employerProfile);
          return { ok: true };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Failed to save business profile.' };
        setEmployerProfile(res.data.employerProfile);
        return { ok: true };
      } catch {
        const localRes = localWorkspaceEngine.saveEmployerProfile(activeSessionKey, payload);
        setEmployerProfile(localRes.employerProfile);
        return { ok: true };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const applyUnlockResult = useCallback((talentId: string, data: any) => {
    setEmployerProfile(data.employerProfile);
    setTokenLedger(data.tokenLedger);
    setBlindTalents((prev) => prev.map((item) => (item.talent.userId === talentId ? data.card : item)));
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === data.conversation.id);
      return exists ? prev : [data.conversation, ...prev];
    });
    setMessagesByConversation((prev) => ({
      ...prev,
      [data.conversation.id]: data.messages,
    }));
  }, []);

  const unlockTalent = useCallback(
    async (talentId: string) => {
      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.unlockTalent(activeSessionKey, talentId);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        applyUnlockResult(talentId, localRes);
        return { ok: true, card: localRes.card, conversationId: localRes.conversation.id };
      }
      try {
        const res = await fetchJsonSafe('/api/employer/unlock-talent', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ talentId }),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.unlockTalent(activeSessionKey, talentId);
          if (!localRes.ok) return { ok: false, error: localRes.error };
          applyUnlockResult(talentId, localRes);
          return { ok: true, card: localRes.card, conversationId: localRes.conversation.id };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Unable to unlock talent.' };
        applyUnlockResult(talentId, res.data);
        return { ok: true, card: res.data.card, conversationId: res.data.conversation.id };
      } catch {
        const localRes = localWorkspaceEngine.unlockTalent(activeSessionKey, talentId);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        applyUnlockResult(talentId, localRes);
        return { ok: true, card: localRes.card, conversationId: localRes.conversation.id };
      }
    },
    [activeSessionKey, apiHeaders, applyUnlockResult]
  );

  const publishOpportunity = useCallback(
    async (payload: {
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
    }) => {
      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.publishOpportunity(activeSessionKey, payload);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setOpportunities((prev) => [localRes.opportunity, ...prev]);
        setEmployerProfile(localRes.employerProfile);
        setTokenLedger(localRes.tokenLedger);
        return { ok: true, opportunity: localRes.opportunity };
      }
      try {
        const res = await fetchJsonSafe('/api/employer/opportunities', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.publishOpportunity(activeSessionKey, payload);
          if (!localRes.ok) return { ok: false, error: localRes.error };
          setOpportunities((prev) => [localRes.opportunity, ...prev]);
          setEmployerProfile(localRes.employerProfile);
          setTokenLedger(localRes.tokenLedger);
          return { ok: true, opportunity: localRes.opportunity };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Failed to publish project.' };
        setOpportunities((prev) => [res.data.opportunity, ...prev]);
        setEmployerProfile(res.data.employerProfile);
        setTokenLedger(res.data.tokenLedger);
        return { ok: true, opportunity: res.data.opportunity };
      } catch {
        const localRes = localWorkspaceEngine.publishOpportunity(activeSessionKey, payload);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setOpportunities((prev) => [localRes.opportunity, ...prev]);
        setEmployerProfile(localRes.employerProfile);
        setTokenLedger(localRes.tokenLedger);
        return { ok: true, opportunity: localRes.opportunity };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const applyToOpportunity = useCallback(
    async (opportunityId: string, pitch: string, portfolioLink: string) => {
      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.applyToOpportunity(activeSessionKey, opportunityId, pitch, portfolioLink);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setApplications((prev) => [localRes.application, ...prev]);
        return { ok: true };
      }
      try {
        const res = await fetchJsonSafe(`/api/opportunities/${opportunityId}/apply`, {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ pitch, portfolioLink }),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.applyToOpportunity(activeSessionKey, opportunityId, pitch, portfolioLink);
          if (!localRes.ok) return { ok: false, error: localRes.error };
          setApplications((prev) => [localRes.application, ...prev]);
          return { ok: true };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Could not submit application.' };
        setApplications((prev) => [res.data.application, ...prev]);
        return { ok: true };
      } catch {
        const localRes = localWorkspaceEngine.applyToOpportunity(activeSessionKey, opportunityId, pitch, portfolioLink);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setApplications((prev) => [localRes.application, ...prev]);
        return { ok: true };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const updateApplicationStatus = useCallback(
    async (applicationId: string, status: ApplicationStatus) => {
      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.updateApplicationStatus(activeSessionKey, applicationId, status);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setApplications((prev) => prev.map((a) => (a.id === applicationId ? localRes.application : a)));
        return { ok: true };
      }
      try {
        const res = await fetchJsonSafe(`/api/applications/${applicationId}/status`, {
          method: 'PATCH',
          headers: apiHeaders(),
          body: JSON.stringify({ status }),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.updateApplicationStatus(activeSessionKey, applicationId, status);
          if (!localRes.ok) return { ok: false, error: localRes.error };
          setApplications((prev) => prev.map((a) => (a.id === applicationId ? localRes.application : a)));
          return { ok: true };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Could not update application.' };
        setApplications((prev) => prev.map((a) => (a.id === applicationId ? res.data.application : a)));
        return { ok: true };
      } catch {
        const localRes = localWorkspaceEngine.updateApplicationStatus(activeSessionKey, applicationId, status);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setApplications((prev) => prev.map((a) => (a.id === applicationId ? localRes.application : a)));
        return { ok: true };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const fundContract = useCallback(
    async (payload: {
      conversationId?: string;
      opportunityId?: string;
      talentId: string;
      title: string;
      scopeSummary: string;
      grossAmountMinor: number;
      currency: CurrencyCode;
    }) => {
      const applyFunded = (contract: EscrowContract) => {
        setContracts((prev) => [contract, ...prev]);
        if (payload.conversationId) {
          setConversations((prev) =>
            prev.map((c) => (c.id === payload.conversationId ? { ...c, contractId: contract.id } : c))
          );
        }
      };

      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.fundContract(activeSessionKey, payload);
        applyFunded(localRes.contract);
        return { ok: true, contract: localRes.contract };
      }
      try {
        const res = await fetchJsonSafe('/api/contracts/fund', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.fundContract(activeSessionKey, payload);
          applyFunded(localRes.contract);
          return { ok: true, contract: localRes.contract };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Could not fund Escrow contract.' };
        applyFunded(res.data.contract);
        return { ok: true, contract: res.data.contract };
      } catch {
        const localRes = localWorkspaceEngine.fundContract(activeSessionKey, payload);
        applyFunded(localRes.contract);
        return { ok: true, contract: localRes.contract };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const submitDeliverable = useCallback(
    async (contractId: string, deliverableUrl: string, deliverableNote: string) => {
      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.submitDeliverable(activeSessionKey, contractId, deliverableUrl, deliverableNote);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setContracts((prev) => prev.map((c) => (c.id === contractId ? localRes.contract : c)));
        return { ok: true };
      }
      try {
        const res = await fetchJsonSafe(`/api/contracts/${contractId}/deliverable`, {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ deliverableUrl, deliverableNote }),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.submitDeliverable(activeSessionKey, contractId, deliverableUrl, deliverableNote);
          if (!localRes.ok) return { ok: false, error: localRes.error };
          setContracts((prev) => prev.map((c) => (c.id === contractId ? localRes.contract : c)));
          return { ok: true };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Could not submit deliverable.' };
        setContracts((prev) => prev.map((c) => (c.id === contractId ? res.data.contract : c)));
        return { ok: true };
      } catch {
        const localRes = localWorkspaceEngine.submitDeliverable(activeSessionKey, contractId, deliverableUrl, deliverableNote);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setContracts((prev) => prev.map((c) => (c.id === contractId ? localRes.contract : c)));
        return { ok: true };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const releaseContract = useCallback(
    async (contractId: string) => {
      const applyRelease = (data: any) => {
        setContracts((prev) => prev.map((c) => (c.id === contractId ? data.contract : c)));
        if (data.certificate) {
          setCertificates((prev) =>
            prev.some((c) => c.id === data.certificate.id) ? prev : [data.certificate, ...prev]
          );
        }
        if (data.badge) {
          setSkillBadges((prev) => [data.badge, ...prev]);
        }
        if (data.talentProfile) setTalentProfile(data.talentProfile);
        if (data.walletTransactions) setWalletTransactions(data.walletTransactions);
      };

      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.releaseContract(activeSessionKey, contractId);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        applyRelease(localRes);
        return { ok: true, certificate: localRes.certificate };
      }
      try {
        const res = await fetchJsonSafe(`/api/contracts/${contractId}/release`, {
          method: 'POST',
          headers: apiHeaders(),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.releaseContract(activeSessionKey, contractId);
          if (!localRes.ok) return { ok: false, error: localRes.error };
          applyRelease(localRes);
          return { ok: true, certificate: localRes.certificate };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Could not release Escrow funds.' };
        applyRelease(res.data);
        return { ok: true, certificate: res.data.certificate };
      } catch {
        const localRes = localWorkspaceEngine.releaseContract(activeSessionKey, contractId);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        applyRelease(localRes);
        return { ok: true, certificate: localRes.certificate };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const withdrawWallet = useCallback(
    async (amountMinor: number, currencyCode: CurrencyCode, payoutDestination: string) => {
      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.withdrawWallet(activeSessionKey, amountMinor, currencyCode, payoutDestination);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setWalletTransactions(localRes.walletTransactions);
        return { ok: true };
      }
      try {
        const res = await fetchJsonSafe('/api/wallet/withdraw', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ amountMinor, currency: currencyCode, payoutDestination }),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.withdrawWallet(activeSessionKey, amountMinor, currencyCode, payoutDestination);
          if (!localRes.ok) return { ok: false, error: localRes.error };
          setWalletTransactions(localRes.walletTransactions);
          return { ok: true };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Withdrawal failed.' };
        setWalletTransactions(res.data.walletTransactions);
        return { ok: true };
      } catch {
        const localRes = localWorkspaceEngine.withdrawWallet(activeSessionKey, amountMinor, currencyCode, payoutDestination);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setWalletTransactions(localRes.walletTransactions);
        return { ok: true };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const buyTokenPack = useCallback(
    async (packId: 'pack_1' | 'pack_5' | 'pack_15', currencyCode: CurrencyCode) => {
      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.buyTokenPack(activeSessionKey, packId, currencyCode);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setEmployerProfile(localRes.employerProfile);
        setTokenLedger(localRes.tokenLedger);
        return { ok: true };
      }
      try {
        const res = await fetchJsonSafe('/api/billing/tokens', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ packId, currency: currencyCode }),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.buyTokenPack(activeSessionKey, packId, currencyCode);
          if (!localRes.ok) return { ok: false, error: localRes.error };
          setEmployerProfile(localRes.employerProfile);
          setTokenLedger(localRes.tokenLedger);
          return { ok: true };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Token checkout failed.' };
        setEmployerProfile(res.data.employerProfile);
        setTokenLedger(res.data.tokenLedger);
        return { ok: true };
      } catch {
        const localRes = localWorkspaceEngine.buyTokenPack(activeSessionKey, packId, currencyCode);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        setEmployerProfile(localRes.employerProfile);
        setTokenLedger(localRes.tokenLedger);
        return { ok: true };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const activateSubscription = useCallback(
    async (planType: PlanType, currencyCode: CurrencyCode, targetRole: WorkspaceMode) => {
      const applySub = (data: any) => {
        setSubscriptions((prev) => [data.subscription, ...prev]);
        setTalentProfile(data.talentProfile);
        setEmployerProfile(data.employerProfile);
        if (data.tokenLedger) setTokenLedger(data.tokenLedger);
      };
      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.activateSubscription(activeSessionKey, planType, currencyCode, targetRole);
        applySub(localRes);
        return { ok: true };
      }
      try {
        const res = await fetchJsonSafe('/api/billing/subscription', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ planType, currency: currencyCode, targetRole }),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.activateSubscription(activeSessionKey, planType, currencyCode, targetRole);
          applySub(localRes);
          return { ok: true };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Subscription activation failed.' };
        applySub(res.data);
        return { ok: true };
      } catch {
        const localRes = localWorkspaceEngine.activateSubscription(activeSessionKey, planType, currencyCode, targetRole);
        applySub(localRes);
        return { ok: true };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const sendMessage = useCallback(
    async (
      conversationId: string,
      body: string,
      options?: { attachmentUrl?: string; shareContactOptIn?: boolean; contactChannel?: 'whatsapp' | 'phone' }
    ) => {
      const applyMsg = (message: ChatMessage, conversation: Conversation) => {
        setMessagesByConversation((prev) => {
          const list = prev[conversationId] || [];
          if (list.some((m) => m.id === message.id)) return prev;
          return { ...prev, [conversationId]: [...list, message] };
        });
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? conversation : c)));
      };

      if (backendModeRef.current === 'local') {
        const localRes = localWorkspaceEngine.sendMessage(activeSessionKey, conversationId, body, options);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        applyMsg(localRes.message, localRes.conversation);
        return { ok: true };
      }
      try {
        const res = await fetchJsonSafe(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ body, ...options }),
        });
        if (!res.isJson) {
          const localRes = localWorkspaceEngine.sendMessage(activeSessionKey, conversationId, body, options);
          if (!localRes.ok) return { ok: false, error: localRes.error };
          applyMsg(localRes.message, localRes.conversation);
          return { ok: true };
        }
        if (!res.ok) return { ok: false, error: res.data?.error || 'Message failed to send.' };
        applyMsg(res.data.message, res.data.conversation);
        return { ok: true };
      } catch {
        const localRes = localWorkspaceEngine.sendMessage(activeSessionKey, conversationId, body, options);
        if (!localRes.ok) return { ok: false, error: localRes.error };
        applyMsg(localRes.message, localRes.conversation);
        return { ok: true };
      }
    },
    [activeSessionKey, apiHeaders]
  );

  const dict = useMemo(() => getDictionary(locale), [locale]);
  const activeMode: WorkspaceMode = profile?.activeMode ?? 'talent';

  const value: WorkspaceContextValue = {
    firebaseUser,
    accountEmail,
    authReady,
    isDemoWorkspace: !firebaseUser && !accountEmail,
    demoBannerDismissed,
    dismissDemoBanner: () => setDemoBannerDismissed(true),
    loading,
    error,
    retryLoad: loadWorkspace,
    locale,
    setLocale,
    dict,
    currency,
    setCurrency,
    distanceUnit,
    setDistanceUnit,
    theme,
    toggleTheme,
    profile,
    talentProfile,
    employerProfile,
    blindTalents,
    opportunities,
    applications,
    tokenLedger,
    subscriptions,
    contracts,
    certificates,
    skillBadges,
    conversations,
    messagesByConversation,
    walletTransactions,
    paymentProviders,
    activeMode,
    switchMode,
    signInWithAccount,
    enterDemoWorkspace,
    logout,
    completeFirstQuest,
    saveTalentProfile,
    saveEmployerProfile,
    unlockTalent,
    publishOpportunity,
    applyToOpportunity,
    updateApplicationStatus,
    fundContract,
    submitDeliverable,
    releaseContract,
    withdrawWallet,
    buyTokenPack,
    activateSubscription,
    sendMessage,
    joinConversationSocket,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
