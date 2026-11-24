import type {
  BlindTalentCardData,
  CurrencyCode,
  DistanceUnit,
  FirstQuestDraft,
  LocaleCode,
  PlanType,
  TalentPublicProfile,
  TalentRevealedIdentity,
} from '../types/timu';

export const PLATFORM_ADMIN_FEE_RATE = 0.1;
export const STARTER_EMPLOYER_TOKENS = 3;
export const FIRST_QUEST_TOTAL_EXP = 100;
export const FIRST_QUEST_STEP_EXP = [17, 17, 17, 17, 16, 16] as const;
export const POST_PAYOUT_EXP_REWARD = 75;

export interface CurrencyConfig {
  code: CurrencyCode;
  minorUnits: number;
  localeDefault: string;
  symbol: string;
}

export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', minorUnits: 2, localeDefault: 'en-US', symbol: '$' },
  IDR: { code: 'IDR', minorUnits: 0, localeDefault: 'id-ID', symbol: 'Rp' },
  EUR: { code: 'EUR', minorUnits: 2, localeDefault: 'de-DE', symbol: '€' },
  GBP: { code: 'GBP', minorUnits: 2, localeDefault: 'en-GB', symbol: '£' },
  SGD: { code: 'SGD', minorUnits: 2, localeDefault: 'en-SG', symbol: 'S$' },
};

export interface TokenPack {
  id: 'pack_1' | 'pack_5' | 'pack_15';
  tokens: number;
  priceIdrMinor: number;
  priceUsdMinor: number;
  savingsLabel?: string;
}

export const TOKEN_PACKS: TokenPack[] = [
  { id: 'pack_1', tokens: 1, priceIdrMinor: 10000, priceUsdMinor: 100 },
  { id: 'pack_5', tokens: 5, priceIdrMinor: 50000, priceUsdMinor: 500 },
  { id: 'pack_15', tokens: 15, priceIdrMinor: 140000, priceUsdMinor: 1400, savingsLabel: 'Save 7%' },
];

export const SUBSCRIPTION_PRICING: Record<
  PlanType,
  { priceIdrMinor: number; priceUsdMinor: number; periodDays: number }
> = {
  talent_premium: { priceIdrMinor: 100000, priceUsdMinor: 699, periodDays: 30 },
  employer_premium: { priceIdrMinor: 100000, priceUsdMinor: 699, periodDays: 30 },
  verification_badge: { priceIdrMinor: 50000, priceUsdMinor: 349, periodDays: 30 },
};

// Approximate FX rates relative to USD for display of EUR/GBP/SGD pack prices (exact rates preserved for USD & IDR)
const USD_MINOR_MULTIPLIER: Record<CurrencyCode, number> = {
  USD: 1,
  IDR: 100, // unused when IDR exact price is passed
  EUR: 0.92,
  GBP: 0.79,
  SGD: 1.34,
};

export function getTokenPackPriceMinor(pack: TokenPack, currency: CurrencyCode): number {
  if (currency === 'IDR') return pack.priceIdrMinor;
  if (currency === 'USD') return pack.priceUsdMinor;
  return Math.round(pack.priceUsdMinor * USD_MINOR_MULTIPLIER[currency]);
}

export function getSubscriptionPriceMinor(plan: PlanType, currency: CurrencyCode): number {
  const cfg = SUBSCRIPTION_PRICING[plan];
  if (currency === 'IDR') return cfg.priceIdrMinor;
  if (currency === 'USD') return cfg.priceUsdMinor;
  return Math.round(cfg.priceUsdMinor * USD_MINOR_MULTIPLIER[currency]);
}

export interface EscrowBreakdown {
  grossAmountMinor: number;
  platformFeeMinor: number;
  netTalentMinor: number;
  feePercentage: number;
}

/**
 * Calculates exact integer minor-unit escrow breakdown:
 * 100% gross funded by Employer -> 10% Platform Admin Fee + 90% Net Talent Payout.
 */
export function calculateEscrowBreakdown(grossAmountMinor: number): EscrowBreakdown {
  if (!Number.isFinite(grossAmountMinor) || grossAmountMinor < 0) {
    throw new Error('Gross amount must be a non-negative integer minor unit.');
  }
  const safeGross = Math.round(grossAmountMinor);
  const platformFeeMinor = Math.round(safeGross * PLATFORM_ADMIN_FEE_RATE);
  const netTalentMinor = safeGross - platformFeeMinor;
  return {
    grossAmountMinor: safeGross,
    platformFeeMinor,
    netTalentMinor,
    feePercentage: 10,
  };
}

/**
 * Formats integer minor units using Intl.NumberFormat.
 */
export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode,
  locale: LocaleCode = 'en'
): string {
  const cfg = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.USD;
  const majorAmount = cfg.minorUnits === 0 ? amountMinor : amountMinor / Math.pow(10, cfg.minorUnits);
  const formatLocale = locale === 'id' ? 'id-ID' : currency === 'IDR' ? 'id-ID' : cfg.localeDefault;
  return new Intl.NumberFormat(formatLocale, {
    style: 'currency',
    currency: cfg.code,
    minimumFractionDigits: cfg.minorUnits,
    maximumFractionDigits: cfg.minorUnits,
  }).format(majorAmount);
}

/**
 * Parses a user-entered major currency string (e.g. "250000" for IDR or "45.50" for USD) into integer minor units.
 */
