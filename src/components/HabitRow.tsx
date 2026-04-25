'use client';

import { useState, useRef } from 'react';
import { Habit, HabitEntry } from '@/types';
import DayCell from './DayCell';
import StreakBadge from './StreakBadge';
import { formatDate, getDaysInMonth } from '@/lib/calendar';
import { Trash2, Edit2 } from 'lucide-react';

interface HabitRowProps {
  habit: Habit;
  month: number;
  year: number;
  entries: Record<string, HabitEntry>;
  currentStreak?: number;
  bestStreak?: number;
  onToggleHabit: (dateStr: string, completed: boolean) => Promise<void>;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

export default function HabitRow({
  habit,
  month,
  year,
  entries,
  currentStreak,
  bestStreak,
  onToggleHabit,
  onEditHabit,
  onDeleteHabit,
}: HabitRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    return new Date(year, month, i + 1);
  });

  // Calculate completion % for this month
  const completedDays = days.filter((day) => {
    const dateStr = formatDate(day);
    const entry = entries[dateStr];
    return entry?.completions[habit.id];
  }).length;
  const completionPercent = days.length > 0 ? Math.round((completedDays / days.length) * 100) : 0;

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== habit.name) {
      onEditHabit({ ...habit, name: editName });
    }
    setIsEditing(false);
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center gap-4 border-r border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900 sticky left-0 z-10 min-w-[200px]">
        {/* Habit Name & Emoji */}
        <div className="w-32 flex-shrink-0">
          {isEditing ? (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="flex-1 rounded border border-blue-500 bg-white px-2 py-1 text-sm dark:bg-gray-800"
                autoFocus
              />
            </div>
          ) : (
            <div
              onClick={() => {
                setIsEditing(true);
              }}
              className="cursor-pointer truncate rounded px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              <span className="text-lg">{habit.emoji}</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {habit.name}
              </span>
            </div>
          )}
        </div>

        {/* Completion % & Streaks */}
        <div className="w-24 flex-shrink-0 flex items-center justify-between">
          <div className="w-12">
            <div className="h-2 rounded-full bg-gray-300 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
              {completionPercent}%
            </p>
          </div>
          <StreakBadge current={currentStreak || 0} best={bestStreak} size="sm" />
        </div>

        {/* Menu Button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded p-1 hover:bg-gray-300 dark:hover:bg-gray-700"
          >
            ⋮
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDeleteHabit(habit.id);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Days Grid */}
      <div className="flex gap-1 border-r border-gray-200 p-3 dark:border-gray-800">
        {days.map((day) => {
          const dateStr = formatDate(day);
          const entry = entries[dateStr];
          const isCompleted = entry?.completions[habit.id] || false;

          return (
            <DayCell
              key={dateStr}
              habitId={habit.id}
              date={day}
              isCompleted={isCompleted}
              onToggle={(completed) => onToggleHabit(dateStr, completed)}
            />
          );
        })}
      </div>
    </div>
  );
}
