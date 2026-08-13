import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Dumbbell,
  Footprints,
  Flame,
  Calendar as CalendarIcon,
  Grid,
  Info,
  Check
} from 'lucide-react';
import { WorkoutWithDetails } from '../types';

interface CalendarViewProps {
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  workoutsByDate: Record<string, WorkoutWithDetails[]>;
  onSelectDay: (dateStr: string) => void;
  onOpenLogModal: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  onDateChange,
  workoutsByDate,
  onSelectDay,
  onOpenLogModal
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    onDateChange(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    onDateChange(new Date(year, month + 1, 1));
  };

  const setToday = () => {
    onDateChange(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calculate calendar grid days for the month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Adjust so Monday = 0, Sunday = 6
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Helper to format date string YYYY-MM-DD
  const formatDateStr = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  // Intensity color mapper strictly according to Sophisticated Dark specification:
  // 0 = Rest Gray, 1 = Deep Emerald 900, 2-3 = Vivid Emerald 700, 4 = Bright Emerald 500
  const getIntensityStyles = (intensity: number) => {
    switch (intensity) {
      case 1:
        return {
          bg: 'bg-emerald-900/90 hover:bg-emerald-800',
          border: 'border-emerald-800',
          text: 'text-emerald-300',
          label: 'Light',
          badgeBg: 'bg-emerald-950 text-emerald-300'
        };
      case 2:
      case 3:
        return {
          bg: 'bg-emerald-700 hover:bg-emerald-600',
          border: 'border-emerald-600',
          text: 'text-zinc-50 font-semibold',
          label: 'Medium',
          badgeBg: 'bg-emerald-800 text-emerald-100'
        };
      case 4:
        return {
          bg: 'bg-emerald-500 hover:bg-emerald-400',
          border: 'border-emerald-400',
          text: 'text-zinc-950 font-bold shadow-sm',
          label: 'Peak',
          badgeBg: 'bg-emerald-950 text-emerald-400'
        };
      case 0:
      default:
        return {
          bg: 'bg-zinc-800/80 hover:bg-zinc-700/80',
          border: 'border-zinc-800',
          text: 'text-zinc-400',
          label: 'Rest',
          badgeBg: 'bg-zinc-900 text-zinc-500'
        };
    }
  };

  // Calculate highest intensity score for a day if multiple workouts exist
  const getDayIntensity = (dayWorkouts?: WorkoutWithDetails[]) => {
    if (!dayWorkouts || dayWorkouts.length === 0) return 0;
    return Math.max(...dayWorkouts.map(dw => dw.workout.intensity_score || 1));
  };

  // Generate Year Heatmap Data (52 weeks for annual GitHub view)
  const generateYearMatrix = () => {
    const weeks: Array<Array<{ dateStr: string; intensity: number; count: number }>> = [];
    const endDate = new Date(today);
    // Find the end of the current week (Sunday)
    const endDayOfWeek = endDate.getDay() === 0 ? 6 : endDate.getDay() - 1;
    endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (52 * 7 - 1));

    let current = new Date(startDate);
    let currentWeek: Array<{ dateStr: string; intensity: number; count: number }> = [];

    while (current <= endDate) {
      const dStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const dayWorkouts = workoutsByDate[dStr];
      const intensity = getDayIntensity(dayWorkouts);

      currentWeek.push({
        dateStr: dStr,
        intensity,
        count: dayWorkouts?.length || 0
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    return weeks;
  };

  return (
    <section id="calendar-consistency-section" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
      {/* Calendar Header / Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              <span>{monthNames[month]} {year}</span>
            </h2>
            <button
              id="today-btn"
              onClick={setToday}
              className="px-3 py-1 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl transition-colors touch-press"
            >
              Today
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            Monthly Intensity Heatmap • Activity matrix based on logged session load
          </p>
        </div>

        {/* View Switcher & Month Arrows */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Toggle Month vs Year matrix */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              id="view-mode-month-btn"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Month
            </button>
            <button
              id="view-mode-year-btn"
              onClick={() => setViewMode('year')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                viewMode === 'year'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Grid className="w-3 h-3" />
              52-Week
            </button>
          </div>

          {/* Month Paginate Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id="prev-month-btn"
              onClick={prevMonth}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors touch-press"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="next-month-btn"
              onClick={nextMonth}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors touch-press"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View 1: Month Grid View (Primary Hero Specification) */}
      {viewMode === 'month' && (
        <div className="w-full">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-3 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            {weekdayNames.map(day => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {/* Empty slots for month start offset */}
            {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="aspect-square sm:aspect-auto sm:h-24 rounded-2xl bg-zinc-950/20 border border-zinc-900/40 opacity-20 pointer-events-none"
              />
            ))}

            {/* Actual Days of the Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1;
              const dateStr = formatDateStr(year, month, dayNumber);
              const dayWorkouts = workoutsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const intensity = getDayIntensity(dayWorkouts);
              const styles = getIntensityStyles(intensity);

              // Extract workout types for badges
              const hasStrength = dayWorkouts.some(dw => dw.workout.type === 'strength' || dw.workout.type === 'hybrid');
              const hasCardio = dayWorkouts.some(dw => dw.workout.type === 'cardio' || dw.workout.type === 'hybrid');
              const isHybrid = dayWorkouts.some(dw => dw.workout.type === 'hybrid') || (hasStrength && hasCardio);

              return (
                <div
                  key={dateStr}
                  id={`calendar-day-${dateStr}`}
                  onClick={() => {
                    if (dayWorkouts.length > 0) {
                      onSelectDay(dateStr);
                    } else {
                      onOpenLogModal(dateStr);
                    }
                  }}
                  className={`relative group cursor-pointer aspect-square sm:aspect-auto sm:h-24 p-2 sm:p-3 rounded-2xl border transition-all duration-150 flex flex-col justify-between touch-press ${styles.bg} ${styles.border} ${
                    isToday ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950' : ''
                  }`}
                >
                  {/* Day Number and Today Indicator */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs sm:text-sm font-mono-numbers font-semibold ${styles.text} ${
                        isToday ? 'px-1.5 py-0.5 rounded-lg bg-emerald-400 text-zinc-950 font-bold' : ''
                      }`}
                    >
                      {dayNumber}
                    </span>

                    {/* Quick "+" hover log button for desktop */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLogModal(dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 sm:p-1 p-0.5 rounded-lg bg-zinc-900/90 text-zinc-200 hover:text-emerald-400 hover:bg-zinc-800 transition-opacity"
                      title={`Log workout for ${dateStr}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Day Activity Indicators & Preview */}
                  {dayWorkouts.length > 0 ? (
                    <div className="mt-auto flex flex-col gap-1">
                      {/* Mobile compact icons */}
                      <div className="flex items-center gap-1 sm:hidden">
                        {isHybrid ? (
                          <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                        ) : hasStrength ? (
                          <Dumbbell className="w-3 h-3 text-emerald-200" />
                        ) : (
                          <Footprints className="w-3 h-3 text-blue-200" />
                        )}
                        <span className="text-[10px] font-mono-numbers font-bold text-white">
                          L{intensity}
                        </span>
                      </div>

                      {/* Desktop Rich Pill Badge */}
                      <div className="hidden sm:flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-[11px] font-semibold tracking-tight text-zinc-100 truncate">
                          {isHybrid ? (
                            <>
                              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 shrink-0" />
                              <span className="truncate">Hybrid Session</span>
                            </>
                          ) : hasStrength ? (
                            <>
                              <Dumbbell className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                              <span className="truncate">
                                {dayWorkouts[0]?.exercises?.[0]?.exercise_name || 'Strength'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Footprints className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                              <span className="truncate capitalize">
                                {dayWorkouts[0]?.cardio?.activity_type || 'Cardio'}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Subtitle notes/sets */}
                        <div className="text-[10px] text-zinc-300/80 truncate font-mono-numbers">
                          {dayWorkouts[0]?.workout.duration_mins ? `${dayWorkouts[0].workout.duration_mins}m • ` : ''}
                          {dayWorkouts[0]?.cardio?.zone2 ? 'Zone 2' : `Level ${intensity}`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="hidden sm:block text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors font-medium">
                      + Log
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: GitHub 52-Week Annual Heatmap Grid */}
      {viewMode === 'year' && (
        <div className="w-full overflow-x-auto pb-2">
          <div className="min-w-[700px] flex flex-col gap-2">
            <div className="text-xs text-zinc-400 font-medium flex items-center justify-between">
              <span>52-Week Contribution Timeline</span>
              <span className="text-zinc-500">Yearly overview</span>
            </div>

            <div className="flex gap-1.5 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              {generateYearMatrix().map((week, wIdx) => (
                <div key={`week-${wIdx}`} className="flex flex-col gap-1.5">
                  {week.map(day => {
                    const styles = getIntensityStyles(day.intensity);
                    const isToday = day.dateStr === todayStr;

                    return (
                      <button
                        key={day.dateStr}
                        onClick={() => {
                          if (day.count > 0) {
                            onSelectDay(day.dateStr);
                          } else {
                            onOpenLogModal(day.dateStr);
                          }
                        }}
                        className={`w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 ${
                          day.intensity === 0 ? 'bg-zinc-800 hover:bg-zinc-700' : styles.bg
                        } ${isToday ? 'ring-1 ring-emerald-400' : ''}`}
                        title={`${day.dateStr}: ${day.count} workout(s), Intensity ${day.intensity}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Legend & Consistency Guide matching Sophisticated Dark design */}
      <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2 font-medium">
          <span>Less</span>
          <div className="w-3.5 h-3.5 bg-zinc-800 rounded-sm border border-zinc-700/40" title="0: Rest Day" />
          <div className="w-3.5 h-3.5 bg-emerald-900 rounded-sm" title="1: Light (Recovery)" />
          <div className="w-3.5 h-3.5 bg-emerald-700 rounded-sm" title="2-3: Medium (Solid Workout)" />
          <div className="w-3.5 h-3.5 bg-emerald-500 rounded-sm" title="4: Peak Intensity" />
          <span>More</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
            Strength
          </span>
          <span className="flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-blue-400" />
            Cardio
          </span>
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            Hybrid
          </span>
        </div>
      </div>
    </section>
  );
};
