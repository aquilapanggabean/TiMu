import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected interface error occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('TIMU ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-status-error-bg text-status-error-text">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="type-h2 text-ink">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted">
              We encountered an unexpected error while rendering this screen. Please reload to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-hover transition-colors"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reload TIMU
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
