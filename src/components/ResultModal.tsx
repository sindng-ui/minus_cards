import React, { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Eye } from 'lucide-react';
import { GameState } from '../types/game';
import { calculateFinalRankings } from '../utils/gameLogic';
import { SingleCard } from './CardView';
import { RubyCoin } from './RubyCoin';

interface ResultModalProps {
  gameState: GameState;
  myPlayerId: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = React.memo(
  ({ gameState, myPlayerId, isHost, onPlayAgain, onReturnToLobby }) => {
    const rankings = useMemo(
      () => calculateFinalRankings(gameState.players),
      [gameState.players]
    );

    useEffect(() => {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore in headless environments
      }
    }, []);

    return (
      <div className="fixed inset-0 z-50 bg-[#090d16]/95 flex flex-col items-center justify-between p-4 overflow-y-auto">
        <div className="w-full max-w-md space-y-4 my-auto py-2">
          {/* Winner Banner */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950 border border-amber-400 text-amber-300 text-xs font-black">
              <Trophy className="w-4 h-4 text-amber-400" /> 게임 종료 · 최종 결과
            </div>
            <h2 className="text-2xl font-black text-white">
              👑 우승: {rankings[0]?.name}님!
            </h2>
            <p className="text-xs text-slate-400">
              점수 계산: (연속 숫자는 최소값만 더한 카드 합) - (보유 코인 수)
            </p>
          </div>

          {/* Leaderboard Cards */}
          <div className="space-y-2.5">
            {rankings.map((r) => {
              const isWinner = r.rank === 1;
              const isMe = r.playerId === myPlayerId;
              return (
                <div
                  key={r.playerId}
                  className={`p-3.5 rounded-2xl border ${
                    isWinner
                      ? 'bg-[#1f1924] border-2 border-amber-400 shadow-lg'
                      : 'bg-[#111827] border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          isWinner
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {r.rank}위
                      </span>
                      <span className="font-black text-base text-white">
                        {r.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                          나
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 mr-1.5">
                        ({r.cardSum}점 - 코인 {r.coins}개) =
                      </span>
                      <span
                        className={`text-lg font-black ${
                          isWinner ? 'text-amber-300' : 'text-white'
                        }`}
                      >
                        {r.finalScore}점
                      </span>
                    </div>
                  </div>

                  {/* Consecutive Groups Breakdown */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {r.groups.length === 0 ? (
                        <span className="text-xs text-slate-500 italic">
                          획득한 카드 없음 (0점)
                        </span>
                      ) : (
                        r.groups.map((grp) => (
                          <div
                            key={grp[0]}
                            className="px-2 py-1 rounded-lg bg-[#090d16] border border-slate-700 text-xs font-bold flex items-center gap-1"
                          >
                            <span className="text-amber-300 font-black">
                              {grp[0]}
                            </span>
                            {grp.length > 1 && (
                              <span className="text-slate-500 line-through text-[11px]">
                                , {grp.slice(1).join(', ')}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <RubyCoin size="sm" count={r.coins} hidden={false} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Excluded Hidden Cards Reveal Section */}
          <div className="p-3.5 rounded-2xl bg-[#111827] border border-rose-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> 처음에 제외되었던 히든 카드 (
                {gameState.hiddenExcludedCards.length}장) 공개!
              </span>
              <span className="text-[11px] text-slate-400">
                이 숫자들을 기다리셨나요? 😉
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {gameState.hiddenExcludedCards.map((num) => (
                <SingleCard key={num} number={num} size="xs" />
              ))}
            </div>
          </div>

          {/* Host Replay / Lobby Controls */}
          {isHost ? (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={onPlayAgain}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-sm text-white shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> 바로 한 판 더!
              </button>
              <button
                onClick={onReturnToLobby}
                className="py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 font-bold text-sm text-white cursor-pointer"
              >
                대기실(설정변경)로 이동
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs font-bold text-slate-400">
              방장이 다음 게임을 시작하기를 기다리는 중입니다...
            </div>
          )}
        </div>
      </div>
    );
  }
);

ResultModal.displayName = 'ResultModal';
