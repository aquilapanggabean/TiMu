import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { TimuLogo } from '../components/TimuLogo';
import { BlindTalentCard } from '../components/BlindTalentCard';
import type { BlindTalentCardData } from '../types/timu';

const SAMPLE_PREVIEW_CARD: BlindTalentCardData = {
  talent: {
    userId: 'preview_nadia',
    candidateCode: 'TM-4082',
    category: 'University Student',
    educationDetail: 'Universitas Padjadjaran · Semester 5',
    experienceSummary:
      'Designed print-ready cafe menus, Instagram catalog kits, and product packaging for three local SMEs.',
    hasNoFormalExperience: false,
    careerField: 'Design',
    interests: ['Brand Identity', 'Packaging', 'Copywriting'],
    topSkills: ['Canva Design', 'Copywriting', 'Reels Content'],
    workModes: ['onsite', 'remote', 'hybrid'],
    bootcampHistory: 'Creative Design & Copywriting Cohort',
    portfolioUrl: 'https://portfolio.example.com/tm-4082',
    linkedinUrl: '',
    city: 'Bandung',
    countryCode: 'ID',
    lat: -6.907,
    lng: 107.618,
    timezone: 'UTC+7',
    expPoints: 260,
    tierLevel: 2,
    firstQuestCompleted: true,
    isVerified: true,
    isPremium: false,
    completedGigsCount: 3,
    avatarPalette: '#3B4D0C',
  },
  isUnlocked: false,
  distanceKm: 1.2,
  timezoneOverlapHours: 8,
};

