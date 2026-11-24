import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  calculateFirstQuestExp,
  evaluateFirstQuestSteps,
  getTierFromExp,
  isSafeExternalUrl,
  validateTopSkills,
} from '../../src/lib/domain';
import { getWorkspace, resolveSessionKey } from '../_store';

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

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ws = getWorkspace(resolveSessionKey(req));
  const parsed = firstQuestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Please complete all required First Quest fields.',
    });
  }

  const d = parsed.data;
  const skillCheck = validateTopSkills(d.topSkills);
  if (!skillCheck.valid) return res.status(400).json({ error: skillCheck.error });

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

  return res.json({ profile: ws.profile, talentProfile: ws.talentProfile, tier });
}
