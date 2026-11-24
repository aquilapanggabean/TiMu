import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Crown,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { BlindTalentCard } from '../components/BlindTalentCard';
import { Modal } from '../components/Modal';
import { PageErrorState, PageSkeleton } from '../components/StateBlocks';
import { formatMoney, getSubscriptionPriceMinor } from '../lib/domain';

export const EmployerDiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    locale,
    currency,
    distanceUnit,
    setDistanceUnit,
    loading,
    error,
    retryLoad,
    blindTalents,
    employerProfile,
    unlockTalent,
    activateSubscription,
  } = useWorkspace();

  const isId = locale === 'id';
  const [locationMode, setLocationMode] = useState<'nearby' | 'all'>('nearby');
  const [selectedField, setSelectedField] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [confirmUnlockId, setConfirmUnlockId] = useState<string | null>(null);
  const [postUnlockName, setPostUnlockName] = useState<string | null>(null);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [premiumBusy, setPremiumBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Native pointer swipe gesture state (GPU transform only)
  const dragStartX = useRef<number | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const availableFields = useMemo(() => {
    const set = new Set(blindTalents.map((b) => b.talent.careerField));
    return Array.from(set);
  }, [blindTalents]);

  const visibleDeck = useMemo(() => {
    const filtered = blindTalents
      .filter((item) => !skippedIds.includes(item.talent.userId))
      .filter((item) => (selectedField === 'all' ? true : item.talent.careerField === selectedField))
      .filter((item) => (verifiedOnly ? item.talent.isVerified : true));

    if (locationMode === 'nearby') {
      return [...filtered].sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }
    return filtered;
  }, [blindTalents, skippedIds, selectedField, verifiedOnly, locationMode]);

  const currentCard = visibleDeck[0];
  const cardToUnlock = blindTalents.find((c) => c.talent.userId === confirmUnlockId);
  const premiumPrice = getSubscriptionPriceMinor('employer_premium', currency);

  const handleSkip = () => {
    if (!currentCard) return;
    setSkippedIds((prev) => [...prev, currentCard.talent.userId]);
    setFeedback(null);
  };

  // Keyboard shortcuts ArrowLeft (Skip) & ArrowRight (Unlock / Open Chat)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirmUnlockId || premiumModalOpen || postUnlockName) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft' && currentCard) {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'ArrowRight' && currentCard) {
        e.preventDefault();
        if (currentCard.isUnlocked) navigate('/employer/chat');
        else setConfirmUnlockId(currentCard.talent.userId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentCard, confirmUnlockId, premiumModalOpen, postUnlockName, navigate]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    dragStartX.current = e.clientX;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartX.current === null) return;
    setDragOffsetX(e.clientX - dragStartX.current);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    const finalOffset = dragOffsetX;
    setIsDragging(false);
    dragStartX.current = null;
    setDragOffsetX(0);

    if (finalOffset < -90 && currentCard) {
      handleSkip();
    } else if (finalOffset > 90 && currentCard) {
      if (currentCard.isUnlocked) navigate('/employer/chat');
      else setConfirmUnlockId(currentCard.talent.userId);
    }
  };

  const handleConfirmUnlock = async () => {
    if (!confirmUnlockId) return;
    setUnlockBusy(true);
    setFeedback(null);
    const res = await unlockTalent(confirmUnlockId);
    setUnlockBusy(false);

    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Unable to unlock talent.' });
      setConfirmUnlockId(null);
      return;
    }

    setConfirmUnlockId(null);
    setPostUnlockName(res.card?.revealedIdentity?.fullName || (isId ? 'Talenta' : 'Talent'));
  };

  const handleUpgradePremium = async () => {
    setPremiumBusy(true);
    const res = await activateSubscription('employer_premium', currency, 'employer');
    setPremiumBusy(false);
    if (res.ok) {
      setPremiumModalOpen(false);
      setFeedback({
        type: 'success',
        text: isId
          ? 'Prioritas UMKM aktif! Lowonganmu tampil paling atas.'
          : 'SME Priority activated! Your projects now appear at the top.',
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Unable to activate plan.' });
    }
  };

  if (loading && blindTalents.length === 0) return <PageSkeleton />;
  if (error) return <PageErrorState message={error} onRetry={retryLoad} />;

  const renderFilterControls = () => (
    <div className="space-y-5">
      {/* Work Location Segmented Control */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-ink">{isId ? 'Jangkauan Lokasi' : 'Location Scope'}</p>
        <div
          role="tablist"
          aria-label={isId ? 'Filter Lokasi Talenta' : 'Talent Location Filter'}
          className="grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={locationMode === 'nearby'}
            onClick={() => setLocationMode('nearby')}
            className={`min-h-[38px] rounded-lg px-2 text-xs font-semibold transition-colors ${
              locationMode === 'nearby'
                ? 'bg-brand text-brand-fg shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            {isId ? `Terdekat (${distanceUnit})` : `Nearest (${distanceUnit})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={locationMode === 'all'}
            onClick={() => setLocationMode('all')}
            className={`min-h-[38px] rounded-lg px-2 text-xs font-semibold transition-colors ${
              locationMode === 'all'
                ? 'bg-brand text-brand-fg shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            {isId ? 'Semua / Remote' : 'All / Remote'}
          </button>
        </div>
        <div className="flex items-center justify-between text-xs text-muted pt-1">
          <span>{isId ? 'Satuan jarak' : 'Distance unit'}</span>
          <div className="inline-flex rounded-lg border border-line bg-canvas p-0.5">
            {(['km', 'mi'] as const).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => setDistanceUnit(unit)}
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                  distanceUnit === unit ? 'bg-brand text-brand-fg' : 'text-muted'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Career Field Filter */}
      <div className="space-y-2">
        <label htmlFor="discover-field-filter" className="block text-xs font-bold text-ink">
          {isId ? 'Bidang Keahlian' : 'Career Field'}
        </label>
        <select
          id="discover-field-filter"
          value={selectedField}
          onChange={(e) => setSelectedField(e.target.value)}
          className="w-full min-h-[42px] rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink"
        >
          <option value="all">{isId ? 'Semua Bidang' : 'All Fields'}</option>
          {availableFields.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>
      </div>

      {/* Verified Only Toggle */}
      <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm font-medium text-ink">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-fresh" aria-hidden="true" />
          {isId ? 'Hanya Terverifikasi' : 'Verified Only'}
        </span>
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={(e) => setVerifiedOnly(e.target.checked)}
          className="h-4 w-4 accent-[#3B4D0C]"
        />
      </label>

      {/* Subtle Compact Dismissible SME Priority Card (Demoted so Blind Card stays focal point) */}
      {!promoDismissed && !employerProfile?.isPremium && (
        <div className="rounded-2xl border border-line bg-subtle p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
              <Crown className="h-4 w-4 text-gold-soft-fg" aria-hidden="true" />
              {isId ? 'Prioritas UMKM' : 'SME Priority'}
            </span>
            <button
              type="button"
              onClick={() => setPromoDismissed(true)}
              aria-label={isId ? 'Tutup promo prioritas' : 'Dismiss priority upgrade'}
              className="rounded-lg p-1 text-muted hover:bg-surface hover:text-ink"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            {isId
              ? `Tampilkan proyekmu di posisi teratas + 5 Token bonus (${formatMoney(premiumPrice, currency, locale)}/bln).`
              : `Pin your projects at the top + 5 bonus Tokens (${formatMoney(premiumPrice, currency, locale)}/mo).`}
          </p>
          <button
            type="button"
            onClick={() => setPremiumModalOpen(true)}
            className="w-full min-h-[38px] rounded-xl border border-line-strong bg-surface px-3 text-xs font-bold text-ink hover:bg-canvas"
          >
            {isId ? 'Lihat Detail Paket' : 'View Priority Plan'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Compact Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-h1 text-ink">
            {isId ? 'Cari Talenta Tanpa Bias' : 'Discover Blind Talent'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isId
              ? 'Tinjau keahlian terverifikasi dan kecocokan lokasi sebelum membuka identitas.'
              : 'Evaluate verified skills and location fit before spending 1 Token to reveal identity.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-subtle"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {isId ? 'Filter' : 'Filters'}
        </button>
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

      {/* Desktop: 300px Left Filter Rail + Centered Blind Talent Stage */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
        <aside className="hidden lg:block rounded-[20px] border border-line bg-surface p-5">
          {renderFilterControls()}
        </aside>

        {/* Center/Right Focal Stage */}
        <section className="mx-auto w-full max-w-[460px] space-y-4">
          {currentCard ? (
            <>
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  transform: `translate3d(${dragOffsetX}px, 0, 0) rotate(${dragOffsetX * 0.025}deg)`,
                  transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="touch-pan-y cursor-grab active:cursor-grabbing"
              >
                <BlindTalentCard card={currentCard} />
              </div>

              {/* Clean Effortless Action Dock */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSkip}
                  aria-label={isId ? 'Lewati talenta ini' : 'Skip candidate'}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-xs transition-all hover:border-line-strong hover:text-ink active:scale-95"
                >
                  <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </button>

                {currentCard.isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => navigate('/employer/chat')}
                    className="flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-fg shadow-xs transition-colors hover:bg-brand-hover"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    {isId ? 'Buka Chat & Kontrak Escrow' : 'Open Chat & Escrow'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmUnlockId(currentCard.talent.userId)}
                    className="flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-extrabold text-gold-fg shadow-xs transition-colors hover:bg-gold-hover active:scale-[0.99]"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {isId ? 'Buka Chat & Hire (1 Token)' : 'Unlock Chat & Hire (1 Token)'}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between px-1 text-xs text-muted">
                <span>
                  {isId ? 'Geser kartu atau pakai tombol ← / →' : 'Swipe card or press ← / →'}
                </span>
                <span className="tabular-nums">
                  {visibleDeck.length} {isId ? 'kandidat tersedia' : 'candidates in queue'}
                </span>
              </div>
            </>
          ) : (
            <div className="rounded-[20px] border border-line bg-surface px-6 py-12 text-center space-y-3">
              <h2 className="type-h2 text-ink">
                {isId ? 'Tidak ada kandidat tersisa di filter ini' : 'No candidates left in this view'}
              </h2>
              <p className="mx-auto max-w-sm text-sm text-muted">
                {isId
                  ? 'Atur ulang filter atau muat ulang kandidat yang dilewati untuk melanjutkan.'
                  : 'Reset your filters or reload skipped candidates to continue browsing.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSkippedIds([]);
                  setSelectedField('all');
                  setVerifiedOnly(false);
                }}
                className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-gold-fg hover:bg-gold-hover"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {isId ? 'Muat Ulang Kandidat' : 'Reload Candidates'}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Mobile Filters Sheet */}
      <Modal
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title={isId ? 'Filter Talenta' : 'Filter Talent'}
      >
        {renderFilterControls()}
      </Modal>

      {/* Transparent 1 Token Reveal Confirmation Modal */}
      <Modal
        open={Boolean(cardToUnlock)}
        onClose={() => setConfirmUnlockId(null)}
        title={isId ? 'Buka Chat & Hire (1 Token)' : 'Unlock Chat & Hire (1 Token)'}
        description={
          isId
            ? 'Memakai 1 Token membuka identitas lengkap talenta dan ruang Chat. Pendanaan Escrow proyek dilakukan terpisah nanti dengan biaya admin 10% saat pencairan.'
            : 'Spending 1 Token reveals full identity and opens Chat. Project Escrow funding is separate later with a 10% admin fee upon release.'
        }
      >
        {cardToUnlock && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-subtle p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">{cardToUnlock.talent.category}</span>
                <span className="text-xs font-semibold text-muted">{cardToUnlock.talent.candidateCode}</span>
              </div>
              <p className="text-muted">{cardToUnlock.talent.educationDetail}</p>
              <div className="flex items-center justify-between border-t border-line pt-2.5 text-xs">
                <span className="text-muted">{isId ? 'Saldo Token setelah ini' : 'Balance after unlock'}</span>
                <span className="font-bold text-ink tabular-nums">
                  {employerProfile?.tokenBalance ?? 0} →{' '}
                  {Math.max(0, (employerProfile?.tokenBalance ?? 0) - 1)} {isId ? 'Token' : 'Tokens'}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-gold-soft px-3.5 py-2.5 text-xs font-medium text-gold-soft-fg leading-relaxed">
              {isId
                ? 'Privasi WhatsApp: Nomor telepon atau WhatsApp hanya dibagikan jika talenta memilih membagikannya secara sukarela di dalam chat.'
                : 'Privacy guarantee: Direct WhatsApp or phone numbers are only shared if the talent opts in inside chat.'}
            </div>

            {(employerProfile?.tokenBalance ?? 0) < 1 ? (
              <button
                type="button"
                onClick={() => {
                  setConfirmUnlockId(null);
                  navigate('/employer/profile');
                }}
                className="w-full min-h-[44px] rounded-xl bg-gold text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
              >
                {isId ? 'Isi Saldo Token' : 'Top Up Tokens'}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmUnlockId(null)}
                  className="flex-1 min-h-[44px] rounded-xl border border-line bg-surface text-sm font-semibold text-muted hover:text-ink"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={unlockBusy}
                  onClick={handleConfirmUnlock}
                  className="flex-1 min-h-[44px] rounded-xl bg-gold text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
                >
                  {unlockBusy
                    ? isId
                      ? 'Membuka...'
                      : 'Unlocking...'
                    : isId
                    ? 'Konfirmasi (1 Token)'
                    : 'Confirm (1 Token)'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Post-Unlock Privacy Confirmation Modal */}
      <Modal
        open={Boolean(postUnlockName)}
        onClose={() => setPostUnlockName(null)}
        title={isId ? 'Chat & Fitur Hire Terbuka' : 'Chat & Hiring Unlocked'}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-status-success-bg p-4 text-status-success-text">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="text-sm leading-relaxed">
              <p className="font-bold">
                {isId
                  ? `Profil ${postUnlockName} berhasil dibuka.`
                  : `${postUnlockName}'s identity is now revealed.`}
              </p>
              <p className="mt-1 opacity-90">
                {isId
                  ? 'Ruang Chat dan kontrak Escrow sudah aktif. Kontak WhatsApp hanya akan muncul jika talenta memilih membagikannya di dalam chat.'
                  : 'Chat and Escrow hiring are ready. Direct WhatsApp or phone numbers are only shared if the talent opts in inside chat.'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPostUnlockName(null)}
              className="flex-1 min-h-[44px] rounded-xl border border-line bg-surface text-sm font-semibold text-ink"
            >
              {isId ? 'Lanjut Cari' : 'Keep Browsing'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPostUnlockName(null);
                navigate('/employer/chat');
              }}
              className="flex-1 min-h-[44px] rounded-xl bg-gold text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
            >
              {isId ? 'Buka Chat Sekarang' : 'Open Chat Now'}
            </button>
          </div>
        </div>
      </Modal>

      {/* SME Priority Upgrade Modal */}
      <Modal
        open={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
        title={isId ? 'Paket Prioritas UMKM' : 'SME Priority Plan'}
        description={
          isId
            ? 'Tampilkan lowongan proyek di posisi teratas plus 5 Token bulanan.'
            : 'Pin your projects at the top of talent search plus 5 monthly Tokens.'
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-subtle p-4">
            <p className="font-display text-2xl font-extrabold text-ink tabular-nums">
              {formatMoney(premiumPrice, currency, locale)}
              <span className="text-sm font-medium text-muted">/{isId ? 'bulan' : 'month'}</span>
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              <li>• {isId ? 'Proyek tampil di urutan teratas Cari Proyek' : 'Top placement in Find Projects'}</li>
              <li>• {isId ? 'Bonus 5 Token setiap bulan' : '5 bonus Tokens every month'}</li>
              <li>• {isId ? 'Dukungan prioritas untuk kontrak Escrow' : 'Priority Escrow review support'}</li>
            </ul>
          </div>
          <button
            type="button"
            disabled={premiumBusy || employerProfile?.isPremium}
            onClick={handleUpgradePremium}
            className="w-full min-h-[44px] rounded-xl bg-gold text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
          >
            {premiumBusy
              ? isId
                ? 'Mengaktifkan...'
                : 'Activating...'
              : isId
              ? 'Aktifkan Prioritas UMKM'
              : 'Activate SME Priority'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
