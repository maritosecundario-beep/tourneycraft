
'use client';

import { cn } from '@/lib/utils';
import { EmblemShape, EmblemPattern } from '@/lib/types';

export const CrestIcon = ({ 
  shape, pattern, c1, c2, c3, c4, border = 'thin', size = "w-10 h-10", className
}: { 
  shape: EmblemShape, pattern: EmblemPattern, c1: string, c2: string, c3: string, c4?: string, 
  border?: 'none' | 'thin' | 'thick', size?: string, className?: string
}) => {
  const borderWidth = border === 'none' ? 0 : border === 'thin' ? 1 : 2;
  
  const renderPattern = () => {
    switch(pattern) {
      case 'vertical-split': return <rect x="12" y="0" width="12" height="24" fill={c2} />;
      case 'horizontal-split': return <rect x="0" y="12" width="24" height="12" fill={c2} />;
      case 'diagonal-split': return <path d="M0 0 L24 24 L24 0 Z" fill={c2} />;
      case 'cross': return (
        <>
          <rect x="10" y="0" width="4" height="24" fill={c2} />
          <rect x="0" y="10" width="24" height="4" fill={c2} />
        </>
      );
      case 'saltire': return (
        <>
          <path d="M0 0 L24 24 L20 24 L0 4 Z" fill={c2} />
          <path d="M24 0 L0 24 L4 24 L24 4 Z" fill={c2} />
        </>
      );
      case 'quarters': return (
        <>
          <rect x="12" y="0" width="12" height="12" fill={c2} />
          <rect x="0" y="12" width="12" height="12" fill={c2} />
        </>
      );
      default: return null;
    }
  };

  const renderShapePath = () => {
    switch (shape) {
      case 'shield': return "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";
      case 'circle': return "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z";
      case 'hexagon': return "M12 2l8.66 5v10L12 22l-8.66-5V7z";
      case 'diamond': return "M12 2l10 10-10 10-10-10z";
      case 'modern': return "M2 7l10-5 10 5v10l-10 5-10-5z";
      case 'square': return "M3 3h18v18h-18z";
      case 'star': return "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z";
      case 'lion': return "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z";
      case 'crown': return "M2 20h20v-4l-4-4-2 4-2-4-2 4-2-4-4 4z";
      case 'eagle': return "M12 2l2 4h6l-4 4 2 6-6-4-6 4 2-6-4-4h6z";
      default: return "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";
    }
  };

  const pathD = renderShapePath();

  return (
    <svg viewBox="0 0 24 24" className={cn("drop-shadow-lg", size, className)}>
      <defs>
        <clipPath id={`crest-clip-${shape}`}>
          <path d={pathD} />
        </clipPath>
      </defs>
      <path d={pathD} fill={c1} />
      <g clipPath={`url(#crest-clip-${shape})`}>
        {renderPattern()}
      </g>
      {borderWidth > 0 && <path d={pathD} fill="none" stroke={c3} strokeWidth={borderWidth} />}
      {shape === 'lion' && <path d="M12 7c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3z" fill={c4 || c2} />}
    </svg>
  );
};
