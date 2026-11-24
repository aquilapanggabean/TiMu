import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Edit3,
  ExternalLink,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { CurrencyCode, WorkspaceMode } from '../types/timu';
import { formatMoney, getSubscriptionPriceMinor } from '../lib/domain';
import { DualModeSwitcher } from '../components/DualModeSwitcher';
import { Modal } from '../components/Modal';
import { PageErrorState, PageSkeleton } from '../components/StateBlocks';

export const TalentProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    locale,
    setLocale,
    currency,
    setCurrency,
    theme,
    toggleTheme,
    loading,
    error,
    retryLoad,
    profile,
    talentProfile,
    certificates,
    skillBadges,
    saveTalentProfile,
    activateSubscription,
    switchMode,
    logout,
  } = useWorkspace();

  const isId = locale === 'id';
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || 'Aldi Pratama');
  const [educationDetail, setEducationDetail] = useState(
    talentProfile?.educationDetail || 'Desain Komunikasi Visual, Bandung'
  );
  const [experienceSummary, setExperienceSummary] = useState(
    talentProfile?.experienceSummary || ''
  );
  const [bootcampHistory, setBootcampHistory] = useState(talentProfile?.bootcampHistory || '');
  const [portfolioUrl, setPortfolioUrl] = useState(talentProfile?.portfolioUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(talentProfile?.linkedinUrl || '');
  const [city, setCity] = useState(profile?.city || 'Bandung');
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC+7');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    const res = await saveTalentProfile({
      fullName: fullName.trim(),
      educationDetail: educationDetail.trim(),
      experienceSummary: experienceSummary.trim(),
      bootcampHistory: bootcampHistory.trim(),
      portfolioUrl: portfolioUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      city: city.trim(),
      timezone: timezone.trim(),
    });
    setBusy(false);
    if (res.ok) {
      setEditOpen(false);
      setFeedback({
        type: 'success',
        text: isId ? 'Profil talenta berhasil diperbarui.' : 'Talent profile updated.',
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Unable to save profile.' });
    }
  };

  const handleActivateBadge = async () => {
    setBusy(true);
    const res = await activateSubscription('verification_badge', currency, 'talent');
    setBusy(false);
    if (res.ok) {
      setFeedback({
        type: 'success',
        text: isId ? 'Lencana Verifikasi Talenta aktif.' : 'Talent Verification Badge activated.',
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Unable to activate badge.' });
    }
  };

  const handleModeSwitch = async (next: WorkspaceMode) => {
    await switchMode(next);
    if (next === 'employer') navigate('/employer/discover');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading && !profile) return <PageSkeleton />;
  if (error) return <PageErrorState message={error} onRetry={retryLoad} />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="type-h1 text-ink">
          {isId ? 'Profil, Sertifikat & Pengaturan' : 'Profile, Credentials & Settings'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isId
            ? 'Kelola identitas talenta, sertifikat proyek terverifikasi, dan preferensi aplikasi.'
            : 'Manage your talent identity, verifiable project certificates, and workspace preferences.'}
        </p>
      </div>

      {feedback && (
        <div
          role="status"
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            feedback.type === 'success'
              ? 'bg-status-success-bg text-status-success-text'
              : 'bg-status-error-bg text-status-error-text'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* 1. Identity Header Card + 2. Dual-Mode Switcher */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <section className="md:col-span-7 flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand ring-2 ring-brand-fresh text-brand-fg">
              <UserRound className="h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink">
                {profile?.fullName || 'Aldi Pratama'}
              </h2>
              <p className="text-xs text-muted">
                {talentProfile?.educationDetail} · {profile?.city}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-brand-fg">
                  {isId ? 'Talenta' : 'Talent'} · Lv {talentProfile?.tierLevel ?? 0}
                </span>
                {talentProfile?.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-0.5 text-xs font-semibold text-ink">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-fresh" aria-hidden="true" />
                    {isId ? 'Terverifikasi' : 'Verified'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-line bg-canvas px-4 text-xs font-bold text-ink hover:bg-subtle"
          >
            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
            {isId ? 'Edit Profil' : 'Edit Profile'}
          </button>
        </section>

        <section className="md:col-span-5 flex flex-col justify-center rounded-[20px] border border-line bg-surface p-5 sm:p-6 space-y-3">
          <div>
            <h2 className="font-display text-base font-bold text-ink">
              {isId ? 'Mode Ruang Kerja' : 'Workspace Mode'}
            </h2>
            <p className="text-xs text-muted">
              {isId
                ? 'Pindah langsung ke ruang kerja UMKM dengan akun yang sama.'
                : 'Switch directly to Employer (SME) workspace on the same account.'}
            </p>
          </div>
          <DualModeSwitcher mode="talent" onChange={handleModeSwitch} />
        </section>
      </div>

      {/* 3. Verifiable Certificates Gallery, Skill Badges & Verification Upgrade */}
      <section className="rounded-[20px] border border-line bg-surface p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Award className="h-5 w-5 text-brand-fresh" aria-hidden="true" />
              {isId ? 'Galeri Sertifikat Terverifikasi' : 'Verifiable Certificates Gallery'}
            </h2>
            <p className="text-xs text-muted">
              {isId
                ? 'Setiap proyek Escrow yang selesai otomatis menerbitkan sertifikat publik dengan ID unik.'
                : 'Every released Escrow project mints a public certificate with a unique verification code.'}
            </p>
          </div>

          {!talentProfile?.isVerified && (
            <button
              type="button"
              disabled={busy}
              onClick={handleActivateBadge}
              className="min-h-[40px] rounded-xl bg-brand px-4 text-xs font-bold text-brand-fg hover:bg-brand-hover"
            >
              {isId ? 'Aktifkan Lencana Verifikasi' : 'Get Verification Badge'} (
              {formatMoney(getSubscriptionPriceMinor('verification_badge', currency), currency, locale)})
            </button>
          )}
        </div>

        {skillBadges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skillBadges.map((b) => (
              <span
                key={b.id}
                className="rounded-full bg-subtle px-3.5 py-1 text-xs font-semibold text-ink"
              >
                {b.badgeName} · {b.careerField}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {certificates.map((cert) => (
            <Link
              key={cert.id}
              to={`/verify/${cert.verificationCode}`}
              className="flex flex-col justify-between rounded-2xl border border-line bg-canvas p-4 transition-all hover:border-line-strong hover:shadow-card"
            >
              <div>
                <p className="text-xs font-semibold text-muted">{cert.businessName}</p>
                <h3 className="mt-1 font-display text-base font-bold text-ink">{cert.projectTitle}</h3>
                <p className="mt-1.5 text-xs text-muted">{cert.skillsValidated.join(' · ')}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs">
                <span className="font-mono font-bold text-ink">{cert.verificationCode}</span>
                <span className="inline-flex items-center gap-1 font-bold text-brand">
                  {isId ? 'Buka Sertifikat' : 'Open Certificate'}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. App Preferences & Restrained Sign Out */}
      <section className="rounded-[20px] border border-line bg-surface divide-y divide-line overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <span className="text-sm font-semibold text-ink">{isId ? 'Bahasa' : 'Language'}</span>
          <div className="inline-flex rounded-xl bg-subtle p-1">
            {(['en', 'id'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                className={`min-h-[36px] rounded-lg px-3.5 text-xs font-bold ${
                  locale === code ? 'bg-surface text-ink shadow-xs' : 'text-muted'
                }`}
              >
                {code === 'en' ? 'English' : 'Bahasa Indonesia'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <label htmlFor="tal-pref-curr" className="text-sm font-semibold text-ink">
            {isId ? 'Mata Uang Pilihan' : 'Preferred Currency'}
          </label>
          <select
            id="tal-pref-curr"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="min-h-[40px] rounded-xl border border-line-strong bg-canvas px-3 text-xs font-bold text-ink"
          >
            <option value="IDR">IDR (Rp)</option>
            <option value="USD">USD ($)</option>
            <option value="SGD">SGD (S$)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <span className="text-sm font-semibold text-ink">{isId ? 'Tampilan' : 'Appearance'}</span>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-line bg-canvas px-4 text-xs font-bold text-ink hover:bg-subtle"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? (isId ? 'Mode Terang' : 'Light Mode') : isId ? 'Mode Gelap' : 'Dark Mode'}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 text-xs text-muted">
          <div className="flex flex-wrap gap-4">
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
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-line px-4 text-xs font-bold text-muted hover:border-line-strong hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            {isId ? 'Keluar' : 'Sign Out'}
          </button>
        </div>
      </section>

      {/* Edit Talent Profile Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={isId ? 'Edit Profil Talenta' : 'Edit Talent Profile'}
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label htmlFor="tp-name" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Nama Lengkap' : 'Full Name'}
            </label>
            <input
              id="tp-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="tp-edu" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Pendidikan / Status Saat Ini' : 'Education / Status'}
            </label>
            <input
              id="tp-edu"
              type="text"
              required
              value={educationDetail}
              onChange={(e) => setEducationDetail(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="tp-exp" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Ringkasan Pengalaman' : 'Experience Summary'}
            </label>
            <textarea
              id="tp-exp"
              rows={3}
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value)}
              className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tp-city" className="block text-xs font-bold text-ink mb-1.5">
                {isId ? 'Kota' : 'City'}
              </label>
              <input
                id="tp-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
              />
            </div>
            <div>
              <label htmlFor="tp-tz" className="block text-xs font-bold text-ink mb-1.5">
                {isId ? 'Zona Waktu' : 'Timezone'}
              </label>
              <input
                id="tp-tz"
                type="text"
                required
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
              />
            </div>
          </div>
          <div>
            <label htmlFor="tp-boot" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Pelatihan / Bootcamp' : 'Bootcamp / Certifications'}
            </label>
            <input
              id="tp-boot"
              type="text"
              value={bootcampHistory}
              onChange={(e) => setBootcampHistory(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="tp-port" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Tautan Portofolio' : 'Portfolio URL'}
            </label>
            <input
              id="tp-port"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="tp-li" className="block text-xs font-bold text-ink mb-1.5">
              LinkedIn URL
            </label>
            <input
              id="tp-li"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-[48px] rounded-xl bg-gold text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
          >
            {busy ? (isId ? 'Menyimpan...' : 'Saving...') : isId ? 'Simpan Perubahan' : 'Save Changes'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
