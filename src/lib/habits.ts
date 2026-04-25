import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Habit, HabitEntry } from '@/types';
import { formatDate } from './calendar';

// Get all habits for user
export async function getUserHabits(userId: string): Promise<Habit[]> {
  const habitsRef = collection(db, 'users', userId, 'habits');
  const q = query(habitsRef, orderBy('position', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Habit[];
}

// Create new habit
export async function createHabit(
  userId: string,
  habit: Omit<Habit, 'id' | 'userId' | 'createdAt'>
): Promise<string> {
  const habitsRef = collection(db, 'users', userId, 'habits');

  // Get max position
  const existingHabits = await getUserHabits(userId);
  const maxPosition = Math.max(...existingHabits.map((h) => h.position), -1);

  const newHabitRef = doc(habitsRef);
  const habitData = {
    ...habit,
    userId,
    position: maxPosition + 1,
    createdAt: serverTimestamp(),
  };

  await setDoc(newHabitRef, habitData);
  return newHabitRef.id;
}

// Update habit
export async function updateHabit(
  userId: string,
  habitId: string,
  updates: Partial<Habit>
): Promise<void> {
  const habitRef = doc(db, 'users', userId, 'habits', habitId);
  await updateDoc(habitRef, updates);
}

// Delete habit
export async function deleteHabit(userId: string, habitId: string): Promise<void> {
  const habitRef = doc(db, 'users', userId, 'habits', habitId);
  await deleteDoc(habitRef);
}

// Get habit entry for a specific date
export async function getHabitEntry(
  userId: string,
  dateStr: string
): Promise<HabitEntry | null> {
  const entryRef = doc(db, 'users', userId, 'entries', dateStr);
  const snapshot = await getDoc(entryRef);

  if (snapshot.exists()) {
    return snapshot.data() as HabitEntry;
  }
  return null;
}

// Save or update habit entry
export async function saveHabitEntry(
  userId: string,
  dateStr: string,
  entry: Partial<HabitEntry>
): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', dateStr);
  const data = {
    ...entry,
    date: dateStr,
    userId,
    lastUpdated: serverTimestamp(),
  };

  await setDoc(entryRef, data, { merge: true });
}

// Toggle habit for a specific date
export async function toggleHabitCompletion(
  userId: string,
  dateStr: string,
  habitId: string,
  completed: boolean
): Promise<void> {
  const entry = await getHabitEntry(userId, dateStr) || {
    completions: {},
  };

  const completions: Record<string, boolean> = entry.completions || {};
  completions[habitId] = completed;

  // Calculate completion percentage
  const completedCount = Object.values(completions).filter(Boolean).length;
  const allHabits = await getUserHabits(userId);
  const completionPercentage = allHabits.length > 0 ? Math.round((completedCount / allHabits.length) * 100) : 0;

  await saveHabitEntry(userId, dateStr, {
    completions,
    completionPercentage,
  });
}

// Get entries for a month
export async function getMonthEntries(
  userId: string,
  year: number,
  month: number
): Promise<Record<string, HabitEntry>> {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const snapshot = await getDocs(entriesRef);

  const result: Record<string, HabitEntry> = {};

  snapshot.docs.forEach((doc) => {
    const entry = doc.data() as HabitEntry;
    const [entryYear, entryMonth] = entry.date.split('-').map(Number);

    if (entryYear === year && entryMonth === month + 1) { // month in Date is 0-indexed, but dateStr YYYY-MM-DD uses 1-indexed
      result[entry.date] = entry;
    }
  });

  return result;
}

// Reorder habits
export async function reorderHabits(
  userId: string,
  habitIds: string[]
): Promise<void> {
  const batch = writeBatch(db);

  habitIds.forEach((habitId, index) => {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    batch.update(habitRef, { position: index });
  });

  await batch.commit();
}

// Get total number of unique days with at least one completion
export async function getTotalCompletionDays(userId: string): Promise<number> {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const snapshot = await getDocs(entriesRef);
  
  let totalDays = 0;
  snapshot.docs.forEach((doc) => {
    const entry = doc.data() as HabitEntry;
    if (Object.values(entry.completions || {}).some(Boolean)) {
      totalDays++;
    }
  });
  
  return totalDays;
}
