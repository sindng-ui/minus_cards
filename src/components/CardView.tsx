import React, { useMemo } from 'react';
import { getCardTheme, groupConsecutiveCards } from '../utils/gameLogic';

interface SingleCardProps {
  number: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isFirstInRun?: boolean; // Whether this card counts toward the score (lowest in run)
  highlightSynergy?: boolean;
}

/**
 * Dual-Half Number Card:
 * Has clearly visible numbers in BOTH the TOP HALF and BOTTOM HALF
 * so that when cards are overlapped by 50% vertically, every card's number is 100% readable!
 */
export const SingleCard: React.FC<SingleCardProps> = React.memo(
  ({ number, size = 'md', isFirstInRun = true, highlightSynergy = false }) => {
    const theme = useMemo(() => getCardTheme(number), [number]);

    const dimensions = {
      xs: 'w-9 h-14 rounded-md border',
      sm: 'w-11 h-16 rounded-lg border-[1.5px]',
      md: 'w-14 h-20 rounded-xl border-2',
      lg: 'w-28 h-40 rounded-2xl border-[3px]',
    }[size];

    const fontSizes = {
      xs: 'text-[13px] font-black leading-none',
      sm: 'text-[15px] font-black leading-none',
      md: 'text-lg font-black leading-none',
      lg: 'text-4xl font-black leading-none',
    }[size];

    return (
      <div
        style={{
          background: theme.bgGradient,
          boxShadow: highlightSynergy
            ? `0 0 16px ${theme.glowColor}`
            : '0 4px 8px rgba(0,0,0,0.55)',
        }}
        className={`relative select-none flex flex-col justify-between overflow-hidden transition-transform duration-200 ${dimensions} ${
          theme.borderClass
        } ${highlightSynergy ? 'ring-2 ring-yellow-300 scale-105' : ''}`}
      >
        {/* Decorative inner frame */}
        <div className="pointer-events-none absolute inset-[2px] rounded-[inherit] border border-white/20" />

        {/* TOP HALF: Number & indicator */}
        <div className="relative z-10 flex h-1/2 w-full items-center justify-between px-1.5 pt-0.5 border-b border-white/15">
          <span
            className={`${fontSizes} text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)] tracking-tighter`}
          >
            {number}
          </span>
          {size === 'lg' ? (
            <span className="text-[11px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/40 text-white/90 border border-white/20">
              {theme.tierName.split(' ')[0]}
            </span>
          ) : !isFirstInRun ? (
            <span
              title="연속 숫자 (0점 처리)"
              className="text-[9px] font-extrabold px-1 rounded bg-black/50 text-emerald-300"
            >
              연속
            </span>
          ) : null}
        </div>

        {/* Center watermark gem for large card */}
        {size === 'lg' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rotate-45 border-2 border-white/20 bg-white/5 flex items-center justify-center">
              <span className="-rotate-45 text-xs font-black text-white/40">
                MINUS
              </span>
            </div>
          </div>
        )}

        {/* BOTTOM HALF: Identical Complete Number so bottom overlap also shows full number */}
        <div className="relative z-10 flex h-1/2 w-full items-center justify-between px-1.5 pb-0.5 bg-black/15">
          {size === 'lg' ? (
            <span className="text-[11px] font-extrabold text-white/80">
              +{number}점
            </span>
          ) : (
            <span className="text-[8px] font-bold text-white/60">
              {isFirstInRun ? `+${number}` : '0'}
            </span>
          )}
          <span
            className={`${fontSizes} text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)] tracking-tighter`}
          >
            {number}
          </span>
        </div>
      </div>
    );
  }
);

SingleCard.displayName = 'SingleCard';

interface HalfOverlapCardGroupsProps {
  cards: number[];
  size?: 'xs' | 'sm' | 'md';
  emptyText?: string;
}

/**
 * Renders a player's collected cards grouped into consecutive runs.
 * Within each consecutive run, cards are vertically overlapped by 50% (half-card height)
 * so both the top half of covered cards and bottom half of the top card remain 100% visible!
 */
export const HalfOverlapCardGroups: React.FC<HalfOverlapCardGroupsProps> =
  React.memo(({ cards, size = 'sm', emptyText = '보유 카드 없음' }) => {
    const groups = useMemo(() => groupConsecutiveCards(cards), [cards]);

    if (groups.length === 0) {
      return (
        <div className="flex items-center justify-center h-full min-h-[48px] text-[11px] text-slate-500 font-medium italic">
          {emptyText}
        </div>
      );
    }

    // Half-height negative margin for 50% vertical overlap
    const overlapOffsetPx = {
      xs: 28, // half of h-14 (56px)
      sm: 32, // half of h-16 (64px)
      md: 40, // half of h-20 (80px)
    }[size];

    const baseHeightPx = {
      xs: 56,
      sm: 64,
      md: 80,
    }[size];

    return (
      <div className="flex flex-wrap items-start justify-center gap-1.5 py-0.5">
        {groups.map((run) => {
          const stackHeight =
            baseHeightPx + (run.length - 1) * overlapOffsetPx;
          return (
            <div
              key={run[0]}
              style={{ height: `${stackHeight}px` }}
              className="relative flex flex-col items-center"
            >
              {run.map((cardNum, idx) => (
                <div
                  key={cardNum}
                  style={{
                    position: idx === 0 ? 'relative' : 'absolute',
                    top: idx === 0 ? 0 : `${idx * overlapOffsetPx}px`,
                    zIndex: idx + 1,
                  }}
                >
                  <SingleCard
                    number={cardNum}
                    size={size}
                    isFirstInRun={idx === 0}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  });

HalfOverlapCardGroups.displayName = 'HalfOverlapCardGroups';
