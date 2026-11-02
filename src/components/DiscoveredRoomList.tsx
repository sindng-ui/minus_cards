import React, { useState, useEffect, useCallback } from 'react';
import { Radio, RefreshCw, LogIn, Users } from 'lucide-react';
import { DiscoveredRoom } from '../types/game';
import { scanFamilyRooms } from '../utils/roomDiscovery';

interface DiscoveredRoomListProps {
  myName: string;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  isConnecting: boolean;
}

export const DiscoveredRoomList: React.FC<DiscoveredRoomListProps> = React.memo(
  ({ myName, onJoinRoom, isConnecting }) => {
    const [rooms, setRooms] = useState<DiscoveredRoom[]>([]);
    const [isScanning, setIsScanning] = useState<boolean>(false);

    const refreshRooms = useCallback(async () => {
      setIsScanning(true);
      try {
        const found = await scanFamilyRooms();
        setRooms(found);
      } catch {
        // Ignore scan error
      } finally {
        setIsScanning(false);
      }
    }, []);

    useEffect(() => {
      refreshRooms();
      // Periodically scan every 5 seconds while on lobby
      const interval = setInterval(refreshRooms, 5000);
      return () => clearInterval(interval);
    }, [refreshRooms]);

    return (
      <div className="p-4 rounded-2xl bg-gradient-to-b from-[#101b2b] to-[#0c1420] border-2 border-emerald-500/50 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-sm font-black text-emerald-300 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            📡 열려 있는 게임방 (자동 감지)
          </span>
          <button
            type="button"
            disabled={isScanning || isConnecting}
            onClick={refreshRooms}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[11px] font-bold text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw
              className={`w-3 h-3 ${isScanning ? 'animate-spin text-emerald-400' : ''}`}
            />
            {isScanning ? '탐색 중...' : '새로고침'}
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="py-3 px-2 text-center text-xs text-slate-400">
            {isScanning ? (
              <span className="text-emerald-300 font-bold animate-pulse">
                가족 스마트폰 방을 찾는 중입니다... 📡
              </span>
            ) : (
              <span>
                현재 열려 있는 방이 없습니다.
                <br />
                아래에서 직접 방을 열거나 새로고침을 눌러주세요!
              </span>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => {
              const isFull = room.playerCount >= room.maxPlayers;
              const isPlaying = room.phase !== 'LOBBY';
              const canJoin = !isFull && !isPlaying && !isConnecting;

              return (
                <div
                  key={room.slotId}
                  className="p-3 rounded-xl bg-[#132238] border border-emerald-500/40 flex items-center justify-between gap-2 shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-black text-sm text-white truncate">
                        {room.hostName}님의 방
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-semibold">
                      <span className="flex items-center gap-0.5">
                        <Users className="w-3 h-3 text-emerald-400" />
                        {room.playerCount} / {room.maxPlayers}명
                      </span>
                      {isPlaying && (
                        <span className="text-amber-400 font-black">
                          [게임 진행 중]
                        </span>
                      )}
                      {isFull && !isPlaying && (
                        <span className="text-rose-400 font-black">
                          [인원 꽉 참]
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!canJoin}
                    onClick={() => onJoinRoom(room.roomCode, myName || '참가자')}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 font-black text-xs text-slate-950 flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {isConnecting ? '입장 중...' : '원터치 입장'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

DiscoveredRoomList.displayName = 'DiscoveredRoomList';
