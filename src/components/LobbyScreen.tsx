import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  Users,
  Bot,
  Trash2,
  Play,
  Eye,
  EyeOff,
  Sparkles,
  LogIn,
  Crown,
} from 'lucide-react';
import { GameSettings, GameState } from '../types/game';
import { extractRoomCodeFromUrl } from '../utils/peerConfig';
import { RubyCoin } from './RubyCoin';
import { DiscoveredRoomList } from './DiscoveredRoomList';

interface LobbyScreenProps {
  myPlayerId: string;
  myName: string;
  setMyName: (name: string) => void;
  isHost: boolean;
  connectionStatus: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
  errorMessage: string | null;
  gameState: GameState | null;
  onCreateRoom: (hostName: string, settings: GameSettings) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onUpdateSettings: (settings: GameSettings) => void;
  onAddBot: () => void;
  onRemovePlayer: (id: string) => void;
  onStartGame: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = React.memo(
  ({
    myPlayerId,
    myName,
    setMyName,
    isHost,
    connectionStatus,
    errorMessage,
    gameState,
    onCreateRoom,
    onJoinRoom,
    onUpdateSettings,
    onAddBot,
    onRemovePlayer,
    onStartGame,
  }) => {
    const [roomInput, setRoomInput] = useState(() => extractRoomCodeFromUrl());
    const [isInvited, setIsInvited] = useState(() =>
      Boolean(extractRoomCodeFromUrl())
    );
    const [showManualCodeJoin, setShowManualCodeJoin] = useState(false);
    const [excludedCount, setExcludedCount] = useState(9);
    const [coinVisibility, setCoinVisibility] = useState<'PUBLIC' | 'HIDDEN'>(
      'HIDDEN'
    );
    const [copied, setCopied] = useState(false);

    // Keep query param or hash sync in case URL changes dynamically
    useEffect(() => {
      const code = extractRoomCodeFromUrl();
      if (code) {
        setRoomInput(code);
        setIsInvited(true);
      }
    }, []);

    const shareUrl = gameState
      ? `${window.location.origin}${window.location.pathname}?room=${gameState.roomCode}#room=${gameState.roomCode}`
      : '';

    const handleCopyInviteLink = async () => {
      if (!gameState) return;
      const inviteText = `[마이너스 카드] 🎴 가족·친구 심리전 보드게임에 초대되었습니다!\n아래 링크를 터치하면 바로 입장됩니다:\n${shareUrl}`;
      try {
        await navigator.clipboard.writeText(inviteText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch {
        // Fallback
      }
    };

    const handleNativeShare = async () => {
      if (!gameState) return;
      if (navigator.share) {
        try {
          await navigator.share({
            title: '마이너스 카드 (가족·친구 모바일 게임)',
            text: `마이너스 카드 게임에 초대되었습니다! 링크를 터치하면 바로 입장됩니다.`,
            url: shareUrl,
          });
          return;
        } catch {
          // User cancelled or fallback to copy
        }
      }
      handleCopyInviteLink();
    };

    // View 1: Not inside a room yet (Create or Join)
    if (!gameState || connectionStatus !== 'CONNECTED') {
      return (
        <div className="min-h-[100dvh] w-full bg-[#090d16] text-white flex flex-col items-center justify-between p-4 overflow-y-auto">
          {/* Header Banner */}
          <div className="w-full max-w-md pt-2 text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950 border border-rose-500/50 text-rose-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> 3~4인 실시간 모바일 네트워크 카드게임
            </div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300 bg-clip-text text-transparent">
              MINUS CARDS
            </h1>
            <p className="text-xs text-slate-400">
              3~35 숫자 카드와 영롱한 루비 코인 11개의 쫄깃한 눈치싸움!
            </p>
          </div>

          {/* Main Card Container */}
          <div className="w-full max-w-md space-y-4 my-auto py-3">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950 border border-rose-500 text-rose-200 text-xs font-bold text-center">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* CASE 1: Invited via KakaoTalk Link (No Room Code / No Password required, 1-Click Instant Pass!) */}
            {isInvited ? (
              <div className="p-5 rounded-2xl bg-gradient-to-b from-[#132238] to-[#111827] border-2 border-emerald-400 space-y-4 shadow-2xl">
                <div className="text-center space-y-1.5">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-400/60 text-xs font-black shadow-sm">
                    💌 초대장이 도착했습니다!
                  </span>
                  <h3 className="text-lg font-black text-white">
                    가족·친구 심리전 카드게임 참가
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    내 이름만 적고 아래 버튼을 누르면 바로 입장됩니다!
                  </p>
                </div>

                {/* Nickname Input for Invited Player */}
                <div className="space-y-1.5 bg-[#090d16] p-3 rounded-xl border border-slate-700">
                  <label className="block text-xs font-bold text-slate-300">
                    내 닉네임 (게임 중 표시될 이름)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={myName}
                    onChange={(e) => setMyName(e.target.value)}
                    placeholder="예: 막내, 삼촌, 타짜..."
                    className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* 1-Click Instant Enter Button */}
                <button
                  disabled={connectionStatus === 'CONNECTING'}
                  onClick={() => onJoinRoom(roomInput, myName || '참가자')}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 font-black text-base text-slate-950 shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <LogIn className="w-5 h-5" />
                  {connectionStatus === 'CONNECTING' ? '접속 중...' : '🚀 즉시 게임 입장하기'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsInvited(false)}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    내가 직접 방을 열거나 다른 방 번호 입력하기
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 0. Arcade Style Auto Discovered Rooms (One-Touch Instant Join for Family!) */}
                <DiscoveredRoomList
                  myName={myName}
                  onJoinRoom={onJoinRoom}
                  isConnecting={connectionStatus === 'CONNECTING'}
                />

                {/* 1. Host Room Section (Main Default) */}
                <div className="p-4 rounded-2xl bg-[#111827] border-2 border-rose-500/50 space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-base font-black text-rose-300 flex items-center gap-1.5">
                      <Crown className="w-5 h-5 text-amber-400" /> 내가 새 방(서버) 열기
                    </span>
                    <RubyCoin size="sm" count={11} />
                  </div>

                  {/* Player Nickname Input */}
                  <div className="space-y-1 bg-[#090d16] p-3 rounded-xl border border-slate-800">
                    <label className="block text-xs font-bold text-slate-300">
                      내 닉네임 (방장 이름)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={myName}
                      onChange={(e) => setMyName(e.target.value)}
                      placeholder="예: 큰형님, 타짜..."
                      className="w-full px-3.5 py-2 rounded-lg bg-[#111827] border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Setting 1: Excluded Cards Count (2 ~ 9) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">
                        제외할 비공개 카드 수 (2~9장)
                      </span>
                      <span className="text-amber-300 font-black">
                        33장 중 {excludedCount}장 제외 (사용: {33 - excludedCount}장)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={9}
                      value={excludedCount}
                      onChange={(e) => setExcludedCount(Number(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>2장 (변수 적음)</span>
                      <span>5장 (표준)</span>
                      <span>9장 (원작 룰·쫄깃함!)</span>
                    </div>
                  </div>

                  {/* Setting 2: Coin Visibility */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-bold text-slate-300">
                      보유 코인 개수 공개 여부
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCoinVisibility('HIDDEN')}
                        className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                          coinVisibility === 'HIDDEN'
                            ? 'bg-rose-950 border-rose-400 text-rose-200'
                            : 'bg-[#090d16] border-slate-800 text-slate-400'
                        }`}
                      >
                        <EyeOff className="w-3.5 h-3.5" /> 비공개 (심리전 추천)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoinVisibility('PUBLIC')}
                        className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                          coinVisibility === 'PUBLIC'
                            ? 'bg-amber-950 border-amber-400 text-amber-200'
                            : 'bg-[#090d16] border-slate-800 text-slate-400'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" /> 모두에게 공개
                      </button>
                    </div>
                  </div>

                  <button
                    disabled={connectionStatus === 'CONNECTING'}
                    onClick={() =>
                      onCreateRoom(myName || '방장', {
                        excludedCount,
                        coinVisibility,
                      })
                    }
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 font-black text-sm text-white shadow-lg cursor-pointer transition-transform active:scale-95"
                  >
                    {connectionStatus === 'CONNECTING'
                      ? '방 개설 중...'
                      : '이 설정으로 방 만들기 (3~4인)'}
                  </button>
                </div>

                {/* 2. Manual Room Code Join (Collapsible secondary option) */}
                <div className="text-center pt-1">
                  {!showManualCodeJoin ? (
                    <button
                      type="button"
                      onClick={() => setShowManualCodeJoin(true)}
                      className="text-xs text-slate-400 hover:text-emerald-400 underline cursor-pointer"
                    >
                      혹시 초대 링크 대신 방 코드를 직접 입력하시나요?
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-700 space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                          <LogIn className="w-3.5 h-3.5 text-emerald-400" /> 방 코드 직접 입력 참가
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowManualCodeJoin(false)}
                          className="text-[11px] text-slate-500 hover:text-slate-300"
                        >
                          닫기
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={roomInput}
                          onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                          placeholder="4자리 코드"
                          className="flex-1 px-3 py-2 rounded-lg bg-[#090d16] border border-slate-700 text-white font-black uppercase text-center text-sm focus:outline-none focus:border-emerald-400"
                        />
                        <button
                          disabled={
                            connectionStatus === 'CONNECTING' ||
                            roomInput.trim().length < 3
                          }
                          onClick={() => onJoinRoom(roomInput, myName || '참가자')}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-black text-xs text-white cursor-pointer"
                        >
                          입장
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer Rule Summary */}
          <div className="w-full max-w-md text-center pb-2 text-[11px] text-slate-500 space-y-0.5">
            <p>승리 조건: [카드 숫자의 합 - 보유 코인 수]가 가장 작은 사람 승리!</p>
            <p>연속된 숫자(예: 11, 12, 13)는 가장 작은 숫자(11) 하나로만 계산됩니다.</p>
          </div>
        </div>
      );
    }

    // View 2: Connected Inside Room Lobby (Waiting for 3~4 Players)
    const canStart =
      gameState.players.length >= 3 && gameState.players.length <= 4;

    return (
      <div className="min-h-[100dvh] w-full bg-[#090d16] text-white flex flex-col items-center justify-between p-4 overflow-y-auto">
        <div className="w-full max-w-md space-y-4 my-auto">
          {/* KakaoTalk Invite Card (No Clunky Code UI, Pure 1-Click Invite!) */}
          <div className="p-5 rounded-2xl bg-[#111827] border-2 border-amber-500/60 space-y-3.5 text-center shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                🎉 게임방 개설 완료!
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/50">
                참가자 대기 중
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              가족·친구들에게 카톡 링크를 보내면 <strong>링크 터치 1번으로 바로 게임에 입장</strong>됩니다!
            </p>

            {/* Action Buttons: KakaoTalk Share & Instant Link Copy */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleNativeShare}
                className="py-3 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg cursor-pointer transition-transform active:scale-95"
              >
                <Share2 className="w-4 h-4" /> 카톡으로 초대
              </button>
              <button
                onClick={handleCopyInviteLink}
                className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg cursor-pointer transition-transform active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> 복사 완료!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-300" /> 초대 링크 복사
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Announced Game Rules Banner */}
          <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">📢 방장 설정 공지</span>
              <span className="text-rose-300">시작 코인: 1인당 11개</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-[#090d16] border border-slate-800">
                <div className="text-[11px] text-slate-400">제외될 비공개 카드</div>
                <div className="text-sm font-black text-amber-300">
                  33장 중 {gameState.settings.excludedCount}장 제외
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#090d16] border border-slate-800">
                <div className="text-[11px] text-slate-400">보유 코인 수</div>
                <div className="text-sm font-black text-emerald-300">
                  {gameState.settings.coinVisibility === 'PUBLIC'
                    ? '👀 전체 공개 모드'
                    : '🔒 비밀(비공개) 모드'}
                </div>
              </div>
            </div>

            {/* Host can still tweak settings in lobby */}
            {isHost && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">제외장수:</span>
                  {[2, 5, 7, 9].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() =>
                        onUpdateSettings({
                          ...gameState.settings,
                          excludedCount: cnt,
                        })
                      }
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        gameState.settings.excludedCount === cnt
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cnt}장
                    </button>
                  ))}
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      ...gameState.settings,
                      coinVisibility:
                        gameState.settings.coinVisibility === 'PUBLIC'
                          ? 'HIDDEN'
                          : 'PUBLIC',
                    })
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 cursor-pointer"
                >
                  공개/비공개 전환
                </button>
              </div>
            )}
          </div>

          {/* Connected Players List (3 ~ 4 Players) */}
          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" /> 참가 플레이어 (
                {gameState.players.length} / 4명)
              </span>
              {isHost && gameState.players.length < 4 && (
                <button
                  onClick={onAddBot}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5" /> AI 봇 채우기
                </button>
              )}
            </div>

            <div className="space-y-2">
              {gameState.players.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${
                    p.id === myPlayerId
                      ? 'bg-slate-900 border-amber-500/60'
                      : 'bg-[#090d16] border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-xs font-black flex items-center justify-center text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-white">
                      {p.name}
                    </span>
                    {p.id === myPlayerId && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        나
                      </span>
                    )}
                    {p.isHost && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                        방장
                      </span>
                    )}
                  </div>
                  {isHost && p.id !== myPlayerId && (
                    <button
                      onClick={() => onRemovePlayer(p.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      title="내보내기"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {Array.from({
                length: Math.max(0, 4 - gameState.players.length),
              }).map((_, i) => (
                <div
                  key={i}
                  className="px-3.5 py-2.5 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500 text-center"
                >
                  {gameState.players.length + i < 3
                    ? '필수 참가자 대기 중... (최소 3인 필요)'
                    : '선택 참가자 슬롯 (최대 4인)'}
                </div>
              ))}
            </div>
          </div>

          {/* Start Game Action */}
          {isHost ? (
            <button
              disabled={!canStart}
              onClick={onStartGame}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 font-black text-base text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              {canStart
                ? `${gameState.players.length}인 게임 시작하기 (주사위 순서 결정)`
                : '3~4인이 모여야 시작할 수 있습니다'}
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs font-bold text-slate-300">
              ⏳ 방장이 게임을 시작하기를 기다리는 중입니다... (
              {gameState.players.length}/4명)
            </div>
          )}
        </div>
      </div>
    );
  }
);

LobbyScreen.displayName = 'LobbyScreen';
