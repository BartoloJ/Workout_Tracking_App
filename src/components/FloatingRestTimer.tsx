import React from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Maximize2,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useRestTimer } from '../contexts/RestTimerContext';

export const FloatingRestTimer: React.FC = () => {
  const {
    remainingSeconds,
    totalSeconds,
    isActive,
    soundEnabled,
    formattedTime,
    progressPercent,
    toggleTimer,
    resetTimer,
    adjustTime,
    setSoundEnabled,
    openTimer,
    pauseTimer
  } = useRestTimer();

  // Only show floating mini-dock when active or when paused with time remaining
  if (!isActive && remainingSeconds === totalSeconds && remainingSeconds === 90) {
    return null;
  }

  // If time is up (0s) and not active, show completed banner briefly
  const isFinished = remainingSeconds === 0;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
      <div
        id="floating-rest-timer-dock"
        className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${
          isFinished
            ? 'bg-amber-950/90 border-amber-500/80 text-amber-100 shadow-amber-950/60 ring-2 ring-amber-400/40 animate-pulse'
            : isActive
            ? 'bg-zinc-900/95 border-emerald-500/60 text-zinc-100 shadow-black/80 ring-1 ring-emerald-500/30'
            : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 shadow-black/60'
        }`}
      >
        {/* Click to expand full modal */}
        <button
          type="button"
          onClick={() => openTimer()}
          className="flex items-center gap-2 px-1.5 py-0.5 rounded-xl hover:bg-zinc-800/80 transition-colors"
          title="Open Full Rest Timer"
        >
          <div className={`p-1.5 rounded-lg ${isActive ? 'bg-emerald-500/20 text-emerald-400' : isFinished ? 'bg-amber-400/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
            <Timer className="w-4 h-4" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-mono-numbers font-black text-sm tracking-tight leading-none">
              {isFinished ? 'Rest Done!' : formattedTime}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 leading-tight mt-0.5">
              {isFinished ? 'Ready' : isActive ? 'Resting' : 'Paused'}
            </span>
          </div>
        </button>

        {/* Progress bar line */}
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden hidden xs:block">
          <div
            className={`h-full transition-all duration-300 ${isFinished ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Adjust Time */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => adjustTime(-15)}
            className="px-1.5 py-1 text-[10px] font-mono font-bold bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            title="Minus 15 seconds"
          >
            -15s
          </button>
          <button
            type="button"
            onClick={() => adjustTime(15)}
            className="px-1.5 py-1 text-[10px] font-mono font-bold bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            title="Add 15 seconds"
          >
            +15s
          </button>
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={toggleTimer}
          className={`p-2 rounded-xl font-bold transition-transform active:scale-95 ${
            isActive
              ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-md shadow-amber-950/40'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-950/40'
          }`}
          title={isActive ? 'Pause Rest' : 'Resume Rest'}
        >
          {isActive ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>

        {/* Reset / Mute buttons */}
        <button
          type="button"
          onClick={resetTimer}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          title="Reset timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setSoundEnabled(prev => !prev)}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors hidden sm:inline-flex"
          title={soundEnabled ? 'Mute chime' : 'Unmute chime'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
        </button>

        <button
          type="button"
          onClick={() => openTimer()}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          title="Expand timer modal"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => {
            pauseTimer();
            resetTimer();
          }}
          className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
          title="Dismiss rest timer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
