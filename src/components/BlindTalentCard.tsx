import React from 'react';
import {
  Award,
  Check,
  ExternalLink,
  GraduationCap,
  Lock,
  MapPin,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import type { BlindTalentCardData } from '../types/timu';
import { formatDistance, isSafeExternalUrl } from '../lib/domain';
import { useWorkspace } from '../context/WorkspaceContext';

interface BlindTalentCardProps {
  card: BlindTalentCardData;
  previewMode?: boolean;
}

export const BlindTalentCard: React.FC<BlindTalentCardProps> = ({ card, previewMode = false }) => {
  const { locale, distanceUnit } = useWorkspace();
  const { talent, isUnlocked, revealedIdentity, distanceKm, timezoneOverlapHours } = card;
  const isId = locale === 'id';

  const initials = revealedIdentity?.fullName
    ? revealedIdentity.fullName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'TM';

  const locationLabel =
    typeof distanceKm === 'number' && distanceKm < 50
      ? formatDistance(distanceKm, distanceUnit)
      : `${isId ? 'Remote' : 'Remote'} · ${talent.timezone}`;

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card select-none">
      {/* Top 136px Deep-Olive Gradient Banner */}
      <div className="relative flex h-[140px] w-full items-center justify-between overflow-hidden bg-gradient-to-br from-[#3B4D0C] to-[#233008] px-5">
        {/* Top-left Gold Category Tag */}
        <span className="absolute top-3.5 left-4 z-10 rounded-full bg-gold px-3 py-1 text-xs font-bold text-gold-fg">
          {talent.category}
        </span>

        {/* Top-right Clean White Location / Timezone Pill */}
        <span className="absolute top-3.5 right-4 z-10 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1B2408] tabular-nums shadow-xs">
          <MapPin className="h-3.5 w-3.5 text-[#3B4D0C]" aria-hidden="true" />
          {locationLabel}
        </span>

        {/* Center-left Blurred Avatar OR Revealed Crisp Avatar + Privacy Badge */}
        <div className="mt-7 flex items-center gap-3.5">
          {isUnlocked && revealedIdentity ? (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-[#3B4D0C] text-xl font-extrabold text-white">
              {initials}
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/10"
            >
              <div className="flex flex-col items-center pt-2">
                <div className="h-6 w-6 rounded-full bg-white/85 blur-[4px]" />
                <div className="mt-1 h-8 w-11 rounded-t-full bg-white/80 blur-[5px]" />
              </div>
            </div>
          )}

          <div className="min-w-0">
            {isUnlocked ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xs">
                <Unlock className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                {isId ? 'Identitas Terbuka' : 'Identity Revealed'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-xs">
                <Lock className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                {isId ? 'Identitas tersembunyi sampai dibuka' : 'Identity hidden until unlocked'}
              </span>
            )}
            {typeof timezoneOverlapHours === 'number' && (
              <p className="mt-1.5 text-xs text-[#D5E0BE] tabular-nums">
                {talent.city} · {timezoneOverlapHours}h {isId ? 'overlap jam kerja' : 'workday overlap'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pure-White Body with Generous 24px Padding */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Identity & Education Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {isUnlocked && revealedIdentity ? (
              <div className="flex items-center gap-2">
                <h2 className="truncate font-display text-xl font-extrabold text-ink">
                  {revealedIdentity.fullName}
                </h2>
                {talent.isVerified && (
                  <ShieldCheck className="h-5 w-5 shrink-0 text-brand-fresh" aria-hidden="true" />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-extrabold text-ink">
                  {isId ? 'Talenta Anonim' : 'Hidden Talent'}
                </h2>
                <Lock className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              </div>
            )}
            <p className="mt-1 text-sm text-muted leading-snug">{talent.educationDetail}</p>
          </div>

          <span className="shrink-0 rounded-full bg-subtle px-3 py-1 text-xs font-bold text-ink tabular-nums">
            {`Lv ${talent.tierLevel}`}
            {talent.isVerified ? ` · ${isId ? 'Terverifikasi' : 'Verified'}` : ''}
          </span>
        </div>

        {/* Top 3 Skills */}
        <div>
          <p className="text-xs font-semibold text-muted">
            {isId ? '3 Keahlian Utama' : 'Top 3 Skills'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {talent.topSkills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-fg"
              >
                <Check className="h-3.5 w-3.5 stroke-[2.25]" aria-hidden="true" />
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Two Neat Subtle Metric Tiles */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-subtle p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <Award className="h-3.5 w-3.5 text-brand-fresh shrink-0" aria-hidden="true" />
              <span>{isId ? 'Proyek Selesai' : 'Completed Projects'}</span>
            </div>
            <p className="mt-1 text-sm font-bold text-ink tabular-nums">
              {talent.completedGigsCount} {isId ? 'proyek terverifikasi' : 'verified projects'}
            </p>
          </div>
          <div className="rounded-xl bg-subtle p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <GraduationCap className="h-3.5 w-3.5 text-brand-fresh shrink-0" aria-hidden="true" />
              <span>{isId ? 'Pelatihan & Sertifikasi' : 'Bootcamp & Training'}</span>
            </div>
            <p className="mt-1 truncate text-sm font-bold text-ink" title={talent.bootcampHistory}>
              {talent.bootcampHistory || (isId ? 'Siap proyek UMKM' : 'Project ready')}
            </p>
          </div>
        </div>

        {/* Experience Summary */}
        <p className="text-sm leading-relaxed text-muted">{talent.experienceSummary}</p>

        {/* Anonymized Portfolio & Work Modes Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs">
          <span className="font-medium text-muted">
            {talent.candidateCode} · {talent.workModes.join(' / ')}
          </span>
          {!previewMode && talent.portfolioUrl && isSafeExternalUrl(talent.portfolioUrl) && (
            <a
              href={talent.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-brand hover:underline"
            >
              {isId ? 'Pratinjau Portofolio' : 'Preview Portfolio'}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
