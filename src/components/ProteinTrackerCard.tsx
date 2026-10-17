import React, { useState, useEffect, useCallback } from 'react';
import {
  Utensils,
  Plus,
  Flame,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trash2,
  Edit2,
  Clock,
  Target,
  Sliders,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { ProteinMealLog, MealType } from '../types';
import {
  getDailyProteinSummary,
  saveProteinMealLog,
  deleteProteinMealLog
} from '../db';
import { usePreferences } from '../contexts/PreferencesContext';
import confetti from 'canvas-confetti';

interface ProteinTrackerCardProps {
  onOpenLogModal: (dateStr?: string, mealToEdit?: ProteinMealLog | null) => void;
  selectedDate?: string;
}

export const ProteinTrackerCard: React.FC<ProteinTrackerCardProps> = ({
  onOpenLogModal,
  selectedDate: propSelectedDate
}) => {
  const { preferences, updatePreference } = usePreferences();
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeDate, setActiveDate] = useState(propSelectedDate || todayStr);
  const [proteinLogs, setProteinLogs] = useState<ProteinMealLog[]>([]);
  const [totalGrams, setTotalGrams] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoalInput, setTempGoalInput] = useState(String(preferences.dailyProteinGoal || 160));
  const [showAllMeals, setShowAllMeals] = useState(false);
  const [recentAddedMessage, setRecentAddedMessage] = useState<string | null>(null);

  // Sync if propSelectedDate changes
  useEffect(() => {
    if (propSelectedDate) {
      setActiveDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  // Load protein logs for activeDate
  const loadDailyProtein = useCallback(async () => {
    setIsLoading(true);
    try {
      const summary = await getDailyProteinSummary(activeDate);
      setProteinLogs(summary.logs);
      setTotalGrams(summary.totalGrams);
    } catch (err) {
      console.error('Failed to load protein logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeDate]);

  useEffect(() => {
    loadDailyProtein();
  }, [loadDailyProtein]);

  // Quick 1-tap add preset
  const handleQuickAdd = async (label: string, grams: number, type: MealType = 'other') => {
    const d = new Date();
    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    try {
      await saveProteinMealLog({
        date: activeDate,
        meal_name: label,
        protein_grams: grams,
        meal_type: type,
        time: timeStr,
        created_at: Date.now()
      });
      await loadDailyProtein();

      const newTotal = totalGrams + grams;
      if (preferences.dailyProteinGoal > 0 && newTotal >= preferences.dailyProteinGoal && totalGrams < preferences.dailyProteinGoal) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b']
        });
      }

      setRecentAddedMessage(`+${grams}g added (${label})`);
      setTimeout(() => setRecentAddedMessage(null), 2500);
    } catch (err) {
      console.error('Error quick adding protein:', err);
    }
  };

  // Delete a meal
  const handleDeleteMeal = async (id?: number) => {
    if (!id) return;
    try {
      await deleteProteinMealLog(id);
      await loadDailyProtein();
    } catch (err) {
      console.error('Error deleting meal:', err);
    }
  };

  // Date navigation
  const shiftDay = (days: number) => {
    const parts = activeDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setActiveDate(`${y}-${m}-${day}`);
  };

  const handleSaveGoal = (goalVal: number) => {
    updatePreference('dailyProteinGoal', Math.max(0, goalVal));
    setIsEditingGoal(false);
  };

  // Date label formatting
  const isToday = activeDate === todayStr;
  const formatDateLabel = () => {
    if (isToday) return 'Today';
    const parts = activeDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // If user disabled protein tracker completely in preferences, do not render
  if (!preferences.showProteinTracker) {
    return null;
  }

  const goal = preferences.dailyProteinGoal || 0;
  const hasGoal = goal > 0;
  const percentage = hasGoal ? Math.min(100, Math.round((totalGrams / goal) * 100)) : 0;
  const remaining = Math.max(0, goal - totalGrams);
  const isGoalReached = hasGoal && totalGrams >= goal;

  // Unset Goal State: Minimalist, optional prompt
  if (!hasGoal) {
    return (
      <div
        id="protein-tracker-optional-card"
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 transition-all hover:border-zinc-700/80 shadow-md"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-zinc-800/80 text-emerald-400 border border-zinc-700/60 shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                  Daily Protein Tracking
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                  Optional
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Set a daily protein target (e.g. 160g) to get a visual progress bar and log meals throughout the day.
              </p>
            </div>
          </div>

          {/* Quick Setup Presets */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <span className="text-xs text-zinc-500 font-semibold mr-1 hidden md:inline">
              Set Goal:
            </span>
            {[140, 160, 180, 200].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleSaveGoal(g)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-200 border border-zinc-700/70 text-xs font-bold font-mono-numbers transition-colors touch-press"
              >
                {g}g
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setTempGoalInput('160');
                setIsEditingGoal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 border border-emerald-500/30 text-xs font-bold transition-colors touch-press"
            >
              Custom...
            </button>
            <button
              type="button"
              onClick={() => updatePreference('showProteinTracker', false)}
              className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/60 transition-colors ml-1"
              title="Hide protein tracker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Custom Goal Form in Unset Mode */}
        {isEditingGoal && (
          <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-3 animate-in fade-in">
            <span className="text-xs text-zinc-300 font-medium">Daily target in grams:</span>
            <input
              type="number"
              min="20"
              max="500"
              value={tempGoalInput}
              onChange={(e) => setTempGoalInput(e.target.value)}
              className="w-24 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-emerald-400 font-mono-numbers font-bold text-sm focus:border-emerald-500 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                const val = parseInt(tempGoalInput, 10);
                if (val > 0) handleSaveGoal(val);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs"
            >
              Set Goal
            </button>
            <button
              type="button"
              onClick={() => setIsEditingGoal(false)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active Goal State: Minimalist, visual progress card
  return (
    <div
      id="protein-tracker-card"
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 transition-all hover:border-zinc-700/80 shadow-md space-y-4"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        {/* Title & Date Selector */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border transition-colors ${
            isGoalReached
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-950'
              : 'bg-zinc-800/80 text-emerald-400 border-zinc-700/60'
          }`}>
            <Utensils className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                Daily Protein
              </h3>
              {isGoalReached && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  <Check className="w-3 h-3 stroke-[3]" />
                  Goal Hit
                </span>
              )}
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
              <button
                type="button"
                onClick={() => shiftDay(-1)}
                className="p-0.5 hover:text-zinc-100 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className={`font-medium ${isToday ? 'text-emerald-400 font-semibold' : 'text-zinc-300'}`}>
                {formatDateLabel()}
              </span>
              <button
                type="button"
                onClick={() => shiftDay(1)}
                className="p-0.5 hover:text-zinc-100 transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              {!isToday && (
                <button
                  type="button"
                  onClick={() => setActiveDate(todayStr)}
                  className="text-[10px] text-zinc-500 hover:text-emerald-400 underline ml-1"
                >
                  Jump to Today
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls & Goal Edit */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Goal pill / editor */}
          {isEditingGoal ? (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              <input
                type="number"
                min="0"
                max="500"
                value={tempGoalInput}
                onChange={(e) => setTempGoalInput(e.target.value)}
                className="w-20 px-2 py-1 rounded-xl bg-zinc-950 border border-zinc-700 text-emerald-400 font-mono-numbers font-bold text-xs focus:border-emerald-500 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(tempGoalInput, 10);
                  handleSaveGoal(isNaN(val) ? 0 : val);
                }}
                className="px-2.5 py-1 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingGoal(false)}
                className="px-2 py-1 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempGoalInput(String(goal));
                setIsEditingGoal(true);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1"
              title="Change your daily protein target"
            >
              <Target className="w-3 h-3 text-emerald-400" />
              <span>Goal: <strong className="text-zinc-200 font-mono-numbers">{goal}g</strong></span>
            </button>
          )}

          {/* Primary + Log Meal CTA */}
          <button
            id="log-protein-meal-btn"
            type="button"
            onClick={() => onOpenLogModal(activeDate, null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-950 touch-press cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Log Meal</span>
          </button>
        </div>
      </div>

      {/* Main Visual Progress Section */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-zinc-100 font-mono-numbers tracking-tight">
              {totalGrams}
            </span>
            <span className="text-sm font-semibold text-zinc-500">
              / {goal}g
            </span>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className={`text-sm font-extrabold font-mono-numbers ${
                isGoalReached ? 'text-emerald-400' : 'text-zinc-200'
              }`}>
                {percentage}%
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">
              {isGoalReached
                ? `Target reached! +${totalGrams - goal}g surplus`
                : `${remaining}g remaining`}
            </p>
          </div>
        </div>

        {/* Minimalist Glowing Progress Bar */}
        <div className="relative w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isGoalReached
                ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300 shadow-sm shadow-emerald-500/50'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
            }`}
            style={{ width: `${Math.min(100, (totalGrams / goal) * 100)}%` }}
          />

          {/* Segment Tick Marks for visual pacing (25%, 50%, 75%) */}
          <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5">
            <span className="w-0.5 h-full bg-zinc-900/60" style={{ left: '25%' }} />
            <span className="w-0.5 h-full bg-zinc-900/60" style={{ left: '50%' }} />
            <span className="w-0.5 h-full bg-zinc-900/60" style={{ left: '75%' }} />
          </div>
        </div>

        {/* Recent feedback notification */}
        {recentAddedMessage && (
          <div className="text-xs text-emerald-400 font-medium animate-in fade-in flex items-center gap-1.5 pt-1">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{recentAddedMessage}</span>
          </div>
        )}
      </div>

      {/* 1-Tap Quick Add Preset Chips */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Quick Add Throughout The Day
          </span>
          <span className="text-[10px] text-zinc-500">1-Tap Log</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleQuickAdd('Whey Shake', 25, 'shake')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-emerald-300 transition-colors touch-press cursor-pointer"
          >
            <span>🥤</span>
            <span>+25g Shake</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickAdd('Chicken / Poultry', 35, 'lunch')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-emerald-300 transition-colors touch-press cursor-pointer"
          >
            <span>🍗</span>
            <span>+35g Chicken</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickAdd('Steak / Beef / Fish', 45, 'dinner')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-emerald-300 transition-colors touch-press cursor-pointer"
          >
            <span>🥩</span>
            <span>+45g Meat/Fish</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickAdd('Protein Snack', 15, 'snack')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-emerald-300 transition-colors touch-press cursor-pointer"
          >
            <span>🥜</span>
            <span>+15g Snack</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenLogModal(activeDate, null)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 text-xs font-semibold text-emerald-300 transition-colors touch-press cursor-pointer ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Meal</span>
          </button>
        </div>
      </div>

      {/* Logged Meals List / Breakdown */}
      {proteinLogs.length > 0 && (
        <div className="pt-2 border-t border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">
              Meals Logged ({proteinLogs.length})
            </span>
            {proteinLogs.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAllMeals(!showAllMeals)}
                className="text-zinc-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
              >
                <span>{showAllMeals ? 'Show Less' : `View All (${proteinLogs.length})`}</span>
                {showAllMeals ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {(showAllMeals ? proteinLogs : proteinLogs.slice(-3)).map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 text-xs group transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm shrink-0">
                    {meal.meal_type === 'shake'
                      ? '🥤'
                      : meal.meal_type === 'breakfast'
                      ? '🍳'
                      : meal.meal_type === 'lunch'
                      ? '🍗'
                      : meal.meal_type === 'dinner'
                      ? '🥩'
                      : meal.meal_type === 'snack'
                      ? '🥜'
                      : '🍽️'}
                  </span>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-200 truncate">
                        {meal.meal_name}
                      </span>
                      {meal.time && (
                        <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {meal.time}
                        </span>
                      )}
                    </div>
                    {meal.notes && (
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {meal.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="font-bold font-mono-numbers text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                    +{meal.protein_grams}g
                  </span>
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onOpenLogModal(activeDate, meal)}
                      className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                      title="Edit Meal"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Delete Meal"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
