import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  Flame,
  Plus,
  Timer,
  Trophy,
  Database,
  Smartphone,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  onOpenNewWorkout: () => void;
  onOpenTimer: () => void;
  onOpenPRs: () => void;
  onOpenDataModal: () => void;
  onOpenPWAModal: () => void;
  onSeedSampleData: () => void;
  totalWorkouts: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewWorkout,
  onOpenTimer,
  onOpenPRs,
  onOpenDataModal,
  onOpenPWAModal,
  onSeedSampleData,
  totalWorkouts
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-emerald-400 shadow-sm">
            <Dumbbell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tighter text-emerald-400">
                PULSE
              </span>
              <span className="text-xs text-zinc-400 font-medium hidden sm:inline">•</span>
              <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Workout Tracker</span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 text-emerald-400 border border-zinc-800">
                <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                Hybrid
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
              <span className="flex items-center gap-1">
                {isOnline ? (
                  <span className="inline-flex items-center text-emerald-400">
                    <Wifi className="w-3 h-3 mr-1" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center text-amber-400">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline (IndexedDB)
                  </span>
                )}
              </span>
              <span>•</span>
              <span className="text-zinc-400 font-mono-numbers">
                {totalWorkouts} logged
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {totalWorkouts === 0 && (
            <button
              id="seed-sample-data-btn"
              onClick={onSeedSampleData}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-400 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors touch-press"
              title="Generate realistic sample workouts to populate the activity heat-map"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Seed Demo Data
            </button>
          )}

          {/* Rest Timer Button */}
          <button
            id="rest-timer-btn"
            onClick={onOpenTimer}
            className="p-2 text-zinc-400 hover:text-emerald-400 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl transition-colors touch-press"
            title="Gym Rest Timer"
          >
            <Timer className="w-4 h-4" />
          </button>

          {/* PRs / Exercise History */}
          <button
            id="pr-tracker-btn"
            onClick={onOpenPRs}
            className="p-2 text-zinc-400 hover:text-amber-400 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl transition-colors touch-press"
            title="Personal Records & PR Tracker"
          >
            <Trophy className="w-4 h-4" />
          </button>

          {/* Backup / Export / Import */}
          <button
            id="data-backup-btn"
            onClick={onOpenDataModal}
            className="p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl transition-colors touch-press"
            title="Data Backup, JSON Export & Import"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* iOS / PWA Guide */}
          <button
            id="pwa-guide-btn"
            onClick={onOpenPWAModal}
            className="hidden sm:inline-flex p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl transition-colors touch-press"
            title="iOS PWA & Offline Guide"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* + Log Workout Primary CTA */}
          <button
            id="nav-log-workout-btn"
            onClick={onOpenNewWorkout}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl transition-colors shadow-sm shadow-emerald-950 touch-press"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Log Session</span>
            <span className="sm:hidden">Log</span>
          </button>
        </div>
      </div>
    </header>
  );
};