export function parseMajorToMinor(raw: string, currency: CurrencyCode): number {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  const minorUnits = CURRENCY_CONFIG[currency]?.minorUnits ?? 2;
  return Math.round(parsed * Math.pow(10, minorUnits));
}

export interface TierInfo {
  level: number;
  labelEn: string;
  labelId: string;
  minExp: number;
  nextTierExp: number | null;
}

export const TIER_THRESHOLDS: TierInfo[] = [
  { level: 0, labelEn: 'Starter Lv 0', labelId: 'Pemula Lv 0', minExp: 0, nextTierExp: 100 },
  { level: 1, labelEn: 'Rookie Lv 1', labelId: 'Rookie Lv 1', minExp: 100, nextTierExp: 250 },
  { level: 2, labelEn: 'Rising Lv 2', labelId: 'Rising Lv 2', minExp: 250, nextTierExp: 500 },
  { level: 3, labelEn: 'Proven Lv 3', labelId: 'Proven Lv 3', minExp: 500, nextTierExp: 900 },
  { level: 4, labelEn: 'Master Lv 4', labelId: 'Master Lv 4', minExp: 900, nextTierExp: null },
];

export function getTierFromExp(expPoints: number): TierInfo {
  const safeExp = Math.max(0, Math.floor(expPoints));
  let current = TIER_THRESHOLDS[0];
  for (const tier of TIER_THRESHOLDS) {
    if (safeExp >= tier.minExp) {
      current = tier;
    }
  }
  return current;
}

export function evaluateFirstQuestSteps(draft: FirstQuestDraft): boolean[] {
  const step1 =
    draft.fullName.trim().length >= 2 &&
    draft.phonePrivate.trim().length >= 6 &&
    draft.city.trim().length >= 2 &&
    draft.timezone.trim().length >= 3 &&
    draft.workModes.length > 0;

  const step2 = draft.category.trim().length >= 2 && draft.educationDetail.trim().length >= 3;

  const step3 = draft.hasNoFormalExperience || draft.experienceSummary.trim().length >= 10;

  const step4 = draft.interests.length >= 1;

  const step5 = draft.careerField.trim().length >= 2;

  const step6 = validateTopSkills(draft.topSkills).valid;

  return [step1, step2, step3, step4, step5, step6];
}

export function calculateFirstQuestExp(stepCompletion: boolean[]): number {
  let total = 0;
  for (let i = 0; i < FIRST_QUEST_STEP_EXP.length; i++) {
    if (stepCompletion[i]) {
      total += FIRST_QUEST_STEP_EXP[i];
    }
  }
  return total;
}

export function validateTopSkills(skills: string[]): { valid: boolean; count: number; error?: string } {
  const unique = Array.from(new Set(skills.map((s) => s.trim()).filter(Boolean)));
  if (unique.length !== 3) {
    return {
      valid: false,
      count: unique.length,
      error: `Select exactly 3 top skills (${unique.length}/3 selected).`,
    };
  }
  return { valid: true, count: 3 };
}

/**
 * Server-enforced Blind Discovery sanitizer.
 * Guarantees fullName, avatarUrl, and phonePrivate are NEVER present on locked cards.
 */
export function buildBlindTalentCard(params: {
  talent: TalentPublicProfile;
  identity: TalentRevealedIdentity & { phonePrivate?: string };
  isUnlocked: boolean;
  distanceKm?: number;
  timezoneOverlapHours?: number;
  conversationId?: string;
}): BlindTalentCardData {
  if (!params.isUnlocked) {
    return {
      talent: { ...params.talent },
      isUnlocked: false,
      distanceKm: params.distanceKm,
      timezoneOverlapHours: params.timezoneOverlapHours,
    };
  }

  return {
    talent: { ...params.talent },
    isUnlocked: true,
    revealedIdentity: {
      userId: params.identity.userId,
      fullName: params.identity.fullName,
      avatarUrl: params.identity.avatarUrl,
      headline: params.identity.headline,
    },
    distanceKm: params.distanceKm,
    timezoneOverlapHours: params.timezoneOverlapHours,
    conversationId: params.conversationId,
  };
}

export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function formatDistance(distanceKm: number, unit: DistanceUnit): string {
  if (unit === 'mi') {
    const miles = Math.round(distanceKm * 0.621371 * 10) / 10;
    return `${miles} mi`;
  }
  return `${distanceKm} km`;
}

export function parseUtcOffsetHours(tz: string): number {
  const match = tz.match(/UTC([+-]?\d+(?:\.\d+)?)/i);
  if (!match) return 0;
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Estimates overlapping standard 9:00-17:00 (8h) working hours between two UTC offsets.
 */
export function calculateTimezoneOverlapHours(tzA: string, tzB: string): number {
  const diff = Math.abs(parseUtcOffsetHours(tzA) - parseUtcOffsetHours(tzB));
  return Math.max(0, Math.min(8, Math.round((8 - diff) * 10) / 10));
}

export function generateVerificationCode(year: number, uniqueSeed: string): string {
  const cleaned = uniqueSeed.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const suffix = (cleaned + 'X9K2M7').slice(0, 6);
  return `TIMU-${year}-${suffix}`;
}

export function isSafeExternalUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function deductTokenAtomically(
  currentBalance: number,
  cost = 1
): { ok: true; nextBalance: number } | { ok: false; error: string } {
  if (currentBalance < cost) {
    return { ok: false, error: 'Insufficient Tokens. Purchase a Token Pack to continue.' };
  }
  return { ok: true, nextBalance: currentBalance - cost };
}
