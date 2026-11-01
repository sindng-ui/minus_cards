import React from 'react';

interface RubyCoinProps {
  size?: 'sm' | 'md' | 'lg';
  count?: number;
  hidden?: boolean;
  showBadge?: boolean;
}

/**
 * Shiny faceted red Ruby Coin that looks desirable and tactile (Zero blur filters used).
 */
export const RubyCoin: React.FC<RubyCoinProps> = React.memo(
  ({ size = 'md', count, hidden = false, showBadge = true }) => {
    const sizeClasses = {
      sm: 'w-5 h-5 text-[10px]',
      md: 'w-7 h-7 text-xs',
      lg: 'w-10 h-10 text-sm',
    }[size];

    return (
      <div className="inline-flex items-center gap-1.5 select-none">
        <div
          style={{
            background:
              'radial-gradient(circle at 32% 28%, #fda4af 0%, #f43f5e 35%, #be123c 72%, #881337 100%)',
            boxShadow:
              '0 2px 6px rgba(225, 29, 72, 0.65), inset 0 1px 2px rgba(255, 255, 255, 0.8)',
          }}
          className={`relative rounded-full border-2 border-rose-200 flex items-center justify-center font-black text-white ${sizeClasses}`}
        >
          {/* Faceted inner gem ring */}
          <div className="pointer-events-none absolute inset-[2px] rounded-full border border-amber-200/60" />
          {/* Specular shine dot */}
          <div className="pointer-events-none absolute top-1 left-1.5 w-1.5 h-1 rounded-full bg-white/90 rotate-[-25deg]" />
          <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            ♦
          </span>
        </div>

        {showBadge && (
          <span className="font-extrabold tracking-tight text-rose-300">
            {hidden ? '??개' : `${count ?? 1}개`}
          </span>
        )}
      </div>
    );
  }
);

RubyCoin.displayName = 'RubyCoin';

interface CenterCoinPileProps {
  count: number;
}

/**
 * Visualizes all the red ruby coins stacked on top of/next to the center card.
 */
export const CenterCoinPile: React.FC<CenterCoinPileProps> = React.memo(
  ({ count }) => {
    return (
      <div className="h-[52px] w-full flex flex-col items-center justify-center shrink-0">
        {count <= 0 ? (
          <div className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[11px] text-slate-400 font-bold">
            쌓인 코인 0개
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex flex-wrap items-center justify-center max-w-[140px] -space-x-2">
              {Array.from({ length: Math.min(count, 10) }).map((_, idx) => (
                <div
                  key={idx}
                  className="transition-transform duration-200"
                  style={{ zIndex: idx + 1 }}
                >
                  <RubyCoin size="sm" showBadge={false} />
                </div>
              ))}
            </div>
            <div className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500/70 text-rose-200 text-[10px] font-black shadow-md">
              💎 루비 코인 +{count}개
            </div>
          </div>
        )}
      </div>
    );
  }
);

CenterCoinPile.displayName = 'CenterCoinPile';
