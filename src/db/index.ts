import Dexie, { type Table } from 'dexie';
import {
  Workout,
  ExerciseLog,
  CardioLog,
  WorkoutWithDetails,
  StreakStats,
  ExportDataPayload
} from '../types';

export class WorkoutTrackerDatabase extends Dexie {
  workouts!: Table<Workout, number>;
  exercise_logs!: Table<ExerciseLog, number>;
  cardio_logs!: Table<CardioLog, number>;

  constructor() {
    super('WorkoutTrackerDB');
    this.version(1).stores({
      workouts: '++id, date, type, intensity_score',
      exercise_logs: '++id, workout_id, exercise_name, category',
      cardio_logs: '++id, workout_id, activity_type'
    });
  }
}

export const db = new WorkoutTrackerDatabase();

/**
 * Fetch all workouts for a given date YYYY-MM-DD
 */
export async function getWorkoutsByDate(date: string): Promise<WorkoutWithDetails[]> {
  const workouts = await db.workouts.where('date').equals(date).toArray();
  const results: WorkoutWithDetails[] = [];

  for (const w of workouts) {
    if (w.id) {
      const exercises = await db.exercise_logs.where('workout_id').equals(w.id).toArray();
      const cardioList = await db.cardio_logs.where('workout_id').equals(w.id).toArray();
      results.push({
        workout: w,
        exercises,
        cardio: cardioList.length > 0 ? cardioList[0] : null
      });
    }
  }
  return results;
}

/**
 * Fetch all workouts with their exercises and cardio details
 */
export async function getAllWorkoutsWithDetails(): Promise<WorkoutWithDetails[]> {
  const workouts = await db.workouts.orderBy('date').reverse().toArray();
  const results: WorkoutWithDetails[] = [];

  for (const w of workouts) {
    if (w.id) {
      const exercises = await db.exercise_logs.where('workout_id').equals(w.id).toArray();
      const cardioList = await db.cardio_logs.where('workout_id').equals(w.id).toArray();
      results.push({
        workout: w,
        exercises,
        cardio: cardioList.length > 0 ? cardioList[0] : null
      });
    }
  }
  return results;
}

/**
 * Save or update a workout with its related exercise and cardio logs
 */
export async function saveWorkoutWithDetails(
  workoutData: Omit<Workout, 'id'> & { id?: number },
  exercises: Array<Omit<ExerciseLog, 'id' | 'workout_id'> & { id?: number }>,
  cardio?: (Omit<CardioLog, 'id' | 'workout_id'> & { id?: number }) | null
): Promise<number> {
  return await db.transaction('rw', db.workouts, db.exercise_logs, db.cardio_logs, async () => {
    let workoutId = workoutData.id;

    if (workoutId) {
      // Update existing workout
      await db.workouts.update(workoutId, {
        date: workoutData.date,
        type: workoutData.type,
        intensity_score: workoutData.intensity_score,
        notes: workoutData.notes || '',
        duration_mins: workoutData.duration_mins || 0
      });

      // Clear previous sub-logs for this workout to replace with fresh entries
      await db.exercise_logs.where('workout_id').equals(workoutId).delete();
      await db.cardio_logs.where('workout_id').equals(workoutId).delete();
    } else {
      // Create new workout
      workoutId = await db.workouts.add({
        date: workoutData.date,
        type: workoutData.type,
        intensity_score: workoutData.intensity_score,
        notes: workoutData.notes || '',
        duration_mins: workoutData.duration_mins || 0,
        created_at: Date.now()
      });
    }

    // Insert exercises
    if (exercises && exercises.length > 0) {
      const exercisesToInsert: ExerciseLog[] = exercises.map(ex => ({
        workout_id: workoutId as number,
        exercise_name: ex.exercise_name,
        category: ex.category,
        sets: ex.sets,
        notes: ex.notes || ''
      }));
      await db.exercise_logs.bulkAdd(exercisesToInsert);
    }

    // Insert cardio log
    if (cardio && (cardio.duration_mins > 0 || cardio.distance_miles > 0 || cardio.activity_type)) {
      await db.cardio_logs.add({
        workout_id: workoutId as number,
        activity_type: cardio.activity_type || 'running',
        duration_mins: Number(cardio.duration_mins) || 0,
        distance_miles: Number(cardio.distance_miles) || 0,
        zone2: Boolean(cardio.zone2),
        avg_hr: cardio.avg_hr ? Number(cardio.avg_hr) : undefined,
        calories: cardio.calories ? Number(cardio.calories) : undefined,
        notes: cardio.notes || ''
      });
    }

    return workoutId as number;
  });
}

