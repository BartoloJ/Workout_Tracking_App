import React, { useState, useEffect, useCallback } from 'react';
import {
  getAllWorkoutsWithDetails,
  calculateStreakStats,
  seedSampleWorkouts,
  ensureAllWorkoutsHaveSyncIds,
  db
} from './db';
import { WorkoutWithDetails, StreakStats } from './types';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { CalendarView } from './components/CalendarView';
import { WorkoutModal } from './components/WorkoutModal';
import { WorkoutDetailModal } from './components/WorkoutDetailModal';
import { WorkoutFeed } from './components/WorkoutFeed';
import { DataManagementModal } from './components/DataManagementModal';
import { PRTrackerModal } from './components/PRTrackerModal';
import { RestTimerModal } from './components/RestTimerModal';
import { FloatingRestTimer } from './components/FloatingRestTimer';
import { PWAInstallModal } from './components/PWAInstallModal';
import { useRestTimer } from './contexts/RestTimerContext';
import { Plus, Dumbbell, Sparkles, Flame, Trophy, Timer, ArrowUp } from 'lucide-react';

export default function App() {
  const { isTimerModalOpen, openTimer, closeTimer } = useRestTimer();
  // Calendar month state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Data state from Dexie.js
  const [workouts, setWorkouts] = useState<WorkoutWithDetails[]>([]);
  const [workoutsByDate, setWorkoutsByDate] = useState<Record<string, WorkoutWithDetails[]>>({});
  const [stats, setStats] = useState<StreakStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalThisMonth: 0,
    totalAllTime: 0,
    strengthCount: 0,
    cardioCount: 0,
    hybridCount: 0,
    activeDaysThisMonth: 0,
    totalDaysInMonth: 30,
    totalHours: 0,
    totalVolumeLbs: 0,
    zone2RunsCount: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [selectedDateForLog, setSelectedDateForLog] = useState<string>('');
  const [editWorkoutData, setEditWorkoutData] = useState<WorkoutWithDetails | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedDateForDetail, setSelectedDateForDetail] = useState<string>('');

  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [isPRModalOpen, setIsPRModalOpen] = useState<boolean>(false);
  const [isPWAModalOpen, setIsPWAModalOpen] = useState<boolean>(false);

  // Fetch all workouts and streak stats from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const yearMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const [allWorkouts, calculatedStats] = await Promise.all([
        getAllWorkoutsWithDetails(),
        calculateStreakStats(yearMonthStr)
      ]);

      setWorkouts(allWorkouts);
      setStats(calculatedStats);

      // Group workouts by date YYYY-MM-DD
      const byDate: Record<string, WorkoutWithDetails[]> = {};
      allWorkouts.forEach(w => {
        const d = w.workout.date;
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(w);
      });
      setWorkoutsByDate(byDate);
    } catch (err) {
      console.error('Error refreshing Dexie data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Initial auto-seed if first time opening empty app (optional friendly starter)
  useEffect(() => {
    const checkInitialSeed = async () => {
      const count = await db.workouts.count();
      if (count === 0) {
        // Automatically seed sample data on first launch so user gets instant heat-map experience
        await seedSampleWorkouts();
        refreshData();
      } else {
        await ensureAllWorkoutsHaveSyncIds();
      }
    };
    checkInitialSeed();
  }, [refreshData]);

  // Handler: Open logging modal for a specific or current date
  const handleOpenLogModal = (dateStr?: string) => {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    setSelectedDateForLog(targetDate);
    setEditWorkoutData(null);
    setIsLogModalOpen(true);
  };

  // Handler: Open day details modal for a date with existing workouts
  const handleSelectDay = (dateStr: string) => {
    setSelectedDateForDetail(dateStr);
    setIsDetailModalOpen(true);
  };

  // Handler: Edit specific workout
  const handleEditWorkout = (workoutDetails: WorkoutWithDetails) => {
    setEditWorkoutData(workoutDetails);
    setSelectedDateForLog(workoutDetails.workout.date);
    setIsDetailModalOpen(false);
    setIsLogModalOpen(true);
  };

  // Month name formatting
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = monthNames[currentDate.getMonth()];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased">
      {/* Top App Navbar */}
      <Navbar
        onOpenNewWorkout={() => handleOpenLogModal()}
        onOpenTimer={() => openTimer()}
        onOpenPRs={() => setIsPRModalOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenPWAModal={() => setIsPWAModalOpen(true)}
        onSeedSampleData={async () => {
          await seedSampleWorkouts();
          refreshData();
        }}
        totalWorkouts={stats.totalAllTime}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Top Consistency Stats Bar */}
        <StatsBar
          stats={stats}
          currentMonthName={currentMonthName}
        />

        {/* Hero GitHub-style Green Activity Calendar */}
        <CalendarView
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          workoutsByDate={workoutsByDate}
          onSelectDay={handleSelectDay}
          onOpenLogModal={handleOpenLogModal}
        />

        {/* Chronological Workout Activity Feed */}
        <WorkoutFeed
          workouts={workouts}
          onSelectWorkout={handleSelectDay}
          onOpenLogModal={handleOpenLogModal}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800 bg-zinc-950 py-8 px-4 sm:px-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">PULSE Workout Tracker</span>
            <span>•</span>
            <span>Offline-First PWA (IndexedDB)</span>
          </div>

          <div className="flex items-center gap-6 text-zinc-400 font-medium">
            <button
              onClick={() => openTimer()}
              className="hover:text-emerald-400 transition-colors"
            >
              Rest Timer
            </button>
            <button
              onClick={() => setIsPRModalOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              PR Records
            </button>
            <button
              onClick={() => setIsDataModalOpen(true)}
              className="hover:text-zinc-200 transition-colors"
            >
              Backup & Restore
            </button>
            <button
              onClick={() => setIsPWAModalOpen(true)}
              className="hover:text-zinc-200 transition-colors"
            >
              iOS Safari Guide
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Mini Rest Timer (Stays active on top of workout logging) */}
      <FloatingRestTimer />

      {/* Floating Action Button for Mobile Logging */}
      <div className="fixed bottom-6 right-6 sm:hidden z-20">
        <button
          id="mobile-floating-log-btn"
          onClick={() => handleOpenLogModal()}
          className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500 text-zinc-950 shadow-xl shadow-emerald-950/80 active:scale-95 transition-transform touch-press"
          aria-label="Log new workout"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* MODALS */}
      {/* 1. Workout Logging & Editing Modal */}
      <WorkoutModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setEditWorkoutData(null);
        }}
        onSaved={refreshData}
        initialDate={selectedDateForLog}
        editWorkoutData={editWorkoutData}
      />

      {/* 2. Day Details Inspection Modal */}
      <WorkoutDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        dateStr={selectedDateForDetail}
        workouts={workoutsByDate[selectedDateForDetail] || []}
        onEditWorkout={handleEditWorkout}
        onAddAnother={(dStr) => {
          setIsDetailModalOpen(false);
          handleOpenLogModal(dStr);
        }}
        onDeleted={refreshData}
      />

      {/* 3. Data Backup, JSON Export & Import Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onDataChanged={refreshData}
      />

      {/* 4. Personal Records & PR Tracker Modal */}
      <PRTrackerModal
        isOpen={isPRModalOpen}
        onClose={() => setIsPRModalOpen(false)}
      />

      {/* 5. Gym Rest Timer Modal */}
      <RestTimerModal
        isOpen={isTimerModalOpen}
        onClose={closeTimer}
      />

      {/* 6. iOS PWA Installation Guide Modal */}
      <PWAInstallModal
        isOpen={isPWAModalOpen}
        onClose={() => setIsPWAModalOpen(false)}
      />
    </div>
  );
}
