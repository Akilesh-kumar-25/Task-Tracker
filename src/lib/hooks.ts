'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from './db';
import { User, Habit, HabitEntry } from '@/types';
import {
  getUserHabits,
  getMonthEntries,
  toggleHabitCompletion as toggleHabitAPI,
  createHabit as createHabitAPI,
  updateHabit as updateHabitAPI,
  deleteHabit as deleteHabitAPI,
  getTotalCompletionDays,
} from './habits';
import { getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { calculateCurrentStreak, calculateBestStreak, calculateGlobalStreak } from './streaks';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(user.uid);
        setProfile(data);
        setError(null);
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading, error };
}

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Load from cache first
    const cached = localStorage.getItem(`habits_${user.uid}`);
    if (cached) {
      setHabits(JSON.parse(cached));
      setLoading(false);
    }

    const fetchHabits = async () => {
      try {
        const data = await getUserHabits(user.uid);
        setHabits(data);
        localStorage.setItem(`habits_${user.uid}`, JSON.stringify(data));
        setError(null);
      } catch (err) {
        setError('Failed to load habits');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, [user]);

  const addHabit = useCallback(
    async (name: string, emoji: string, type: 'permanent' | 'temporary' = 'permanent', startDate?: string, endDate?: string) => {
      if (!user) return;
      try {
        const id = await createHabitAPI(user.uid, {
          name,
          emoji,
          type,
          startDate,
          endDate,
          color: '#10B981',
          archived: false,
          position: habits.length,
        });
        const newHabit: Habit = {
          id, userId: user.uid, name, emoji, color: '#10B981',
          archived: false, position: habits.length, createdAt: new Date(),
          type, startDate, endDate
        };
        setHabits([...habits, newHabit]);
        return id;
      } catch (err) {
        setError('Failed to add habit');
        console.error(err);
      }
    },
    [user, habits]
  );

  const updateHabit = useCallback(
    async (habitId: string, updates: Partial<Habit>) => {
      if (!user) return;
      try {
        await updateHabitAPI(user.uid, habitId, updates);
        setHabits(habits.map((h) => (h.id === habitId ? { ...h, ...updates } : h)));
      } catch (err) {
        setError('Failed to update habit');
        console.error(err);
      }
    },
    [user, habits]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      if (!user) return;
      try {
        await deleteHabitAPI(user.uid, habitId);
        setHabits(habits.filter((h) => h.id !== habitId));
      } catch (err) {
        setError('Failed to delete habit');
        console.error(err);
      }
    },
    [user, habits]
  );

  return { habits, loading, error, addHabit, updateHabit, deleteHabit };
}

export function useMonthEntries(year: number, month: number) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Record<string, HabitEntry>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const cacheKey = `entries_${user.uid}_${year}_${month}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setEntries(JSON.parse(cached));
      setLoading(false);
    }

    const fetchEntries = async () => {
      try {
        const data = await getMonthEntries(user.uid, year, month);
        setEntries(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        setError(null);
      } catch (err) {
        setError('Failed to load entries');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user, year, month]);

  const toggleHabit = useCallback(
    async (dateStr: string, habitId: string, completed: boolean) => {
      if (!user) return;
      try {
        await toggleHabitAPI(user.uid, dateStr, habitId, completed);
        setEntries((prev) => ({
          ...prev,
          [dateStr]: {
            ...prev[dateStr],
            completions: { ...prev[dateStr]?.completions, [habitId]: completed },
          } as HabitEntry,
        }));
      } catch (err) {
        setError('Failed to update habit');
        console.error(err);
      }
    },
    [user]
  );

  const getStreaks = useCallback(async (habitId: string) => {
    if (!user) return { current: 0, best: 0 };
    try {
      const allEntriesSnapshot = await getDocs(collection(db, 'users', user.uid, 'entries'));
      const allEntries = allEntriesSnapshot.docs.map(doc => doc.data() as HabitEntry);
      return { current: calculateCurrentStreak(allEntries, habitId), best: calculateBestStreak(allEntries, habitId) };
    } catch (err) {
      console.error('Failed to get streaks', err);
      return { current: 0, best: 0 };
    }
  }, [user]);

  return { entries, loading, error, toggleHabit, getStreaks };
}

export function useAnnualStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ completionDays: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const count = await getTotalCompletionDays(user.uid);
        const entriesRef = collection(db, 'users', user.uid, 'entries');
        const streakQuery = query(entriesRef, orderBy('date', 'desc'), limit(10));
        const snapshot = await getDocs(streakQuery);
        const recentEntries = snapshot.docs.map(doc => doc.data() as HabitEntry);
        const streak = calculateGlobalStreak(recentEntries);
        setStats({ completionDays: count, streak });
      } catch (err) {
        console.error('Stats Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(() => setLoading(false), 3000);
    fetchStats();
    return () => clearTimeout(timeout);
  }, [user]);

  return { ...stats, loading };
}
