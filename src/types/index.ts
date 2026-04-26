export interface User {
  uid: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: Date;
  archived: boolean;
  position: number;
  type: 'permanent' | 'temporary';
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface HabitEntry {
  date: string; // YYYY-MM-DD format
  userId: string;
  completions: Record<string, boolean>; // habitId -> completed
  completionPercentage: number; // 0-100
  lastUpdated: Date;
  note?: string;
}

export interface Streak {
  habitId: string;
  current: number;
  best: number;
  lastBrokenDate?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  fiscalYearStart: number; // 1-12 (month)
  timezone: string;
  accentColor: string;
}
