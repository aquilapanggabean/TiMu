import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  section: 'terms' | 'privacy' | 'escrow';
}

const CONTENT = {
  terms: {
    title: 'Terms of Service',
    updated: 'Effective November 2026',
    paragraphs: [
      'TIMU (Titik Temu) operates a dual-mode marketplace connecting small and medium enterprises (SMEs) with emerging talent for project-based Escrow Projects and part-time or full-time roles.',
      'One authenticated account may activate both Talent Mode and Business (SME) Mode. Each workspace maintains separate profiles, balances, and permissions.',
      'Business accounts spend 1 Token to reveal a blind candidate profile and open real-time chat, or 1 Token to publish an opportunity. Tokens are non-transferable and logged transparently in the Token Ledger.',
      'Deliverables funded through Escrow must follow the agreed scope summary. Disputes are reviewed using chat history and submitted deliverable links before any funds are released.',
    ],
  },
  privacy: {
    title: 'Privacy & Blind Discovery Policy',
    updated: 'Effective November 2026',
    paragraphs: [
      'TIMU enforces server-side Blind Discovery. A talent full name, clear portrait, email, and private phone number are withheld from discovery cards and API payloads until an employer unlocks that specific candidate with 1 Token.',
      'Private phone numbers and WhatsApp contact details are NEVER revealed automatically upon Token unlock. Talent must explicitly opt in inside a chat thread to share direct contact details.',
      'Public completion certificates (/verify/[code]) display only the recipient name, completed project title, issuing business name, validated Skill Badges, completion date, and verification ID.',
    ],
  },
  escrow: {
    title: 'Third-Party Escrow & Fee Policy',
    updated: 'Effective November 2026',
    paragraphs: [
      'TIMU never routes Escrow funds into personal or manual operator bank accounts. All milestone funds are processed through a pluggable licensed third-party Payment Service Provider (Stripe Connect Express for international currencies or licensed regional PSP adapters for IDR), or through the explicitly labeled Sandbox Payment Simulator in test environments.',
      'For Escrow Projects, the Employer funds 100% of the agreed gross budget into Escrow prior to work starting. Upon Employer approval of the submitted deliverable, 90% releases immediately to the Talent Wallet and 10% is logged transparently as the Platform Admin Fee.',
      'All monetary amounts are stored as integer minor units (ISO 4217: USD, IDR, EUR, GBP, SGD) to prevent rounding errors across international payouts.',
    ],
  },
};

export const LegalPage: React.FC<LegalPageProps> = ({ section }) => {
  const docContent = CONTENT[section];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-surface pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-[820px] items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to TIMU
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold text-muted">
            <Link to="/legal/terms" className={section === 'terms' ? 'text-ink underline' : 'hover:text-ink'}>
              Terms
            </Link>
            <Link to="/legal/privacy" className={section === 'privacy' ? 'text-ink underline' : 'hover:text-ink'}>
              Privacy
            </Link>
            <Link to="/legal/escrow-policy" className={section === 'escrow' ? 'text-ink underline' : 'hover:text-ink'}>
              Escrow Policy
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[820px] px-4 py-10 sm:px-6">
        <article className="rounded-2xl border border-line bg-surface p-6 sm:p-8 space-y-5">
          <div>
            <p className="text-xs font-semibold text-muted">{docContent.updated}</p>
            <h1 className="mt-1 type-h1 text-ink">{docContent.title}</h1>
          </div>
          <div className="space-y-4 text-sm sm:text-base text-muted leading-relaxed">
            {docContent.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </article>
      </main>
    </div>
  );
};
