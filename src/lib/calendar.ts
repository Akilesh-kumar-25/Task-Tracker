/**
 * Calendar utilities for fiscal year (April 1 - March 31)
 */

// Get fiscal year start date (April 1)
export function getFiscalYearStart(date: Date = new Date()): Date {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();

  if (month >= 4) {
    // April onwards: fiscal year starts this year (April)
    return new Date(year, 3, 1); // Month is 0-indexed
  } else {
    // Before April: fiscal year started last year
    return new Date(year - 1, 3, 1);
  }
}

// Get current fiscal year (e.g., "FY 2025-26")
export function getFiscalYearLabel(date: Date = new Date()): string {
  const start = getFiscalYearStart(date);
  const end = new Date(start.getFullYear() + 1, 2, 31); // March 31 next year
  return `FY ${start.getFullYear()}-${end.getFullYear()}`;
}

// Get all dates in current fiscal year
export function getFiscalYearDates(date: Date = new Date()): Date[] {
  const start = getFiscalYearStart(date);
  const end = new Date(start.getFullYear() + 1, 2, 31); // March 31 next year
  const dates: Date[] = [];

  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Get days in a specific month (within fiscal year context)
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse date string YYYY-MM-DD
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Get month name
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month];
}

// Get month and year for display (April 2025)
export function getMonthYearLabel(year: number, month: number): string {
  return `${getMonthName(month)} ${year}`;
}

// Check if date is in future
export function isDateInFuture(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date > today;
}

// Check if date is weekend
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Get number of days between two date strings (inclusive)
export function getDateDiff(startStr: string, endStr: string): number {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Get week day name (Mon, Tue, etc.)
export function getDayName(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}
