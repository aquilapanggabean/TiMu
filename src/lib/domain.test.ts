import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBlindTalentCard,
  calculateDistanceKm,
  calculateEscrowBreakdown,
  calculateFirstQuestExp,
  calculateTimezoneOverlapHours,
  deductTokenAtomically,
  evaluateFirstQuestSteps,
  formatDistance,
  formatMoney,
  generateVerificationCode,
  getSubscriptionPriceMinor,
  getTierFromExp,
  getTokenPackPriceMinor,
  isSafeExternalUrl,
  parseMajorToMinor,
  TOKEN_PACKS,
  validateTopSkills,
} from './domain';
import type { FirstQuestDraft, TalentPublicProfile } from '../types/timu';

test('calculateEscrowBreakdown applies exact 10% platform admin fee and 90% talent payout', () => {
  const idr = calculateEscrowBreakdown(250000);
  assert.equal(idr.grossAmountMinor, 250000);
  assert.equal(idr.platformFeeMinor, 25000);
  assert.equal(idr.netTalentMinor, 225000);
  assert.equal(idr.platformFeeMinor + idr.netTalentMinor, idr.grossAmountMinor);

  const usd = calculateEscrowBreakdown(15000); // $150.00
  assert.equal(usd.platformFeeMinor, 1500); // $15.00
  assert.equal(usd.netTalentMinor, 13500); // $135.00

  const odd = calculateEscrowBreakdown(999);
  assert.equal(odd.platformFeeMinor + odd.netTalentMinor, 999);
});

test('formatMoney and parseMajorToMinor preserve ISO 4217 integer minor units', () => {
  assert.match(formatMoney(2500, 'USD', 'en'), /\$25\.00/);
  assert.match(formatMoney(250000, 'IDR', 'id'), /250\.000/);
  assert.equal(parseMajorToMinor('25.50', 'USD'), 2550);
  assert.equal(parseMajorToMinor('250000', 'IDR'), 250000);
});

test('Token packs and subscriptions match exact IDR and USD PRD rates', () => {
  const pack1 = TOKEN_PACKS[0];
  const pack5 = TOKEN_PACKS[1];
  const pack15 = TOKEN_PACKS[2];
  assert.equal(getTokenPackPriceMinor(pack1, 'IDR'), 10000);
  assert.equal(getTokenPackPriceMinor(pack1, 'USD'), 100);
  assert.equal(getTokenPackPriceMinor(pack5, 'IDR'), 50000);
  assert.equal(getTokenPackPriceMinor(pack5, 'USD'), 500);
  assert.equal(getTokenPackPriceMinor(pack15, 'IDR'), 140000);
  assert.equal(getTokenPackPriceMinor(pack15, 'USD'), 1400);

  assert.equal(getSubscriptionPriceMinor('employer_premium', 'IDR'), 100000);
  assert.equal(getSubscriptionPriceMinor('employer_premium', 'USD'), 699);
  assert.equal(getSubscriptionPriceMinor('verification_badge', 'IDR'), 50000);
  assert.equal(getSubscriptionPriceMinor('verification_badge', 'USD'), 349);
});

test('First Quest awards 100 EXP across 6 steps and promotes to Rookie Lv 1', () => {
  const fullDraft: FirstQuestDraft = {
    fullName: 'Nadia Putri',
    phonePrivate: '+628123456789',
    city: 'Bandung',
    countryCode: 'ID',
    timezone: 'UTC+7',
    workModes: ['remote', 'onsite'],
    category: 'University Student',
    educationDetail: 'Informatics Engineering, Year 3',
    hasNoFormalExperience: true,
    experienceSummary: '',
    bootcampHistory: 'UI/UX Design Cohort 2025',
    interests: ['Brand Design', 'SME Digitalization'],
    careerField: 'UI/UX & Product Design',
    topSkills: ['Figma Prototyping', 'Brand Identity', 'Social Media Content'],
    portfolioUrl: 'https://portfolio.example.com/nadia',
  };

  const steps = evaluateFirstQuestSteps(fullDraft);
  assert.deepEqual(steps, [true, true, true, true, true, true]);
  const exp = calculateFirstQuestExp(steps);
  assert.equal(exp, 100);
  assert.equal(getTierFromExp(exp).level, 1);
  assert.equal(getTierFromExp(exp).labelEn, 'Rookie Lv 1');

  // Verify exact 3/3 skill enforcement
  assert.equal(validateTopSkills(['Figma', 'Copywriting']).valid, false);
  assert.equal(validateTopSkills(['Figma', 'Copywriting', 'React', 'SQL']).valid, false);
  assert.equal(validateTopSkills(['Figma', 'Copywriting', 'React']).valid, true);
});

