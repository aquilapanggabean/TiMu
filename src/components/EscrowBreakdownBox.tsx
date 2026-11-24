import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { CurrencyCode } from '../types/timu';
import { calculateEscrowBreakdown, formatMoney } from '../lib/domain';
import { useWorkspace } from '../context/WorkspaceContext';

interface EscrowBreakdownBoxProps {
  grossAmountMinor: number;
  currency: CurrencyCode;
  providerLabel?: string;
}

export const EscrowBreakdownBox: React.FC<EscrowBreakdownBoxProps> = ({
  grossAmountMinor,
  currency,
  providerLabel,
}) => {
  const { dict, locale } = useWorkspace();
  const safeGross = Math.max(0, Math.round(grossAmountMinor || 0));
  const { platformFeeMinor, netTalentMinor } = calculateEscrowBreakdown(safeGross);

  return (
    <div className="rounded-lg border border-line bg-canvas p-4 space-y-3">
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">{dict.escrow.grossBudget}</span>
          <span className="font-semibold text-ink tabular-nums text-right">
            {formatMoney(safeGross, currency, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">{dict.escrow.platformFee}</span>
          <span className="font-semibold text-muted tabular-nums text-right">
            - {formatMoney(platformFeeMinor, currency, locale)}
          </span>
        </div>
        <div className="border-t border-line pt-2 flex items-center justify-between gap-4">
          <span className="font-bold text-ink">{dict.escrow.netPayout}</span>
          <span className="text-base font-bold text-brand tabular-nums text-right">
            {formatMoney(netTalentMinor, currency, locale)}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-subtle px-3 py-2 text-xs text-muted leading-relaxed">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
        <div>
          {providerLabel && <p className="font-semibold text-ink mb-0.5">{providerLabel}</p>}
          <p>{dict.escrow.complianceNote}</p>
        </div>
      </div>
    </div>
  );
};
