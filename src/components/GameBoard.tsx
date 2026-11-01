import React, { useMemo } from 'react';
import { Layers, HandCoins, Download, Flame, Eye, EyeOff } from 'lucide-react';
import { EmojiEvent, GameState, Player } from '../types/game';
import {
  calculateNetScore,
  evaluateCardSynergy,
} from '../utils/gameLogic';
import { HalfOverlapCardGroups, SingleCard } from './CardView';
import { CenterCoinPile, RubyCoin } from './RubyCoin';
import { OpponentSeat } from './PlayerSeat';
import { EmojiOverlay } from './EmojiOverlay';
import { TableAnimations } from './TableAnimations';
import { DicePhaseModal } from './DicePhaseModal';
import { ResultModal } from './ResultModal';

interface GameBoardProps {
  gameState: GameState;
  myPlayerId: string;
  isHost: boolean;
  activeEmojis: EmojiEvent[];
  onRollDice: () => void;
  onPassWithCoin: () => void;
  onTakeCard: () => void;
  onSendEmoji: (emoji: string, label: string) => void;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = React.memo(
  ({
    gameState,
    myPlayerId,
    isHost,
    activeEmojis,
    onRollDice,
    onPassWithCoin,
    onTakeCard,
    onSendEmoji,
    onPlayAgain,
    onReturnToLobby,
  }) => {
    // Sort players by turnOrder so seat rotation is clockwise around ME at bottom
    const orderedPlayers = useMemo(
      () => [...gameState.players].sort((a, b) => a.turnOrder - b.turnOrder),
      [gameState.players]
    );

    const myIndex = useMemo(() => {
      const idx = orderedPlayers.findIndex((p) => p.id === myPlayerId);
      return idx >= 0 ? idx : 0;
    }, [orderedPlayers, myPlayerId]);

    const me: Player = orderedPlayers[myIndex];

    // Relative opponents clockwise from Me (Bottom):
    // 3 Players: Left (next turn), Right (2nd next turn)
    // 4 Players: Left (next turn), Top (2nd next turn), Right (3rd next turn)
    const { leftOpponent, topOpponent, rightOpponent } = useMemo(() => {
      const total = orderedPlayers.length;
      if (total === 3) {
        return {
          leftOpponent: orderedPlayers[(myIndex + 1) % 3],
          topOpponent: null,
          rightOpponent: orderedPlayers[(myIndex + 2) % 3],
        };
      }
      return {
        leftOpponent: orderedPlayers[(myIndex + 1) % total],
        topOpponent: total >= 4 ? orderedPlayers[(myIndex + 2) % total] : null,
        rightOpponent:
          total >= 3 ? orderedPlayers[(myIndex + (total - 1)) % total] : null,
      };
    }, [orderedPlayers, myIndex]);

    const isMyTurn =
      gameState.phase === 'PLAYING' &&
      gameState.currentTurnPlayerId === myPlayerId;
    const mustForceTake = isMyTurn && me.coins <= 0;

    const myNetScore = useMemo(
      () => calculateNetScore(me.cards, me.coins),
      [me.cards, me.coins]
    );

    const synergy = useMemo(() => {
      if (gameState.currentCard === null) return null;
      return evaluateCardSynergy(me.cards, gameState.currentCard);
    }, [me.cards, gameState.currentCard]);

    return (
      <div className="h-[100dvh] w-full bg-[#090d16] text-white flex flex-col justify-between p-2 gap-1.5 overflow-hidden select-none relative">
        {/* Fullscreen 3D Flying Action Animations (Coin Throw & Card/Coin Sweep) */}
        <TableAnimations
          lastAction={gameState.lastAction}
          players={gameState.players}
          myPlayerId={myPlayerId}
          leftPlayerId={leftOpponent?.id}
          rightPlayerId={rightOpponent?.id}
          topPlayerId={topOpponent?.id}
        />

        {/* 1. TOP STATUS BAR */}
        <header className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#111827] border border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-black text-amber-300">
              방 {gameState.roomCode}
            </span>
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              {gameState.settings.coinVisibility === 'PUBLIC' ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" /> 코인 공개
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-rose-400" /> 코인 비공개
                </>
              )}
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (제외 {gameState.settings.excludedCount}장)
            </span>
          </div>

          <EmojiOverlay
            activeEmojis={activeEmojis}
            onSendEmoji={onSendEmoji}
          />
        </header>

        {/* 2. TOP PLAYER SEAT (Only in 4-Player Mode) */}
        {topOpponent && (
          <div className="shrink-0 w-full">
            <OpponentSeat
              player={topOpponent}
              position="TOP"
              isCurrentTurn={gameState.currentTurnPlayerId === topOpponent.id}
              coinVisibility={gameState.settings.coinVisibility}
            />
          </div>
        )}

        {/* 3. MIDDLE TABLE AREA: Left Player + Center Deck/Card + Right Player */}
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-1.5 items-stretch">
          {/* LEFT PLAYER SEAT */}
          <div className="col-span-4 flex flex-col min-h-0">
            {leftOpponent && (
              <OpponentSeat
                player={leftOpponent}
                position="LEFT"
                isCurrentTurn={
                  gameState.currentTurnPlayerId === leftOpponent.id
                }
                coinVisibility={gameState.settings.coinVisibility}
              />
            )}
          </div>

          {/* CENTER BOARD: Remaining Deck + Open Card + Center Ruby Coins */}
          <div className="col-span-4 rounded-2xl bg-[#0d1424] border border-slate-800/90 p-2 flex flex-col items-center justify-between relative overflow-hidden">
            {/* 1. TOP FIXED HEADER: Deck count + Latest Action text */}
            <div className="w-full h-[40px] shrink-0 flex flex-col items-center justify-center gap-0.5 z-10">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-black text-slate-200">
                <Layers className="w-3 h-3 text-amber-400" /> 남은 덱:{' '}
                <span className="text-amber-300">{gameState.deckCount}장</span>
              </div>
              <div className="h-[14px] text-[10px] text-slate-400 font-bold text-center truncate w-full">
                {gameState.lastAction ? (
                  gameState.lastAction.action === 'PASS'
                    ? `${gameState.lastAction.playerName}: 코인 1개 냄`
                    : `${gameState.lastAction.playerName}: [${gameState.lastAction.cardNumber}] 획득!`
                ) : (
                  <span>게임 진행 중</span>
                )}
              </div>
            </div>

            {/* 2. CENTER FIXED CARD CONTAINER: Card position never moves even 1 pixel! */}
            <div className="flex-1 w-full flex flex-col items-center justify-center z-10 relative">
              {gameState.currentCard !== null ? (
                <div className="flex flex-col items-center">
                  <SingleCard
                    number={gameState.currentCard}
                    size="lg"
                    highlightSynergy={Boolean(synergy?.isConnected)}
                  />
                  {/* Fixed 22px slot below card so synergy badge never shifts card Y-position */}
                  <div className="h-[22px] w-full flex items-center justify-center mt-1">
                    {synergy?.isConnected ? (
                      <div className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-200 text-[10px] font-black flex items-center gap-1 animate-pulse">
                        <Flame className="w-3 h-3 text-amber-400" /> 내 카드와 연속! (
                        {synergy.scoreDelta <= 0
                          ? `${synergy.scoreDelta}점 이득`
                          : '+0점 추가'}
                        )
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-500 font-bold">
                        중앙 카드
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-28 h-40 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center text-xs text-slate-500 font-bold">
                  카드 대기중
                </div>
              )}
            </div>

            {/* 3. BOTTOM FIXED COIN PILE */}
            <div className="z-10 w-full shrink-0">
              <CenterCoinPile count={gameState.centerCoins} />
            </div>
          </div>

          {/* RIGHT PLAYER SEAT */}
          <div className="col-span-4 flex flex-col min-h-0">
            {rightOpponent && (
              <OpponentSeat
                player={rightOpponent}
                position="RIGHT"
                isCurrentTurn={
                  gameState.currentTurnPlayerId === rightOpponent.id
                }
                coinVisibility={gameState.settings.coinVisibility}
              />
            )}
          </div>
        </div>

        {/* 4. BOTTOM AREA: MY SEAT (My Cards + My Ruby Coins + Turn Actions) */}
        <section
          className={`shrink-0 rounded-2xl p-2.5 border-2 transition-colors ${
            isMyTurn
              ? 'bg-[#1a1528] border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
              : 'bg-[#111827] border-slate-800'
          }`}
        >
          {/* My Info Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                {me.turnOrder + 1}
              </span>
              <span className="font-black text-sm text-white truncate">
                {me.name} <span className="text-amber-300 text-xs">(나)</span>
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="text-xs font-bold text-slate-300">
                내 점수: <strong className="text-emerald-300 font-black text-sm">{myNetScore}점</strong>
              </div>
              <RubyCoin size="md" count={me.coins} hidden={false} />
            </div>
          </div>

          {/* My Collected Cards (50% Half-Overlap Runs) */}
          <div className="max-h-[135px] min-h-[72px] overflow-y-auto px-1 py-1 rounded-xl bg-[#090d16]/80 border border-slate-800/80 mb-2 flex items-start justify-center">
            <HalfOverlapCardGroups
              cards={me.cards}
              size="sm"
              emptyText="아직 가져온 카드가 없습니다"
            />
          </div>

          {/* Turn Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={!isMyTurn || mustForceTake}
              onClick={onPassWithCoin}
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-35 font-black text-sm text-white shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <HandCoins className="w-4 h-4" />
              {mustForceTake
                ? '코인 0개 (패스 불가!)'
                : '노 땡스! (코인 1개 내기)'}
            </button>

            <button
              disabled={!isMyTurn}
              onClick={onTakeCard}
              className={`py-3 px-3 rounded-xl font-black text-sm text-slate-950 shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-35 ${
                mustForceTake
                  ? 'bg-amber-400 animate-bounce ring-2 ring-white'
                  : 'bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300'
              }`}
            >
              <Download className="w-4 h-4" />
              카드 가져오기
              {gameState.centerCoins > 0
                ? ` (+코인 ${gameState.centerCoins}개)`
                : ''}
            </button>
          </div>
        </section>

        {/* Modals for DICE_ORDER and FINISHED phases */}
        {gameState.phase === 'DICE_ORDER' && (
          <DicePhaseModal
            gameState={gameState}
            myPlayerId={myPlayerId}
            onRollDice={onRollDice}
          />
        )}

        {gameState.phase === 'FINISHED' && (
          <ResultModal
            gameState={gameState}
            myPlayerId={myPlayerId}
            isHost={isHost}
            onPlayAgain={onPlayAgain}
            onReturnToLobby={onReturnToLobby}
          />
        )}
      </div>
    );
  }
);

GameBoard.displayName = 'GameBoard';
