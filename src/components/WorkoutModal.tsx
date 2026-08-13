import React, { useState, useEffect } from 'react';
import {
  X,
  Dumbbell,
  Footprints,
  Flame,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Sparkles,
  Heart,
  Timer,
  Info
} from 'lucide-react';
import {
  Workout,
  ExerciseLog,
  CardioLog,
  WorkoutWithDetails,
  WorkoutType,
  ExerciseCategory,
  ExerciseSet,
  PREDEFINED_EXERCISES,
  CARDIO_ACTIVITIES
} from '../types';
import { saveWorkoutWithDetails } from '../db';
import confetti from 'canvas-confetti';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialDate?: string;
  editWorkoutData?: WorkoutWithDetails | null;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialDate,
  editWorkoutData
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Core workout state
  const [date, setDate] = useState<string>(initialDate || todayStr);
  const [workoutType, setWorkoutType] = useState<WorkoutType>('hybrid');
  const [intensityScore, setIntensityScore] = useState<number>(3);
  const [durationMins, setDurationMins] = useState<number>(45);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Strength exercises state
  const [exercises, setExercises] = useState<Array<Omit<ExerciseLog, 'id' | 'workout_id'> & { id?: number }>>([]);
  const [showAddExercisePicker, setShowAddExercisePicker] = useState<boolean>(false);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ExerciseCategory | 'all'>('all');
  const [customExerciseName, setCustomExerciseName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<ExerciseCategory>('push');

  // Cardio state
  const [cardioActivity, setCardioActivity] = useState<string>('running');
  const [cardioDurationMins, setCardioDurationMins] = useState<number>(30);
  const [cardioDistanceMiles, setCardioDistanceMiles] = useState<number>(3.1);
  const [isZone2, setIsZone2] = useState<boolean>(true);
  const [avgHeartRate, setAvgHeartRate] = useState<string>('138');
  const [calories, setCalories] = useState<string>('350');
  const [cardioNotes, setCardioNotes] = useState<string>('');

  // Initialize or reset form when modal opens or edit data changes
  useEffect(() => {
    if (isOpen) {
      if (editWorkoutData) {
        // Populate edit state
        setDate(editWorkoutData.workout.date);
        setWorkoutType(editWorkoutData.workout.type);
        setIntensityScore(editWorkoutData.workout.intensity_score || 3);
        setDurationMins(editWorkoutData.workout.duration_mins || 45);
        setNotes(editWorkoutData.workout.notes || '');

        setExercises(
          editWorkoutData.exercises.map(e => ({
            exercise_name: e.exercise_name,
            category: e.category,
            sets: e.sets.map(s => ({ ...s })),
            notes: e.notes || ''
          }))
        );

        if (editWorkoutData.cardio) {
          setCardioActivity(editWorkoutData.cardio.activity_type || 'running');
          setCardioDurationMins(editWorkoutData.cardio.duration_mins || 30);
          setCardioDistanceMiles(editWorkoutData.cardio.distance_miles || 0);
          setIsZone2(editWorkoutData.cardio.zone2 ?? true);
          setAvgHeartRate(editWorkoutData.cardio.avg_hr ? String(editWorkoutData.cardio.avg_hr) : '');
          setCalories(editWorkoutData.cardio.calories ? String(editWorkoutData.cardio.calories) : '');
          setCardioNotes(editWorkoutData.cardio.notes || '');
        } else {
          setCardioDurationMins(30);
          setCardioDistanceMiles(3.1);
          setIsZone2(true);
        }
      } else {
        // Fresh state
        setDate(initialDate || todayStr);
        setWorkoutType('hybrid');
        setIntensityScore(3);
        setDurationMins(45);
        setNotes('');
        setExercises([
          {
            exercise_name: 'Barbell Bench Press',
            category: 'push',
            sets: [
              { set_number: 1, reps: 10, weight_lbs: 135, completed: true },
              { set_number: 2, reps: 8, weight_lbs: 185, completed: true },
              { set_number: 3, reps: 6, weight_lbs: 205, completed: true }
            ]
          }
        ]);
        setCardioActivity('running');
        setCardioDurationMins(20);
        setCardioDistanceMiles(2.5);
        setIsZone2(true);
        setAvgHeartRate('135');
        setCalories('220');
        setCardioNotes('');
      }
      setShowAddExercisePicker(false);
      setExerciseSearch('');
    }
  }, [isOpen, initialDate, editWorkoutData]);

  if (!isOpen) return null;

  // Strength Helper Functions
  const handleAddPredefinedExercise = (name: string, category: ExerciseCategory, defaultReps = 10, defaultWeight = 135) => {
    setExercises(prev => [
      ...prev,
      {
        exercise_name: name,
        category,
        sets: [
          { set_number: 1, reps: defaultReps, weight_lbs: defaultWeight, completed: true },
          { set_number: 2, reps: defaultReps, weight_lbs: defaultWeight, completed: true },
          { set_number: 3, reps: defaultReps, weight_lbs: defaultWeight, completed: false }
        ]
      }
    ]);
    setShowAddExercisePicker(false);
    setExerciseSearch('');
  };

  const handleAddCustomExercise = () => {
    if (!customExerciseName.trim()) return;
    handleAddPredefinedExercise(customExerciseName.trim(), customCategory, 10, 50);
    setCustomExerciseName('');
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSet = (exerciseIndex: number) => {
    setExercises(prev => {
      const updated = [...prev];
      const ex = updated[exerciseIndex];
      const lastSet = ex.sets[ex.sets.length - 1];
      const newSet: ExerciseSet = {
        set_number: ex.sets.length + 1,
        reps: lastSet ? lastSet.reps : 10,
        weight_lbs: lastSet ? lastSet.weight_lbs : 100,
        completed: false
      };
      ex.sets.push(newSet);
      return updated;
    });
  };

  const handleDuplicateSet = (exerciseIndex: number, setIndex: number) => {
    setExercises(prev => {
      const updated = [...prev];
      const targetSet = updated[exerciseIndex].sets[setIndex];
      const newSet: ExerciseSet = {
        set_number: updated[exerciseIndex].sets.length + 1,
        reps: targetSet.reps,
        weight_lbs: targetSet.weight_lbs,
        completed: false
      };
      updated[exerciseIndex].sets.push(newSet);
      return updated;
    });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex);
      // Re-index sets
      updated[exerciseIndex].sets.forEach((s, idx) => {
        s.set_number = idx + 1;
      });
      return updated;
    });
  };

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof ExerciseSet,
    value: any
  ) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex] = {
        ...updated[exerciseIndex].sets[setIndex],
        [field]: value
      };
      return updated;
    });
  };

  // Adjust weight or reps by increment
  const adjustSetValue = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight_lbs', delta: number) => {
    setExercises(prev => {
      const updated = [...prev];
      const current = Number(updated[exerciseIndex].sets[setIndex][field]) || 0;
      const nextVal = Math.max(0, current + delta);
      updated[exerciseIndex].sets[setIndex][field] = nextVal;
      return updated;
    });
  };

  // Pace Calculator
  const calculatePace = (distance: number, duration: number) => {
    if (!distance || distance <= 0 || !duration || duration <= 0) return null;
    const paceMinutes = duration / distance;
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.round((paceMinutes - minutes) * 60);
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    const mph = (distance / (duration / 60)).toFixed(1);

    return {
      pacePerMile: `${minutes}:${formattedSeconds} /mi`,
      speedMph: `${mph} mph`
    };
  };

  const calculatedPace = calculatePace(cardioDistanceMiles, cardioDurationMins);

  // Form Save Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setIsSaving(true);
    try {
      const isStrengthIncluded = workoutType === 'strength' || workoutType === 'hybrid';
      const isCardioIncluded = workoutType === 'cardio' || workoutType === 'hybrid';

      const workoutPayload: Omit<Workout, 'id'> & { id?: number } = {
        id: editWorkoutData?.workout.id,
        date,
        type: workoutType,
        intensity_score: intensityScore,
        duration_mins: Number(durationMins) || 45,
        notes
      };

      const exercisesPayload = isStrengthIncluded ? exercises : [];
      const cardioPayload = isCardioIncluded
        ? {
            activity_type: cardioActivity,
            duration_mins: Number(cardioDurationMins) || 0,
            distance_miles: Number(cardioDistanceMiles) || 0,
            zone2: isZone2,
            avg_hr: avgHeartRate ? Number(avgHeartRate) : undefined,
            calories: calories ? Number(calories) : undefined,
            notes: cardioNotes
          }
        : null;

      await saveWorkoutWithDetails(workoutPayload, exercisesPayload, cardioPayload);

      // Trigger celebrate confetti on save
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#22c55e', '#15803d', '#4ade80']
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save workout to IndexedDB:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const categoryBadgeColors: Record<ExerciseCategory, string> = {
    push: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
    pull: 'bg-blue-950/70 text-blue-300 border-blue-800/60',
    legs: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
    core: 'bg-purple-950/70 text-purple-300 border-purple-800/60',
    arms: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
    other: 'bg-zinc-800 text-zinc-300 border-zinc-700'
  };

  // Filter predefined exercises
  const filteredPredefined = PREDEFINED_EXERCISES.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || ex.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="workout-modal-container"
        className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl shadow-black my-8 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-emerald-400">
              {workoutType === 'hybrid' ? (
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              ) : workoutType === 'strength' ? (
                <Dumbbell className="w-5 h-5 text-emerald-400" />
              ) : (
                <Footprints className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                {editWorkoutData ? 'Edit Workout Session' : 'Log Workout Session'}
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Offline-first IndexedDB storage • {date}
              </p>
            </div>
          </div>

          <button
            id="close-workout-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Row: Date, Mode Selector, & Overall Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
            {/* Date Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Session Date
              </label>
              <input
                id="workout-date-input"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Workout Mode */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Training Mode
              </label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  id="mode-hybrid-btn"
                  onClick={() => setWorkoutType('hybrid')}
                  className={`py-1 text-xs font-medium rounded-md transition-colors ${
                    workoutType === 'hybrid'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Hybrid
                </button>
                <button
                  type="button"
                  id="mode-strength-btn"
                  onClick={() => setWorkoutType('strength')}
                  className={`py-1 text-xs font-medium rounded-md transition-colors ${
                    workoutType === 'strength'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Strength
                </button>
                <button
                  type="button"
                  id="mode-cardio-btn"
                  onClick={() => setWorkoutType('cardio')}
                  className={`py-1 text-xs font-medium rounded-md transition-colors ${
                    workoutType === 'cardio'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Cardio
                </button>
              </div>
            </div>

            {/* Duration Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Total Duration (mins)
              </label>
              <div className="relative">
                <input
                  id="workout-duration-input"
                  type="number"
                  min="1"
                  max="600"
                  value={durationMins}
                  onChange={e => setDurationMins(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2 text-xs text-zinc-500 pointer-events-none">
                  min
                </span>
              </div>
            </div>
          </div>

          {/* Intensity Score (1 to 4) Bar (Key GitHub heat-map driver) */}
          <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-400" />
                Intensity Level (Heatmap Shading: 1 - 4)
              </label>
              <span className="text-xs font-mono-numbers font-semibold text-emerald-400">
                Score {intensityScore} of 4
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { score: 1, label: 'Light', desc: 'Active recovery', color: 'border-emerald-900 bg-emerald-950/50 text-emerald-400' },
                { score: 2, label: 'Moderate', desc: 'Aerobic base / Steady', color: 'border-emerald-700 bg-emerald-800/50 text-emerald-200' },
                { score: 3, label: 'Hard', desc: 'Vigorous volume', color: 'border-emerald-500 bg-emerald-600/60 text-white' },
                { score: 4, label: 'Peak #15803d', desc: 'Max effort / PR', color: 'border-emerald-400 bg-[#15803d] text-white shadow-md' }
              ].map(item => (
                <button
                  key={item.score}
                  type="button"
                  id={`intensity-score-btn-${item.score}`}
                  onClick={() => setIntensityScore(item.score)}
                  className={`p-2.5 rounded-xl border text-left transition-all touch-press ${
                    intensityScore === item.score
                      ? `${item.color} ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-900`
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-bold">{item.score} • {item.label}</div>
                  <div className="text-[10px] opacity-75 truncate">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: STRENGTH LOGGING */}
          {(workoutType === 'strength' || workoutType === 'hybrid') && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-zinc-100 uppercase tracking-wide">
                    Strength Training Exercises
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono-numbers">
                    ({exercises.length})
                  </span>
                </div>

                <button
                  type="button"
                  id="add-exercise-btn"
                  onClick={() => setShowAddExercisePicker(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 rounded-lg hover:bg-emerald-900 transition-colors touch-press"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Exercise
                </button>
              </div>

              {/* Add Exercise Modal / Overlay within form */}
              {showAddExercisePicker && (
                <div className="p-4 bg-zinc-950 border border-emerald-500/40 rounded-xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                      Select or Search Exercise
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddExercisePicker(false)}
                      className="text-zinc-400 hover:text-zinc-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search bench press, squat, deadlift, pull-up..."
                      value={exerciseSearch}
                      onChange={e => setExerciseSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {(['all', 'push', 'pull', 'legs', 'core'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                          selectedCategoryFilter === cat
                            ? 'bg-emerald-500 text-zinc-950 font-semibold'
                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Predefined List */}
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {filteredPredefined.map(ex => (
                      <button
                        key={ex.name}
                        type="button"
                        onClick={() => handleAddPredefinedExercise(ex.name, ex.category, ex.defaultReps, ex.defaultWeight)}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-left transition-colors border border-transparent hover:border-zinc-700"
                      >
                        <span className="text-xs font-semibold text-zinc-200">
                          {ex.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryBadgeColors[ex.category]}`}>
                            {ex.category.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono-numbers">
                            {ex.defaultWeight} lbs
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom Exercise creator */}
                  <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      placeholder="Or create custom exercise name..."
                      value={customExerciseName}
                      onChange={e => setCustomExerciseName(e.target.value)}
                      className="w-full sm:flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                    <select
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value as ExerciseCategory)}
                      className="w-full sm:w-auto px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 uppercase font-semibold"
                    >
                      <option value="push">Push</option>
                      <option value="pull">Pull</option>
                      <option value="legs">Legs</option>
                      <option value="core">Core</option>
                      <option value="arms">Arms</option>
                      <option value="other">Other</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddCustomExercise}
                      disabled={!customExerciseName.trim()}
                      className="w-full sm:w-auto px-3 py-1.5 bg-emerald-500 disabled:opacity-50 text-zinc-950 text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                      + Add Custom
                    </button>
                  </div>
                </div>
              )}

              {/* Logged Exercises Table / Cards */}
              {exercises.length === 0 ? (
                <div className="text-center py-6 px-4 bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
                  <Dumbbell className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">
                    No exercises added yet. Tap <strong>"+ Add Exercise"</strong> to record sets, reps, and weights.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exercises.map((ex, exIdx) => (
                    <div
                      key={`ex-${exIdx}`}
                      className="p-3.5 sm:p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-3"
                    >
                      {/* Exercise Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${categoryBadgeColors[ex.category]}`}>
                            {ex.category.toUpperCase()}
                          </span>
                          <h4 className="font-bold text-sm text-zinc-100">
                            {ex.exercise_name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddSet(exIdx)}
                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Set</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(exIdx)}
                            className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Remove exercise"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Sets Table */}
                      <div className="space-y-1.5">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-zinc-500 px-1">
                          <div className="col-span-2 sm:col-span-1 text-center">SET</div>
                          <div className="col-span-4 sm:col-span-4 text-center">WEIGHT (LBS)</div>
                          <div className="col-span-4 sm:col-span-4 text-center">REPS</div>
                          <div className="col-span-2 sm:col-span-3 text-right pr-1">ACTIONS</div>
                        </div>

                        {/* Sets Rows */}
                        {ex.sets.map((set, setIdx) => (
                          <div
                            key={`set-${exIdx}-${setIdx}`}
                            className={`grid grid-cols-12 gap-2 items-center p-1.5 rounded-lg border transition-colors ${
                              set.completed
                                ? 'bg-zinc-900/90 border-emerald-950'
                                : 'bg-zinc-900/40 border-zinc-800'
                            }`}
                          >
                            {/* Set Number */}
                            <div className="col-span-2 sm:col-span-1 text-center font-mono-numbers text-xs font-bold text-zinc-400">
                              #{set.set_number}
                            </div>

                            {/* Weight Controls */}
                            <div className="col-span-4 sm:col-span-4 flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => adjustSetValue(exIdx, setIdx, 'weight_lbs', -5)}
                                className="hidden sm:inline-flex px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 rounded font-mono"
                              >
                                -5
                              </button>
                              <input
                                type="number"
                                min="0"
                                step="2.5"
                                value={set.weight_lbs}
                                onChange={e => handleSetChange(exIdx, setIdx, 'weight_lbs', Number(e.target.value))}
                                className="w-16 sm:w-20 text-center py-1 bg-zinc-950 border border-zinc-700 rounded text-xs sm:text-sm font-mono-numbers font-bold text-zinc-100 focus:outline-none focus:border-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => adjustSetValue(exIdx, setIdx, 'weight_lbs', 5)}
                                className="hidden sm:inline-flex px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 rounded font-mono"
                              >
                                +5
                              </button>
                            </div>

                            {/* Reps Controls */}
                            <div className="col-span-4 sm:col-span-4 flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => adjustSetValue(exIdx, setIdx, 'reps', -1)}
                                className="hidden sm:inline-flex px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 rounded font-mono"
                              >
                                -1
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={set.reps}
                                onChange={e => handleSetChange(exIdx, setIdx, 'reps', Number(e.target.value))}
                                className="w-14 sm:w-16 text-center py-1 bg-zinc-950 border border-zinc-700 rounded text-xs sm:text-sm font-mono-numbers font-bold text-zinc-100 focus:outline-none focus:border-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => adjustSetValue(exIdx, setIdx, 'reps', 1)}
                                className="hidden sm:inline-flex px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 rounded font-mono"
                              >
                                +1
                              </button>
                            </div>

                            {/* Actions: Completed Toggle, Duplicate, Delete */}
                            <div className="col-span-2 sm:col-span-3 flex items-center justify-end gap-1.5">
                              {/* Complete Toggle Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleSetChange(exIdx, setIdx, 'completed', !set.completed)}
                                className={`p-1.5 rounded-md border transition-colors ${
                                  set.completed
                                    ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                                    : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-200'
                                }`}
                                title={set.completed ? 'Mark incomplete' : 'Mark completed'}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </button>

                              {/* Duplicate Set */}
                              <button
                                type="button"
                                onClick={() => handleDuplicateSet(exIdx, setIdx)}
                                className="hidden sm:inline-flex p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                                title="Duplicate set"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Remove Set */}
                              {ex.sets.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSet(exIdx, setIdx)}
                                  className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                                  title="Delete set"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 2: CARDIO / ENDURANCE LOGGING */}
          {(workoutType === 'cardio' || workoutType === 'hybrid') && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-sm text-zinc-100 uppercase tracking-wide">
                    Cardio & Endurance Engine
                  </h3>
                </div>

                {/* Zone 2 Toggle Pill */}
                <button
                  type="button"
                  id="zone2-toggle-btn"
                  onClick={() => setIsZone2(!isZone2)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all touch-press ${
                    isZone2
                      ? 'bg-rose-950/80 text-rose-300 border-rose-600 shadow-sm shadow-rose-950'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isZone2 ? 'fill-rose-400 text-rose-400 animate-pulse' : ''}`} />
                  <span>Zone 2 Easy Pace: {isZone2 ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Cardio Fields Grid */}
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-4">
                {/* Activity Selector */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">
                    Cardio Activity Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CARDIO_ACTIVITIES.map(act => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          setCardioActivity(act.id);
                          if (!cardioDistanceMiles) setCardioDistanceMiles(act.defaultDistance);
                          if (!cardioDurationMins) setCardioDurationMins(act.defaultDuration);
                        }}
                        className={`p-2 rounded-lg border text-xs font-semibold transition-all flex items-center gap-2 ${
                          cardioActivity === act.id
                            ? 'bg-blue-950/80 text-blue-300 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        <Footprints className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{act.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance & Duration Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Distance (miles)
                    </label>
                    <div className="relative">
                      <input
                        id="cardio-distance-input"
                        type="number"
                        step="0.01"
                        min="0"
                        value={cardioDistanceMiles}
                        onChange={e => setCardioDistanceMiles(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono-numbers font-bold focus:outline-none focus:border-blue-500"
                        placeholder="e.g. 5.0"
                      />
                      <span className="absolute right-3 top-2 text-xs text-zinc-500 font-mono">
                        mi
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Cardio Duration (mins)
                    </label>
                    <div className="relative">
                      <input
                        id="cardio-duration-input"
                        type="number"
                        min="1"
                        value={cardioDurationMins}
                        onChange={e => setCardioDurationMins(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono-numbers font-bold focus:outline-none focus:border-blue-500"
                        placeholder="e.g. 45"
                      />
                      <span className="absolute right-3 top-2 text-xs text-zinc-500 font-mono">
                        min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real-time Pace & Speed Indicator */}
                {calculatedPace && (
                  <div className="flex items-center justify-between p-2.5 bg-blue-950/30 border border-blue-900/50 rounded-lg text-xs">
                    <span className="text-blue-300 font-medium flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5" />
                      Calculated Pace:
                    </span>
                    <div className="flex items-center gap-3 font-mono-numbers font-bold text-blue-200">
                      <span>{calculatedPace.pacePerMile}</span>
                      <span className="text-blue-500">•</span>
                      <span>{calculatedPace.speedMph}</span>
                    </div>
                  </div>
                )}

                {/* Optional Heart Rate & Calories */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Avg Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 138"
                      value={avgHeartRate}
                      onChange={e => setAvgHeartRate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono-numbers text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Calories Burned (kcal)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 380"
                      value={calories}
                      onChange={e => setCalories(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono-numbers text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Zone 2 Explanation Tip */}
                {isZone2 && (
                  <div className="flex items-start gap-2 p-2 bg-rose-950/20 border border-rose-900/30 rounded-lg text-[11px] text-rose-300/90">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                    <span>
                      <strong>Zone 2 Aerobic Base:</strong> Conversational effort that enhances mitochondrial density, fat oxidation, and recovery capacity without excessive central nervous system fatigue.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Session Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Session Notes & Reflection
            </label>
            <textarea
              id="workout-notes-textarea"
              rows={2}
              placeholder="Felt strong on bench press, kept Zone 2 run strictly nasal breathing..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Modal Footer / Save Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              id="cancel-workout-btn"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-xl transition-colors touch-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-workout-submit-btn"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-950 transition-all touch-press active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSaving ? 'Saving to IndexedDB...' : editWorkoutData ? 'Update Workout' : 'Save Workout'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
