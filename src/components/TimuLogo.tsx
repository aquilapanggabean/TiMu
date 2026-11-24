import React from 'react';

const LIGHT_LOGO_SRC = '/assets/aistudio/IMG_1153_0507ea40.PNG';
const DARK_LOGO_SRC = '/assets/aistudio/IMG_1154_3aaa0c6d.PNG';

interface TimuLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  tone?: 'auto' | 'light' | 'dark';
  className?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-[46px] w-[104px]',
  md: 'h-[62px] w-[138px]',
  lg: 'h-[98px] w-[220px]',
};

/**
 * Official TIMU (Titik Temu) brand logo rendered from the provided
 * light-mode and dark-mode artwork assets, cropped cleanly to the wordmark
 * bounding box and blended seamlessly into light and dark editorial surfaces.
 */
export const TimuLogo: React.FC<TimuLogoProps> = ({
  size = 'sm',
  tone = 'auto',
  className = '',
}) => {
  const boxClass = `relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none leading-none ${SIZE_CLASSES[size]} ${className}`;
  const imgBase = 'h-full w-full object-cover object-center pointer-events-none';

  return (
    <span className={boxClass}>
      {tone !== 'dark' && (
        <img
          src={LIGHT_LOGO_SRC}
          alt="TIMU Titik Temu"
          decoding="async"
          className={`${imgBase} mix-blend-multiply ${tone === 'auto' ? 'dark:hidden' : ''}`}
        />
      )}
      {tone !== 'light' && (
        <img
          src={DARK_LOGO_SRC}
          alt="TIMU Titik Temu"
          decoding="async"
          className={`${imgBase} mix-blend-lighten ${tone === 'auto' ? 'hidden dark:block' : ''}`}
        />
      )}
    </span>
  );
};
