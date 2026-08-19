import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Dumbbell,
  TrendingUp,
  Search,
  Award,
  Sparkles
} from 'lucide-react';
import { db, getAllCustomExercises } from '../db';
import { ExerciseLog } from '../types';

interface PRTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExercisePR {
  name: string;
  category: string;
  maxWeight: number;
  maxRepsAtMaxWeight: number;
  estimated1RM: number;
  totalSetsLogged: number;
  lastPerformedDate: string;
  isCustom?: boolean;
}

export const PRTrackerModal: React.FC<PRTrackerModalProps> = ({ isOpen, onClose }) => {
  const [prs, setPrs] = useState<ExercisePR[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadPRs();
    }
  }, [isOpen]);

  const loadPRs = async () => {
    setLoading(true);
    try {
      const allExercises = await db.exercise_logs.toArray();
      const allWorkouts = await db.workouts.toArray();
      const customExercises = await getAllCustomExercises();

      const customMap = new Set(customExercises.map(c => c.name.toLowerCase()));

      const workoutDateMap = new Map<number, string>();
      allWorkouts.forEach(w => {
        if (w.id) workoutDateMap.set(w.id, w.date);
      });

      const map = new Map<string, {
        name: string;
        category: string;
        maxWeight: number;
        maxRepsAtMaxWeight: number;
        max1RM: number;
        totalSets: number;
        latestDate: string;
        isCustom: boolean;
      }>();

      // Seed with custom exercises so even new ones appear
      customExercises.forEach(c => {
        const normName = c.name.trim();
        map.set(normName, {
          name: normName,
          category: c.category || 'push',
          maxWeight: 0,
          maxRepsAtMaxWeight: 0,
          max1RM: 0,
          totalSets: 0,
          latestDate: '',
          isCustom: true
        });
      });

      allExercises.forEach(ex => {
        const normName = ex.exercise_name.trim();
        const workoutDate = workoutDateMap.get(ex.workout_id) || '';

        if (!map.has(normName)) {
          map.set(normName, {
            name: normName,
            category: ex.category || 'push',
            maxWeight: 0,
            maxRepsAtMaxWeight: 0,
            max1RM: 0,
            totalSets: 0,
            latestDate: workoutDate,
            isCustom: customMap.has(normName.toLowerCase())
          });
        }

        const item = map.get(normName)!;
        if (workoutDate > item.latestDate) {
          item.latestDate = workoutDate;
        }

        ex.sets.forEach(s => {
          if (s.completed !== false) {
            item.totalSets += 1;
            const weight = Number(s.weight_lbs) || 0;
            const reps = Number(s.reps) || 0;

            // Epley formula: 1RM = Weight * (1 + Reps/30)
            const est1RM = weight > 0 && reps > 0 ? Math.round(weight * (1 + reps / 30)) : weight;

            if (est1RM > item.max1RM) {
              item.max1RM = est1RM;
            }

            if (weight > item.maxWeight) {
              item.maxWeight = weight;
              item.maxRepsAtMaxWeight = reps;
            } else if (weight === item.maxWeight && reps > item.maxRepsAtMaxWeight) {
              item.maxRepsAtMaxWeight = reps;
            }
          }
        });
      });

      const sortedPRs: ExercisePR[] = Array.from(map.values())
        .filter(i => i.totalSets > 0 || i.isCustom)
        .map(i => ({
          name: i.name,
          category: i.category,
          maxWeight: i.maxWeight,
          maxRepsAtMaxWeight: i.maxRepsAtMaxWeight,
          estimated1RM: i.max1RM,
          totalSetsLogged: i.totalSets,
          lastPerformedDate: i.latestDate,
          isCustom: i.isCustom
        }))
        .sort((a, b) => b.estimated1RM - a.estimated1RM);

      setPrs(sortedPRs);
    } catch (err) {
      console.error('Error calculating PRs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredPRs = prs.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'custom'
        ? Boolean(p.isCustom)
        : p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="pr-tracker-modal"
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl shadow-black my-8 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-900 text-amber-400 border border-zinc-800">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                Personal Records & Progress
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Heaviest recorded sets and estimated 1-Rep Maxes for all exercises
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter and Search */}
        <div className="p-5 bg-zinc-950/50 border-b border-zinc-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
            <input
              type="text"
              placeholder="Search exercise PRs (e.g. dumbbell lateral raise, bench press)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {(['all', 'custom', 'push', 'pull', 'legs', 'core', 'arms'] as const).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl capitalize font-bold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-zinc-950'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List of PRs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-xs text-zinc-500">
              Calculating personal records...
            </div>
          ) : filteredPRs.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500">
              No exercises logged matching this filter.
            </div>
          ) : (
            filteredPRs.map((pr, idx) => (
              <div
                key={`pr-${idx}`}
                className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-100">
                      {pr.name}
                    </span>
                    {pr.isCustom && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                        Custom
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                      {pr.category}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-2">
                    <span>{pr.totalSetsLogged} total sets logged</span>
                    {pr.lastPerformedDate && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span>Last logged: {pr.lastPerformedDate}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {pr.maxWeight > 0 ? (
                    <>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span className="text-lg font-bold font-mono-numbers text-amber-300">
                          {pr.maxWeight} lbs
                        </span>
                        {pr.maxRepsAtMaxWeight > 0 && (
                          <span className="text-xs text-zinc-400 font-mono-numbers">
                            × {pr.maxRepsAtMaxWeight}
                          </span>
                        )}
                      </div>
                      {pr.estimated1RM > pr.maxWeight && (
                        <span className="text-[11px] text-zinc-400 font-mono-numbers block">
                          Est. 1RM: <strong className="text-emerald-400">{pr.estimated1RM} lbs</strong>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-zinc-500 italic">No sets logged yet</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
