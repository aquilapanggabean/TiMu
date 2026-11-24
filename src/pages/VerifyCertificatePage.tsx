import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileSearch, Search, ShieldCheck } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { localWorkspaceEngine } from '../lib/localWorkspaceEngine';
import { CertificateCard } from '../components/CertificateCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/StateBlocks';
import { useWorkspace } from '../context/WorkspaceContext';
import type { VerifiableCertificate } from '../types/timu';

export const VerifyCertificatePage: React.FC = () => {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { dict, profile } = useWorkspace();

  const [lookupInput, setLookupInput] = useState(code);
  const [certificate, setCertificate] = useState<VerifiableCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchCertificate = useCallback(async (targetCode: string) => {
    const cleaned = targetCode.trim().toUpperCase();
    if (!cleaned) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const res = await fetch(`/api/certificates/${encodeURIComponent(cleaned)}`);
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      const rawText = await res.text();
      if (res.ok && contentType.includes('application/json') && rawText.trim() && !rawText.trim().startsWith('<')) {
        const data = JSON.parse(rawText);
        if (data?.certificate) {
          setCertificate(data.certificate);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall through to Firestore / local registry
    }

    // Fallback check against public Firestore certificates/{code}
    try {
      const snap = await getDoc(doc(db, 'certificates', cleaned));
      if (snap.exists()) {
        const d = snap.data();
        setCertificate({
          id: snap.id,
          verificationCode: d.verificationCode,
          contractId: d.contractId,
          talentId: d.talentId,
          talentName: d.talentName,
          employerId: d.employerId,
          businessName: d.businessName,
          projectTitle: d.projectTitle,
          skillsValidated: d.skillsValidated || [],
          issuedAt: d.issuedAt?.toDate ? d.issuedAt.toDate().toISOString() : String(d.issuedAt),
        });
        setLoading(false);
        return;
      }
    } catch {
      // Ignore Firestore read error when public code does not exist there
    }

    // Final fallback for static deployments (e.g. Vercel) and offline PWA
    const localCert = localWorkspaceEngine.findCertificateByCode(profile?.id || 'demo_default', cleaned);
    if (localCert) {
      setCertificate(localCert);
      setLoading(false);
      return;
    }

    setCertificate(null);
    setNotFound(true);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    setLookupInput(code);
    void fetchCertificate(code);
  }, [code, fetchCertificate]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupInput.trim().toUpperCase();
    if (cleaned) {
      navigate(`/verify/${encodeURIComponent(cleaned)}`);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="no-print border-b border-line bg-surface safe-top">
        <div className="mx-auto flex h-16 max-w-[960px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>TIMU Home</span>
          </Link>
          <span className="font-display text-base font-extrabold text-ink">
            Public Certificate Registry
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[820px] px-4 py-8 sm:px-6 space-y-6">
        <div className="no-print flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="type-h1 text-ink">{dict.certificate.pageTitle}</h1>
            <p className="mt-1 text-sm text-muted">
              Public read-only verification of Escrow-completed TIMU projects. No account required.
            </p>
          </div>

          <form onSubmit={handleLookup} className="flex items-center gap-2">
            <label htmlFor="verify-search" className="sr-only">
              Verification ID
            </label>
            <input
              id="verify-search"
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="TIMU-2026-A84K2P"
              className="min-h-[44px] w-48 rounded-xl border border-line-strong bg-surface px-3 text-sm font-mono text-ink"
            />
            <button
              type="submit"
              aria-label="Verify certificate code"
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Verify
            </button>
          </form>
        </div>

        {loading && <LoadingSkeleton label="Verifying certificate record..." variant="list" />}

        {!loading && error && (
          <ErrorState
            title="Verification temporarily unavailable"
            message={error}
            onRetry={() => void fetchCertificate(code)}
          />
        )}

        {!loading && !error && notFound && (
          <EmptyState
            icon={<FileSearch className="h-6 w-6" aria-hidden="true" />}
            title="Certificate code not found"
            description={`No TIMU completion record matches "${code.toUpperCase()}". Double-check the ID or view a verified sample certificate.`}
            actionLabel="View Sample Certificate (TIMU-2026-A84K2P)"
            onAction={() => navigate('/verify/TIMU-2026-A84K2P')}
          />
        )}

        {!loading && !error && certificate && (
          <div className="space-y-4">
            <div className="no-print flex items-center gap-2.5 rounded-xl border border-status-success-text/20 bg-status-success-bg px-4 py-3 text-sm font-semibold text-status-success-text">
              <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{dict.certificate.authenticBanner}</span>
            </div>
            <CertificateCard certificate={certificate} showActions />
          </div>
        )}
      </main>
    </div>
  );
};
