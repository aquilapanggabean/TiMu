import React from 'react';

interface TimuLogoProps {
  size?: 'sm' | 'lg';
  showTagline?: boolean;
}

/**
 * Exact TIMü (Titik Temu) brand wordmark matching user reference:
 * Bold dark T, tall warm-gold serif I, bold dark M, split-curve u with two gold dots.
 */
export const TimuLogo: React.FC<TimuLogoProps> = ({ size = 'sm', showTagline = true }) => {
  const isLarge = size === 'lg';
  return (
    <div className="inline-flex flex-col items-center select-none leading-none">
      <svg
        viewBox="0 0 220 74"
        width={isLarge ? 210 : 88}
        height={isLarge ? 70 : 30}
        role="img"
        aria-label="TIMU Titik Temu"
        className="overflow-visible"
      >
        {/* T */}
        <path
          d="M6 12 H56 V23 H37 V68 H24 V23 H6 Z"
          className="fill-ink"
        />
        {/* I (warm gold with clean serif caps) */}
        <path
          d="M64 12 H88 V19 H81 V61 H88 V68 H64 V61 H71 V19 H64 Z"
          fill="#FEA405"
        />
        {/* M */}
        <path
          d="M95 68 V12 H110 L124 44 L138 12 H153 V68 H141 V32 L128 60 H120 L107 32 V68 Z"
          className="fill-ink"
        />
        {/* ü - two warm gold meeting dots */}
        <circle cx="174" cy="17" r="7.5" fill="#FEA405" />
        <circle cx="204" cy="17" r="7.5" fill="#FEA405" />
        {/* ü - split bottom U (two arcs meeting at Titik Temu) */}
        <path
          d="M164 29 H176 V49 C176 54.8 180.5 58 186.5 58.2 V69 C173.2 68.5 164 60.5 164 49 Z"
          className="fill-ink"
        />
        <path
          d="M202 29 H214 V49 C214 60.5 204.8 68.5 191.5 69 V58.2 C197.5 58 202 54.8 202 49 Z"
          className="fill-ink"
        />
      </svg>
      {showTagline && (
        <span
          className={`font-sans font-semibold tracking-tight text-ink ${
            isLarge ? 'mt-1 text-base' : 'mt-0.5 text-[9px]'
          }`}
        >
          Titik Temu
        </span>
      )}
    </div>
  );
};
