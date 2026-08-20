import React from 'react';
import {
  X,
  SlidersHorizontal,
  Heart,
  Dumbbell,
  Sparkles,
  Flame,
  Calendar,
  Layers,
  Timer,
  Check,
  RotateCcw,
  Zap,
  Eye,
  EyeOff,
  Activity,
  FileText,
  Clock
} from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { PresetTheme } from '../types';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose }) => {
  const { preferences, updatePreference, applyPreset, resetPreferences } = usePreferences();

  if (!isOpen) return null;

  // Calculate minimalism score (number of features turned off)
  const allToggles = [
    preferences.showZone2,
    preferences.showStrengthVolume,
    preferences.showStatsBar,
    preferences.showStreakStats,
    preferences.showHeatmap,
    preferences.showIntensityScore,
    preferences.showDuration,
    preferences.showCardioExtraMetrics,
    preferences.showCardioDistance,
    preferences.showWorkoutNotes,
    preferences.showFloatingRestTimer
  ];
  const disabledCount = allToggles.filter(v => !v).length;
  const isUltraMinimal = disabledCount >= 4;

  const handlePreset = (preset: PresetTheme) => {
    applyPreset(preset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="preferences-modal"
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl shadow-black my-8 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-900 text-emerald-400 border border-zinc-800">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                  Display & Minimalism Options
                </h2>
                {isUltraMinimal && (
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded-md font-bold">
                    Minimal
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                Customize your layout: remove Zone 2, strength volume, or strip down to ultra-minimal
              </p>
            </div>
          </div>

          <button
            id="close-preferences-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            title="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Presets Bar */}
          <div className="p-4 bg-zinc-950/70 rounded-2xl border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Quick Layout Presets
              </span>
              <span className="text-[11px] text-zinc-500">
                {disabledCount === 0 ? 'Full Feature View' : `${disabledCount} features hidden`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                id="preset-ultra-minimal-btn"
                onClick={() => handlePreset('ultra_minimal')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isUltraMinimal && !preferences.showZone2 && !preferences.showStrengthVolume
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span className="font-bold block text-zinc-100">Ultra-Minimal</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5 leading-tight">
                  No Zone 2, no volume, clean feed
                </span>
              </button>

              <button
                type="button"
                id="preset-strength-only-btn"
                onClick={() => handlePreset('strength_only')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  !preferences.showZone2 && preferences.showStreakStats && !preferences.showCardioExtraMetrics
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span className="font-bold block text-zinc-100">Lifting Focused</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5 leading-tight">
                  No Zone 2 / cardio metrics
                </span>
              </button>

              <button
                type="button"
                id="preset-cardio-only-btn"
                onClick={() => handlePreset('cardio_only')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  !preferences.showStrengthVolume && !preferences.showZone2 && preferences.showCardioDistance
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span className="font-bold block text-zinc-100">Cardio Clean</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5 leading-tight">
                  Simple endurance runs
                </span>
              </button>

              <button
                type="button"
                id="preset-full-btn"
                onClick={() => handlePreset('full')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  disabledCount === 0
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span className="font-bold block text-zinc-100">Full Hybrid</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5 leading-tight">
                  All stats, volume & Zone 2
                </span>
              </button>
            </div>
          </div>

          {/* Section 1: Cardio & Zone 2 (Directly requested) */}
          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <Heart className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-sm text-zinc-100">
                Cardio & Zone 2 Engine
              </h3>
            </div>

            <div className="space-y-3">
              {/* Zone 2 Toggle */}
              <div
                id="toggle-zone2-row"
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  preferences.showZone2
                    ? 'bg-zinc-900/90 border-zinc-800'
                    : 'bg-zinc-950/60 border-rose-950/40'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-200">
                      Zone 2 Aerobic Base Tracking
                    </span>
                    {!preferences.showZone2 && (
                      <span className="text-[10px] font-mono px-2 py-0.2 bg-rose-950 text-rose-300 rounded border border-rose-900/50">
                        Completely Removed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Hides the Zone 2 filter tab, Zone 2 badges on workout cards, and the Zone 2 toggle switch in the logging form.
                  </p>
                </div>

                <button
                  type="button"
                  id="pref-toggle-zone2-btn"
                  onClick={() => updatePreference('showZone2', !preferences.showZone2)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.showZone2 ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={preferences.showZone2}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.showZone2 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Heart Rate & Calories */}
              <div
                className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-zinc-200 block">
                    Heart Rate (BPM) & Calories
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Show or hide secondary wearable fields when logging cardio sessions.
                  </p>
                </div>

                <button
                  type="button"
                  id="pref-toggle-cardio-extra-btn"
                  onClick={() => updatePreference('showCardioExtraMetrics', !preferences.showCardioExtraMetrics)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.showCardioExtraMetrics ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={preferences.showCardioExtraMetrics}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.showCardioExtraMetrics ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Distance in Miles */}
              <div
                className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-zinc-200 block">
                    Distance Tracking (Miles)
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Track cardio distance in miles. Turn off if you only track duration/time.
                  </p>
                </div>

                <button
                  type="button"
                  id="pref-toggle-cardio-dist-btn"
                  onClick={() => updatePreference('showCardioDistance', !preferences.showCardioDistance)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.showCardioDistance ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={preferences.showCardioDistance}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.showCardioDistance ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Strength & Volume (Directly requested) */}
          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-zinc-100">
                Strength & Volume Metrics
              </h3>
            </div>

            <div className="space-y-3">
              {/* Strength Volume Toggle */}
              <div
                id="toggle-strength-volume-row"
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  preferences.showStrengthVolume
                    ? 'bg-zinc-900/90 border-zinc-800'
                    : 'bg-zinc-950/60 border-purple-950/40'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-200">
                      Strength Volume (lbs lifted)
                    </span>
                    {!preferences.showStrengthVolume && (
                      <span className="text-[10px] font-mono px-2 py-0.2 bg-purple-950 text-purple-300 rounded border border-purple-900/50">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Hides total volume (lbs) stats card, volume numbers on workout cards, and session volume totals across the app.
                  </p>
                </div>

                <button
                  type="button"
                  id="pref-toggle-volume-btn"
                  onClick={() => updatePreference('showStrengthVolume', !preferences.showStrengthVolume)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.showStrengthVolume ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={preferences.showStrengthVolume}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.showStrengthVolume ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Overview & Consistency Dashboard */}
          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-zinc-100">
                Dashboard & Calendar Layout
              </h3>
            </div>

            <div className="space-y-3">
              {/* Activity Heatmap */}
              <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-zinc-200 block">
                    GitHub Activity Heatmap Calendar
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Display the green monthly and 52-week activity grid on your home screen.
                  </p>
                </div>

                <button
                  type="button"
                  id="pref-toggle-heatmap-btn"
                  onClick={() => updatePreference('showHeatmap', !preferences.showHeatmap)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.showHeatmap ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={preferences.showHeatmap}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.showHeatmap ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Stats Summary Bar */}
              <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-zinc-200 block">
                    Top Stats Summary Bar
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Show the monthly totals, streaks, and session counters banner.
                  </p>
                </div>

                <button
                  type="button"
                  id="pref-toggle-statsbar-btn"
                  onClick={() => updatePreference('showStatsBar', !preferences.showStatsBar)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.showStatsBar ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={preferences.showStatsBar}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.showStatsBar ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Streak Counters */}
              <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-zinc-200 block">
                    Streak Counters & Flame Badges
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Turn off for zero-pressure, guilt-free training without streak counters.
                  </p>
                </div>

                <button
                  type="button"
                  id="pref-toggle-streak-btn"
                  onClick={() => updatePreference('showStreakStats', !preferences.showStreakStats)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.showStreakStats ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={preferences.showStreakStats}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.showStreakStats ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Intensity Scores L1-L4 */}
              <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-zinc-200 block">
                    Workout Intensity Badges (L1-L4)
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Show light/medium/peak intensity ratings on workout cards.
                  </p>
                </div>

                <button
                  type="button"
                  id="pref-toggle-intensity-btn"
                  onClick={() => updatePreference('showIntensityScore', !preferences.showIntensityScore)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.showIntensityScore ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={preferences.showIntensityScore}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.showIntensityScore ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Timers & Extras */}
          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <Timer className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-zinc-100">
                Timers & Feed Density
              </h3>
            </div>

            <div className="space-y-3">
              {/* Floating Mini Rest Timer */}
              <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-zinc-200 block">
                    Floating Mini Rest Timer
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Show the pill countdown timer widget on top of workout screens.
                  </p>
                </div>

                <button
                  type="button"
                  id="pref-toggle-floating-timer-btn"
                  onClick={() => updatePreference('showFloatingRestTimer', !preferences.showFloatingRestTimer)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.showFloatingRestTimer ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={preferences.showFloatingRestTimer}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.showFloatingRestTimer ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Compact Feed View */}
              <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-zinc-200 block">
                    Compact Activity Feed View
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Condense workout cards for high information density and minimal spacing.
                  </p>
                </div>

                <button
                  type="button"
                  id="pref-toggle-compact-feed-btn"
                  onClick={() => updatePreference('compactFeedView', !preferences.compactFeedView)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.compactFeedView ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={preferences.compactFeedView}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.compactFeedView ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <button
            type="button"
            id="reset-preferences-btn"
            onClick={resetPreferences}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Defaults</span>
          </button>

          <button
            type="button"
            id="apply-preferences-done-btn"
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-colors shadow-sm shadow-emerald-950 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
