import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export const LoadingSkeleton: React.FC<{
  label?: string;
  variant?: 'cards' | 'list' | 'split';
}> = ({ label = 'Loading content...', variant = 'cards' }) => {
  return (
    <div aria-busy="true" className="space-y-4">
      <span className="sr-only">{label}</span>
      {variant === 'cards' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="rounded-2xl border border-line-subtle bg-surface p-5 space-y-3">
              <div className="skeleton-block h-4 w-28 rounded-lg" />
              <div className="skeleton-block h-6 w-3/4 rounded-lg" />
              <div className="skeleton-block h-4 w-full rounded-lg" />
              <div className="skeleton-block h-4 w-5/6 rounded-lg" />
              <div className="pt-2 flex justify-between">
                <div className="skeleton-block h-8 w-28 rounded-xl" />
                <div className="skeleton-block h-10 w-32 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}
      {variant === 'list' && (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-2xl border border-line-subtle bg-surface p-4 flex items-center gap-4">
              <div className="skeleton-block h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-block h-4 w-44 rounded-lg" />
                <div className="skeleton-block h-3.5 w-72 max-w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}
      {variant === 'split' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-2xl border border-line-subtle bg-surface p-6 space-y-4">
            <div className="skeleton-block h-7 w-56 rounded-lg" />
            <div className="skeleton-block h-24 w-full rounded-xl" />
            <div className="skeleton-block h-24 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-5 rounded-2xl border border-line-subtle bg-surface p-6 space-y-4">
            <div className="skeleton-block h-20 w-20 rounded-full mx-auto" />
            <div className="skeleton-block h-6 w-40 rounded-lg mx-auto" />
            <div className="skeleton-block h-16 w-full rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}> = ({ icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="mx-auto flex max-w-[380px] flex-col items-center rounded-2xl border border-line bg-surface px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-subtle text-ink">
        {icon}
      </div>
      <h2 className="mt-4 type-h2 text-ink">{title}</h2>
      <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-hover transition-colors whitespace-nowrap"
      >
        {actionLabel}
      </button>
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}> = ({ title = 'Unable to load data', message, onRetry, retryLabel = 'Try Again' }) => {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-status-error-text/30 bg-status-error-bg p-5 text-status-error-text"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-bold">{title}</h2>
            <p className="mt-1 text-sm opacity-90">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-status-error-text/40 bg-surface px-4 py-2 text-sm font-semibold text-status-error-text hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </button>
      </div>
    </div>
  );
};

export const PageSkeleton: React.FC = () => (
  <div className="px-4 py-6">
    <LoadingSkeleton variant="list" />
  </div>
);

export const PageErrorState: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="px-4 py-6">
    <ErrorState message={message} onRetry={onRetry} />
  </div>
);

