import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Chrome, ShieldCheck, UserRound } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { WorkspaceMode } from '../types/timu';

export const AuthPage: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
  const { signInWithGoogle, enterDemoWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<WorkspaceMode>('talent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const targetRoute = selectedRole === 'talent' ? '/talent/first-quest' : '/employer/discover';

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setStatusMessage(null);
    const ok = await signInWithGoogle(selectedRole);
    setSubmitting(false);
    if (ok) {
      navigate(targetRoute);
    } else {
      setStatusMessage(
        'Google Sign-In popup was dismissed or blocked by the browser. You can retry Google Sign-In or explore immediately in Demo Workspace.'
      );
    }
  };

  const handleEmailForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || password.length < 6) {
      setStatusMessage('Enter a valid email address and a password with at least 6 characters.');
      return;
    }
    setStatusMessage(
      'This deployment uses Google Sign-In via Firebase Authentication. To enable Email and Password accounts, activate the Email/Password provider in your Firebase Console, or click Continue with Google / Demo Workspace below.'
    );
  };

  const handleDemoEnter = () => {
    enterDemoWorkspace(selectedRole);
    navigate(targetRoute);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to TIMU
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-card space-y-6">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/icon.svg" alt="TIMU logo" width={32} height={32} className="h-8 w-8 rounded-lg" />
              <span className="font-display text-lg font-extrabold text-ink">TIMU</span>
            </div>
            <h1 className="type-h1 text-ink">
              {mode === 'signup' ? 'Create your TIMU account' : 'Sign in to TIMU'}
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              One account gives you access to both Talent and Business (SME) workspaces. Choose where to start first.
            </p>
          </div>

          {/* Initial Role Preference */}
          <div role="radiogroup" aria-label="Starting workspace role" className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              role="radio"
              aria-checked={selectedRole === 'talent'}
              onClick={() => setSelectedRole('talent')}
              className={`flex min-h-[56px] flex-col items-start justify-center rounded-xl border p-3 text-left transition-colors ${
                selectedRole === 'talent'
                  ? 'border-brand bg-subtle text-ink'
                  : 'border-line bg-canvas text-muted hover:text-ink'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Talent
              </span>
              <span className="text-[11px] text-muted">Start First Quest</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={selectedRole === 'employer'}
              onClick={() => setSelectedRole('employer')}
              className={`flex min-h-[56px] flex-col items-start justify-center rounded-xl border p-3 text-left transition-colors ${
                selectedRole === 'employer'
                  ? 'border-brand bg-subtle text-ink'
                  : 'border-line bg-canvas text-muted hover:text-ink'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                Business (SME)
              </span>
              <span className="text-[11px] text-muted">3 starter Tokens</span>
            </button>
          </div>

          {/* Primary Google Sign-In */}
          <div className="space-y-2.5">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleGoogleSignIn()}
              className="w-full inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-fg hover:bg-brand-hover transition-colors"
            >
              <Chrome className="h-4 w-4" aria-hidden="true" />
              {submitting ? 'Connecting to Google...' : 'Continue with Google'}
            </button>

            <button
              type="button"
              onClick={handleDemoEnter}
              className="w-full inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-gold-fg hover:bg-gold-hover transition-colors"
            >
              Continue in Demo Workspace ({selectedRole === 'talent' ? 'Talent' : 'Business SME'})
            </button>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-line-subtle" />
            <span className="mx-3 text-xs font-medium text-muted">or email</span>
            <div className="flex-grow border-t border-line-subtle" />
          </div>

          <form onSubmit={handleEmailForm} className="space-y-3.5">
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-ink mb-1">
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="w-full min-h-[44px] rounded-xl border border-line-strong bg-canvas px-3.5 text-sm text-ink"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-ink mb-1">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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
              className="w-full min-h-[44px] rounded-xl border-[1.5px] border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-subtle transition-colors"
            >
              {mode === 'signup' ? 'Create Account with Email' : 'Sign In with Email'}
            </button>
          </form>

          <div className="flex items-center justify-between pt-2 text-xs text-muted border-t border-line-subtle">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              Protected by TIMU Privacy Rules
            </span>
            {mode === 'login' ? (
              <Link to="/signup" className="font-semibold text-brand hover:underline">
                Need an account? Sign up
              </Link>
            ) : (
              <Link to="/login" className="font-semibold text-brand hover:underline">
                Have an account? Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
