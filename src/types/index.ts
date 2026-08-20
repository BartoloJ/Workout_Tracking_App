export type WorkoutType = 'strength' | 'cardio' | 'hybrid';

export type ExerciseCategory = 'push' | 'pull' | 'legs' | 'core' | 'arms' | 'other';

export interface ExerciseSet {
  set_number: number;
  reps: number;
  weight_lbs: number;
  completed?: boolean;
  rpe?: number;
}

export interface Workout {
  id?: number;
  sync_id?: string; // unique persistent UUID across sync operations and devices
  date: string; // "YYYY-MM-DD"
  type: WorkoutType;
  intensity_score: number; // 1 to 4 (0 is rest/inactive)
  notes?: string;
  duration_mins?: number;
  created_at?: number;
  updated_at?: number;
}

export interface ExerciseLog {
  id?: number;
  workout_id: number;
  exercise_name: string;
  category: ExerciseCategory;
  sets: ExerciseSet[];
  notes?: string;
}

export interface CardioLog {
  id?: number;
  workout_id: number;
  activity_type: string; // "running", "cycling", "rowing", "swimming", "walking", etc.
  duration_mins: number;
  distance_miles: number;
  zone2: boolean;
  avg_hr?: number;
  calories?: number;
  notes?: string;
}

export interface WorkoutWithDetails {
  workout: Workout;
  exercises: ExerciseLog[];
  cardio?: CardioLog | null;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalThisMonth: number;
  totalAllTime: number;
  strengthCount: number;
  cardioCount: number;
  hybridCount: number;
  activeDaysThisMonth: number;
  totalDaysInMonth: number;
  totalHours: number;
  totalVolumeLbs: number;
  zone2RunsCount: number;
}

export interface ExportDataPayload {
  version: number;
  appName: string;
  exportDate: string;
  workouts: Workout[];
  exercise_logs: ExerciseLog[];
  cardio_logs: CardioLog[];
  custom_exercises?: CustomExercise[];
}

export interface CustomExercise {
  id?: number;
  name: string;
  category: ExerciseCategory;
  defaultReps?: number;
  defaultWeight?: number;
  isCustom?: boolean;
  created_at?: number;
}

export interface PredefinedExercise {
  name: string;
  category: ExerciseCategory;
  defaultReps?: number;
  defaultWeight?: number;
  isCustom?: boolean;
}

export const PREDEFINED_EXERCISES: PredefinedExercise[] = [
  // Push
  { name: 'Barbell Bench Press', category: 'push', defaultReps: 8, defaultWeight: 185 },
  { name: 'Incline Dumbbell Press', category: 'push', defaultReps: 10, defaultWeight: 65 },
  { name: 'Overhead Shoulder Press', category: 'push', defaultReps: 8, defaultWeight: 115 },
  { name: 'Dumbbell Lateral Raise', category: 'push', defaultReps: 12, defaultWeight: 25 },
  { name: 'Cable Lateral Raise', category: 'push', defaultReps: 12, defaultWeight: 25 },
  { name: 'Dips (Weighted)', category: 'push', defaultReps: 10, defaultWeight: 25 },
  { name: 'Push-Ups', category: 'push', defaultReps: 20, defaultWeight: 0 },
  { name: 'Tricep Rope Pushdown', category: 'push', defaultReps: 12, defaultWeight: 50 },
  { name: 'Skull Crushers', category: 'push', defaultReps: 10, defaultWeight: 65 },

  // Pull
  { name: 'Barbell Deadlift', category: 'pull', defaultReps: 5, defaultWeight: 275 },
  { name: 'Pull-Ups (Weighted)', category: 'pull', defaultReps: 8, defaultWeight: 25 },
  { name: 'Barbell Bent-Over Row', category: 'pull', defaultReps: 8, defaultWeight: 155 },
  { name: 'Lat Pulldown', category: 'pull', defaultReps: 10, defaultWeight: 140 },
  { name: 'Seated Cable Row', category: 'pull', defaultReps: 10, defaultWeight: 130 },
  { name: 'Face Pulls', category: 'pull', defaultReps: 15, defaultWeight: 40 },
  { name: 'Barbell Bicep Curl', category: 'pull', defaultReps: 10, defaultWeight: 65 },
  { name: 'Hammer Curls', category: 'pull', defaultReps: 12, defaultWeight: 35 },

  // Legs
  { name: 'Barbell Back Squat', category: 'legs', defaultReps: 6, defaultWeight: 225 },
  { name: 'Romanian Deadlift (RDL)', category: 'legs', defaultReps: 8, defaultWeight: 185 },
  { name: 'Bulgarian Split Squat', category: 'legs', defaultReps: 10, defaultWeight: 45 },
  { name: 'Leg Press', category: 'legs', defaultReps: 10, defaultWeight: 360 },
  { name: 'Walking Dumbbell Lunges', category: 'legs', defaultReps: 12, defaultWeight: 40 },
  { name: 'Leg Curl (Hamstring)', category: 'legs', defaultReps: 12, defaultWeight: 100 },
  { name: 'Standing Calf Raise', category: 'legs', defaultReps: 15, defaultWeight: 120 },

  // Core
  { name: 'Hanging Leg Raise', category: 'core', defaultReps: 12, defaultWeight: 0 },
  { name: 'Cable Woodchopper', category: 'core', defaultReps: 12, defaultWeight: 35 },
  { name: 'Ab Wheel Rollout', category: 'core', defaultReps: 12, defaultWeight: 0 },
  { name: 'Plank (Weighted)', category: 'core', defaultReps: 60, defaultWeight: 45 },
  { name: 'Russian Twists', category: 'core', defaultReps: 20, defaultWeight: 25 },
];

export const CARDIO_ACTIVITIES = [
  { id: 'running', name: 'Running', icon: 'Footprints', defaultDistance: 3.1, defaultDuration: 30 },
  { id: 'cycling', name: 'Cycling / Bike', icon: 'Bike', defaultDistance: 12.0, defaultDuration: 45 },
  { id: 'rowing', name: 'Rowing Machine', icon: 'Waves', defaultDistance: 3.1, defaultDuration: 25 },
  { id: 'swimming', name: 'Swimming', icon: 'Fish', defaultDistance: 1.0, defaultDuration: 35 },
  { id: 'walking', name: 'Ruck / Incline Walk', icon: 'MapPin', defaultDistance: 2.5, defaultDuration: 40 },
  { id: 'stairmaster', name: 'Stairmaster', icon: 'Flame', defaultDistance: 1.0, defaultDuration: 20 },
  { id: 'hiit', name: 'HIIT / Circuit', icon: 'Zap', defaultDistance: 0, defaultDuration: 30 },
];
