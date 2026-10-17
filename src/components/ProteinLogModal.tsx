import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Utensils,
  Clock,
  Sparkles,
  Flame,
  Check,
  Beef,
  Coffee,
  CheckCircle2
} from 'lucide-react';
import { ProteinMealLog, MealType } from '../types';
import { saveProteinMealLog } from '../db';

interface ProteinLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMealSaved: () => void;
  initialDate?: string;
  editingMeal?: ProteinMealLog | null;
}

const MEAL_PRESETS: Array<{ label: string; type: MealType; defaultGrams: number; icon: string }> = [
  { label: 'Post-Workout Shake', type: 'shake', defaultGrams: 30, icon: '🥤' },
  { label: 'Eggs & Breakfast', type: 'breakfast', defaultGrams: 28, icon: '🍳' },
  { label: 'Chicken Bowl', type: 'lunch', defaultGrams: 42, icon: '🍗' },
  { label: 'Steak & Dinner', type: 'dinner', defaultGrams: 48, icon: '🥩' },
  { label: 'High-Protein Snack', type: 'snack', defaultGrams: 20, icon: '🥜' },
  { label: 'Fish & Salmon', type: 'lunch', defaultGrams: 36, icon: '🐟' },
];

export const ProteinLogModal: React.FC<ProteinLogModalProps> = ({
  isOpen,
  onClose,
  onMealSaved,
  initialDate,
  editingMeal
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initialDate || todayStr);
  const [mealName, setMealName] = useState('');
  const [proteinGrams, setProteinGrams] = useState<string>('30');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [notes, setNotes] = useState('');
  const [calories, setCalories] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Set default current time
  const getCurrentFormattedTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  useEffect(() => {
    if (isOpen) {
      if (editingMeal) {
        setDate(editingMeal.date);
        setMealName(editingMeal.meal_name);
        setProteinGrams(String(editingMeal.protein_grams));
        setMealType(editingMeal.meal_type || 'other');
        setNotes(editingMeal.notes || '');
        setCalories(editingMeal.calories ? String(editingMeal.calories) : '');
        setTime(editingMeal.time || '');
      } else {
        setDate(initialDate || todayStr);
        setMealName('');
        setProteinGrams('30');
        setMealType('lunch');
        setNotes('');
        setCalories('');
        setTime(getCurrentFormattedTime());
      }
      setValidationError(null);
    }
  }, [isOpen, editingMeal, initialDate, todayStr]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof MEAL_PRESETS[0]) => {
    setMealName(preset.label);
    setMealType(preset.type);
    setProteinGrams(String(preset.defaultGrams));
  };

  const adjustGrams = (amount: number) => {
    const current = parseInt(proteinGrams, 10) || 0;
    const next = Math.max(1, current + amount);
    setProteinGrams(String(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const parsedGrams = parseFloat(proteinGrams);
    if (isNaN(parsedGrams) || parsedGrams <= 0) {
      setValidationError('Please enter a valid protein amount greater than 0g.');
      return;
    }

    const trimmedName = mealName.trim() || 'Meal';
    const parsedCalories = calories ? parseInt(calories, 10) : undefined;

    setIsSubmitting(true);
    try {
      await saveProteinMealLog({
        id: editingMeal?.id,
        sync_id: editingMeal?.sync_id,
        date,
        meal_name: trimmedName,
        protein_grams: Math.round(parsedGrams),
        meal_type: mealType,
        notes: notes.trim(),
        calories: !isNaN(parsedCalories || 0) && (parsedCalories || 0) > 0 ? parsedCalories : undefined,
        time: time.trim() || getCurrentFormattedTime(),
        created_at: editingMeal?.created_at || Date.now()
      });

      onMealSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving meal log:', err);
      setValidationError('Failed to save meal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="protein-log-modal"
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl shadow-black my-8 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-900 text-emerald-400 border border-zinc-800">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
                {editingMeal ? 'Edit Protein Meal' : 'Log Protein Meal'}
              </h2>
              <p className="text-xs text-zinc-400">
                Record your protein intake to hit your daily target
              </p>
            </div>
          </div>

          <button
            id="close-protein-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {validationError && (
            <div className="p-3 text-xs text-rose-300 bg-rose-950/60 border border-rose-800 rounded-xl">
              {validationError}
            </div>
          )}

          {/* Quick Presets (Only when adding new) */}
          {!editingMeal && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 block">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MEAL_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors touch-press ${
                      mealName === p.label
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <span className="text-base shrink-0">{p.icon}</span>
                    <div className="truncate">
                      <div className="truncate leading-tight">{p.label}</div>
                      <div className="text-[10px] text-emerald-400 font-mono-numbers">
                        +{p.defaultGrams}g
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Protein Grams Input (The Hero Element) */}
          <div className="p-4 bg-zinc-950/70 rounded-2xl border border-zinc-800 text-center">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              Protein Amount (Grams)
            </label>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => adjustGrams(-5)}
                className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-sm transition-colors touch-press"
              >
                -5
              </button>
              <div className="relative">
                <input
                  id="protein-grams-input"
                  type="number"
                  min="1"
                  max="500"
                  value={proteinGrams}
                  onChange={(e) => setProteinGrams(e.target.value)}
                  className="w-32 py-2 px-3 text-center text-4xl font-extrabold font-mono-numbers text-emerald-400 bg-transparent border-b-2 border-emerald-500/80 focus:border-emerald-400 focus:outline-none"
                  autoFocus
                />
                <span className="text-xs font-semibold text-zinc-500 block mt-1">grams</span>
              </div>
              <button
                type="button"
                onClick={() => adjustGrams(5)}
                className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-sm transition-colors touch-press"
              >
                +5
              </button>
            </div>

            {/* Quick Adjustment Chips */}
            <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
              {[15, 25, 35, 45, 60].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setProteinGrams(String(g))}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-mono-numbers font-medium transition-colors ${
                    proteinGrams === String(g)
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold'
                      : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {g}g
                </button>
              ))}
            </div>
          </div>

          {/* Meal Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                Meal Name / Description
              </label>
              <input
                id="meal-name-input"
                type="text"
                placeholder="e.g. Greek Yogurt & Berries"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                Meal Timing / Type
              </label>
              <select
                id="meal-type-select"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="shake">Post-Workout Shake</option>
                <option value="snack">High-Protein Snack</option>
                <option value="other">Other / Snack</option>
              </select>
            </div>
          </div>

          {/* Date, Time & Optional Calories */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                Time (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 12:30 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                Calories (optional)
              </label>
              <input
                type="number"
                placeholder="e.g. 450"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              Meal Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 8oz chicken breast, 1 cup white rice"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-protein-meal-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-emerald-950/60 touch-press disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Saving...' : editingMeal ? 'Update Meal' : 'Log Protein'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