export const GatewayPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    locale,
    setLocale,
    theme,
    toggleTheme,
    enterDemoWorkspace,
    accountEmail,
    activeMode,
    blindTalents,
  } = useWorkspace();

  const isId = locale === 'id';

  const previewCard: BlindTalentCardData = blindTalents[0]
    ? { ...blindTalents[0], isUnlocked: false, revealedIdentity: undefined }
    : SAMPLE_PREVIEW_CARD;

  const handleChooseTalent = () => {
    enterDemoWorkspace('talent');
    navigate('/talent/first-quest');
  };

  const handleChooseEmployer = () => {
    enterDemoWorkspace('employer');
    navigate('/employer/discover');
  };

  return (
    <div className="min-h-screen w-full bg-canvas text-ink flex flex-col">
      {/* Clean 3-Zone Top Bar */}
      <header className="w-full border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1040px] items-center justify-between gap-6 px-4 sm:px-6">
          <Link to="/" aria-label="TIMU Titik Temu" className="shrink-0">
            <TimuLogo size="sm" showTagline />
          </Link>

          <nav
            aria-label={isId ? 'Tautan Publik' : 'Public Navigation'}
            className="hidden md:flex items-center gap-6 text-sm font-medium text-muted"
          >
            <Link
              to="/talent/dashboard"
              onClick={() => enterDemoWorkspace('talent')}
              className="hover:text-ink transition-colors whitespace-nowrap"
            >
              {isId ? 'Dasbor Talenta' : 'Talent Workspace'}
            </Link>
            <Link
              to="/employer/discover"
              onClick={() => enterDemoWorkspace('employer')}
              className="hover:text-ink transition-colors whitespace-nowrap"
            >
              {isId ? 'Cari Talenta' : 'Browse Talent'}
            </Link>
            <Link
              to="/verify/TIMU-2026-A84K2P"
              className="hover:text-ink transition-colors whitespace-nowrap"
            >
              {isId ? 'Verifikasi Sertifikat' : 'Verify Certificate'}
            </Link>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLocale(isId ? 'en' : 'id')}
              aria-label={isId ? 'Switch to English' : 'Ubah ke Bahasa Indonesia'}
              className="min-h-[40px] rounded-xl border border-line bg-canvas px-3 text-xs font-bold text-ink hover:bg-subtle whitespace-nowrap"
            >
              {isId ? 'ID / EN' : 'EN / ID'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-canvas text-ink hover:bg-subtle"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {accountEmail ? (
              <Link
                to={activeMode === 'employer' ? '/employer/discover' : '/talent/dashboard'}
                className="hidden sm:inline-flex min-h-[40px] items-center rounded-xl bg-brand px-4 text-xs font-bold text-brand-fg hover:bg-brand-hover whitespace-nowrap transition-colors"
              >
                {isId ? 'Buka Workspace' : 'Open Workspace'}
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex min-h-[40px] items-center rounded-xl bg-brand px-4 text-xs font-bold text-brand-fg hover:bg-brand-hover whitespace-nowrap transition-colors"
              >
                {isId ? 'Masuk' : 'Sign In'}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Centered 2-Column Editorial Split */}
      <main className="mx-auto flex w-full max-w-[1040px] flex-1 items-center px-4 py-10 sm:px-6 lg:py-16">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Value Proposition & Tactile Role Entry Cards */}
          <div className="lg:col-span-6 space-y-7">
            <div className="space-y-4">
              <h1 className="type-display text-ink">
                {isId
                  ? 'Tempat talenta muda & UMKM lokal bertemu dengan aman.'
                  : 'Where emerging talent and local SMEs work with Escrow trust.'}
              </h1>
              <p className="max-w-[52ch] text-[15px] leading-relaxed text-muted">
                {isId
                  ? 'Evaluasi keahlian tanpa bias, lindungi pembayaran proyek lewat Escrow pihak ketiga (biaya admin 10%), dan bangun sertifikat kerja terverifikasi.'
                  : 'Evaluate verified skills before names, protect project payments in third-party Escrow (10% admin fee), and turn completed work into verifiable certificates.'}
              </p>
            </div>

            {/* Two Tactile Role Entry Cards */}
            <div className="space-y-3.5">
              {/* Role 1: Job Seeker (Talent) */}
              <button
                type="button"
                onClick={handleChooseTalent}
                className="group flex w-full items-center gap-4 rounded-[20px] border border-line bg-surface p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold text-gold-fg">
                  <UserRound className="h-6 w-6" strokeWidth={1.85} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-ink">
                    {isId ? 'Masuk sebagai Pencari Kerja (Talenta)' : 'Join as Job Seeker (Talent)'}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {isId
                      ? 'Selesaikan First Quest, lamar proyek ber-Escrow, dan kumpulkan sertifikat.'
                      : 'Complete First Quest, apply to Escrow projects, and earn verified certificates.'}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand">
                    {isId ? 'Mulai First Quest' : 'Start First Quest'}
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </button>

              {/* Role 2: Employer (SME) */}
              <button
                type="button"
                onClick={handleChooseEmployer}
                className="group flex w-full items-center gap-4 rounded-[20px] border border-line bg-surface p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-fg">
                  <Briefcase className="h-6 w-6" strokeWidth={1.85} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-ink">
                    {isId ? 'Masuk sebagai Pemberi Kerja (UMKM)' : 'Join as Employer (SME)'}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {isId
                      ? 'Temukan talenta terverifikasi secara objektif dan mulai kontrak aman dengan 3 Token awal.'
                      : 'Review verified skills objectively and hire safely with 3 starter Tokens included.'}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand">
                    {isId ? 'Cari Talenta Tanpa Bias' : 'Browse Blind Talent'}
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
              <button
                type="button"
                onClick={() => {
                  enterDemoWorkspace('talent');
                  navigate('/talent/dashboard');
                }}
                className="font-semibold text-brand hover:underline"
              >
                {isId ? 'Langsung ke Dasbor Talenta' : 'Go straight to Talent Dashboard'}
              </button>
              <span aria-hidden="true">·</span>
              <Link
                to="/verify/TIMU-2026-A84K2P"
                className="inline-flex items-center gap-1 font-semibold text-muted hover:text-ink"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-brand-fresh" aria-hidden="true" />
                {isId ? 'Cek Contoh Sertifikat (TIMU-2026-A84K2P)' : 'Inspect Sample Certificate'}
              </Link>
            </div>
          </div>

          {/* Right Column: Live Interactive Blind Talent Card Preview */}
          <div className="lg:col-span-6 space-y-3">
            <div className="mx-auto max-w-[460px] space-y-3">
              <BlindTalentCard card={previewCard} previewMode />
              <div className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-xs text-muted">
                <span className="inline-flex items-center gap-2 font-semibold text-ink">
                  <ShieldCheck className="h-4 w-4 text-brand-fresh shrink-0" aria-hidden="true" />
                  {isId ? 'Perlindungan Escrow Pihak Ketiga' : 'Third-Party Escrow Protection'}
                </span>
                <span className="font-bold text-brand tabular-nums">
                  {isId ? '90% Talenta · 10% Admin' : '90% Talent · 10% Fee'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Quiet Footer with Real Legal Routes */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1040px] flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-muted sm:px-6">
          <span>TIMU (Titik Temu)</span>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/legal/terms" className="hover:text-ink">
              {isId ? 'Syarat & Ketentuan' : 'Terms'}
            </Link>
            <Link to="/legal/privacy" className="hover:text-ink">
              {isId ? 'Privasi' : 'Privacy'}
            </Link>
            <Link to="/legal/escrow-policy" className="hover:text-ink">
              {isId ? 'Kebijakan Escrow' : 'Escrow Policy'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
