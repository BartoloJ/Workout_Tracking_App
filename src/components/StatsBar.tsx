import React from 'react';
import { Flame, Calendar, Activity, Dumbbell, Footprints, Sparkles, Award, Clock } from 'lucide-react';
import { StreakStats } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';
import confetti from 'canvas-confetti';

interface StatsBarProps {
  stats: StreakStats;
  currentMonthName: string;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, currentMonthName }) => {
  const { preferences } = usePreferences();

  if (!preferences.showStatsBar) {
    return null;
  }

  const triggerStreakConfetti = () => {
    if (stats.currentStreak > 0) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#15803d', '#4ade80', '#fbbf24']
      });
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Stat 1: Current Streak (or Total All-Time if streak is disabled) */}
        {preferences.showStreakStats ? (
          <div
            id="stat-current-streak-card"
            onClick={triggerStreakConfetti}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 transition-all hover:border-zinc-700 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                Current Streak
              </span>
              <div className="flex items-center justify-center p-1.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Flame className="w-4 h-4 fill-orange-500" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-zinc-100 font-mono-numbers">
                {stats.currentStreak}
              </span>
              <span className="text-sm font-normal text-zinc-500">
                {stats.currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
              <span>Best Streak</span>
              <span className="font-mono-numbers text-zinc-300 font-semibold">{stats.longestStreak} days</span>
            </div>
          </div>
        ) : (
          <div
            id="stat-all-time-total-card"
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 transition-all hover:border-zinc-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                All-Time Total
              </span>
              <div className="flex items-center justify-center p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Award className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-zinc-100 font-mono-numbers">
                {stats.totalAllTime}
              </span>
              <span className="text-sm font-normal text-zinc-500">
                workouts
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
              <span>Total Hours</span>
              <span className="font-mono-numbers text-emerald-400 font-semibold">{stats.totalHours}h</span>
            </div>
          </div>
        )}

        {/* Stat 2: Total Workouts This Month */}
        <div
          id="stat-monthly-total-card"
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 transition-all hover:border-zinc-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
              {currentMonthName} Logs
            </span>
            <div className="flex items-center justify-center p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-zinc-100 font-mono-numbers">
              {stats.totalThisMonth}
            </span>
            <span className="text-sm font-normal text-zinc-500">
              sessions
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
            <span>Active Days</span>
            <span className="font-mono-numbers text-emerald-400 font-semibold">
              {stats.activeDaysThisMonth} / {stats.totalDaysInMonth}
            </span>
          </div>
        </div>

        {/* Stat 3: Hybrid Balance (Strength vs Cardio) */}
        <div
          id="stat-hybrid-balance-card"
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 transition-all hover:border-zinc-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
              Activity Split
            </span>
            <div className="flex items-center justify-center p-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-semibold font-mono-numbers text-zinc-100">
                {stats.strengthCount + stats.hybridCount}
              </span>
              <span className="text-xs text-zinc-500">Lift</span>
            </div>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-blue-400" />
              <span className="text-2xl font-semibold font-mono-numbers text-zinc-100">
                {stats.cardioCount + stats.hybridCount}
              </span>
              <span className="text-xs text-zinc-500">Run</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
            {preferences.showZone2 ? (
              <>
                <span>Zone 2 Base</span>
                <span className="text-zinc-300 font-mono-numbers font-semibold">{stats.zone2RunsCount} runs</span>
              </>
            ) : (
              <>
                <span>Cardio Total</span>
                <span className="text-zinc-300 font-mono-numbers font-semibold">{stats.cardioCount + stats.hybridCount} runs</span>
              </>
            )}
          </div>
        </div>

        {/* Stat 4: Strength Volume (or Time Trained if volume is hidden) */}
        {preferences.showStrengthVolume ? (
          <div
            id="stat-volume-hours-card"
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 transition-all hover:border-zinc-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                Strength Volume
              </span>
              <div className="flex items-center justify-center p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-zinc-100 font-mono-numbers">
                {stats.totalVolumeLbs > 0
                  ? stats.totalVolumeLbs.toLocaleString()
                  : '0'}
              </span>
              <span className="text-sm font-normal text-zinc-600">
                lbs
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
              <span>Total Workouts</span>
              <span className="font-mono-numbers text-zinc-300 font-semibold">
                {stats.totalAllTime} all-time
              </span>
            </div>
          </div>
        ) : (
          <div
            id="stat-training-time-card"
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 transition-all hover:border-zinc-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                Total Workouts
              </span>
              <div className="flex items-center justify-center p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-zinc-100 font-mono-numbers">
                {stats.totalAllTime}
              </span>
              <span className="text-sm font-normal text-zinc-600">
                all-time
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
              <span>Estimated Time</span>
              <span className="font-mono-numbers text-zinc-300 font-semibold">
                {stats.totalHours} hrs
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

