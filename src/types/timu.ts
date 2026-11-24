export type WorkspaceMode = 'talent' | 'employer';
export type LocaleCode = 'en' | 'id';
export type CurrencyCode = 'USD' | 'IDR' | 'EUR' | 'GBP' | 'SGD';
export type ThemeMode = 'light' | 'dark';
export type DistanceUnit = 'km' | 'mi';

export type OpportunityType = 'escrow_gig' | 'part_time' | 'full_time';
export type WorkMode = 'remote' | 'onsite' | 'hybrid';
export type ApplicationStatus = 'applied' | 'shortlisted' | 'hired' | 'closed';
export type EscrowStatus = 'pending_funding' | 'funded' | 'deliverable_submitted' | 'released' | 'disputed';
export type PlanType = 'talent_premium' | 'employer_premium' | 'verification_badge';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  activeMode: WorkspaceMode;
  hasTalentProfile: boolean;
  hasEmployerProfile: boolean;
  countryCode: string;
  city: string;
  lat: number;
  lng: number;
  timezone: string;
  preferredCurrency: CurrencyCode;
  preferredLocale: LocaleCode;
  themePreference: ThemeMode;
  createdAt: string;
}

export interface TalentPublicProfile {
  userId: string;
  candidateCode: string;
  category: string;
  educationDetail: string;
  experienceSummary: string;
  hasNoFormalExperience: boolean;
  careerField: string;
  interests: string[];
  topSkills: string[];
  workModes: WorkMode[];
  bootcampHistory: string;
  portfolioUrl: string;
  linkedinUrl: string;
  city: string;
  countryCode: string;
  lat: number;
  lng: number;
  timezone: string;
  expPoints: number;
  tierLevel: number;
  firstQuestCompleted: boolean;
  isVerified: boolean;
  isPremium: boolean;
  completedGigsCount: number;
  avatarPalette: string;
}

export interface TalentRevealedIdentity {
  userId: string;
  fullName: string;
  avatarUrl: string;
  headline: string;
}

export interface BlindTalentCardData {
  talent: TalentPublicProfile;
  isUnlocked: boolean;
  revealedIdentity?: TalentRevealedIdentity;
  distanceKm?: number;
  timezoneOverlapHours?: number;
  conversationId?: string;
}

export interface EmployerProfile {
  userId: string;
  businessName: string;
  industry: string;
  city: string;
  countryCode: string;
  timezone: string;
  tokenBalance: number;
  isVerified: boolean;
  isPremium: boolean;
  premiumExpiresAt?: string;
}

export interface Opportunity {
  id: string;
  employerId: string;
  businessName: string;
  employerVerified: boolean;
  opportunityType: OpportunityType;
  title: string;
  description: string;
  deliverableScope: string;
  careerField: string;
  workMode: WorkMode;
  city: string;
  lat: number;
  lng: number;
  timezone: string;
  budgetMinor: number;
  currency: CurrencyCode;
  deadline: string;
  isPriority: boolean;
  status: 'open' | 'closed' | 'filled';
  createdAt: string;
}

export interface Application {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  employerId: string;
  businessName: string;
  talentId: string;
  candidateCode: string;
  talentSkills: string[];
  talentTierLevel: number;
  talentVerified: boolean;
  pitch: string;
  portfolioLink: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface TokenLedgerEntry {
  id: string;
  employerId: string;
  delta: number;
  reason: string;
  referenceId: string;
  createdAt: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planType: PlanType;
  status: 'active' | 'cancelled';
  amountMinor: number;
  currency: CurrencyCode;
  currentPeriodEnd: string;
  providerSubscriptionId: string;
}

export interface EscrowContract {
  id: string;
  opportunityId: string;
  employerId: string;
  businessName: string;
  talentId: string;
  talentName: string;
  title: string;
  scopeSummary: string;
  grossAmountMinor: number;
  platformFeeMinor: number;
  netTalentMinor: number;
  currency: CurrencyCode;
  escrowProvider: 'sandbox_simulator' | 'stripe_connect_express' | 'regional_psp';
  escrowStatus: EscrowStatus;
  providerPaymentIntentId: string;
  deliverableUrl: string;
  deliverableNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerifiableCertificate {
  id: string;
  verificationCode: string;
  contractId: string;
  talentId: string;
  talentName: string;
  employerId: string;
  businessName: string;
  projectTitle: string;
  skillsValidated: string[];
  issuedAt: string;
}

export interface SkillBadge {
  id: string;
  talentId: string;
  badgeName: string;
  careerField: string;
  earnedFromContractId: string;
  awardedAt: string;
}

export interface Conversation {
  id: string;
  employerId: string;
  businessName: string;
  talentId: string;
  talentName: string;
  talentAvatarUrl: string;
  talentCandidateCode: string;
  contractId?: string;
  lastMessagePreview: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  attachmentUrl?: string;
  sharedContactPayload?: {
    phone: string;
    channel: 'whatsapp' | 'phone';
    consentedAt: string;
  };
  readAt?: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  talentId: string;
  contractId?: string;
  type: 'escrow_release' | 'platform_fee' | 'withdrawal';
  description: string;
  amountMinor: number;
  currency: CurrencyCode;
  status: 'pending' | 'available' | 'completed';
  payoutDestination?: string;
  createdAt: string;
}

export interface FirstQuestDraft {
  fullName: string;
  phonePrivate: string;
  city: string;
  countryCode: string;
  timezone: string;
  workModes: WorkMode[];
  category: string;
  educationDetail: string;
  hasNoFormalExperience: boolean;
  experienceSummary: string;
  bootcampHistory: string;
  interests: string[];
  careerField: string;
  topSkills: string[];
  portfolioUrl: string;
}
