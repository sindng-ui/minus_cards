import React, { useState } from 'react';
import { SmilePlus, Volume2, VolumeX } from 'lucide-react';
import { EmojiEvent } from '../types/game';
import { soundEngine } from '../utils/soundEngine';

const EMOJI_PRESETS = [
  { emoji: '😎', label: '노 땡스!' },
  { emoji: '😱', label: '헉! 살려줘' },
  { emoji: '😍', label: '코인 개이득!' },
  { emoji: '🙏', label: '제발 가져가~' },
  { emoji: '😭', label: '망했다...' },
  { emoji: '🔥', label: '연속 숫자 완성!' },
];

interface EmojiOverlayProps {
  activeEmojis: EmojiEvent[];
  onSendEmoji: (emoji: string, label: string) => void;
}

export const EmojiOverlay: React.FC<EmojiOverlayProps> = React.memo(
  ({ activeEmojis, onSendEmoji }) => {
    const [openMenu, setOpenMenu] = useState(false);
    const [muted, setMuted] = useState(soundEngine.getMuted());

    const toggleMute = () => {
      const next = !muted;
      soundEngine.setMuted(next);
      setMuted(next);
    };

    return (
      <>
        {/* Floating Active Emoji Toasts */}
        <div className="pointer-events-none fixed top-14 inset-x-0 z-50 flex flex-col items-center gap-1.5 px-4">
          {activeEmojis.map((item) => (
            <div
              key={item.id}
              className="px-3.5 py-1.5 rounded-full bg-slate-900 border-2 border-amber-400 shadow-xl flex items-center gap-2 animate-bounce"
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-xs font-black text-amber-300">
                {item.senderName}:
              </span>
              <span className="text-xs font-bold text-white">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Top-Right Quick Controls (Sound + Emoji Trigger) */}
        <div className="relative flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
            title={muted ? '소리 켜기' : '소리 끄기'}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setOpenMenu((v) => !v)}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-200 text-xs font-black flex items-center gap-1 cursor-pointer"
          >
            <SmilePlus className="w-4 h-4" /> 감정표현
          </button>

          {openMenu && (
            <div className="absolute right-0 top-10 z-50 w-56 p-2 rounded-2xl bg-[#111827] border-2 border-amber-400/70 shadow-2xl grid grid-cols-2 gap-1.5">
              {EMOJI_PRESETS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onSendEmoji(item.emoji, item.label);
                    setOpenMenu(false);
                  }}
                  className="p-2 rounded-xl bg-[#090d16] hover:bg-slate-800 border border-slate-800 flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-[11px] font-bold text-slate-200 leading-tight">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }
);

EmojiOverlay.displayName = 'EmojiOverlay';
