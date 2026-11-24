import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Check,
  Circle,
  Download,
  ExternalLink,
  MapPin,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Upload,
  Wallet,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Opportunity } from '../types/timu';
import {
  calculateDistanceKm,
  formatMoney,
  getTierFromExp,
  parseMajorToMinor,
} from '../lib/domain';
import { Modal } from '../components/Modal';
import { PageErrorState, PageSkeleton } from '../components/StateBlocks';

const BOOSTER_ITEMS = [
  { id: 'bio', labelId: 'Lengkapi Bio Singkat', labelEn: 'Complete Short Bio' },
  { id: 'portfolio', labelId: 'Tautkan Portofolio Proyek', labelEn: 'Link Project Portfolio' },
  { id: 'linkedin', labelId: 'Hubungkan Profil LinkedIn', labelEn: 'Connect LinkedIn Profile' },
  { id: 'bootcamp', labelId: 'Tambahkan Riwayat Pelatihan', labelEn: 'Add Bootcamp or Training' },
] as const;

export const TalentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    locale,
    loading,
    error,
    retryLoad,
    profile,
    talentProfile,
    opportunities,
    applications,
    contracts,
    certificates,
    skillBadges,
    walletTransactions,
    applyToOpportunity,
    submitDeliverable,
    withdrawWallet,
  } = useWorkspace();

  const isId = locale === 'id';

  const [completedBoosters, setCompletedBoosters] = useState<string[]>(['bio', 'portfolio']);
  const [fieldFilter, setFieldFilter] = useState<'mine' | 'all' | 'remote'>('mine');

  // Deliverable modal
  const [deliverableOpen, setDeliverableOpen] = useState(false);
  const [deliverableUrl, setDeliverableUrl] = useState('https://portfolio.example.com/deliverables/menu-v1');
  const [deliverableNote, setDeliverableNote] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  // Apply modal
  const [applyOpp, setApplyOpp] = useState<Opportunity | null>(null);
  const [pitch, setPitch] = useState('');
  const [portfolioLink, setPortfolioLink] = useState(
    talentProfile?.portfolioUrl || 'https://portfolio.example.com/tm-1024'
  );

  // Wallet modals
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [withdrawMajor, setWithdrawMajor] = useState('150000');
  const [payoutDest, setPayoutDest] = useState('BCA / GoPay 0812-1024-8899');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const availableWalletMinor = useMemo(() => {
    return walletTransactions.reduce((sum, tx) => {
      if (tx.type === 'escrow_release') return sum + tx.amountMinor;
      if (tx.type === 'withdrawal') return sum - tx.amountMinor;
      return sum;
    }, 0);
  }, [walletTransactions]);

  const activeContract = useMemo(
    () => contracts.find((c) => c.talentId === profile?.id && c.escrowStatus !== 'released'),
    [contracts, profile?.id]
  );

  const pendingEscrowMinor = useMemo(() => {
    return contracts
      .filter((c) => c.talentId === profile?.id && c.escrowStatus !== 'released')
      .reduce((sum, c) => sum + c.netTalentMinor, 0);
  }, [contracts, profile?.id]);

  const expPoints = talentProfile?.expPoints ?? 100;
  const tier = getTierFromExp(expPoints);
  const nextExpTarget = tier.nextTierExp ?? 1000;
  const expPct = Math.min(100, Math.max(8, Math.round((expPoints / nextExpTarget) * 100)));
  const firstName = (profile?.fullName || 'Aldi').split(' ')[0];

  const myCareerField = talentProfile?.careerField || 'Desain';
  const recommendedProjects = useMemo(() => {
    return opportunities
      .filter((o) => o.status === 'open')
      .filter((o) => {
        if (fieldFilter === 'mine') return o.careerField === myCareerField;
        if (fieldFilter === 'remote') return o.workMode === 'remote';
        return true;
      })
      .slice(0, 4);
  }, [opportunities, fieldFilter, myCareerField]);

  const appliedOppIds = useMemo(
    () => new Set(applications.filter((a) => a.talentId === profile?.id).map((a) => a.opportunityId)),
    [applications, profile?.id]
  );

  const handleToggleBooster = (id: string) => {
    setCompletedBoosters((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContract || !deliverableUrl.trim()) return;
    setActionBusy(true);
    const res = await submitDeliverable(activeContract.id, deliverableUrl.trim(), deliverableNote.trim());
    setActionBusy(false);
    if (res.ok) {
      setDeliverableOpen(false);
      setFeedback({
        type: 'success',
        text: isId
          ? 'Hasil kerja berhasil dikirim! Menunggu persetujuan UMKM untuk pencairan Escrow.'
          : 'Deliverable submitted! Awaiting employer approval to release Escrow.',
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Unable to submit deliverable.' });
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyOpp || !pitch.trim()) return;
    setActionBusy(true);
    const res = await applyToOpportunity(applyOpp.id, pitch.trim(), portfolioLink.trim());
    setActionBusy(false);
    if (res.ok) {
      setApplyOpp(null);
      setPitch('');
      setFeedback({
        type: 'success',
        text: isId
          ? `Lamaran terkirim ke ${applyOpp.businessName}.`
          : `Application submitted to ${applyOpp.businessName}.`,
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Unable to submit application.' });
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountMinor = parseMajorToMinor(withdrawMajor, 'IDR');
    if (amountMinor <= 0 || !payoutDest.trim()) return;
    setActionBusy(true);
    const res = await withdrawWallet(amountMinor, 'IDR', payoutDest.trim());
    setActionBusy(false);
    if (res.ok) {
      setWithdrawOpen(false);
      setFeedback({
        type: 'success',
        text: isId
          ? `Penarikan ${formatMoney(amountMinor, 'IDR', locale)} berhasil diajukan.`
          : `Withdrawal of ${formatMoney(amountMinor, 'IDR', locale)} submitted.`,
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Unable to process withdrawal.' });
    }
  };

  if (loading && !profile) return <PageSkeleton />;
  if (error) return <PageErrorState message={error} onRetry={retryLoad} />;

  return (
    <div className="space-y-6">
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

      {/* Desktop 2-Column Workspace Grid (8 / 4 split) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Main Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Sleek Deep Forest-Olive Hero Header */}
          <section className="rounded-[24px] border border-line/20 bg-wallet p-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {isId ? `Halo, ${firstName}` : `Hello, ${firstName}`}
                </h1>
                <p className="mt-1 text-sm text-wallet-muted">
                  {talentProfile?.category || (isId ? 'Talenta' : 'Talent')} · {profile?.city || 'Bandung'} ·{' '}
                  {profile?.timezone || 'UTC+7'}
                </p>
              </div>
              {!talentProfile?.firstQuestCompleted && (
                <Link
                  to="/talent/first-quest"
                  className="inline-flex min-h-[40px] items-center rounded-xl bg-gold px-4 text-xs font-extrabold text-gold-fg hover:bg-gold-hover whitespace-nowrap"
                >
                  {isId ? 'Lanjutkan First Quest' : 'Continue First Quest'}
                </Link>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full bg-gold px-3.5 py-1 text-xs font-extrabold text-gold-fg">
                Level {tier.level}
              </span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {expPoints} / {nextExpTarget} EXP
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={expPoints}
              aria-valuemin={0}
              aria-valuemax={nextExpTarget}
              aria-label={isId ? 'Progres EXP Level' : 'Level EXP progress'}
              className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-white/15"
            >
              <div
                className="h-full rounded-full bg-gold transition-all duration-300"
                style={{ width: `${expPct}%` }}
              />
            </div>
          </section>

          {/* Crisp Pure-White Active Project & Escrow Status Card */}
          <section className="rounded-[20px] border border-line bg-surface p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-muted">
                  {isId ? 'Proyek Aktif & Status Escrow' : 'Active Project & Escrow Status'}
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">
                  {activeContract?.title || (isId ? 'Desain Menu Kafe' : 'Cafe Menu Design')}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {activeContract?.businessName || 'Kopi Senja'} ·{' '}
                  {isId
                    ? `Di-hire UMKM ${talentProfile?.completedGigsCount ?? 2}× total`
                    : `Hired by SMEs ${talentProfile?.completedGigsCount ?? 2}× total`}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-status-success-bg px-3 py-1 text-xs font-bold text-status-success-text">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {activeContract?.escrowStatus === 'deliverable_submitted'
                  ? isId
                    ? 'Hasil Kerja Dikirim'
                    : 'Deliverable Submitted'
                  : isId
                  ? 'Dana Dilindungi Escrow'
                  : 'Funds Protected in Escrow'}
              </span>
            </div>

            {activeContract && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-subtle px-4 py-3 text-xs">
                <span className="text-muted">
                  {isId ? 'Penerimaan bersih setelah biaya admin 10%' : 'Net payout after 10% admin fee'}
                </span>
                <span className="font-bold text-ink tabular-nums">
                  {formatMoney(activeContract.netTalentMinor, activeContract.currency, locale)}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/talent/chat')}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-canvas px-4 text-sm font-bold text-ink hover:bg-subtle whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {isId ? 'Chat dengan UMKM' : 'Chat with Employer'}
              </button>
              {activeContract && activeContract.escrowStatus === 'funded' && (
                <button
                  type="button"
                  onClick={() => setDeliverableOpen(true)}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-extrabold text-gold-fg hover:bg-gold-hover whitespace-nowrap"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {isId ? 'Kirim Hasil Kerja' : 'Submit Deliverable'}
                </button>
              )}
            </div>
          </section>

          {/* Recommended Projects */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="type-h2 text-ink">
                  {isId ? 'Rekomendasi Proyek' : 'Recommended Projects'}
                </h2>
                <p className="text-xs text-muted">
                  {isId ? 'Proyek ber-Escrow dan pekerjaan terbaru dari UMKM' : 'Escrow projects and jobs from verified SMEs'}
                </p>
              </div>
              <div className="inline-flex rounded-xl bg-subtle p-1">
                {(
                  [
                    { id: 'mine', label: isId ? `Bidang saya (${myCareerField})` : `My Field (${myCareerField})` },
                    { id: 'all', label: isId ? 'Semua' : 'All' },
                    { id: 'remote', label: 'Remote' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFieldFilter(tab.id)}
                    className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                      fieldFilter === tab.id ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {recommendedProjects.map((opp) => {
                const dist = profile
                  ? calculateDistanceKm(profile.lat, profile.lng, opp.lat, opp.lng)
                  : 1.0;
                const alreadyApplied = appliedOppIds.has(opp.id);
                return (
                  <article
                    key={opp.id}
                    className="flex flex-col justify-between rounded-[20px] border border-line bg-surface p-5 transition-all hover:border-line-strong hover:shadow-card"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-base font-bold text-ink leading-snug">
                          {opp.title}
                        </h3>
                        <span className="shrink-0 font-display text-base font-extrabold text-brand tabular-nums">
                          {formatMoney(opp.budgetMinor, opp.currency, locale)}
                        </span>
                      </div>
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted">
                        <span>{opp.businessName}</span>
                        <span aria-hidden="true">·</span>
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="tabular-nums">
                          {opp.workMode === 'remote' ? `Remote · ${opp.timezone}` : `${dist} km`}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-4">
                      <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-fg">
                        {opp.careerField}
                      </span>
                      <button
                        type="button"
                        disabled={alreadyApplied}
                        onClick={() => setApplyOpp(opp)}
                        className={`min-h-[40px] rounded-xl px-4 text-xs font-extrabold transition-colors ${
                          alreadyApplied
                            ? 'bg-subtle text-muted'
                            : 'bg-gold text-gold-fg hover:bg-gold-hover'
                        }`}
                      >
                        {alreadyApplied
                          ? isId
                            ? 'Sudah Dilamar'
                            : 'Applied'
                          : isId
                          ? 'Lamar Proyek'
                          : 'Apply to Project'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Fintech Forest-Olive Escrow Wallet + Credentials */}
        <div className="lg:col-span-4 space-y-6">
          {/* Deep Forest-Olive Fintech Escrow Wallet Card (#233008) */}
          <section className="rounded-[24px] border border-line/20 bg-wallet p-6 text-white shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-wallet-muted">
                <Wallet className="h-4 w-4 text-brand-fresh" aria-hidden="true" />
                {isId ? 'Dompet Escrow' : 'Escrow Wallet'}
              </span>
              <button
                type="button"
                onClick={() => setLedgerOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-wallet-muted hover:text-white"
              >
                <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
                {isId ? 'Rincian 10%' : '10% Fee Ledger'}
              </button>
            </div>

            <div>
              <p className="text-xs text-wallet-muted">
                {isId ? 'Saldo Siap Tarik' : 'Available Balance'}
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-white tabular-nums">
                {formatMoney(Math.max(0, availableWalletMinor), 'IDR', locale)}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-white/15 pt-4 text-xs">
              <span className="text-wallet-muted">{isId ? 'Dana di Escrow Aktif' : 'Pending in Escrow'}</span>
              <span className="font-bold text-white tabular-nums">
                {formatMoney(pendingEscrowMinor, 'IDR', locale)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gold text-sm font-extrabold text-gold-fg transition-colors hover:bg-gold-hover"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isId ? 'Tarik Dana' : 'Withdraw Funds'}
            </button>
          </section>

          {/* Profile Boosters Checklist */}
          <section className="rounded-[20px] border border-line bg-surface p-5 space-y-3.5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-base font-bold text-ink">
                {isId ? 'Penguat Profil' : 'Profile Boosters'}
              </h2>
              <span className="text-xs font-semibold text-muted tabular-nums">
                {completedBoosters.length}/{BOOSTER_ITEMS.length}
              </span>
            </div>
            <div className="space-y-2">
              {BOOSTER_ITEMS.map((item) => {
                const done = completedBoosters.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleBooster(item.id)}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
                      done
                        ? 'border-line bg-subtle text-muted'
                        : 'border-line bg-canvas text-ink hover:border-line-strong'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        done ? 'bg-brand text-brand-fg' : 'bg-gold-soft text-gold-soft-fg'
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <Circle className="h-3.5 w-3.5" />}
                    </span>
                    <span className={done ? 'line-through' : 'font-medium'}>
                      {isId ? item.labelId : item.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Verifiable Certificates & Skill Badges */}
          <section className="rounded-[20px] border border-line bg-surface p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 font-display text-base font-bold text-ink">
                <Award className="h-4 w-4 text-brand-fresh" aria-hidden="true" />
                {isId ? 'Sertifikat & Lencana' : 'Certificates & Badges'}
              </h2>
              <Link to="/talent/profile" className="text-xs font-bold text-brand hover:underline">
                {isId ? 'Semua' : 'View all'}
              </Link>
            </div>

            {skillBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skillBadges.map((b) => (
                  <span
                    key={b.id}
                    className="rounded-full bg-subtle px-3 py-1 text-xs font-semibold text-ink"
                  >
                    {b.badgeName}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {certificates.slice(0, 2).map((cert) => (
                <Link
                  key={cert.id}
                  to={`/verify/${cert.verificationCode}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas p-3 hover:border-line-strong"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink">{cert.projectTitle}</p>
                    <p className="text-[11px] text-muted tabular-nums">
                      {cert.businessName} · {cert.verificationCode}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Submit Deliverable Modal */}
      <Modal
        open={deliverableOpen}
        onClose={() => setDeliverableOpen(false)}
        title={isId ? 'Kirim Hasil Kerja' : 'Submit Deliverable'}
        description={
          isId
            ? 'Bagikan tautan hasil kerja agar UMKM dapat meninjau dan mencairkan dana Escrow.'
            : 'Share your final deliverable link so the employer can review and release Escrow.'
        }
      >
        <form onSubmit={handleSubmitDeliverable} className="space-y-4">
          <div>
            <label htmlFor="dash-deliv-url" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Tautan Hasil Kerja' : 'Deliverable Link'}
            </label>
            <input
              id="dash-deliv-url"
              type="url"
              required
              value={deliverableUrl}
              onChange={(e) => setDeliverableUrl(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="dash-deliv-note" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Catatan Singkat' : 'Delivery Note'}
            </label>
            <textarea
              id="dash-deliv-note"
              rows={3}
              value={deliverableNote}
              onChange={(e) => setDeliverableNote(e.target.value)}
              placeholder={isId ? 'Semua file PDF siap cetak dan PNG sudah lengkap.' : 'Print-ready PDF and PNG assets included.'}
              className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={actionBusy}
            className="w-full min-h-[48px] rounded-xl bg-gold text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
          >
            {actionBusy ? (isId ? 'Mengirim...' : 'Submitting...') : isId ? 'Kirim Hasil Kerja' : 'Submit Deliverable'}
          </button>
        </form>
      </Modal>

      {/* Apply to Project Modal */}
      <Modal
        open={Boolean(applyOpp)}
        onClose={() => setApplyOpp(null)}
        title={applyOpp ? `${isId ? 'Lamar Proyek' : 'Apply to Project'}: ${applyOpp.title}` : ''}
        description={
          applyOpp
            ? `${applyOpp.businessName} · ${formatMoney(applyOpp.budgetMinor, applyOpp.currency, locale)}`
            : undefined
        }
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label htmlFor="dash-pitch" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Pesan Singkat untuk UMKM' : 'Short Pitch'}
            </label>
            <textarea
              id="dash-pitch"
              rows={3}
              required
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder={isId ? 'Jelaskan pengalaman relevan dan estimasi penyelesaian...' : 'Explain your fit and timeline...'}
              className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="dash-port" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Tautan Portofolio' : 'Portfolio URL'}
            </label>
            <input
              id="dash-port"
              type="url"
              value={portfolioLink}
              onChange={(e) => setPortfolioLink(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={actionBusy}
            className="w-full min-h-[48px] rounded-xl bg-gold text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
          >
            {actionBusy ? (isId ? 'Mengirim...' : 'Sending...') : isId ? 'Lamar Proyek' : 'Apply to Project'}
          </button>
        </form>
      </Modal>

      {/* Withdraw Funds Modal */}
      <Modal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title={isId ? 'Tarik Dana Dompet' : 'Withdraw Funds'}
        description={
          isId
            ? `Saldo tersedia: ${formatMoney(Math.max(0, availableWalletMinor), 'IDR', locale)}`
            : `Available balance: ${formatMoney(Math.max(0, availableWalletMinor), 'IDR', locale)}`
        }
      >
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label htmlFor="wd-amount" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Nominal Penarikan (IDR)' : 'Withdrawal Amount (IDR)'}
            </label>
            <input
              id="wd-amount"
              type="number"
              min={10000}
              max={Math.max(10000, availableWalletMinor)}
              required
              value={withdrawMajor}
              onChange={(e) => setWithdrawMajor(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink tabular-nums"
            />
          </div>
          <div>
            <label htmlFor="wd-dest" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Bank / E-Wallet / Stripe Connect Tujuan' : 'Bank / E-Wallet / Stripe Connect Account'}
            </label>
            <input
              id="wd-dest"
              type="text"
              required
              value={payoutDest}
              onChange={(e) => setPayoutDest(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={actionBusy || availableWalletMinor <= 0}
            className="w-full min-h-[48px] rounded-xl bg-gold text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
          >
            {actionBusy ? (isId ? 'Memproses...' : 'Processing...') : isId ? 'Konfirmasi Penarikan' : 'Confirm Withdrawal'}
          </button>
        </form>
      </Modal>

      {/* Transparent 10% Fee Ledger Modal */}
      <Modal
        open={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        title={isId ? 'Riwayat Transaksi & Biaya Admin 10%' : 'Escrow Ledger & 10% Admin Fee'}
      >
        <div className="divide-y divide-line">
          {walletTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-semibold text-ink">{tx.description}</p>
                <p className="text-xs text-muted">{tx.status}</p>
              </div>
              <span
                className={`shrink-0 font-bold tabular-nums ${
                  tx.type === 'escrow_release' ? 'text-status-success-text' : 'text-muted'
                }`}
              >
                {tx.type === 'escrow_release' ? '+' : '-'}
                {formatMoney(tx.amountMinor, tx.currency, locale)}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
