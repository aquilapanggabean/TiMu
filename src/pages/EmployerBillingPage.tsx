import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Crown,
  Edit3,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { CurrencyCode, WorkspaceMode } from '../types/timu';
import {
  TOKEN_PACKS,
  formatMoney,
  getSubscriptionPriceMinor,
  getTokenPackPriceMinor,
} from '../lib/domain';
import { DualModeSwitcher } from '../components/DualModeSwitcher';
import { Modal } from '../components/Modal';
import { PageErrorState, PageSkeleton } from '../components/StateBlocks';

export const EmployerBillingPage: React.FC = () => {
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
    employerProfile,
    tokenLedger,
    buyTokenPack,
    activateSubscription,
    saveEmployerProfile,
    switchMode,
    logout,
  } = useWorkspace();

  const isId = locale === 'id';
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [businessName, setBusinessName] = useState(employerProfile?.businessName || 'Kopi Senja');
  const [industry, setIndustry] = useState(employerProfile?.industry || 'Food & Beverage');
  const [city, setCity] = useState(employerProfile?.city || 'Bandung');
  const [timezone, setTimezone] = useState(employerProfile?.timezone || 'UTC+7');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBuyPack = async (packId: 'pack_1' | 'pack_5' | 'pack_15') => {
    setBusy(true);
    setFeedback(null);
    const res = await buyTokenPack(packId, currency);
    setBusy(false);
    if (res.ok) {
      setFeedback({
        type: 'success',
        text: isId ? 'Token berhasil ditambahkan ke saldo UMKM.' : 'Tokens added to your balance.',
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Unable to top up Tokens.' });
    }
  };

  const handlePlan = async (planType: 'employer_premium' | 'verification_badge') => {
    setBusy(true);
    setFeedback(null);
    const res = await activateSubscription(planType, currency, 'employer');
    setBusy(false);
    if (res.ok) {
      setFeedback({
        type: 'success',
        text: isId ? 'Paket berhasil diaktifkan.' : 'Plan activated successfully.',
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Unable to activate plan.' });
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await saveEmployerProfile({
      businessName: businessName.trim(),
      industry: industry.trim(),
      city: city.trim(),
      timezone: timezone.trim(),
    });
    setBusy(false);
    if (res.ok) {
      setEditOpen(false);
      setFeedback({
        type: 'success',
        text: isId ? 'Profil usaha diperbarui.' : 'Business profile updated.',
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Unable to save business profile.' });
    }
  };

  const handleModeSwitch = async (next: WorkspaceMode) => {
    await switchMode(next);
    if (next === 'talent') navigate('/talent/dashboard');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading && !employerProfile) return <PageSkeleton />;
  if (error) return <PageErrorState message={error} onRetry={retryLoad} />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="type-h1 text-ink">
          {isId ? 'Profil, Token & Pengaturan UMKM' : 'Employer Profile, Tokens & Settings'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isId
            ? 'Kelola identitas bisnis, saldo Token, paket prioritas, dan preferensi akun Anda.'
            : 'Manage your business identity, Token balance, upgrade plans, and workspace preferences.'}
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
                {employerProfile?.businessName || 'Kopi Senja'}
              </h2>
              <p className="text-xs text-muted">
                {employerProfile?.industry} · {employerProfile?.city}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-brand-fg">
                  {isId ? 'UMKM' : 'Employer (SME)'}
                </span>
                {employerProfile?.isVerified && (
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
                ? 'Satu akun untuk berpindah antara Talenta dan UMKM.'
                : 'Switch cleanly between Talent and Employer workspaces.'}
            </p>
          </div>
          <DualModeSwitcher mode="employer" onChange={handleModeSwitch} />
        </section>
      </div>

      {/* 3. Financial, Token Packs, Plans & Ledger */}
      <section className="rounded-[20px] border border-line bg-surface p-5 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-soft font-display text-lg font-extrabold text-gold-soft-fg">
              T
            </span>
            <div>
              <p className="text-xs font-medium text-muted">{isId ? 'Saldo Token Aktif' : 'Current Token Balance'}</p>
              <p className="font-display text-2xl font-extrabold text-ink tabular-nums">
                {employerProfile?.tokenBalance ?? 0} {isId ? 'Token' : 'Tokens'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleBuyPack('pack_5')}
            className="min-h-[44px] rounded-xl bg-gold px-5 text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
          >
            {isId ? '+ Isi 5 Token' : '+ Top Up 5 Tokens'}
          </button>
        </div>

        {/* Token Packs Grid */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-muted">{isId ? 'Paket Isi Ulang Token' : 'Token Top-Up Packs'}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {TOKEN_PACKS.map((pack) => {
              const price = getTokenPackPriceMinor(pack, currency);
              return (
                <button
                  key={pack.id}
                  type="button"
                  disabled={busy}
                  onClick={() => handleBuyPack(pack.id)}
                  className="flex items-center justify-between sm:flex-col sm:items-start rounded-2xl border border-line bg-canvas p-4 text-left transition-colors hover:border-line-strong hover:bg-subtle/60"
                >
                  <div>
                    <p className="font-display text-base font-extrabold text-ink">
                      {pack.tokens} {pack.tokens === 1 ? 'Token' : isId ? 'Token' : 'Tokens'}
                    </p>
                    {pack.savingsLabel && (
                      <span className="text-xs font-semibold text-brand">{pack.savingsLabel}</span>
                    )}
                  </div>
                  <p className="sm:mt-2 font-bold text-brand tabular-nums">
                    {formatMoney(price, currency, locale)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upgrades Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-subtle p-4 space-y-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
                <Crown className="h-4 w-4 text-gold-soft-fg" aria-hidden="true" />
                {isId ? 'Prioritas UMKM' : 'SME Priority Plan'}
              </p>
              <p className="mt-1 text-xs text-muted">
                {isId
                  ? 'Lowongan tampil di urutan teratas + bonus 5 Token bulanan.'
                  : 'Top search placement for projects + 5 monthly bonus Tokens.'}
              </p>
            </div>
            <button
              type="button"
              disabled={busy || employerProfile?.isPremium}
              onClick={() => handlePlan('employer_premium')}
              className="min-h-[42px] w-full rounded-xl bg-brand text-xs font-bold text-brand-fg hover:bg-brand-hover"
            >
              {employerProfile?.isPremium
                ? isId
                  ? 'Aktif'
                  : 'Active'
                : `${formatMoney(getSubscriptionPriceMinor('employer_premium', currency), currency, locale)} / ${
                    isId ? 'bln' : 'mo'
                  }`}
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-line bg-subtle p-4 space-y-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
                <ShieldCheck className="h-4 w-4 text-brand-fresh" aria-hidden="true" />
                {isId ? 'Lencana Terverifikasi UMKM' : 'Verification Badge'}
              </p>
              <p className="mt-1 text-xs text-muted">
                {isId
                  ? 'Tingkatkan kepercayaan pelamar dengan tanda verifikasi bisnis resmi.'
                  : 'Increase applicant trust with a verified business badge.'}
              </p>
            </div>
            <button
              type="button"
              disabled={busy || employerProfile?.isVerified}
              onClick={() => handlePlan('verification_badge')}
              className="min-h-[42px] w-full rounded-xl border border-line-strong bg-surface text-xs font-bold text-ink hover:bg-canvas"
            >
              {employerProfile?.isVerified
                ? isId
                  ? 'Terverifikasi'
                  : 'Verified'
                : `${formatMoney(getSubscriptionPriceMinor('verification_badge', currency), currency, locale)} / ${
                    isId ? 'bln' : 'mo'
                  }`}
            </button>
          </div>
        </div>

        {/* Token Ledger */}
        {tokenLedger.length > 0 && (
          <div className="space-y-2 border-t border-line pt-5">
            <h3 className="text-xs font-bold text-muted">{isId ? 'Riwayat Token' : 'Token Ledger'}</h3>
            <div className="divide-y divide-line">
              {tokenLedger.slice(0, 6).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink">{entry.reason}</span>
                  <span
                    className={`font-bold tabular-nums ${
                      entry.delta > 0 ? 'text-status-success-text' : 'text-status-error-text'
                    }`}
                  >
                    {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
          <label htmlFor="emp-pref-curr" className="text-sm font-semibold text-ink">
            {isId ? 'Mata Uang Pilihan' : 'Preferred Currency'}
          </label>
          <select
            id="emp-pref-curr"
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

      {/* Edit Business Profile Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={isId ? 'Edit Profil Usaha' : 'Edit Business Profile'}
      >
        <form onSubmit={handleSaveBusiness} className="space-y-4">
          <div>
            <label htmlFor="biz-name" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Nama Usaha / UMKM' : 'Business Name'}
            </label>
            <input
              id="biz-name"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="biz-ind" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Bidang Industri' : 'Industry'}
            </label>
            <input
              id="biz-ind"
              type="text"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="biz-city" className="block text-xs font-bold text-ink mb-1.5">
                {isId ? 'Kota' : 'City'}
              </label>
              <input
                id="biz-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
              />
            </div>
            <div>
              <label htmlFor="biz-tz" className="block text-xs font-bold text-ink mb-1.5">
                {isId ? 'Zona Waktu' : 'Timezone'}
              </label>
              <input
                id="biz-tz"
                type="text"
                required
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
              />
            </div>
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
