import React, { useState } from 'react';
import { Award, Check, Copy, Printer, ShieldCheck } from 'lucide-react';
import type { VerifiableCertificate } from '../types/timu';
import { useWorkspace } from '../context/WorkspaceContext';
import { TimuLogo } from './TimuLogo';

interface CertificateCardProps {
  certificate: VerifiableCertificate;
  showActions?: boolean;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  showActions = true,
}) => {
  const { dict } = useWorkspace();
  const [copied, setCopied] = useState(false);

  const verifyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${certificate.verificationCode}`
      : `/verify/${certificate.verificationCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="rounded-2xl border-2 border-line-strong bg-surface p-2 shadow-card">
      <div className="rounded-xl border border-line p-6 sm:p-8 space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line-subtle pb-5">
          <div className="flex items-center gap-3.5">
            <TimuLogo size="sm" />
            <div className="border-l border-line pl-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Award className="h-3.5 w-3.5 text-brand shrink-0" aria-hidden="true" />
                <span>{dict.certificate.pageTitle}</span>
              </div>
              <div className="text-[11px] font-medium text-muted">Titik Temu Escrow Credential</div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-status-success-bg px-3 py-1 text-xs font-semibold text-status-success-text self-start sm:self-center">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Verified Escrow Record
          </div>
        </div>

        {/* Core Credential Body */}
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-muted">{dict.certificate.awardedTo}</div>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-ink">
              {certificate.talentName}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="rounded-lg border border-line-subtle bg-canvas p-3.5">
              <div className="text-xs font-semibold text-muted">{dict.certificate.projectLabel}</div>
              <p className="mt-1 text-sm font-bold text-ink">{certificate.projectTitle}</p>
            </div>
            <div className="rounded-lg border border-line-subtle bg-canvas p-3.5">
              <div className="text-xs font-semibold text-muted">{dict.certificate.issuedBy}</div>
              <p className="mt-1 text-sm font-bold text-ink">{certificate.businessName}</p>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted">{dict.certificate.validatedSkills}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {certificate.skillsValidated.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-full border border-line bg-subtle px-3 py-1 text-xs font-semibold text-ink"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-line-subtle pt-5 text-xs">
          <div>
            <span className="text-muted">{dict.certificate.verificationId}: </span>
            <span className="font-mono font-bold text-ink tabular-nums">
              {certificate.verificationCode}
            </span>
          </div>
          <div>
            <span className="text-muted">{dict.certificate.issuedDate}: </span>
            <span className="font-semibold text-ink tabular-nums">{formattedDate}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-[1.5px] border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-subtle transition-colors whitespace-nowrap"
            >
              {copied ? (
                <Check className="h-4 w-4 text-status-success-text" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? dict.certificate.copied : dict.certificate.copyLink}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:bg-brand-hover transition-colors whitespace-nowrap"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              {dict.certificate.downloadPdf}
            </button>
          </div>
        )}
      </div>
    </article>
  );
};