/**
 * Delete a workout and all linked exercise & cardio logs
 */
export async function deleteWorkoutWithDetails(workoutId: number): Promise<void> {
  await db.transaction('rw', db.workouts, db.exercise_logs, db.cardio_logs, async () => {
    await db.workouts.delete(workoutId);
    await db.exercise_logs.where('workout_id').equals(workoutId).delete();
    await db.cardio_logs.where('workout_id').equals(workoutId).delete();
  });
}

/**
 * Calculate GitHub consistency streak stats
 */
export async function calculateStreakStats(selectedYearMonth?: string): Promise<StreakStats> {
  const allWorkouts = await db.workouts.toArray();
  const allExercises = await db.exercise_logs.toArray();
  const allCardio = await db.cardio_logs.toArray();

  const now = new Date();
  const targetYearMonth = selectedYearMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Unique active dates
  const activeDatesSet = new Set<string>();
  let strengthCount = 0;
  let cardioCount = 0;
  let hybridCount = 0;
  let totalThisMonth = 0;
  let totalHours = 0;

  allWorkouts.forEach(w => {
    activeDatesSet.add(w.date);
    if (w.type === 'strength') strengthCount++;
    else if (w.type === 'cardio') cardioCount++;
    else if (w.type === 'hybrid') hybridCount++;

    if (w.date.startsWith(targetYearMonth)) {
      totalThisMonth++;
    }
    if (w.duration_mins) {
      totalHours += w.duration_mins / 60;
    }
  });

  // Calculate volume
  let totalVolumeLbs = 0;
  allExercises.forEach(ex => {
    ex.sets.forEach(set => {
      totalVolumeLbs += (set.reps || 0) * (set.weight_lbs || 0);
    });
  });

  // Zone 2 runs
  const zone2RunsCount = allCardio.filter(c => c.zone2).length;

  // Streak Calculation: sort all distinct dates chronologically
  const sortedDates = Array.from(activeDatesSet).sort();

  let longestStreak = 0;
  let currentStreak = 0;

  if (sortedDates.length > 0) {
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dStr of sortedDates) {
      const currentDate = new Date(dStr + 'T00:00:00');
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak += 1;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      prevDate = currentDate;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    // Check if streak is active up to today or yesterday
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (activeDatesSet.has(todayStr) || activeDatesSet.has(yesterdayStr)) {
      // Trace backwards from last active date
      const lastActiveDateStr = sortedDates[sortedDates.length - 1];
      let curr = new Date(lastActiveDateStr + 'T00:00:00');
      currentStreak = 0;
      while (true) {
        const checkStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
        if (activeDatesSet.has(checkStr)) {
          currentStreak += 1;
          curr.setDate(curr.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }
  }

  // Active days in this month
  const daysInMonth = new Date(
    Number(targetYearMonth.split('-')[0]),
    Number(targetYearMonth.split('-')[1]),
    0
  ).getDate();

  const activeDaysThisMonth = Array.from(activeDatesSet).filter(d => d.startsWith(targetYearMonth)).length;

  return {
    currentStreak,
    longestStreak,
    totalThisMonth,
    totalAllTime: allWorkouts.length,
    strengthCount,
    cardioCount,
    hybridCount,
    activeDaysThisMonth,
    totalDaysInMonth: daysInMonth,
    totalHours: Math.round(totalHours * 10) / 10,
    totalVolumeLbs,
    zone2RunsCount
  };
}

/**
 * Dump entire Dexie.js IndexedDB dataset to JSON string
 */
export async function exportDatabaseJSON(): Promise<ExportDataPayload> {
  const workouts = await db.workouts.toArray();
  const exercise_logs = await db.exercise_logs.toArray();
  const cardio_logs = await db.cardio_logs.toArray();

  return {
    version: 1,
    appName: 'Workout Tracker',
    exportDate: new Date().toISOString(),
    workouts,
    exercise_logs,
    cardio_logs
  };
}

/**
 * Restore database from JSON backup file
 */
export async function importDatabaseJSON(payload: ExportDataPayload, replaceAll = false): Promise<{ success: boolean; importedCount: number }> {
  if (!payload || !Array.isArray(payload.workouts)) {
    throw new Error('Invalid JSON backup file format.');
  }

  return await db.transaction('rw', db.workouts, db.exercise_logs, db.cardio_logs, async () => {
    if (replaceAll) {
      await db.workouts.clear();
      await db.exercise_logs.clear();
      await db.cardio_logs.clear();
    }

    // Mapping old workout ids to newly inserted ids if merging
    if (replaceAll) {
      if (payload.workouts.length > 0) await db.workouts.bulkAdd(payload.workouts);
      if (payload.exercise_logs?.length > 0) await db.exercise_logs.bulkAdd(payload.exercise_logs);
      if (payload.cardio_logs?.length > 0) await db.cardio_logs.bulkAdd(payload.cardio_logs);
    } else {
      // Merge mode
      for (const w of payload.workouts) {
        const oldId = w.id;
        const newId = await db.workouts.add({
          date: w.date,
          type: w.type,
          intensity_score: w.intensity_score,
          notes: w.notes || '',
          duration_mins: w.duration_mins,
          created_at: w.created_at || Date.now()
        });

        if (oldId && payload.exercise_logs) {
          const matchedExercises = payload.exercise_logs.filter(e => e.workout_id === oldId);
          for (const me of matchedExercises) {
            await db.exercise_logs.add({
              workout_id: newId,
              exercise_name: me.exercise_name,
              category: me.category,
              sets: me.sets,
              notes: me.notes
            });
          }
        }

        if (oldId && payload.cardio_logs) {
          const matchedCardio = payload.cardio_logs.filter(c => c.workout_id === oldId);
          for (const mc of matchedCardio) {
            await db.cardio_logs.add({
              workout_id: newId,
              activity_type: mc.activity_type,
              duration_mins: mc.duration_mins,
              distance_miles: mc.distance_miles,
              zone2: mc.zone2,
              avg_hr: mc.avg_hr,
              calories: mc.calories,
              notes: mc.notes
            });
          }
        }
      }
    }

    return { success: true, importedCount: payload.workouts.length };
  });
}

/**
 * Seed realistic workout history (last 60 days) to demonstrate consistency calendar
 */
export async function seedSampleWorkouts(): Promise<void> {
  await db.transaction('rw', db.workouts, db.exercise_logs, db.cardio_logs, async () => {
    await db.workouts.clear();
    await db.exercise_logs.clear();
    await db.cardio_logs.clear();

    const today = new Date();
    // Schedule workouts for past 60 days with realistic training splits
    const splits: Array<{
      type: 'strength' | 'cardio' | 'hybrid';
      intensity: number;
      duration: number;
      notes: string;
      exercises?: Array<{ name: string; category: 'push' | 'pull' | 'legs' | 'core'; sets: Array<{ set_number: number; reps: number; weight_lbs: number }> }>;
      cardio?: { activity_type: string; duration_mins: number; distance_miles: number; zone2: boolean; avg_hr?: number };
    }> = [
      {
        type: 'strength',
        intensity: 3,
        duration: 55,
        notes: 'Upper Push session - Bench feeling strong and locked in.',
        exercises: [
          {
            name: 'Barbell Bench Press',
            category: 'push',
            sets: [
              { set_number: 1, reps: 10, weight_lbs: 135 },
              { set_number: 2, reps: 8, weight_lbs: 185 },
              { set_number: 3, reps: 6, weight_lbs: 205 },
              { set_number: 4, reps: 5, weight_lbs: 225 }
            ]
          },
          {
            name: 'Incline Dumbbell Press',
            category: 'push',
            sets: [
              { set_number: 1, reps: 10, weight_lbs: 65 },
              { set_number: 2, reps: 10, weight_lbs: 70 },
              { set_number: 3, reps: 8, weight_lbs: 75 }
            ]
          },
          {
            name: 'Cable Lateral Raise',
            category: 'push',
            sets: [
              { set_number: 1, reps: 15, weight_lbs: 25 },
              { set_number: 2, reps: 12, weight_lbs: 30 },
              { set_number: 3, reps: 12, weight_lbs: 30 }
            ]
          }
        ]
      },
      {
        type: 'cardio',
        intensity: 2,
        duration: 45,
        notes: 'Morning Zone 2 base run along river trail. Kept HR strictly below 142 bpm.',
        cardio: {
          activity_type: 'running',
          duration_mins: 45,
          distance_miles: 4.8,
          zone2: true,
          avg_hr: 138
        }
      },
      {
        type: 'strength',
        intensity: 4,
        duration: 65,
        notes: 'Heavy Pull Day - New Deadlift PR on top double!',
        exercises: [
          {
            name: 'Barbell Deadlift',
            category: 'pull',
            sets: [
              { set_number: 1, reps: 5, weight_lbs: 225 },
              { set_number: 2, reps: 5, weight_lbs: 315 },
              { set_number: 3, reps: 3, weight_lbs: 365 },
              { set_number: 4, reps: 2, weight_lbs: 405 }
            ]
          },
          {
            name: 'Pull-Ups (Weighted)',
            category: 'pull',
            sets: [
              { set_number: 1, reps: 8, weight_lbs: 25 },
              { set_number: 2, reps: 8, weight_lbs: 25 },
              { set_number: 3, reps: 6, weight_lbs: 35 }
            ]
          },
          {
            name: 'Barbell Bent-Over Row',
            category: 'pull',
            sets: [
              { set_number: 1, reps: 8, weight_lbs: 155 },
              { set_number: 2, reps: 8, weight_lbs: 165 },
              { set_number: 3, reps: 8, weight_lbs: 175 }
            ]
          }
        ]
      },
      {
        type: 'hybrid',
        intensity: 3,
        duration: 70,
        notes: 'Squat focus followed by 20 min easy aerobic flush.',
        exercises: [
          {
            name: 'Barbell Back Squat',
            category: 'legs',
            sets: [
              { set_number: 1, reps: 8, weight_lbs: 185 },
              { set_number: 2, reps: 6, weight_lbs: 225 },
              { set_number: 3, reps: 6, weight_lbs: 255 },
              { set_number: 4, reps: 5, weight_lbs: 275 }
            ]
          },
          {
            name: 'Romanian Deadlift (RDL)',
            category: 'legs',
            sets: [
              { set_number: 1, reps: 10, weight_lbs: 185 },
              { set_number: 2, reps: 10, weight_lbs: 205 },
              { set_number: 3, reps: 8, weight_lbs: 225 }
            ]
          }
        ],
        cardio: {
          activity_type: 'cycling',
          duration_mins: 20,
          distance_miles: 6.2,
          zone2: true,
          avg_hr: 125
        }
      },
      {
        type: 'cardio',
        intensity: 4,
        duration: 50,
        notes: 'Track intervals: 6x800m with 90s jog recovery.',
        cardio: {
          activity_type: 'running',
          duration_mins: 50,
          distance_miles: 6.2,
          zone2: false,
          avg_hr: 168
        }
      },
      {
        type: 'strength',
        intensity: 2,
        duration: 40,
        notes: 'Shoulders, Arms and Core accessory work.',
        exercises: [
          {
            name: 'Overhead Shoulder Press',
            category: 'push',
            sets: [
              { set_number: 1, reps: 10, weight_lbs: 95 },
              { set_number: 2, reps: 8, weight_lbs: 115 },
              { set_number: 3, reps: 8, weight_lbs: 125 }
            ]
          },
          {
            name: 'Hanging Leg Raise',
            category: 'core',
            sets: [
              { set_number: 1, reps: 15, weight_lbs: 0 },
              { set_number: 2, reps: 15, weight_lbs: 0 },
              { set_number: 3, reps: 12, weight_lbs: 0 }
            ]
          }
        ]
      }
    ];

    // Seed 4-5 workouts per week for the last 55 days
    for (let i = 54; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat

      // Rest days on some Wednesdays and Sundays
      if ((dayOfWeek === 0 && i % 3 === 0) || (dayOfWeek === 3 && i % 2 === 0)) {
        continue;
      }

      const splitIndex = (54 - i) % splits.length;
      const split = splits[splitIndex];
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const wId = await db.workouts.add({
        date: dateStr,
        type: split.type,
        intensity_score: split.intensity,
        notes: split.notes,
        duration_mins: split.duration,
        created_at: d.getTime()
      });

      if (split.exercises) {
        for (const ex of split.exercises) {
          await db.exercise_logs.add({
            workout_id: wId,
            exercise_name: ex.name,
            category: ex.category,
            sets: ex.sets
          });
        }
      }

      if (split.cardio) {
        await db.cardio_logs.add({
          workout_id: wId,
          activity_type: split.cardio.activity_type,
          duration_mins: split.cardio.duration_mins,
          distance_miles: split.cardio.distance_miles,
          zone2: split.cardio.zone2,
          avg_hr: split.cardio.avg_hr
        });
      }
    }
  });
}
