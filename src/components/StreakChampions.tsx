'use client';

import { Habit } from '@/types';
import StreakBadge from './StreakBadge';

interface Champion {
  habit: Habit;
  current: number;
  best: number;
}

interface StreakChampionsProps {
  champions: Champion[];
}

export default function StreakChampions({ champions }: StreakChampionsProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
        🏆 Streak Champions
      </h3>
      
      <div className="space-y-3">
        {champions.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No streaks yet. Keep going!
          </p>
        ) : (
          champions.map((champ, idx) => (
            <div key={champ.habit.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {idx + 1}. {champ.habit.emoji} {champ.habit.name}
                </p>
              </div>
              <StreakBadge current={champ.current} best={champ.best} size="sm" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
