import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, CheckCircle2, ChevronDown, ChevronUp, Eye, Sparkles } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { BlindTalentCard } from '../components/BlindTalentCard';
import { Modal } from '../components/Modal';
import { LoadingSkeleton, ErrorState } from '../components/StateBlocks';
import {
  calculateFirstQuestExp,
  evaluateFirstQuestSteps,
  FIRST_QUEST_STEP_EXP,
  validateTopSkills,
} from '../lib/domain';
import type { BlindTalentCardData, FirstQuestDraft, WorkMode } from '../types/timu';

const CAREER_FIELDS = [
  'UI/UX & Product Design',
  'Web & App Development',
  'Digital Marketing & Content',
  'Operations & Finance',
  'Customer Support & Admin',
  'Photography & Video Production',
];

const INTEREST_OPTIONS = [
  'Brand Identity',
  'Packaging',
  'SME Digitalization',
  'E-Commerce',
  'Short-Form Video',
  'Copywriting',
  'Frontend Engineering',
  'Bookkeeping',
  'Data Cleanup',
];

const SKILL_POOL = [
  'Figma Prototyping',
  'Brand Identity',
  'Social Media Design',
  'React & TypeScript',
  'Tailwind CSS',
  'Landing Pages',
  'Meta Ads Setup',
  'Marketplace SEO',
  'Reels Scripting',
  'Excel & Sheets',
  'SME Bookkeeping',
  'Packaging Design',
];

