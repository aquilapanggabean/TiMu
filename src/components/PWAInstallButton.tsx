import React, { useState } from 'react';
import { Download, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { Modal } from './Modal';
import { useWorkspace } from '../context/WorkspaceContext';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { dict } = useWorkspace();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        aria-label={dict.common.installApp}
        className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface text-sm font-semibold text-ink hover:bg-subtle transition-colors whitespace-nowrap ${
          compact ? 'px-2.5' : 'w-full px-3.5 py-2'
        }`}
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!compact && <span>{dict.common.installApp}</span>}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label={dict.common.installApp}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface text-sm font-semibold text-ink hover:bg-subtle transition-colors whitespace-nowrap ${
            compact ? 'px-2.5' : 'w-full px-3.5 py-2'
          }`}
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!compact && <span>{dict.common.installApp}</span>}
        </button>

        <Modal
          open={showIOSGuide}
          onClose={() => setShowIOSGuide(false)}
          title="Install TIMU on iPhone or iPad"
          description="Add TIMU to your home screen for standalone app access."
        >
          <ol className="space-y-3 text-sm text-ink list-decimal pl-5">
            <li>Tap the Share button in Safari toolbar.</li>
            <li>Scroll down and choose Add to Home Screen.</li>
            <li>Tap Add in the top right corner to launch TIMU full screen.</li>
          </ol>
          <button
            type="button"
            onClick={() => setShowIOSGuide(false)}
            className="mt-5 w-full min-h-[44px] rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
          >
            {dict.common.close}
          </button>
        </Modal>
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { dict } = useWorkspace();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl border border-line-strong bg-gold-soft px-3.5 py-2 text-xs font-semibold text-gold-soft-fg shadow-card sm:bottom-4"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{dict.common.offlineNotice}</span>
    </div>
  );
};
