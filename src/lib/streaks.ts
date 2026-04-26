import { HabitEntry, Streak } from '@/types';
import { formatDate, parseDate } from './calendar';
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Calculate current streak for a habit
export function calculateCurrentStreak(
  entries: HabitEntry[],
  habitId: string
): number {
  const sorted = [...entries].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  const today = new Date();
  let checkDate = new Date(today);

  for (const entry of sorted) {
    const entryDate = parseDate(entry.date);
    checkDate.setHours(0, 0, 0, 0);
    entryDate.setHours(0, 0, 0, 0);

    if (entry.completions[habitId]) {
      const dayDiff = Math.floor(
        (checkDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 0 || dayDiff === 1 || streak === 0) {
        streak++;
        checkDate = new Date(entryDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return streak;
}

// Calculate best streak for a habit
export function calculateBestStreak(
  entries: HabitEntry[],
  habitId: string
): number {
  const sorted = [...entries].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let maxStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  for (const entry of sorted) {
    if (entry.completions[habitId]) {
      const entryDate = parseDate(entry.date);
      if (!lastDate) {
        currentStreak = 1;
      } else {
        const dayDiff = Math.floor(
          (entryDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak);
      lastDate = entryDate;
    } else {
      currentStreak = 0;
      lastDate = null;
    }
  }
  return maxStreak;
}

// NEW: Calculate global current streak (any task completed per day)
export function calculateGlobalStreak(entries: HabitEntry[]): number {
  if (entries.length === 0) return 0;
  
  const sorted = entries
    .filter(e => Object.values(e.completions || {}).some(Boolean))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sorted.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let checkDate = new Date(today);
  
  const firstEntryDate = parseDate(sorted[0].date);
  firstEntryDate.setHours(0, 0, 0, 0);
  const initialDiff = Math.floor((today.getTime() - firstEntryDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (initialDiff > 1) return 0;

  for (const entry of sorted) {
    const entryDate = parseDate(entry.date);
    entryDate.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor((checkDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dayDiff === 1) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function saveStreak(
  userId: string,
  habitId: string,
  streak: Streak
): Promise<void> {
  const streakRef = doc(db, 'users', userId, 'streaks', habitId);
  await setDoc(streakRef, streak, { merge: true });
}

export async function getStreak(
  userId: string,
  habitId: string
): Promise<Streak | null> {
  const streakRef = doc(db, 'users', userId, 'streaks', habitId);
  const snapshot = await getDoc(streakRef);
  if (snapshot.exists()) {
    return snapshot.data() as Streak;
  }
  return null;
}
