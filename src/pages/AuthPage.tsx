import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { TimuLogo } from '../components/TimuLogo';
import type { WorkspaceMode } from '../types/timu';

export const AuthPage: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
  const { locale, setLocale, theme, toggleTheme, signInWithAccount, enterDemoWorkspace } =
    useWorkspace();
  const navigate = useNavigate();
  const isId = locale === 'id';

  const [selectedRole, setSelectedRole] = useState<WorkspaceMode>('talent');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const targetRoute = selectedRole === 'talent' ? '/talent/first-quest' : '/employer/discover';

  const handleEmailForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (mode === 'signup' && fullName.trim().length < 2) {
      setStatusMessage(
        isId ? 'Masukkan nama lengkap minimal 2 karakter.' : 'Enter your full name (at least 2 characters).'
      );
      return;
    }

    if (!email.includes('@') || password.length < 6) {
      setStatusMessage(
        isId
          ? 'Masukkan alamat email yang valid dan kata sandi minimal 6 karakter.'
          : 'Enter a valid email address and a password with at least 6 characters.'
      );
      return;
    }

    setSubmitting(true);
    const ok = await signInWithAccount({
      fullName: fullName.trim() || undefined,
      email,
      role: selectedRole,
    });
    setSubmitting(false);

    if (ok) {
      navigate(targetRoute);
    } else {
      setStatusMessage(
        isId
          ? 'Gagal memproses akun. Silakan periksa kembali email Anda.'
          : 'Unable to sign in. Please double-check your email address.'
      );
    }
  };

  const handleDemoEnter = () => {
    enterDemoWorkspace(selectedRole);
    navigate(targetRoute);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {isId ? 'Kembali ke TIMU' : 'Back to TIMU'}
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale(isId ? 'en' : 'id')}
              aria-label={isId ? 'Switch to English' : 'Ubah ke Bahasa Indonesia'}
              className="min-h-[36px] rounded-xl border border-line bg-surface px-2.5 text-xs font-bold text-ink hover:bg-subtle"
            >
              {isId ? 'ID' : 'EN'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:bg-subtle"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-card space-y-6">
          <div>
            <div className="mb-4">
              <TimuLogo size="md" />
            </div>
            <h1 className="type-h1 text-ink">
              {mode === 'signup'
                ? isId
                  ? 'Buat akun TIMU'
                  : 'Create your TIMU account'
                : isId
                ? 'Masuk ke TIMU'
                : 'Sign in to TIMU'}
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {isId
                ? 'Satu akun untuk akses Talenta dan UMKM. Pilih ruang kerja awal Anda.'
                : 'One account gives you access to both Talent and Business (SME) workspaces. Choose where to start first.'}
            </p>
          </div>

          {/* Initial Role Preference */}
          <div
            role="radiogroup"
            aria-label={isId ? 'Peran awal' : 'Starting workspace role'}
            className="grid grid-cols-2 gap-2.5"
          >
            <button
              type="button"
              role="radio"
              aria-checked={selectedRole === 'talent'}
              onClick={() => setSelectedRole('talent')}
              className={`flex min-h-[58px] flex-col items-start justify-center rounded-xl border p-3 text-left transition-colors ${
                selectedRole === 'talent'
                  ? 'border-brand bg-subtle text-ink'
                  : 'border-line bg-canvas text-muted hover:text-ink'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {isId ? 'Talenta' : 'Talent'}
              </span>
              <span className="text-[11px] text-muted">
                {isId ? 'Mulai First Quest' : 'Start First Quest'}
              </span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={selectedRole === 'employer'}
              onClick={() => setSelectedRole('employer')}
              className={`flex min-h-[58px] flex-col items-start justify-center rounded-xl border p-3 text-left transition-colors ${
                selectedRole === 'employer'
                  ? 'border-brand bg-subtle text-ink'
                  : 'border-line bg-canvas text-muted hover:text-ink'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                {isId ? 'UMKM' : 'Business (SME)'}
              </span>
              <span className="text-[11px] text-muted">
                {isId ? 'Bonus 3 Token awal' : '3 starter Tokens'}
              </span>
            </button>
          </div>

          {/* Primary Email Form (No Google Sign-In required) */}
          <form onSubmit={handleEmailForm} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-name" className="block text-sm font-medium text-ink mb-1">
                  {isId ? 'Nama lengkap' : 'Full name'}
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isId ? 'Contoh: Aldi Pratama' : 'e.g. Aldi Pratama'}
                  className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-ink mb-1">
                {isId ? 'Alamat email' : 'Email address'}
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-ink mb-1">
                {isId ? 'Kata sandi' : 'Password'}
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isId ? 'Minimal 6 karakter' : 'Minimum 6 characters'}
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
              />
            </div>

            {statusMessage && (
              <div
                role="status"
                className="rounded-xl border border-line bg-subtle p-3 text-xs text-ink leading-relaxed"
              >
                {statusMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-fg hover:bg-brand-hover transition-colors"
            >
              {submitting
                ? isId
                  ? 'Memproses...'
                  : 'Signing in...'
                : mode === 'signup'
                ? isId
                  ? 'Daftar dengan Email'
                  : 'Create Account with Email'
                : isId
                ? 'Masuk dengan Email'
                : 'Sign In with Email'}
            </button>
          </form>

          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-line-subtle" />
            <span className="mx-3 text-xs font-medium text-muted">
              {isId ? 'atau langsung coba' : 'or explore directly'}
            </span>
            <div className="flex-grow border-t border-line-subtle" />
          </div>

          <button
            type="button"
            onClick={handleDemoEnter}
            className="w-full inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-gold-fg hover:bg-gold-hover transition-colors"
          >
            {isId
              ? `Masuk Langsung (${selectedRole === 'talent' ? 'Talenta' : 'UMKM'})`
              : `Continue in Demo Workspace (${selectedRole === 'talent' ? 'Talent' : 'Business SME'})`}
          </button>

          <div className="flex items-center justify-between pt-2 text-xs text-muted border-t border-line-subtle">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              {isId ? 'Dilindungi Kebijakan Privasi TIMU' : 'Protected by TIMU Privacy Rules'}
            </span>
            {mode === 'login' ? (
              <Link to="/signup" className="font-semibold text-brand hover:underline">
                {isId ? 'Belum punya akun? Daftar' : 'Need an account? Sign up'}
              </Link>
            ) : (
              <Link to="/login" className="font-semibold text-brand hover:underline">
                {isId ? 'Sudah punya akun? Masuk' : 'Have an account? Sign in'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
