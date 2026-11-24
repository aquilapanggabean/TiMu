import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Phone,
  Send,
  ShieldCheck,
  Upload,
  UserRound,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { EscrowBreakdownBox } from '../components/EscrowBreakdownBox';
import { Modal } from '../components/Modal';
import { PageErrorState, PageSkeleton } from '../components/StateBlocks';
import { formatMoney, parseMajorToMinor } from '../lib/domain';

interface ChatPageProps {
  role: 'talent' | 'employer';
}

function formatShortTime(iso: string, isId: boolean): string {
  const date = new Date(iso);
  const diffHours = (Date.now() - date.getTime()) / 3600000;
  if (diffHours < 16) {
    return date.toLocaleTimeString(isId ? 'id-ID' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  if (diffHours < 40) return isId ? 'Kemarin' : 'Yesterday';
  return date.toLocaleDateString(isId ? 'id-ID' : 'en-US', { weekday: 'short' });
}

export const ChatPage: React.FC<ChatPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const {
    locale,
    currency,
    loading,
    error,
    retryLoad,
    profile,
    conversations,
    messagesByConversation,
    contracts,
    sendMessage,
    joinConversationSocket,
    fundContract,
    submitDeliverable,
    releaseContract,
  } = useWorkspace();

  const isId = locale === 'id';
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [draftMsg, setDraftMsg] = useState('');
  const [sending, setSending] = useState(false);

  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [deliverableModalOpen, setDeliverableModalOpen] = useState(false);
  const [hireTitle, setHireTitle] = useState('Desain menu kafe');
  const [hireScope, setHireScope] = useState('File siap cetak PDF dan versi digital QR table tent.');
  const [hireBudgetMajor, setHireBudgetMajor] = useState(currency === 'IDR' ? '250000' : '40');
  const [deliverableUrl, setDeliverableUrl] = useState('https://portfolio.example.com/deliverables/final-v1');
  const [deliverableNote, setDeliverableNote] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const roleConversations = useMemo(() => {
    if (!profile) return [];
    if (role === 'employer') {
      return conversations.filter((c) => c.employerId === profile.id);
    }
    return conversations.filter((c) => c.talentId === profile.id);
  }, [conversations, profile, role]);

  // Auto-select first conversation on desktop split-pane
  useEffect(() => {
    if (!selectedConvId && roleConversations.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSelectedConvId(roleConversations[0].id);
    }
  }, [roleConversations, selectedConvId]);

  const activeConv = roleConversations.find((c) => c.id === selectedConvId) || null;
  const activeMessages = activeConv ? messagesByConversation[activeConv.id] || [] : [];
  const activeContract = activeConv?.contractId
    ? contracts.find((c) => c.id === activeConv.contractId)
    : undefined;

  useEffect(() => {
    if (activeConv) {
      joinConversationSocket(activeConv.id);
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConv, activeMessages.length, joinConversationSocket]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !draftMsg.trim()) return;
    setSending(true);
    await sendMessage(activeConv.id, draftMsg.trim());
    setDraftMsg('');
    setSending(false);
  };

  const handleQuickReply = async (text: string) => {
    if (!activeConv) return;
    setSending(true);
    await sendMessage(activeConv.id, text);
    setSending(false);
  };

  const handleShareWhatsApp = async () => {
    if (!activeConv) return;
    setSending(true);
    await sendMessage(
      activeConv.id,
      isId
        ? 'Saya membagikan kontak WhatsApp untuk koordinasi proyek.'
        : 'Sharing my WhatsApp contact for project coordination.',
      { shareContactOptIn: true, contactChannel: 'whatsapp' }
    );
    setSending(false);
  };

  const handleFundEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    const grossMinor = parseMajorToMinor(hireBudgetMajor, currency);
    if (!hireTitle.trim() || grossMinor <= 0) return;

    setActionBusy(true);
    const res = await fundContract({
      conversationId: activeConv.id,
      talentId: activeConv.talentId,
      title: hireTitle.trim(),
      scopeSummary: hireScope.trim(),
      grossAmountMinor: grossMinor,
      currency,
    });
    setActionBusy(false);
    if (res.ok) {
      setHireModalOpen(false);
      setFeedback({
        type: 'success',
        text: isId ? 'Dana proyek berhasil dikunci di Escrow.' : 'Project funds locked in Escrow.',
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Unable to fund Escrow.' });
    }
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContract) return;
    setActionBusy(true);
    const res = await submitDeliverable(activeContract.id, deliverableUrl.trim(), deliverableNote.trim());
    setActionBusy(false);
    if (res.ok) {
      setDeliverableModalOpen(false);
      setFeedback({
        type: 'success',
        text: isId ? 'Hasil kerja terkirim untuk ditinjau UMKM.' : 'Deliverable submitted for employer review.',
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Unable to submit deliverable.' });
    }
  };

  const handleReleaseFunds = async () => {
    if (!activeContract) return;
    setActionBusy(true);
    const res = await releaseContract(activeContract.id);
    setActionBusy(false);
    if (res.ok) {
      setFeedback({
        type: 'success',
        text: isId
          ? `Escrow dicairkan! Sertifikat ${res.certificate?.verificationCode ?? ''} otomatis terbit.`
          : `Escrow released! Certificate ${res.certificate?.verificationCode ?? ''} issued.`,
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Unable to release Escrow.' });
    }
  };

  if (loading && conversations.length === 0) return <PageSkeleton />;
  if (error) return <PageErrorState message={error} onRetry={retryLoad} />;

  // Employer Locked Empty State
  if (role === 'employer' && roleConversations.length === 0) {
    return (
      <div className="mx-auto my-8 max-w-md rounded-[20px] border border-line bg-surface px-8 py-12 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-subtle text-brand">
          <Lock className="h-7 w-7" strokeWidth={1.85} aria-hidden="true" />
        </div>
        <h1 className="type-h2 text-ink">{isId ? 'Chat terkunci' : 'Chat is locked'}</h1>
        <p className="text-sm leading-relaxed text-muted">
          {isId
            ? 'Gunakan 1 Token pada profil talenta untuk membuka ruang Chat langsung dan fitur Hire ber-Escrow.'
            : 'Spend 1 Token on a talent profile to unlock real-time Chat and Escrow hiring.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/employer/discover')}
          className="min-h-[44px] rounded-xl bg-gold px-6 text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
        >
          {isId ? 'Cari Talenta Tanpa Bias' : 'Browse Blind Talent'}
        </button>
      </div>
    );
  }

  const quickReplies =
    role === 'talent'
      ? isId
        ? ['Saya siap mulai hari ini', 'Boleh lihat referensi desainnya?']
        : ['I can start today', 'Could you share reference files?']
      : isId
      ? ['Boleh kirim estimasi waktunya?', 'Mari kita kunci dana di Escrow']
      : ['What is your estimated timeline?', 'Let us fund Escrow to start'];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="type-h1 text-ink">{isId ? 'Chat & Ruang Escrow' : 'Chat & Escrow Room'}</h1>
          <p className="text-sm text-muted tabular-nums">
            {roleConversations.length} {isId ? 'percakapan aktif' : 'active conversations'}
          </p>
        </div>
      </div>

      {/* Desktop Split-Pane (4 / 8 cols) & Mobile List-to-Thread */}
      <div className="grid min-h-[580px] grid-cols-1 overflow-hidden rounded-[20px] border border-line bg-surface lg:grid-cols-12">
        {/* Conversation List Pane */}
        <aside
          className={`border-r border-line lg:col-span-4 ${
            activeConv ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
          }`}
        >
          <div className="border-b border-line px-4 py-3.5 text-xs font-bold text-muted">
            {isId ? 'Daftar Percakapan' : 'Conversations'}
          </div>
          <div className="divide-y divide-line flex-1 overflow-y-auto">
            {roleConversations.map((conv, idx) => {
              const title = role === 'employer' ? conv.talentName : conv.businessName;
              const selected = activeConv?.id === conv.id;
              const hasUnread = !selected && idx === 0;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors ${
                    selected ? 'bg-subtle' : 'bg-surface hover:bg-canvas'
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
                    <UserRound className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-ink">{title}</span>
                      <span className="shrink-0 text-xs text-muted tabular-nums">
                        {formatShortTime(conv.lastMessageAt, isId)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={`truncate text-xs ${hasUnread ? 'font-semibold text-ink' : 'text-muted'}`}>
                        {conv.lastMessagePreview}
                      </p>
                      {hasUnread && (
                        <span
                          aria-label={isId ? 'Belum dibaca' : 'Unread'}
                          className="h-2 w-2 shrink-0 rounded-full bg-gold"
                        />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Active Thread Pane */}
        <section
          className={`flex flex-col lg:col-span-8 ${
            activeConv ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Thread Header */}
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedConvId(null)}
                    aria-label={isId ? 'Kembali ke daftar percakapan' : 'Back to conversations'}
                    className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink hover:bg-subtle"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-base font-bold text-ink">
                      {role === 'employer' ? activeConv.talentName : activeConv.businessName}
                    </h2>
                    <p className="text-xs text-muted">
                      {activeContract
                        ? `${activeContract.title} · ${activeContract.escrowStatus}`
                        : isId
                        ? 'Ruang Chat Terverifikasi'
                        : 'Verified Chat Room'}
                    </p>
                  </div>
                </div>

                {role === 'talent' && (
                  <button
                    type="button"
                    disabled={sending}
                    onClick={handleShareWhatsApp}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-line bg-canvas px-3 text-xs font-bold text-ink hover:bg-subtle whitespace-nowrap"
                  >
                    <Phone className="h-3.5 w-3.5 text-brand-fresh" aria-hidden="true" />
                    {isId ? 'Bagikan WhatsApp' : 'Share WhatsApp'}
                  </button>
                )}
              </div>

              {/* Pinned Escrow Contract Bar */}
              <div className="border-b border-line bg-subtle px-4 py-3">
                {activeContract ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
                        <ShieldCheck className="h-4 w-4 text-brand-fresh" aria-hidden="true" />
                        {activeContract.title}
                      </p>
                      <p className="text-xs text-muted tabular-nums">
                        {formatMoney(activeContract.grossAmountMinor, activeContract.currency, locale)} ·{' '}
                        {activeContract.escrowStatus}
                      </p>
                    </div>

                    {role === 'talent' && activeContract.escrowStatus === 'funded' && (
                      <button
                        type="button"
                        onClick={() => setDeliverableModalOpen(true)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-gold px-4 text-xs font-extrabold text-gold-fg hover:bg-gold-hover"
                      >
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        {isId ? 'Kirim Hasil Kerja' : 'Submit Deliverable'}
                      </button>
                    )}

                    {role === 'employer' && activeContract.escrowStatus !== 'released' && (
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={handleReleaseFunds}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-gold px-4 text-xs font-extrabold text-gold-fg hover:bg-gold-hover"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {isId ? 'Setujui & Cairkan Escrow' : 'Approve & Release Escrow'}
                      </button>
                    )}

                    {activeContract.escrowStatus === 'released' && (
                      <Link
                        to="/verify/TIMU-2026-A84K2P"
                        className="inline-flex min-h-[38px] items-center rounded-xl bg-brand px-3.5 text-xs font-bold text-brand-fg"
                      >
                        {isId ? 'Lihat Sertifikat' : 'View Certificate'}
                      </Link>
                    )}
                  </div>
                ) : role === 'employer' ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted">
                      {isId
                        ? 'Mulai proyek dengan perlindungan Escrow pihak ketiga (biaya admin 10%).'
                        : 'Start working with third-party Escrow protection (10% admin fee).'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setHireModalOpen(true)}
                      className="min-h-[40px] rounded-xl bg-gold px-4 text-xs font-extrabold text-gold-fg hover:bg-gold-hover"
                    >
                      {isId ? 'Hire & Kunci Escrow' : 'Hire & Fund Escrow'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted">
                    {isId
                      ? 'Seluruh kesepakatan dan pembayaran proyek dilindungi sistem Escrow TIMU.'
                      : 'All project agreements and payments are protected inside TIMU Escrow.'}
                  </p>
                )}
              </div>

              {/* Subtle Privacy Notice Strip */}
              <div className="border-b border-line bg-gold-soft/70 px-4 py-2 text-xs text-gold-soft-fg">
                {isId
                  ? 'Kontak pribadi tetap terlindungi. Bagikan WhatsApp hanya jika Anda menyetujuinya.'
                  : 'Private contact stays hidden unless the talent explicitly opts in to share WhatsApp.'}
              </div>

              {feedback && (
                <div
                  role="status"
                  className={`mx-4 mt-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                    feedback.type === 'success'
                      ? 'bg-status-success-bg text-status-success-text'
                      : 'bg-status-error-bg text-status-error-text'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              {/* Messages Stream */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
                {activeMessages.map((msg) => {
                  const isMine = msg.senderId === profile?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isMine
                            ? 'rounded-br-sm bg-brand text-brand-fg'
                            : 'rounded-bl-sm border border-line bg-subtle text-ink'
                        }`}
                      >
                        <p>{msg.body}</p>
                        {msg.sharedContactPayload && (
                          <p className="mt-2 rounded-lg bg-black/10 px-2.5 py-1.5 text-xs font-bold tabular-nums">
                            WhatsApp: {msg.sharedContactPayload.phone}
                          </p>
                        )}
                        <span
                          className={`mt-1 block text-right text-[11px] tabular-nums ${
                            isMine ? 'opacity-75' : 'text-muted'
                          }`}
                        >
                          {formatShortTime(msg.createdAt, isId)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {/* Quick Reply Chips + Composer */}
              <div className="border-t border-line p-3.5 space-y-2.5">
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      disabled={sending}
                      onClick={() => handleQuickReply(reply)}
                      className="rounded-full border border-line bg-canvas px-3 py-1 text-xs font-medium text-muted hover:border-line-strong hover:text-ink"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSend} className="flex items-center gap-2.5">
                  <input
                    type="text"
                    value={draftMsg}
                    onChange={(e) => setDraftMsg(e.target.value)}
                    placeholder={isId ? 'Tulis pesan...' : 'Write a message...'}
                    aria-label={isId ? 'Tulis pesan' : 'Write a message'}
                    className="min-h-[44px] flex-1 rounded-xl border border-line-strong bg-canvas px-4 text-sm text-ink placeholder:text-muted/80"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draftMsg.trim()}
                    aria-label={isId ? 'Kirim pesan' : 'Send message'}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold text-gold-fg hover:bg-gold-hover"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted">
              {isId
                ? 'Pilih percakapan di sebelah kiri untuk membuka ruang Chat & Escrow.'
                : 'Select a conversation on the left to open Chat and Escrow controls.'}
            </div>
          )}
        </section>
      </div>

      {/* Hire & Fund Escrow Drawer */}
      <Modal
        open={hireModalOpen}
        onClose={() => setHireModalOpen(false)}
        variant="drawer"
        title={isId ? 'Hire & Kunci Dana Escrow' : 'Hire & Fund Escrow'}
        description={
          isId
            ? 'Dana ditahan aman oleh Escrow pihak ketiga hingga hasil kerja disetujui.'
            : 'Funds are safely held by third-party Escrow until deliverables are approved.'
        }
      >
        <form onSubmit={handleFundEscrow} className="space-y-4">
          <div>
            <label htmlFor="hire-title" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Judul Proyek' : 'Project Title'}
            </label>
            <input
              id="hire-title"
              type="text"
              required
              value={hireTitle}
              onChange={(e) => setHireTitle(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="hire-scope" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Ruang Lingkup Hasil Kerja' : 'Deliverable Scope'}
            </label>
            <textarea
              id="hire-scope"
              rows={3}
              required
              value={hireScope}
              onChange={(e) => setHireScope(e.target.value)}
              className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="hire-budget" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? `Anggaran Proyek (${currency})` : `Gross Project Budget (${currency})`}
            </label>
            <input
              id="hire-budget"
              type="number"
              min={1}
              required
              value={hireBudgetMajor}
              onChange={(e) => setHireBudgetMajor(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink tabular-nums"
            />
          </div>
          <EscrowBreakdownBox
            grossAmountMinor={parseMajorToMinor(hireBudgetMajor, currency)}
            currency={currency}
          />
          <button
            type="submit"
            disabled={actionBusy}
            className="w-full min-h-[48px] rounded-xl bg-gold text-sm font-extrabold text-gold-fg hover:bg-gold-hover"
          >
            {actionBusy
              ? isId
                ? 'Mengunci Dana...'
                : 'Locking...'
              : isId
              ? 'Kunci Dana Escrow'
              : 'Hire & Fund Escrow'}
          </button>
        </form>
      </Modal>

      {/* Submit Deliverable Modal */}
      <Modal
        open={deliverableModalOpen}
        onClose={() => setDeliverableModalOpen(false)}
        title={isId ? 'Kirim Hasil Kerja' : 'Submit Deliverable'}
      >
        <form onSubmit={handleSubmitDeliverable} className="space-y-4">
          <div>
            <label htmlFor="chat-deliv-url" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Tautan Hasil Kerja' : 'Deliverable Link'}
            </label>
            <input
              id="chat-deliv-url"
              type="url"
              required
              value={deliverableUrl}
              onChange={(e) => setDeliverableUrl(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="chat-deliv-note" className="block text-xs font-bold text-ink mb-1.5">
              {isId ? 'Catatan' : 'Summary Note'}
            </label>
            <textarea
              id="chat-deliv-note"
              rows={3}
              value={deliverableNote}
              onChange={(e) => setDeliverableNote(e.target.value)}
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
    </div>
  );
};
