import { ActiveWorkoutDraft, WorkoutWithDetails, ExerciseLog } from '../types';

export const WORKOUT_DRAFT_STORAGE_KEY = 'pulse_active_workout_draft_v1';
export const WORKOUT_DRAFT_EVENT = 'pulse_workout_draft_changed';

/**
 * Saves the active workout draft to local storage and dispatches a notification event.
 */
export function saveActiveWorkoutDraft(draft: ActiveWorkoutDraft): void {
  try {
    localStorage.setItem(WORKOUT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(WORKOUT_DRAFT_EVENT, { detail: draft }));
    }
  } catch (err) {
    console.warn('Failed to save workout draft to localStorage:', err);
  }
}

/**
 * Retrieves the currently saved workout draft, or null if none exists.
 */
export function getActiveWorkoutDraft(): ActiveWorkoutDraft | null {
  try {
    const raw = localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveWorkoutDraft;
    // Basic validation
    if (!parsed || typeof parsed.savedAt !== 'number' || !parsed.date) {
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn('Failed to load workout draft:', err);
    return null;
  }
}

/**
 * Permanently removes the workout draft from storage.
 */
export function clearActiveWorkoutDraft(): void {
  try {
    localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(WORKOUT_DRAFT_EVENT, { detail: null }));
    }
  } catch (err) {
    console.warn('Failed to clear workout draft:', err);
  }
}

/**
 * Checks if a draft has any meaningful entered content (completed sets, non-default weights, notes, cardio distance).
 */
export function hasMeaningfulContent(
  exercises: Array<Omit<ExerciseLog, 'id' | 'workout_id'> & { id?: number }>,
  notes: string,
  cardioDistanceStr: string,
  cardioNotes: string,
  routePointsLength = 0,
  editWorkoutData?: WorkoutWithDetails | null
): boolean {
  if (editWorkoutData) return true;
  if (notes.trim().length > 0 || cardioNotes.trim().length > 0) return true;
  if (routePointsLength > 0) return true;

  const dist = parseFloat(cardioDistanceStr);
  if (!isNaN(dist) && dist > 0) return true;

  // Check if any set is completed or has custom non-zero weight/reps
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (set.completed) return true;
      if (set.weight_lbs && set.weight_lbs > 0 && set.reps && set.reps > 0) {
        // User interacted with sets
        return true;
      }
    }
  }

  return false;
}

/**
 * Format timestamp into friendly string (e.g. "Just now", "2 mins ago", "14:23").
 */
export function formatDraftTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 45) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
