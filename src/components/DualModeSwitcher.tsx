import React from 'react';
import { Briefcase, UserRound } from 'lucide-react';
import type { WorkspaceMode } from '../types/timu';
import { useWorkspace } from '../context/WorkspaceContext';

interface DualModeSwitcherProps {
  mode: WorkspaceMode;
  onChange: (mode: WorkspaceMode) => void;
  compact?: boolean;
}

export const DualModeSwitcher: React.FC<DualModeSwitcherProps> = ({
  mode,
  onChange,
  compact = false,
}) => {
  const { locale, dict } = useWorkspace();
  const isId = locale === 'id';

  const talentLabel = isId ? 'Talenta' : 'Talent';
  const employerLabel = isId ? 'UMKM' : compact ? 'SME' : 'Employer';

  return (
    <div
      role="radiogroup"
      aria-label={dict.modes.switchWorkspace}
      className={`grid grid-cols-2 gap-1 rounded-xl border border-line bg-subtle p-1 ${
        compact ? 'text-xs' : 'w-full text-sm'
      }`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'talent'}
        onClick={() => onChange('talent')}
        className={`flex min-h-[40px] min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 font-semibold transition-colors whitespace-nowrap ${
          mode === 'talent'
            ? 'bg-brand text-brand-fg shadow-xs'
            : 'bg-transparent text-muted hover:text-ink'
        }`}
      >
        <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{talentLabel}</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={mode === 'employer'}
        onClick={() => onChange('employer')}
        className={`flex min-h-[40px] min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 font-semibold transition-colors whitespace-nowrap ${
          mode === 'employer'
            ? 'bg-brand text-brand-fg shadow-xs'
            : 'bg-transparent text-muted hover:text-ink'
        }`}
      >
        <Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{employerLabel}</span>
      </button>
    </div>
  );
};
