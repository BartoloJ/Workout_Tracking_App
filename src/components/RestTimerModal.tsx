import React from 'react';
import {
  X,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { useRestTimer } from '../contexts/RestTimerContext';

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({ isOpen, onClose }) => {
  const {
    totalSeconds,
    remainingSeconds,
    isActive,
    soundEnabled,
    presets,
    formattedTime,
    progressPercent,
    toggleTimer,
    resetTimer,
    adjustTime,
    setSoundEnabled,
    selectPreset,
    autoStartOnComplete,
    setAutoStartOnComplete
  } = useRestTimer();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="rest-timer-modal"
        className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl shadow-black my-8 flex flex-col overflow-hidden text-center"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-900 text-emerald-400 border border-zinc-800">
              <Timer className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-zinc-100">Gym Rest Timer</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(prev => !prev)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timer Body */}
        <div className="p-6 flex flex-col items-center space-y-6">
          {/* Circular Display */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Background Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-zinc-800"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`transition-all duration-300 ease-linear ${
                  remainingSeconds === 0
                    ? 'stroke-amber-400'
                    : isActive
                    ? 'stroke-emerald-400'
                    : 'stroke-zinc-600'
                }`}
                strokeWidth="6"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Time Text in Center */}
            <div className="absolute flex flex-col items-center">
              <span className={`text-4xl font-black font-mono-numbers tracking-tight ${remainingSeconds === 0 ? 'text-amber-400 animate-bounce' : 'text-zinc-100'}`}>
                {formattedTime}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mt-1">
                {remainingSeconds === 0 ? 'Rest Complete!' : isActive ? 'Resting...' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Quick Increment buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustTime(-15)}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-mono font-bold transition-colors"
            >
              <Minus className="w-3 h-3" />
              15s
            </button>
            <button
              onClick={() => adjustTime(15)}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-mono font-bold transition-colors"
            >
              <Plus className="w-3 h-3" />
              15s
            </button>
          </div>

          {/* Play/Pause & Reset Controls */}
          <div className="flex items-center justify-center gap-3 w-full">
            <button
              onClick={resetTimer}
              className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors touch-press"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={toggleTimer}
              className={`flex-1 py-3 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 touch-press ${
                isActive
                  ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-lg shadow-amber-950/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-950/40'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{remainingSeconds === 0 ? 'Restart' : 'Start Rest'}</span>
                </>
              )}
            </button>
          </div>

          {/* Preset Buttons Grid */}
          <div className="w-full pt-3 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Quick Rest Presets
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoStartOnComplete}
                  onChange={e => setAutoStartOnComplete(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Auto-start on check</span>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {presets.map(p => (
                <button
                  key={p.secs}
                  onClick={() => selectPreset(p.secs)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold font-mono-numbers transition-colors ${
                    totalSeconds === p.secs
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
