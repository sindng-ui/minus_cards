import React from 'react';
import { Dices } from 'lucide-react';
import { GameState } from '../types/game';

interface DicePhaseModalProps {
  gameState: GameState;
  myPlayerId: string;
  onRollDice: () => void;
}

const DICE_FACES: Record<number, string> = {
  1: '⚀',
  2: '⚁',
  3: '⚂',
  4: '⚃',
  5: '⚄',
  6: '⚅',
};

export const DicePhaseModal: React.FC<DicePhaseModalProps> = React.memo(
  ({ gameState, myPlayerId, onRollDice }) => {
    const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
    const mustIRoll =
      gameState.diceTiedPlayerIds.includes(myPlayerId) &&
      !myPlayer?.diceRoll?.hasRolled;

    return (
      <div className="fixed inset-0 z-50 bg-[#090d16]/95 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-[#111827] border-2 border-amber-500/60 p-5 space-y-4 shadow-2xl">
          <div className="text-center space-y-1">
            <span className="inline-block px-3 py-0.5 rounded-full bg-amber-950 border border-amber-500/50 text-amber-300 text-xs font-black">
              라운드 {gameState.diceRound} · 선후공 결정
            </span>
            <h2 className="text-xl font-black text-white">
              🎲 주사위 2개로 턴 순서 정하기
            </h2>
            <p className="text-xs font-bold text-amber-200">
              {gameState.diceStatusMessage}
            </p>
          </div>

          {/* Players Dice Board */}
          <div className="space-y-2.5">
            {gameState.players.map((p) => {
              const isRollingTarget = gameState.diceTiedPlayerIds.includes(p.id);
              const rolled = p.diceRoll?.hasRolled;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border ${
                    isRollingTarget && !rolled
                      ? 'bg-amber-950/30 border-amber-400'
                      : 'bg-[#090d16] border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white">
                      {p.name}
                    </span>
                    {p.id === myPlayerId && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        나
                      </span>
                    )}
                    {isRollingTarget && !rolled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold animate-pulse">
                        굴리는 중...
                      </span>
                    )}
                  </div>

                  {rolled && p.diceRoll ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl leading-none text-amber-300">
                        {DICE_FACES[p.diceRoll.dice1] || '⚀'}
                      </span>
                      <span className="text-2xl leading-none text-amber-300">
                        {DICE_FACES[p.diceRoll.dice2] || '⚀'}
                      </span>
                      <span className="ml-1 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-sm">
                        합 {p.diceRoll.total}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 font-bold">
                      주사위 대기 중
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Roll Button */}
          {mustIRoll ? (
            <button
              onClick={onRollDice}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer animate-bounce"
            >
              <Dices className="w-6 h-6" /> 내 주사위 2개 굴리기!
            </button>
          ) : (
            <div className="py-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs font-bold text-slate-400">
              {gameState.diceTiedPlayerIds.length === 0
                ? '모든 순서가 결정되었습니다! 테이블로 이동합니다...'
                : '다른 플레이어가 주사위를 굴리기를 기다리는 중...'}
            </div>
          )}
        </div>
      </div>
    );
  }
);

DicePhaseModal.displayName = 'DicePhaseModal';
