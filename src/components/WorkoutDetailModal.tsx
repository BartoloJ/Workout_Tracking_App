import React, { useState } from 'react';
import {
  X,
  Dumbbell,
  Footprints,
  Flame,
  Edit,
  Trash2,
  Plus,
  Heart,
  Calendar,
  Clock,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { WorkoutWithDetails } from '../types';
import { deleteWorkoutWithDetails } from '../db';
import { usePreferences } from '../contexts/PreferencesContext';

interface WorkoutDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  workouts: WorkoutWithDetails[];
  onEditWorkout: (workout: WorkoutWithDetails) => void;
  onAddAnother: (dateStr: string) => void;
  onDeleted: () => void;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  workouts,
  onEditWorkout,
  onAddAnother,
  onDeleted
}) => {
  const { preferences } = usePreferences();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDelete = async (workoutId: number) => {
    if (window.confirm('Are you sure you want to delete this workout log?')) {
      setDeletingId(workoutId);
      try {
        await deleteWorkoutWithDetails(workoutId);
        onDeleted();
        if (workouts.length <= 1) {
          onClose();
        }
      } catch (err) {
        console.error('Failed to delete workout:', err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getIntensityLabel = (score: number) => {
    switch (score) {
      case 1: return { text: 'Light (Score 1)', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800' };
      case 2: return { text: 'Moderate (Score 2)', color: 'text-emerald-300 bg-emerald-900/80 border-emerald-700' };
      case 3: return { text: 'Hard (Score 3)', color: 'text-emerald-200 bg-emerald-700/80 border-emerald-500' };
      case 4: return { text: 'Peak #15803d (Score 4)', color: 'text-white bg-[#15803d] border-emerald-400' };
      default: return { text: `Intensity ${score}`, color: 'text-zinc-400 bg-zinc-800 border-zinc-700' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="workout-detail-modal"
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl shadow-black my-8 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-900 text-emerald-400 border border-zinc-800">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 tracking-tight">
                <span>Workouts on {dateStr}</span>
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                {workouts.length} {workouts.length === 1 ? 'session' : 'sessions'} recorded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddAnother(dateStr)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-zinc-900 text-emerald-400 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Log Another</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content / Sessions List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {workouts.map((wDetails, index) => {
            const { workout, exercises, cardio } = wDetails;
            const intensityBadge = getIntensityLabel(workout.intensity_score);

            // Calculate total volume for this session
            const sessionVolume = exercises.reduce((acc, ex) => {
              return acc + ex.sets.reduce((sAcc, s) => sAcc + ((s.reps || 0) * (s.weight_lbs || 0)), 0);
            }, 0);

            return (
              <div
                key={workout.id || `w-${index}`}
                className="bg-zinc-800/40 border border-zinc-800 rounded-2xl p-5 space-y-4"
              >
                {/* Session Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
                      {workout.type === 'hybrid' ? (
                        <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                      ) : workout.type === 'strength' ? (
                        <Dumbbell className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Footprints className="w-4 h-4 text-blue-400" />
                      )}
                    </span>
                    <span className="font-bold text-sm text-zinc-100 capitalize">
                      {workout.type} Session
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${intensityBadge.color}`}>
                      {intensityBadge.text}
                    </span>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditWorkout(wDetails)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors"
                      title="Edit this session"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    {workout.id && (
                      <button
                        onClick={() => handleDelete(workout.id!)}
                        disabled={deletingId === workout.id}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors"
                        title="Delete this session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Session Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {preferences.showDuration && (
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <span className="text-zinc-500 block text-[10px] font-bold uppercase">Duration</span>
                      <span className="font-mono-numbers font-bold text-zinc-200">
                        {workout.duration_mins ? `${workout.duration_mins} mins` : '—'}
                      </span>
                    </div>
                  )}

                  {preferences.showStrengthVolume && exercises.length > 0 && (
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <span className="text-zinc-500 block text-[10px] font-bold uppercase">Total Lifted</span>
                      <span className="font-mono-numbers font-bold text-emerald-400">
                        {sessionVolume.toLocaleString()} lbs
                      </span>
                    </div>
                  )}

                  {cardio && (
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <span className="text-zinc-500 block text-[10px] font-bold uppercase">Cardio</span>
                      <span className="font-mono-numbers font-bold text-blue-400">
                        {preferences.showCardioDistance && cardio.distance_miles ? `${cardio.distance_miles} mi ` : ''}
                        {cardio.duration_mins ? `(${cardio.duration_mins}m)` : ''}
                      </span>
                    </div>
                  )}

                  {preferences.showZone2 && cardio?.zone2 && (
                    <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl">
                      <span className="text-rose-400 block text-[10px] font-bold uppercase flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5 fill-rose-400" />
                        Zone 2
                      </span>
                      <span className="font-bold text-rose-300">
                        Aerobic Base
                      </span>
                    </div>
                  )}
                </div>

                {/* Exercises Detail */}
                {exercises.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                      Strength Logs ({exercises.length} exercises)
                    </h4>
                    <div className="space-y-2">
                      {exercises.map((ex, exI) => (
                        <div
                          key={`ex-view-${exI}`}
                          className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-zinc-100">
                              {ex.exercise_name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 uppercase">
                              {ex.category}
                            </span>
                          </div>

                          {/* Sets table */}
                          <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                            {ex.sets.map((s, sIdx) => (
                              <div
                                key={`s-view-${sIdx}`}
                                className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 font-mono-numbers"
                              >
                                <span className="text-[10px] text-zinc-500 block font-sans">Set {s.set_number}</span>
                                <span className="font-bold text-zinc-200">
                                  {s.reps} × {s.weight_lbs} <span className="text-[10px] text-zinc-500 font-normal">lbs</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cardio Detail */}
                {cardio && (
                  <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-100 flex items-center gap-1.5 capitalize">
                        <Footprints className="w-3.5 h-3.5 text-blue-400" />
                        {cardio.activity_type}
                      </span>
                      {preferences.showZone2 && cardio.zone2 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5 fill-rose-400" />
                          Zone 2 Easy Pace
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-zinc-300 font-mono-numbers pt-1">
                      {preferences.showCardioDistance && (
                        <span><strong>{cardio.distance_miles}</strong> miles</span>
                      )}
                      {preferences.showCardioDistance && <span className="text-zinc-600">•</span>}
                      <span><strong>{cardio.duration_mins}</strong> mins</span>
                      {preferences.showCardioExtraMetrics && cardio.avg_hr && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span><strong>{cardio.avg_hr}</strong> bpm</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {preferences.showWorkoutNotes && workout.notes && (
                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs text-zinc-300 italic">
                    "{workout.notes}"
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <button
            onClick={() => onAddAnother(dateStr)}
            className="sm:hidden flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold bg-zinc-900 text-emerald-400 border border-zinc-800 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Log Another</span>
          </button>

          <button
            onClick={onClose}
            className="ml-auto px-5 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
