import React, { useMemo, useState } from 'react';
import { Crown, MapPin, Search } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Opportunity } from '../types/timu';
import { calculateDistanceKm, formatMoney } from '../lib/domain';
import { Modal } from '../components/Modal';
import { PageErrorState, PageSkeleton } from '../components/StateBlocks';

type FilterChip = 'mine' | 'all' | 'escrow' | 'jobs' | 'remote';

export const TalentOpportunitiesPage: React.FC = () => {
  const {
    locale,
    loading,
    error,
    retryLoad,
    profile,
    talentProfile,
    opportunities,
    applications,
    applyToOpportunity,
  } = useWorkspace();

  const isId = locale === 'id';
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState<FilterChip>('all');
  const [applyOpp, setApplyOpp] = useState<Opportunity | null>(null);
  const [pitch, setPitch] = useState('');
  const [portfolioLink, setPortfolioLink] = useState(
    talentProfile?.portfolioUrl || 'https://portfolio.example.com/tm-1024'
  );
  const [applyBusy, setApplyBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const myCareerField = talentProfile?.careerField || 'Desain';

  const appliedOppIds = useMemo(
    () => new Set(applications.filter((a) => a.talentId === profile?.id).map((a) => a.opportunityId)),
    [applications, profile?.id]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return opportunities
      .filter((o) => o.status === 'open')
      .filter((o) => {
        if (activeChip === 'mine') return o.careerField === myCareerField;
        if (activeChip === 'escrow') return o.opportunityType === 'escrow_gig';
        if (activeChip === 'jobs') return o.opportunityType === 'part_time' || o.opportunityType === 'full_time';
        if (activeChip === 'remote') return o.workMode === 'remote';
        return true;
      })
      .filter((o) =>
        q
          ? o.title.toLowerCase().includes(q) ||
            o.businessName.toLowerCase().includes(q) ||
            o.careerField.toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => Number(b.isPriority) - Number(a.isPriority));
  }, [opportunities, activeChip, myCareerField, query]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyOpp || !pitch.trim()) return;
    setApplyBusy(true);
    const res = await applyToOpportunity(applyOpp.id, pitch.trim(), portfolioLink.trim());
    setApplyBusy(false);
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

  if (loading && opportunities.length === 0) return <PageSkeleton />;
  if (error) return <PageErrorState message={error} onRetry={retryLoad} />;

  const chips: { id: FilterChip; label: string }[] = [
    { id: 'all', label: isId ? 'Semua Proyek' : 'All Projects' },
    { id: 'mine', label: isId ? `Bidang Saya (${myCareerField})` : `My Field (${myCareerField})` },
    { id: 'escrow', label: isId ? 'Proyek Escrow' : 'Escrow Projects' },
    { id: 'jobs', label: isId ? 'Part-Time / Full-Time' : 'Part-Time / Full-Time' },
    { id: 'remote', label: isId ? 'Remote' : 'Remote' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1 text-ink">{isId ? 'Cari Proyek' : 'Find Projects'}</h1>
        <p className="mt-1 text-sm text-muted">
          {isId
            ? 'Temukan proyek ber-Escrow dan lowongan kerja dari UMKM lokal maupun remote.'
            : 'Browse Escrow-protected projects and part-time or full-time jobs from local and remote SMEs.'}
        </p>
      </div>

      {/* Prominent Clean White Search + Horizontal Filter Pills */}
      <div className="space-y-3.5">
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isId ? 'Cari judul proyek, bidang, atau nama UMKM...' : 'Search project title, skill field, or SME...'}
            aria-label={isId ? 'Cari proyek atau UMKM' : 'Search projects or SMEs'}
            className="w-full min-h-[48px] rounded-xl border border-line bg-surface pr-4 pl-11 text-sm text-ink placeholder:text-muted/80 shadow-xs focus:border-line-strong"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setActiveChip(chip.id)}
              className={`min-h-[40px] rounded-full px-4 text-xs font-semibold transition-colors whitespace-nowrap ${
                activeChip === chip.id
                  ? 'bg-brand text-brand-fg'
                  : 'border border-line bg-surface text-muted hover:border-line-strong hover:text-ink'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
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

      {/* Responsive Card Grid (1-col Mobile, 2-col Tablet & Desktop) */}
      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-line bg-surface p-10 text-center space-y-3">
          <h2 className="type-h2 text-ink">
            {isId ? 'Tidak ada proyek yang cocok' : 'No projects match your filter'}
          </h2>
          <p className="text-sm text-muted">
            {isId
              ? 'Coba kata kunci lain atau tampilkan semua proyek yang tersedia.'
              : 'Try a different keyword or reset filters to see all open projects.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActiveChip('all');
            }}
            className="min-h-[44px] rounded-xl bg-brand px-5 text-sm font-bold text-brand-fg"
          >
            {isId ? 'Tampilkan Semua Proyek' : 'Show All Projects'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((opp) => {
            const dist = profile
              ? calculateDistanceKm(profile.lat, profile.lng, opp.lat, opp.lng)
              : 1.0;
            const alreadyApplied = appliedOppIds.has(opp.id);
            return (
              <article
                key={opp.id}
                className="flex flex-col justify-between rounded-[20px] border border-line bg-surface p-5 sm:p-6 transition-all hover:border-line-strong hover:shadow-card"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted">
                        {opp.businessName}
                        {opp.isPriority && (
                          <span className="ml-2 inline-flex items-center gap-1 font-bold text-gold-soft-fg">
                            <Crown className="h-3 w-3" aria-hidden="true" />
                            {isId ? 'Prioritas' : 'Priority'}
                          </span>
                        )}
                      </p>
                      <h2 className="mt-1 font-display text-lg font-bold text-ink leading-snug">
                        {opp.title}
                      </h2>
                    </div>
                    <span className="shrink-0 font-display text-lg font-extrabold text-brand tabular-nums">
                      {formatMoney(opp.budgetMinor, opp.currency, locale)}
                    </span>
                  </div>

                  <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="tabular-nums">
                      {opp.workMode === 'remote'
                        ? `Remote · ${opp.timezone}`
                        : `${opp.city} · ${dist} km`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {opp.opportunityType === 'escrow_gig'
                        ? isId
                          ? 'Proyek Escrow'
                          : 'Escrow Project'
                        : opp.opportunityType === 'part_time'
                        ? 'Part-Time'
                        : 'Full-Time'}
                    </span>
                  </p>

                  <p className="line-clamp-2 text-sm text-muted leading-relaxed">
                    {opp.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-fg">
                    {opp.careerField}
                  </span>
                  <button
                    type="button"
                    disabled={alreadyApplied}
                    onClick={() => setApplyOpp(opp)}
                    className={`min-h-[42px] rounded-xl px-4 text-xs font-extrabold transition-colors whitespace-nowrap ${
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
      )}

      {/* Apply Modal */}
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
            <label htmlFor="opp-pitch" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Pesan Lamaran' : 'Application Pitch'}
            </label>
            <textarea
              id="opp-pitch"
              rows={3}
              required
              placeholder={
                isId
                  ? 'Jelaskan pengalaman relevan dan estimasi waktu penyelesaian...'
                  : 'Explain your relevant experience and timeline...'
              }
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="opp-port" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Tautan Portofolio' : 'Portfolio Link'}
            </label>
            <input
              id="opp-port"
              type="url"
              value={portfolioLink}
              onChange={(e) => setPortfolioLink(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={applyBusy}
            className="w-full min-h-[48px] rounded-xl bg-gold text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
          >
            {applyBusy
              ? isId
                ? 'Mengirim...'
                : 'Submitting...'
              : isId
              ? 'Kirim Lamaran'
              : 'Apply to Project'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
