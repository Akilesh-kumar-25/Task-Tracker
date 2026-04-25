'use client';

import { useState } from 'react';
import { isDateInFuture } from '@/lib/calendar';

interface DayCellProps {
  habitId: string;
  date: Date;
  isCompleted: boolean;
  isLoading?: boolean;
  onToggle: (completed: boolean) => Promise<void>;
}

export default function DayCell({
  habitId,
  date,
  isCompleted,
  isLoading = false,
  onToggle,
}: DayCellProps) {
  const [loading, setLoading] = useState(false);
  const isFuture = isDateInFuture(date);

  const handleClick = async () => {
    if (isFuture || loading) return;

    setLoading(true);
    try {
      await onToggle(!isCompleted);
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isFuture) {
    return (
      <button
        disabled
        className="aspect-square rounded border border-gray-200 bg-gray-50 cursor-not-allowed opacity-40 dark:border-gray-700 dark:bg-gray-800"
        title="Future date"
      />
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`aspect-square rounded border transition-all smooth-transition ${
        isCompleted
          ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/30'
          : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'
      } ${loading ? 'opacity-50' : ''} flex items-center justify-center text-lg font-semibold`}
      title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      ) : isCompleted ? (
        <span className="text-emerald-600 dark:text-emerald-400">✓</span>
      ) : null}
    </button>
  );
}
