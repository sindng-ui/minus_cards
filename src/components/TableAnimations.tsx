import React, { useEffect, useState } from 'react';
import { TurnHistoryItem } from '../types/game';
import { RubyCoin } from './RubyCoin';
import { SingleCard } from './CardView';

interface TableAnimationsProps {
  lastAction: TurnHistoryItem | null;
  players: { id: string; name: string }[];
  myPlayerId: string;
  leftPlayerId?: string;
  rightPlayerId?: string;
  topPlayerId?: string;
}

type RelativeSeat = 'BOTTOM' | 'LEFT' | 'RIGHT' | 'TOP';

interface AnimState {
  id: string;
  type: 'PASS' | 'TAKE';
  seat: RelativeSeat;
  cardNumber: number;
  playerName: string;
  coinsTaken: number;
}

export const TableAnimations: React.FC<TableAnimationsProps> = React.memo(
  ({
    lastAction,
    myPlayerId,
    leftPlayerId,
    rightPlayerId,
    topPlayerId,
  }) => {
    const [anim, setAnim] = useState<AnimState | null>(null);

    useEffect(() => {
      if (!lastAction) return;

      const actorId = lastAction.playerId;

      let seat: RelativeSeat = 'BOTTOM';
      if (actorId === myPlayerId) {
        seat = 'BOTTOM';
      } else if (actorId === leftPlayerId) {
        seat = 'LEFT';
      } else if (actorId === rightPlayerId) {
        seat = 'RIGHT';
      } else if (actorId === topPlayerId) {
        seat = 'TOP';
      }

      const newAnim: AnimState = {
        id: lastAction.id,
        type: lastAction.action,
        seat,
        cardNumber: lastAction.cardNumber,
        playerName: lastAction.playerName,
        coinsTaken: lastAction.coinsTaken ?? 0,
      };

      setAnim(newAnim);

      // Duration for smooth visual cascade (PASS completes in 560ms, TAKE cascade takes up to 1100ms)
      const duration =
        newAnim.coinsTaken > 2
          ? 1100
          : newAnim.type === 'PASS'
          ? 560
          : 720;
      const timer = setTimeout(() => {
        setAnim((prev) => (prev?.id === newAnim.id ? null : prev));
      }, duration);

      return () => clearTimeout(timer);
    }, [lastAction, myPlayerId, leftPlayerId, rightPlayerId, topPlayerId]);

    if (!anim) return null;

    // Relative seat coordinates (in % of viewport)
    // Left Opponent seat: x = 18%, y = 44%
    // Right Opponent seat: x = 82%, y = 44%
    // Bottom (My seat): x = 50%, y = 84%
    // Top Opponent seat: x = 50%, y = 14%
    const seatCoords: Record<RelativeSeat, { x: number; y: number }> = {
      LEFT: { x: 18, y: 44 },
      RIGHT: { x: 82, y: 44 },
      BOTTOM: { x: 50, y: 84 },
      TOP: { x: 50, y: 14 },
    };

    const isPass = anim.type === 'PASS';

    // 1. COIN PASS:
    // Left player starts from LEFT (18%), Right player from RIGHT (82%), Me from BOTTOM (50%)
    // Destination is ALWAYS EXACT SCREEN CENTER X: 50%, and below the center card Y: 57%!
    const coinPassStartX = seatCoords[anim.seat].x;
    const coinPassStartY = seatCoords[anim.seat].y;
    const coinPassEndX = 50;
    const coinPassEndY = 57;

    // 2. CARD TAKE:
    // Origin is Center Card (x: 50%, y: 42%)
    const cardTakeStartX = 50;
    const cardTakeStartY = 42;
    const playerDest = seatCoords[anim.seat];
    const cardTakeEndX = playerDest.x;
    const cardTakeEndY = playerDest.y;

    const trailCoinCount = Math.min(Math.max(anim.coinsTaken, 1), 7);

    return (
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {/* CASE 1: PASS - Coin starts from player's exact seat (Left/Right/Bottom) and drops to EXACT CENTER (50%, 57%) */}
        {isPass && (
          <div
            key={anim.id}
            style={
              {
                '--from-x': `${coinPassStartX}%`,
                '--from-y': `${coinPassStartY}%`,
                '--to-x': `${coinPassEndX}%`,
                '--to-y': `${coinPassEndY}%`,
              } as React.CSSProperties
            }
            className="absolute animate-global-throw flex flex-col items-center drop-shadow-[0_4px_12px_rgba(244,63,94,0.95)]"
          >
            <RubyCoin size="lg" showBadge={false} />
            {/* Placed BELOW the coin, ensuring center card remains 100% uncovered */}
            <span className="mt-1 px-2.5 py-0.5 rounded-full bg-rose-600 border border-white text-white text-[11px] font-black shadow-lg whitespace-nowrap">
              {anim.playerName}: 코인 1개 냄!
            </span>
          </div>
        )}

        {/* CASE 2: TAKE - Card Flies into Player Deck + Trailing Coins Cascade! */}
        {!isPass && (
          <>
            {/* The Main Card Flying into Player Deck */}
            <div
              key={`card_${anim.id}`}
              style={
                {
                  '--from-x': `${cardTakeStartX}%`,
                  '--from-y': `${cardTakeStartY}%`,
                  '--to-x': `${cardTakeEndX}%`,
                  '--to-y': `${cardTakeEndY}%`,
                } as React.CSSProperties
              }
              className="absolute animate-global-card-take flex flex-col items-center drop-shadow-2xl"
            >
              <SingleCard number={anim.cardNumber} size="md" />
              <div className="mt-1 px-2.5 py-0.5 rounded-full bg-amber-400 border border-slate-950 text-slate-950 text-[11px] font-black shadow-xl whitespace-nowrap">
                {anim.playerName}님이 획득!
              </div>
            </div>

            {/* TRAILING COINS: 주루루루룩~ 딸려 들어가는 연속 코인 폭포 연출! */}
            {anim.coinsTaken > 0 &&
              Array.from({ length: trailCoinCount }).map((_, idx) => (
                <div
                  key={`coin_trail_${anim.id}_${idx}`}
                  style={
                    {
                      '--from-x': `${cardTakeStartX}%`,
                      '--from-y': `${cardTakeStartY + 12}%`,
                      '--to-x': `${cardTakeEndX}%`,
                      '--to-y': `${cardTakeEndY}%`,
                      animationDelay: `${0.08 + idx * 0.065}s`,
                    } as React.CSSProperties
                  }
                  className="absolute animate-global-coin-trail drop-shadow-[0_2px_8px_rgba(244,63,94,0.95)]"
                >
                  <RubyCoin size="md" showBadge={false} />
                </div>
              ))}

            {/* Jackpot Sweep Toast if 3+ coins taken */}
            {anim.coinsTaken >= 3 && (
              <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce z-50">
                <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 border-2 border-white text-white font-black text-sm shadow-[0_0_24px_rgba(245,158,11,0.8)] flex items-center gap-1.5 whitespace-nowrap">
                  💎 {anim.playerName}님이 코인 +{anim.coinsTaken}개 싹쓸이!!
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

TableAnimations.displayName = 'TableAnimations';
