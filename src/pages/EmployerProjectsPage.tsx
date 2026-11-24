import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { CurrencyCode, Opportunity, OpportunityType, WorkMode } from '../types/timu';
import { formatMoney, parseMajorToMinor } from '../lib/domain';
import { EscrowBreakdownBox } from '../components/EscrowBreakdownBox';
import { Modal } from '../components/Modal';
import { PageErrorState, PageSkeleton } from '../components/StateBlocks';

export const EmployerProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    locale,
    currency,
    loading,
    error,
    retryLoad,
    profile,
    employerProfile,
    opportunities,
    applications,
    contracts,
    blindTalents,
    publishOpportunity,
    updateApplicationStatus,
    unlockTalent,
    fundContract,
    releaseContract,
  } = useWorkspace();

  const isId = locale === 'id';
  const [activeTab, setActiveTab] = useState<'projects' | 'contracts'>('projects');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Project Form
  const [oppType, setOppType] = useState<OpportunityType>('escrow_gig');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deliverableScope, setDeliverableScope] = useState('');
  const [careerField, setCareerField] = useState('Desain');
  const [workMode, setWorkMode] = useState<WorkMode>('onsite');
  const [city, setCity] = useState(employerProfile?.city || 'Bandung');
  const [budgetMajor, setBudgetMajor] = useState(currency === 'IDR' ? '300000' : '45');
  const [budgetCurrency, setBudgetCurrency] = useState<CurrencyCode>(currency);
  const [deadline, setDeadline] = useState('2026-12-28');

  const myOpportunities = useMemo(
    () => opportunities.filter((o) => o.employerId === profile?.id),
    [opportunities, profile?.id]
  );

  const unlockedTalents = useMemo(
    () => blindTalents.filter((c) => c.isUnlocked),
    [blindTalents]
  );

  const employerContracts = useMemo(
    () => contracts.filter((c) => c.employerId === profile?.id || c.businessName === employerProfile?.businessName),
    [contracts, profile?.id, employerProfile?.businessName]
  );

  const selectedOpp: Opportunity | undefined = myOpportunities.find((o) => o.id === selectedOppId);
  const selectedApps = useMemo(
    () => applications.filter((a) => a.opportunityId === selectedOppId),
    [applications, selectedOppId]
  );
  const selectedContracts = useMemo(
    () => contracts.filter((c) => c.opportunityId === selectedOppId),
    [contracts, selectedOppId]
  );

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const budgetMinor = parseMajorToMinor(budgetMajor, budgetCurrency);
    if (!title.trim() || !description.trim() || budgetMinor <= 0) {
      setFeedback({
        type: 'error',
        text: isId
          ? 'Lengkapi judul, deskripsi, dan anggaran proyek dengan benar.'
          : 'Please enter a valid title, description, and budget.',
      });
      return;
    }

    setBusy(true);
    const res = await publishOpportunity({
      opportunityType: oppType,
      title: title.trim(),
      description: description.trim(),
      deliverableScope: deliverableScope.trim() || description.trim(),
      careerField,
      workMode,
      city: city.trim() || 'Bandung',
      timezone: employerProfile?.timezone || 'UTC+7',
      budgetMinor,
      currency: budgetCurrency,
      deadline,
    });
    setBusy(false);

    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Unable to post project.' });
      return;
    }

    setTitle('');
    setDescription('');
    setDeliverableScope('');
    setCreateOpen(false);
    setFeedback({
      type: 'success',
      text: isId
        ? 'Proyek berhasil diterbitkan! 1 Token digunakan.'
        : 'Project published! 1 Token spent.',
    });
  };

  const handleHireApplicant = async (appId: string, talentId: string, opp: Opportunity) => {
    setBusy(true);
    setFeedback(null);

    const card = blindTalents.find((c) => c.talent.userId === talentId);
    let conversationId = card?.conversationId;
    if (card && !card.isUnlocked) {
      const unlockRes = await unlockTalent(talentId);
      if (!unlockRes.ok) {
        setBusy(false);
        setFeedback({ type: 'error', text: unlockRes.error || 'Unable to unlock applicant.' });
        return;
      }
      conversationId = unlockRes.conversationId;
    }

    await updateApplicationStatus(appId, 'hired');
    const fundRes = await fundContract({
      conversationId,
      opportunityId: opp.id,
      talentId,
      title: opp.title,
      scopeSummary: opp.deliverableScope,
      grossAmountMinor: opp.budgetMinor,
      currency: opp.currency,
    });
    setBusy(false);

    if (!fundRes.ok) {
      setFeedback({ type: 'error', text: fundRes.error || 'Unable to lock Escrow funds.' });
      return;
    }

    setSelectedOppId(null);
    setFeedback({
      type: 'success',
      text: isId
        ? 'Talenta di-hire dan dana proyek telah dikunci di Escrow.'
        : 'Talent hired and project funds locked in Escrow.',
    });
  };

  const handleRelease = async (contractId: string) => {
    setBusy(true);
    const res = await releaseContract(contractId);
    setBusy(false);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Unable to release Escrow funds.' });
      return;
    }
    setFeedback({
      type: 'success',
      text: isId
        ? `Escrow dicairkan (90% Talenta / 10% Admin) & Sertifikat ${res.certificate?.verificationCode ?? ''} diterbitkan.`
        : `Escrow released (90% Talent / 10% Fee) and Certificate ${res.certificate?.verificationCode ?? ''} issued.`,
    });
  };

  if (loading && opportunities.length === 0) return <PageSkeleton />;
  if (error) return <PageErrorState message={error} onRetry={retryLoad} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-h1 text-ink">{isId ? 'Proyek Saya' : 'My Projects'}</h1>
          <p className="mt-1 text-sm text-muted">
            {isId
              ? 'Kelola proyek ber-Escrow, lowongan kerja, pelamar, dan pencairan dana.'
              : 'Manage Escrow projects, job openings, applicants, and Escrow releases.'}
          </p>
        </div>

        {/* Clean Tabbed Switcher */}
        <div role="tablist" className="inline-flex rounded-xl bg-subtle p-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'projects'}
            onClick={() => setActiveTab('projects')}
            className={`min-h-[40px] rounded-lg px-4 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            {isId ? `Proyek Aktif (${myOpportunities.length})` : `Active Projects (${myOpportunities.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'contracts'}
            onClick={() => setActiveTab('contracts')}
            className={`min-h-[40px] rounded-lg px-4 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'contracts'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            {isId
              ? `Talenta & Kontrak (${unlockedTalents.length + employerContracts.length})`
              : `Unlocked & Contracts (${unlockedTalents.length + employerContracts.length})`}
          </button>
        </div>
      </div>

      {/* Primary Top Trigger: Clean Dashed Card */}
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="flex w-full min-h-[64px] items-center justify-between gap-4 rounded-[20px] border-2 border-dashed border-line-strong bg-surface px-5 py-4 text-left transition-colors hover:border-brand hover:bg-subtle/60"
      >
        <div className="flex items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-gold-fg">
            <Plus className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
          </span>
          <div>
            <span className="block text-sm font-bold text-ink">
              {isId ? 'Buat Proyek Baru (1 Token)' : 'Post a Project (1 Token)'}
            </span>
            <span className="text-xs text-muted">
              {isId
                ? 'Dukung Proyek Escrow (10% biaya admin) maupun lowongan Part-Time / Full-Time.'
                : 'Supports Escrow Projects (10% admin fee) as well as Part-Time and Full-Time Jobs.'}
            </span>
          </div>
        </div>
        <span className="hidden sm:inline-flex shrink-0 rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-gold-soft-fg">
          1 Token
        </span>
      </button>

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

      {/* Tab 1: Active Projects */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {myOpportunities.length === 0 ? (
            <div className="col-span-full rounded-[20px] border border-line bg-surface p-10 text-center space-y-3">
              <h2 className="type-h2 text-ink">
                {isId ? 'Belum ada proyek aktif' : 'No active projects yet'}
              </h2>
              <p className="text-sm text-muted">
                {isId
                  ? 'Publikasikan proyek pertama Anda agar talenta terverifikasi dapat melamar.'
                  : 'Post your first project so verified talent can apply with a pitch.'}
              </p>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="min-h-[44px] rounded-xl bg-gold px-5 text-sm font-bold text-gold-fg"
              >
                {isId ? 'Buat Proyek Baru (1 Token)' : 'Post a Project (1 Token)'}
              </button>
            </div>
          ) : (
            myOpportunities.map((opp) => {
              const appCount = applications.filter((a) => a.opportunityId === opp.id).length;
              return (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => setSelectedOppId(opp.id)}
                  className="flex flex-col justify-between rounded-[20px] border border-line bg-surface p-5 sm:p-6 text-left transition-all hover:border-line-strong hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted">
                        {opp.opportunityType === 'escrow_gig'
                          ? isId
                            ? 'Proyek Escrow'
                            : 'Escrow Project'
                          : opp.opportunityType === 'part_time'
                          ? 'Part-Time'
                          : 'Full-Time'}{' '}
                        · {opp.workMode} · {opp.city}
                      </p>
                      <h2 className="mt-1.5 font-display text-lg font-bold text-ink leading-snug">
                        {opp.title}
                      </h2>
                    </div>
                    <span className="shrink-0 font-display text-lg font-extrabold text-brand tabular-nums">
                      {formatMoney(opp.budgetMinor, opp.currency, locale)}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-muted">{opp.description}</p>

                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-fg">
                        {opp.status === 'open'
                          ? isId
                            ? 'Terbuka'
                            : 'Open'
                          : isId
                          ? 'Selesai'
                          : 'Completed'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted tabular-nums">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {appCount} {isId ? 'pelamar' : 'applicants'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-brand">
                      {isId ? 'Kelola pelamar →' : 'Inspect →'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Unlocked Talents & Active Escrow Contracts */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          {unlockedTalents.length === 0 && employerContracts.length === 0 ? (
            <div className="rounded-[20px] border border-line bg-surface p-10 text-center space-y-3">
              <h2 className="type-h2 text-ink">
                {isId ? 'Belum ada talenta terbuka atau kontrak aktif' : 'No unlocked talent or contracts yet'}
              </h2>
              <p className="text-sm text-muted">
                {isId
                  ? 'Buka profil talenta di Cari Talenta dengan 1 Token untuk memulai Chat & Escrow.'
                  : 'Unlock a talent profile in Discover Talent with 1 Token to open Chat and Escrow.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/employer/discover')}
                className="min-h-[44px] rounded-xl bg-gold px-5 text-sm font-bold text-gold-fg"
              >
                {isId ? 'Cari Talenta Tanpa Bias' : 'Browse Blind Talent'}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
              {employerContracts.map((ctr) => (
                <div
                  key={ctr.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted">
                      {ctr.talentName} · {ctr.escrowStatus}
                    </p>
                    <h3 className="mt-0.5 font-display text-base font-bold text-ink">{ctr.title}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-ink tabular-nums">
                      {formatMoney(ctr.grossAmountMinor, ctr.currency, locale)}
                    </span>
                    {ctr.escrowStatus !== 'released' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRelease(ctr.id)}
                        className="min-h-[40px] rounded-xl bg-gold px-4 text-xs font-bold text-gold-fg hover:bg-gold-hover"
                      >
                        {isId ? 'Setujui & Cairkan Escrow' : 'Approve & Release Escrow'}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-status-success-bg px-3 py-1 text-xs font-bold text-status-success-text">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {isId ? 'Cair' : 'Released'}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {unlockedTalents.map((item) => (
                <div
                  key={item.talent.userId}
                  className="flex flex-wrap items-center justify-between gap-4 p-5"
                >
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">
                      {item.revealedIdentity?.fullName || item.talent.candidateCode}
                    </h3>
                    <p className="text-xs text-muted">
                      {item.talent.educationDetail} · {isId ? 'Chat Terbuka' : 'Chat Open'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/employer/chat')}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-line bg-canvas px-4 text-xs font-bold text-ink hover:bg-subtle"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {isId ? 'Buka Chat' : 'Open Chat'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Slide-Over Create Project Drawer */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        variant="drawer"
        title={isId ? 'Buat Proyek Baru' : 'Post a Project'}
        description={
          isId
            ? 'Menerbitkan proyek menggunakan 1 Token anti-spam dan mendukung Escrow pihak ketiga (biaya admin 10%).'
            : 'Publishing uses 1 anti-spam Token and supports third-party Escrow (10% admin fee).'
        }
      >
        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label htmlFor="opp-type" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Jenis Kesempatan' : 'Opportunity Type'}
            </label>
            <select
              id="opp-type"
              value={oppType}
              onChange={(e) => setOppType(e.target.value as OpportunityType)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            >
              <option value="escrow_gig">{isId ? 'Proyek Escrow' : 'Escrow Project'}</option>
              <option value="part_time">{isId ? 'Pekerjaan Part-Time' : 'Part-Time Job'}</option>
              <option value="full_time">{isId ? 'Pekerjaan Full-Time' : 'Full-Time Job'}</option>
            </select>
          </div>

          <div>
            <label htmlFor="opp-title" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Judul Proyek / Posisi' : 'Project or Job Title'}
            </label>
            <input
              id="opp-title"
              type="text"
              required
              placeholder={isId ? 'Contoh: Desain stiker kemasan kopi' : 'e.g. Coffee packaging label design'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="opp-field" className="block text-xs font-bold text-ink mb-1.5">
                {isId ? 'Bidang' : 'Category'}
              </label>
              <select
                id="opp-field"
                value={careerField}
                onChange={(e) => setCareerField(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink"
              >
                <option value="Desain">Desain</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Web & App">Web & App</option>
                <option value="Keuangan & Admin">Keuangan & Admin</option>
              </select>
            </div>
            <div>
              <label htmlFor="opp-mode" className="block text-xs font-bold text-ink mb-1.5">
                {isId ? 'Mode Kerja' : 'Work Mode'}
              </label>
              <select
                id="opp-mode"
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink"
              >
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label htmlFor="opp-budget" className="block text-xs font-bold text-ink mb-1.5">
                {isId ? 'Anggaran / Gaji' : 'Budget / Salary'}
              </label>
              <input
                id="opp-budget"
                type="number"
                min={1}
                required
                value={budgetMajor}
                onChange={(e) => setBudgetMajor(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="opp-curr" className="block text-xs font-bold text-ink mb-1.5">
                {isId ? 'Mata Uang' : 'Currency'}
              </label>
              <select
                id="opp-curr"
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value as CurrencyCode)}
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-2.5 text-sm text-ink"
              >
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="opp-city" className="block text-xs font-bold text-ink mb-1.5">
                {isId ? 'Kota' : 'City'}
              </label>
              <input
                id="opp-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
              />
            </div>
            <div>
              <label htmlFor="opp-deadline" className="block text-xs font-bold text-ink mb-1.5">
                {isId ? 'Batas Waktu' : 'Deadline'}
              </label>
              <input
                id="opp-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
              />
            </div>
          </div>

          <div>
            <label htmlFor="opp-desc" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Deskripsi & Hasil Kerja' : 'Description & Deliverables'}
            </label>
            <textarea
              id="opp-desc"
              rows={3}
              required
              placeholder={
                isId
                  ? 'Jelaskan ruang lingkup, format file akhir, dan jadwal revisi...'
                  : 'Describe scope, expected deliverables, and revision schedule...'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
            />
          </div>

          {oppType === 'escrow_gig' && (
            <EscrowBreakdownBox
              grossAmountMinor={parseMajorToMinor(budgetMajor, budgetCurrency)}
              currency={budgetCurrency}
            />
          )}

          <button
            type="submit"
            disabled={busy || (employerProfile?.tokenBalance ?? 0) < 1}
            className="w-full min-h-[48px] rounded-xl bg-gold text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
          >
            {busy
              ? isId
                ? 'Menerbitkan...'
                : 'Publishing...'
              : isId
              ? 'Terbitkan Proyek (1 Token)'
              : 'Post a Project (1 Token)'}
          </button>
        </form>
      </Modal>

      {/* Slide-Over Applicant & Escrow Inspector Drawer */}
      <Modal
        open={Boolean(selectedOpp)}
        onClose={() => setSelectedOppId(null)}
        variant="drawer"
        title={selectedOpp?.title || ''}
        description={
          selectedOpp
            ? `${formatMoney(selectedOpp.budgetMinor, selectedOpp.currency, locale)} · ${selectedOpp.careerField} · ${selectedOpp.city}`
            : undefined
        }
      >
        {selectedOpp && (
          <div className="space-y-6">
            <p className="text-sm leading-relaxed text-muted">{selectedOpp.description}</p>

            {selectedContracts.length > 0 && (
              <div className="space-y-3">
                <h3 className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
                  <ShieldCheck className="h-4 w-4 text-brand-fresh" aria-hidden="true" />
                  {isId ? 'Kontrak Escrow Aktif' : 'Active Escrow Contracts'}
                </h3>
                {selectedContracts.map((ctr) => (
                  <div key={ctr.id} className="rounded-2xl border border-line bg-subtle p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-ink">{ctr.talentName}</span>
                      <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-brand-fg">
                        {ctr.escrowStatus}
                      </span>
                    </div>
                    {ctr.deliverableUrl && (
                      <a
                        href={ctr.deliverableUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                      >
                        {isId ? 'Tinjau Hasil Kerja' : 'Review Deliverable'}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                    {ctr.escrowStatus !== 'released' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRelease(ctr.id)}
                        className="w-full min-h-[44px] rounded-xl bg-gold text-xs font-extrabold text-gold-fg hover:bg-gold-hover"
                      >
                        {isId ? 'Setujui & Cairkan Escrow' : 'Approve & Release Escrow'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
                <Users className="h-4 w-4 text-brand-fresh" aria-hidden="true" />
                {isId ? `Pelamar (${selectedApps.length})` : `Applicants (${selectedApps.length})`}
              </h3>
              {selectedApps.length === 0 ? (
                <p className="rounded-xl bg-subtle p-4 text-center text-sm text-muted">
                  {isId ? 'Belum ada pelamar untuk proyek ini.' : 'No applicants yet.'}
                </p>
              ) : (
                selectedApps.map((app) => (
                  <div key={app.id} className="rounded-2xl border border-line bg-surface p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-ink">
                          {app.candidateCode} · Lv {app.talentTierLevel}
                        </p>
                        <p className="text-xs text-muted">{app.talentSkills.join(' · ')}</p>
                      </div>
                      <span className="rounded-full bg-subtle px-2.5 py-0.5 text-xs font-semibold text-ink">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted">{app.pitch}</p>
                    <div className="flex gap-2.5">
                      {app.status === 'applied' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                          className="flex-1 min-h-[40px] rounded-xl border border-line text-xs font-semibold text-ink hover:bg-subtle"
                        >
                          {isId ? 'Shortlist' : 'Shortlist'}
                        </button>
                      )}
                      {app.status !== 'hired' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleHireApplicant(app.id, app.talentId, selectedOpp)}
                          className="flex-1 min-h-[40px] rounded-xl bg-gold text-xs font-extrabold text-gold-fg hover:bg-gold-hover"
                        >
                          {isId ? 'Hire & Kunci Escrow' : 'Hire & Fund Escrow'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('/employer/chat')}
                          className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1 rounded-xl bg-brand text-xs font-bold text-brand-fg"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {isId ? 'Buka Chat' : 'Open Chat'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
