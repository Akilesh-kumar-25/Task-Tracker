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
  type: 'permanent' | 'temporary' | 'milestone';
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  // New features
  category?: 'active' | 'passive';
  startTime?: string; // "HH:MM"
  endTime?: string;   // "HH:MM"
  mode?: 'default' | 'checklist' | 'notes' | 'hybrid';
  checklistItems?: string[];
  milestoneCompletions?: string[]; // Array of completed item strings
}

export interface HabitEntry {
  date: string; // YYYY-MM-DD format
  userId: string;
  completions: Record<string, boolean>; // habitId -> completed
  completionPercentage: number; // 0-100
  lastUpdated: Date;
  note?: string; // Global note for the day
  
  // New features
  checklistCompletions?: Record<string, Record<string, boolean>>; // habitId -> item -> completed
  notes?: Record<string, string>; // habitId -> notes
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

export interface Todo {
  id: string;
  userId: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date; // New field
  xp?: number;
}

export interface Event {
  id: string;
  userId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "FN", "AN", or "10:00 AM"
  type: 'exam' | 'reminder' | 'other';
  createdAt: Date;
}