export const TalentFirstQuestPage: React.FC = () => {
  const {
    profile,
    talentProfile,
    loading,
    error,
    retryLoad,
    completeFirstQuest,
    dict,
  } = useWorkspace();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<FirstQuestDraft>(() => ({
    fullName: profile?.fullName || 'Raka Pratama',
    phonePrivate: '+6281210248899',
    city: talentProfile?.city || 'Bandung',
    countryCode: talentProfile?.countryCode || 'ID',
    timezone: talentProfile?.timezone || 'UTC+7',
    workModes: talentProfile?.workModes?.length ? talentProfile.workModes : ['remote', 'hybrid'],
    category: talentProfile?.category || 'Final-Year University Student',
    educationDetail: talentProfile?.educationDetail || 'B.Sc. Visual Communication Design',
    hasNoFormalExperience: talentProfile?.hasNoFormalExperience ?? false,
    experienceSummary:
      talentProfile?.experienceSummary ||
      'Designed social catalog templates and menu systems for two local coffee kiosks.',
    bootcampHistory: talentProfile?.bootcampHistory || 'Binar Academy Product Design Intensive (2025)',
    interests: talentProfile?.interests?.length ? talentProfile.interests : ['Brand Identity', 'SME Digitalization'],
    careerField: talentProfile?.careerField || 'UI/UX & Product Design',
    topSkills: talentProfile?.topSkills?.length ? talentProfile.topSkills.slice(0, 3) : ['Figma Prototyping', 'Brand Identity'],
    portfolioUrl: talentProfile?.portfolioUrl || 'https://portfolio.example.com/tm-1024',
  }));

  const [openStep, setOpenStep] = useState<number>(5); // Focus step 6 or step 1 easily
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [levelUpSuccess, setLevelUpSuccess] = useState(false);

  const stepDone = useMemo(() => evaluateFirstQuestSteps(draft), [draft]);
  const questExp = useMemo(() => calculateFirstQuestExp(stepDone), [stepDone]);
  const skillValidation = useMemo(() => validateTopSkills(draft.topSkills), [draft.topSkills]);
  const allStepsComplete = stepDone.every(Boolean);

  const livePreviewCard: BlindTalentCardData = useMemo(
    () => ({
      talent: {
        userId: talentProfile?.userId || 'preview_self',
        candidateCode: talentProfile?.candidateCode || 'TM-1024',
        category: draft.category || 'Emerging Talent',
        educationDetail: draft.educationDetail || 'Add your education or current status',
        experienceSummary: draft.hasNoFormalExperience
          ? 'No formal work experience yet. Ready for mentored First Quest and SME Escrow projects.'
          : draft.experienceSummary || 'Share projects, campus work, or freelance samples.',
        hasNoFormalExperience: draft.hasNoFormalExperience,
        careerField: draft.careerField,
        interests: draft.interests,
        topSkills: draft.topSkills.length ? draft.topSkills : ['Select 3 skills'],
        workModes: draft.workModes.length ? draft.workModes : ['remote'],
        bootcampHistory: draft.bootcampHistory,
        portfolioUrl: draft.portfolioUrl,
        linkedinUrl: '',
        city: draft.city || 'Your City',
        countryCode: draft.countryCode || 'ID',
        lat: -6.9175,
        lng: 107.6191,
        timezone: draft.timezone || 'UTC+7',
        expPoints: Math.max(questExp, talentProfile?.expPoints || 0),
        tierLevel: questExp >= 100 ? 1 : 0,
        firstQuestCompleted: questExp >= 100,
        isVerified: talentProfile?.isVerified ?? false,
        isPremium: talentProfile?.isPremium ?? false,
        completedGigsCount: talentProfile?.completedGigsCount ?? 0,
        avatarPalette: '#4F6110',
      },
      isUnlocked: false,
      timezoneOverlapHours: 8,
    }),
    [draft, questExp, talentProfile]
  );

  const toggleWorkMode = (wm: WorkMode) => {
    setDraft((prev) => ({
      ...prev,
      workModes: prev.workModes.includes(wm)
        ? prev.workModes.filter((m) => m !== wm)
        : [...prev.workModes, wm],
    }));
  };

  const toggleInterest = (item: string) => {
    setDraft((prev) => ({
      ...prev,
      interests: prev.interests.includes(item)
        ? prev.interests.filter((i) => i !== item)
        : prev.interests.length < 6
          ? [...prev.interests, item]
          : prev.interests,
    }));
  };

  const toggleSkill = (skill: string) => {
    setDraft((prev) => {
      if (prev.topSkills.includes(skill)) {
        return { ...prev, topSkills: prev.topSkills.filter((s) => s !== skill) };
      }
      if (prev.topSkills.length >= 3) return prev;
      return { ...prev, topSkills: [...prev.topSkills, skill] };
    });
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!allStepsComplete) {
      setSubmitError('Please complete all 6 steps including selecting exactly 3 Top Skills.');
      return;
    }
    setSaving(true);
    const res = await completeFirstQuest(draft);
    setSaving(false);
    if (!res.ok) {
      setSubmitError(res.error || 'Could not save First Quest.');
      return;
    }
    setLevelUpSuccess(true);
  };

  if (loading) return <LoadingSkeleton label="Loading First Quest onboarding..." variant="split" />;
  if (error) return <ErrorState message={error} onRetry={() => void retryLoad()} />;

  const stepsMeta = [
    { idx: 0, title: '1. Identity, Private Phone & Work Mode', exp: FIRST_QUEST_STEP_EXP[0] },
    { idx: 1, title: '2. Education & Current Status', exp: FIRST_QUEST_STEP_EXP[1] },
    { idx: 2, title: '3. Experience & Training', exp: FIRST_QUEST_STEP_EXP[2] },
    { idx: 3, title: '4. Interests & Strengths', exp: FIRST_QUEST_STEP_EXP[3] },
    { idx: 4, title: '5. Primary Career Field', exp: FIRST_QUEST_STEP_EXP[4] },
    { idx: 5, title: `6. ${dict.firstQuest.skillsCounter} (${draft.topSkills.length}/3)`, exp: FIRST_QUEST_STEP_EXP[5] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="type-h1 text-ink">{dict.firstQuest.title}</h1>
          <p className="mt-1 text-sm text-muted">{dict.firstQuest.subtitle}</p>
        </div>

        {/* Mobile / Tablet Preview Card Trigger */}
        <button
          type="button"
          onClick={() => setPreviewModalOpen(true)}
          className="lg:hidden inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-[1.5px] border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:bg-subtle self-start"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          {dict.firstQuest.previewCard}
        </button>
      </div>

      {/* Restrained Level-Up Confirmation Banner */}
      {levelUpSuccess && (
        <div
          role="status"
          className="rounded-2xl border border-status-success-text/30 bg-status-success-bg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 text-status-success-text">
            <Award className="h-6 w-6 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold">Rookie Lv 1 Unlocked (100 EXP)</h2>
              <p className="text-sm opacity-90">
                Your Blind Talent Card is active and ready for SME discovery and Escrow opportunities.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/talent/dashboard')}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-brand-fg hover:bg-brand-hover"
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {/* Desktop 2-Column Split (55% Left Stepper / 45% Right Sticky Live Preview) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7 space-y-4">
          {/* Sticky EXP Progress Header */}
          <div className="sticky top-14 lg:top-4 z-20 rounded-2xl bg-wallet p-4 text-white shadow-card">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 font-bold text-white">
                <Sparkles className="h-4 w-4 text-gold" aria-hidden="true" />
                First Quest Progress
              </span>
              <span className="font-bold text-white tabular-nums">
                {questExp} / 100 EXP {questExp >= 100 ? '· Rookie Lv 1' : '· Starter Lv 0'}
              </span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gold transition-[width] duration-300 ease-out"
                style={{ width: `${Math.min(100, questExp)}%` }}
              />
            </div>
          </div>

          {/* 6-Step Interactive Accordion */}
          <div className="space-y-3">
            {stepsMeta.map((step) => {
              const isOpen = openStep === step.idx;
              const isDone = stepDone[step.idx];
              return (
                <section
                  key={step.idx}
                  className="rounded-2xl border border-line bg-surface overflow-hidden"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenStep(isOpen ? -1 : step.idx)}
                    className="flex w-full min-h-[56px] items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-subtle/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2
                        className={`h-5 w-5 shrink-0 ${
                          isDone ? 'text-status-success-text' : 'text-muted opacity-50'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-bold text-ink truncate">{step.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-muted tabular-nums">
                        +{step.exp} EXP
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-line-subtle px-5 py-4 space-y-4">
                      {step.idx === 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="fq-name" className="block text-sm font-medium text-ink mb-1">
                              Full Name (hidden until unlocked)
                            </label>
                            <input
                              id="fq-name"
                              type="text"
                              value={draft.fullName}
                              onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
                            />
                          </div>
                          <div>
                            <label htmlFor="fq-phone" className="block text-sm font-medium text-ink mb-1">
                              Private Phone / WhatsApp (opt-in only)
                            </label>
                            <input
                              id="fq-phone"
                              type="tel"
                              value={draft.phonePrivate}
                              onChange={(e) => setDraft({ ...draft, phonePrivate: e.target.value })}
                              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
                            />
                          </div>
                          <div>
                            <label htmlFor="fq-city" className="block text-sm font-medium text-ink mb-1">
                              City
                            </label>
                            <input
                              id="fq-city"
                              type="text"
                              value={draft.city}
                              onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
                            />
                          </div>
                          <div>
                            <label htmlFor="fq-tz" className="block text-sm font-medium text-ink mb-1">
                              Timezone
                            </label>
                            <select
                              id="fq-tz"
                              value={draft.timezone}
                              onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
                              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
                            >
                              <option value="UTC+7">UTC+7 (WIB / Jakarta / Bangkok)</option>
                              <option value="UTC+8">UTC+8 (WITA / Singapore / Manila)</option>
                              <option value="UTC+9">UTC+9 (WIT / Tokyo / Seoul)</option>
                              <option value="UTC+0">UTC+0 (London / GMT)</option>
                              <option value="UTC-5">UTC-5 (New York / EST)</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="block text-sm font-medium text-ink mb-2">
                              Preferred Work Modes
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {(['remote', 'onsite', 'hybrid'] as WorkMode[]).map((wm) => {
                                const active = draft.workModes.includes(wm);
                                return (
                                  <button
                                    key={wm}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => toggleWorkMode(wm)}
                                    className={`min-h-[44px] rounded-full px-4 text-xs font-semibold border transition-colors ${
                                      active
                                        ? 'border-brand bg-brand text-brand-fg'
                                        : 'border-line-strong bg-canvas text-ink hover:bg-subtle'
                                    }`}
                                  >
                                    {wm === 'onsite' ? 'On-site' : wm === 'remote' ? 'Remote' : 'Hybrid'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {step.idx === 1 && (
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="fq-cat" className="block text-sm font-medium text-ink mb-1">
                              Current Status
                            </label>
                            <select
                              id="fq-cat"
                              value={draft.category}
                              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
                            >
                              <option value="University Student">University Student</option>
                              <option value="Final-Year University Student">Final-Year University Student</option>
                              <option value="Fresh Graduate">Fresh Graduate</option>
                              <option value="Bootcamp Alumni">Bootcamp Alumni</option>
                              <option value="Early-Career Freelancer">Early-Career Freelancer</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="fq-edu" className="block text-sm font-medium text-ink mb-1">
                              Education / Major / Institution
                            </label>
                            <input
                              id="fq-edu"
                              type="text"
                              value={draft.educationDetail}
                              onChange={(e) => setDraft({ ...draft, educationDetail: e.target.value })}
                              placeholder="e.g. Informatics Engineering, Year 3"
                              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
                            />
                          </div>
                        </div>
                      )}

                      {step.idx === 2 && (
                        <div className="space-y-4">
                          <label
                            htmlFor="fq-no-exp"
                            className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3.5 text-sm font-semibold text-ink"
                          >
                            <input
                              id="fq-no-exp"
                              type="checkbox"
                              checked={draft.hasNoFormalExperience}
                              onChange={(e) =>
                                setDraft({ ...draft, hasNoFormalExperience: e.target.checked })
                              }
                              className="h-5 w-5 accent-[var(--brand-primary)]"
                            />
                            <span>No formal experience yet (start strong with First Quest skills)</span>
                          </label>

                          {!draft.hasNoFormalExperience && (
                            <div>
                              <label htmlFor="fq-exp-summary" className="block text-sm font-medium text-ink mb-1">
                                Brief Project or Experience Summary
                              </label>
                              <textarea
                                id="fq-exp-summary"
                                rows={3}
                                value={draft.experienceSummary}
                                onChange={(e) =>
                                  setDraft({ ...draft, experienceSummary: e.target.value })
                                }
                                className="w-full rounded-xl border border-line-strong bg-canvas p-3 text-sm text-ink"
                              />
                            </div>
                          )}

                          <div>
                            <label htmlFor="fq-bootcamp" className="block text-sm font-medium text-ink mb-1">
                              Bootcamp or Certification History (optional)
                            </label>
                            <input
                              id="fq-bootcamp"
                              type="text"
                              value={draft.bootcampHistory}
                              onChange={(e) => setDraft({ ...draft, bootcampHistory: e.target.value })}
                              placeholder="e.g. Product Design Bootcamp 2025"
                              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
                            />
                          </div>

                          <div>
                            <label htmlFor="fq-portfolio" className="block text-sm font-medium text-ink mb-1">
                              Anonymized Portfolio URL (optional)
                            </label>
                            <input
                              id="fq-portfolio"
                              type="url"
                              value={draft.portfolioUrl}
                              onChange={(e) => setDraft({ ...draft, portfolioUrl: e.target.value })}
                              placeholder="https://portfolio.example.com/..."
                              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
                            />
                          </div>
                        </div>
                      )}

                      {step.idx === 3 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted">Pick at least 1 interest area (up to 6).</p>
                          <div className="flex flex-wrap gap-2">
                            {INTEREST_OPTIONS.map((item) => {
                              const active = draft.interests.includes(item);
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() => toggleInterest(item)}
                                  className={`min-h-[40px] rounded-full px-3.5 text-xs font-semibold border transition-colors ${
                                    active
                                      ? 'border-brand bg-brand text-brand-fg'
                                      : 'border-line bg-canvas text-ink hover:bg-subtle'
                                  }`}
                                >
                                  {item}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {step.idx === 4 && (
                        <div>
                          <label htmlFor="fq-field" className="block text-sm font-medium text-ink mb-1">
                            Primary Career Field
                          </label>
                          <select
                            id="fq-field"
                            value={draft.careerField}
                            onChange={(e) => setDraft({ ...draft, careerField: e.target.value })}
                            className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
                          >
                            {CAREER_FIELDS.map((field) => (
                              <option key={field} value={field}>
                                {field}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {step.idx === 5 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted">
                              Choose exactly 3 verified skills to highlight on your Blind Talent Card.
                            </span>
                            <span
                              className={`font-bold tabular-nums ${
                                skillValidation.valid ? 'text-status-success-text' : 'text-ink'
                              }`}
                            >
                              {draft.topSkills.length} / 3 selected
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {SKILL_POOL.map((skill) => {
                              const selected = draft.topSkills.includes(skill);
                              const maxedOut = !selected && draft.topSkills.length >= 3;
                              return (
                                <button
                                  key={skill}
                                  type="button"
                                  aria-pressed={selected}
                                  aria-disabled={maxedOut}
                                  onClick={() => toggleSkill(skill)}
                                  className={`min-h-[40px] rounded-full px-3.5 text-xs font-semibold border transition-colors ${
                                    selected
                                      ? 'border-brand bg-brand text-brand-fg'
                                      : maxedOut
                                        ? 'border-line bg-canvas text-muted opacity-50'
                                        : 'border-line-strong bg-canvas text-ink hover:bg-subtle'
                                  }`}
                                >
                                  {skill}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {submitError && (
            <div role="alert" className="rounded-xl border border-status-error-text/30 bg-status-error-bg px-4 py-3 text-sm font-medium text-status-error-text">
              {submitError}
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-2">
            <button
              type="button"
              disabled={!allStepsComplete || saving}
              onClick={() => void handleSubmit()}
              className="w-full min-h-[48px] rounded-xl bg-gold px-6 py-3 text-sm font-bold text-gold-fg hover:bg-gold-hover transition-colors"
            >
              {saving ? 'Saving First Quest...' : dict.firstQuest.completeCta}
            </button>
          </div>
        </div>

        {/* Desktop Right Sticky Column: Live Blind Talent Card Preview */}
        <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Live Blind Talent Card Preview</h2>
            <span className="text-xs text-muted">Updates in real time</span>
          </div>
          <BlindTalentCard card={livePreviewCard} previewMode />
        </div>
      </div>

      {/* Mobile / Tablet Live Card Modal */}
      <Modal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Live Blind Talent Card Preview"
        description="This is how SMEs evaluate your profile before spending 1 Token."
      >
        <BlindTalentCard card={livePreviewCard} previewMode />
      </Modal>
    </div>
  );
};