test('buildBlindTalentCard strictly strips identity and private phone when locked', () => {
  const talent: TalentPublicProfile = {
    userId: 'talent_1',
    candidateCode: 'TM-4082',
    category: 'Bootcamp Alumni',
    educationDetail: 'Fullstack Web Bootcamp',
    experienceSummary: 'Built 2 SME storefronts',
    hasNoFormalExperience: false,
    careerField: 'Web & App Development',
    interests: ['Frontend'],
    topSkills: ['React', 'Tailwind CSS', 'TypeScript'],
    workModes: ['remote'],
    bootcampHistory: 'Hacktiv8 Web Dev',
    portfolioUrl: 'https://anon-portfolio.timu.app/tm-4082',
    linkedinUrl: '',
    city: 'Jakarta',
    countryCode: 'ID',
    lat: -6.2,
    lng: 106.8,
    timezone: 'UTC+7',
    expPoints: 175,
    tierLevel: 1,
    firstQuestCompleted: true,
    isVerified: true,
    isPremium: false,
    completedGigsCount: 2,
    avatarPalette: '#4F6110',
  };

  const locked = buildBlindTalentCard({
    talent,
    identity: {
      userId: 'talent_1',
      fullName: 'Secret Real Name',
      avatarUrl: 'https://example.com/secret.png',
      headline: 'Frontend Dev',
      phonePrivate: '+628111111111',
    },
    isUnlocked: false,
  });

  assert.equal(locked.isUnlocked, false);
  assert.equal(locked.revealedIdentity, undefined);
  assert.equal(JSON.stringify(locked).includes('Secret Real Name'), false);
  assert.equal(JSON.stringify(locked).includes('+628111111111'), false);

  const unlocked = buildBlindTalentCard({
    talent,
    identity: {
      userId: 'talent_1',
      fullName: 'Secret Real Name',
      avatarUrl: 'https://example.com/secret.png',
      headline: 'Frontend Dev',
      phonePrivate: '+628111111111',
    },
    isUnlocked: true,
    conversationId: 'conv_1',
  });

  assert.equal(unlocked.isUnlocked, true);
  assert.equal(unlocked.revealedIdentity?.fullName, 'Secret Real Name');
  // Phone private must NEVER leak even on unlock (opt-in via chat only!)
  assert.equal(JSON.stringify(unlocked).includes('+628111111111'), false);
});

test('deductTokenAtomically blocks negative balance', () => {
  const ok = deductTokenAtomically(3, 1);
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.nextBalance, 2);

  const fail = deductTokenAtomically(0, 1);
  assert.equal(fail.ok, false);
});

test('distance, timezone overlap, verification code, and safe URL checks work accurately', () => {
  const km = calculateDistanceKm(-6.2088, 106.8456, -6.9175, 107.6191);
  assert.ok(km > 100 && km < 130);
  assert.match(formatDistance(10, 'km'), /^10 km$/);
  assert.match(formatDistance(10, 'mi'), /^6\.2 mi$/);

  assert.equal(calculateTimezoneOverlapHours('UTC+7', 'UTC+8'), 7);
  assert.equal(calculateTimezoneOverlapHours('UTC+7', 'UTC-5'), 0);

  assert.equal(generateVerificationCode(2026, 'a84k2p99'), 'TIMU-2026-A84K2P');

  assert.equal(isSafeExternalUrl('https://timu.app/portfolio'), true);
  assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);
  assert.equal(isSafeExternalUrl('data:text/html,<script>alert(1)</script>'), false);
});
