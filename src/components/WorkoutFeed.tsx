import React, { useState } from 'react';
import {
  Search,
  Filter,
  Dumbbell,
  Footprints,
  Flame,
  Calendar,
  Heart,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { WorkoutWithDetails, WorkoutType } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';

interface WorkoutFeedProps {
  workouts: WorkoutWithDetails[];
  onSelectWorkout: (dateStr: string) => void;
  onOpenLogModal: (dateStr: string) => void;
}

export const WorkoutFeed: React.FC<WorkoutFeedProps> = ({
  workouts,
  onSelectWorkout,
  onOpenLogModal
}) => {
  const { preferences } = usePreferences();
  const [filterType, setFilterType] = useState<WorkoutType | 'all' | 'zone2'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback if Zone 2 was active but user disabled Zone 2 in preferences
  const activeFilter = (!preferences.showZone2 && filterType === 'zone2') ? 'all' : filterType;

  const filteredWorkouts = workouts.filter(w => {
    // Type Filter
    if (activeFilter === 'zone2') {
      if (!w.cardio?.zone2) return false;
    } else if (activeFilter !== 'all') {
      if (w.workout.type !== activeFilter) return false;
    }

    // Search Query (matches exercise names, notes, or date)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inDate = w.workout.date.includes(q);
      const inNotes = (w.workout.notes || '').toLowerCase().includes(q);
      const inExercises = w.exercises.some(e => e.exercise_name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
      const inCardio = w.cardio ? w.cardio.activity_type.toLowerCase().includes(q) : false;
      return inDate || inNotes || inExercises || inCardio;
    }

    return true;
  });

  const getIntensityBadge = (score: number) => {
    switch (score) {
      case 1: return 'bg-emerald-950 text-emerald-300 border-emerald-900';
      case 2: return 'bg-emerald-900/80 text-emerald-200 border-emerald-700';
      case 3: return 'bg-emerald-700 text-zinc-50 border-emerald-500';
      case 4: return 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'strength', label: 'Strength' },
    { id: 'cardio', label: 'Cardio' },
    { id: 'hybrid', label: 'Hybrid' },
    ...(preferences.showZone2 ? [{ id: 'zone2', label: 'Zone 2' }] : [])
  ];

  return (
    <section id="workout-history-feed-section" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm space-y-5">
      {/* Header with Title and Search/Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
            <span>Recent Activity Log</span>
            <span className="text-xs font-mono-numbers px-2.5 py-0.5 rounded-full bg-zinc-900 text-emerald-400 border border-zinc-800">
              {filteredWorkouts.length}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">
            Chronological breakdown of logged workout sessions
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeFilter === f.id
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
        <input
          type="text"
          placeholder="Filter by exercise name (e.g. Bench Press, Squat), notes, or date..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* List of Workouts */}
      {filteredWorkouts.length === 0 ? (
        <div className="text-center py-12 px-4 bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-800 space-y-2">
          <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-xs text-zinc-400">
            No workouts found matching your current filter.
          </p>
        </div>
      ) : (
        <div className={preferences.compactFeedView ? 'space-y-2' : 'space-y-3'}>
          {filteredWorkouts.map((item, idx) => {
            const { workout, exercises, cardio } = item;
            const badgeClass = getIntensityBadge(workout.intensity_score);

            const totalVolume = exercises.reduce((acc, ex) => {
              return acc + ex.sets.reduce((sAcc, s) => sAcc + ((s.reps || 0) * (s.weight_lbs || 0)), 0);
            }, 0);

            return (
              <div
                key={workout.id || `feed-${idx}`}
                onClick={() => onSelectWorkout(workout.date)}
                className={`group cursor-pointer bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 touch-press ${
                  preferences.compactFeedView ? 'p-3 sm:p-3.5' : 'p-4 sm:p-5'
                }`}
              >
                {/* Left info: Date & Mode badge */}
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`rounded-2xl bg-zinc-900 border border-zinc-800 text-emerald-400 shrink-0 group-hover:border-emerald-500/40 transition-colors ${
                    preferences.compactFeedView ? 'p-2' : 'p-3'
                  }`}>
                    {workout.type === 'hybrid' ? (
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    ) : workout.type === 'strength' ? (
                      <Dumbbell className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Footprints className="w-4 h-4 text-blue-400" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-zinc-100 font-mono-numbers">
                        {workout.date}
                      </span>
                      <span className="text-xs text-zinc-400 capitalize font-medium">
                        • {workout.type}
                      </span>
                      {preferences.showIntensityScore && (
                        <span className={`text-[10px] font-mono-numbers font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                          L{workout.intensity_score}
                        </span>
                      )}
                      {preferences.showZone2 && cardio?.zone2 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5 fill-rose-400" />
                          Zone 2
                        </span>
                      )}
                    </div>

                    {/* Preview details */}
                    <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2">
                      {exercises.length > 0 && (
                        <span>
                          <strong>{exercises.length}</strong> exercises ({exercises.map(e => e.exercise_name).slice(0, 2).join(', ')}{exercises.length > 2 ? '...' : ''})
                        </span>
                      )}
                      {exercises.length > 0 && cardio && <span className="text-zinc-600">•</span>}
                      {cardio && (
                        <span className="text-blue-300 capitalize font-medium">
                          {cardio.activity_type} {preferences.showCardioDistance ? `${cardio.distance_miles}mi ` : ''}({cardio.duration_mins}m)
                        </span>
                      )}
                      {preferences.showWorkoutNotes && workout.notes && !cardio && exercises.length === 0 && (
                        <span className="text-zinc-400 italic">"{workout.notes}"</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right stats & action arrow */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                  <div className="text-left sm:text-right font-mono-numbers text-xs text-zinc-400">
                    {preferences.showStrengthVolume && totalVolume > 0 && (
                      <span className="block font-bold text-zinc-200">
                        {totalVolume.toLocaleString()} lbs
                      </span>
                    )}
                    {preferences.showDuration && workout.duration_mins ? (
                      <span className="text-[11px] text-zinc-500">
                        {workout.duration_mins} mins
                      </span>
                    ) : null}
                  </div>

                  <div className="p-1 rounded-lg text-zinc-500 group-hover:text-emerald-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

