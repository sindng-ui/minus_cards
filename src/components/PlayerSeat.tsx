import React from 'react';
import { Player } from '../types/game';
import { HalfOverlapCardGroups } from './CardView';
import { RubyCoin } from './RubyCoin';

interface OpponentSeatProps {
  player: Player;
  position: 'LEFT' | 'RIGHT' | 'TOP';
  isCurrentTurn: boolean;
  coinVisibility: 'PUBLIC' | 'HIDDEN';
}

export const OpponentSeat: React.FC<OpponentSeatProps> = React.memo(
  ({ player, position, isCurrentTurn, coinVisibility }) => {
    const posStyles = {
      TOP: 'w-full max-w-[340px] mx-auto',
      LEFT: 'w-full h-full flex flex-col',
      RIGHT: 'w-full h-full flex flex-col',
    }[position];

    return (
      <div
        className={`rounded-2xl p-2 transition-colors duration-200 border flex flex-col justify-between ${posStyles} ${
          isCurrentTurn
            ? 'bg-[#1a162b] border-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.35)]'
            : 'bg-[#111827] border-slate-800'
        }`}
      >
        {/* Header: Vertical 2-Row Layout so Name gets 100% width without being crowded by Coins! */}
        <div className="flex flex-col gap-1 border-b border-slate-800 pb-1.5 mb-1 shrink-0 w-full">
          {/* Row 1: Turn Number + Player Name (Full Width) */}
          <div className="flex items-center gap-1.5 w-full min-w-0">
            <span
              className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${
                isCurrentTurn
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-slate-800 text-slate-200'
              }`}
            >
              {player.turnOrder + 1}
            </span>
            <span
              className="font-black text-xs sm:text-sm text-white truncate drop-shadow-sm flex-1"
              title={player.name}
            >
              {player.name}
            </span>
          </div>

          {/* Row 2: Ruby Coin + Turn Indicator */}
          <div className="flex items-center justify-between w-full">
            <RubyCoin
              size="sm"
              count={player.coins}
              hidden={coinVisibility === 'HIDDEN'}
            />
            {isCurrentTurn && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black shrink-0 animate-pulse">
                차례
              </span>
            )}
          </div>
        </div>

        {/* Collected Cards (50% Half-Overlapped Consecutive Runs) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-[90px] max-h-[175px] flex items-start justify-center">
          <HalfOverlapCardGroups
            cards={player.cards}
            size="xs"
            emptyText="카드 없음"
          />
        </div>
      </div>
    );
  }
);

OpponentSeat.displayName = 'OpponentSeat';
