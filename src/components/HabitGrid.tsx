'use client';

import { Habit, HabitEntry } from '@/types';
import HabitRow from './HabitRow';
import { getDaysInMonth, formatDate, getMonthName } from '@/lib/calendar';

interface HabitGridProps {
  habits: Habit[];
  month: number;
  year: number;
  entries: Record<string, HabitEntry>;
  streaks?: Record<string, {current: number, best: number}>;
  onToggleHabit: (habitId: string, dateStr: string, completed: boolean) => Promise<void>;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

export default function HabitGrid({
  habits,
  month,
  year,
  entries,
  streaks,
  onToggleHabit,
  onEditHabit,
  onDeleteHabit,
}: HabitGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      {/* Month Header */}
      <div className="flex items-center gap-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 p-4 dark:border-gray-800 dark:from-blue-900/20 dark:to-blue-800/20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getMonthName(month)} {year}
        </h2>
      </div>

      {/* Date Header Row */}
      <div className="flex overflow-hidden">
        {/* Habit Names Column (sticky) */}
        <div className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 sticky left-0 z-10" />

        {/* Dates Row */}
        <div className="flex gap-1 overflow-x-auto p-3">
          {days.map((day) => {
            const date = new Date(year, month, day);
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
              date.getDay()
            ];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div
                key={day}
                className={`w-12 flex-shrink-0 text-center rounded border ${
                  isWeekend
                    ? 'border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800'
                    : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900'
                } p-2`}
              >
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {dayName}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {day}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habit Rows */}
      <div>
        {habits.length === 0 ? (
          <div className="flex items-center justify-center border-t border-gray-200 p-8 text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <p>No habits yet. Create one to get started!</p>
          </div>
        ) : (
          habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              month={month}
              year={year}
              entries={entries}
              currentStreak={streaks?.[habit.id]?.current}
              bestStreak={streaks?.[habit.id]?.best}
              onToggleHabit={(dateStr, completed) =>
                onToggleHabit(habit.id, dateStr, completed)
              }
              onEditHabit={onEditHabit}
              onDeleteHabit={onDeleteHabit}
            />
          ))
        )}
      </div>
    </div>
  );
}
