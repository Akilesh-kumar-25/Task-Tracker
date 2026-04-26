'use client';

import { useState, useEffect, useMemo, memo, useDeferredValue, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Trash2, Clock, Zap, Trophy, Calendar, Info } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown';
import { useAuth } from '@/context/AuthContext';
import { useHabits, useMonthEntries, useAnnualStats } from '@/lib/hooks';
import { formatDate, getDaysInMonth, getMonthName, getDateDiff } from '@/lib/calendar';
import { getQuoteOfDay } from '@/lib/quotes';

// --- PERFORMANCE: Lazy load the entire Charts section ---
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), {
  loading: () => <div className="h-64 w-full bg-gray-100 dark:bg-slate-800 animate-pulse rounded-2xl" />,
  ssr: false
});

const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  loading: () => <div className="p-4 text-xs font-bold animate-pulse text-gray-400">Loading...</div>,
  ssr: false
});

// Memoized Habit Row - Circles, Zero-Lag, and Type Support
const HabitRow = memo(({ habit, days, entries, toggleHabit, deleteHabit, getHabitStats, formatDate, currentYear, currentMonth, hIdx }: any) => {
  const stats = getHabitStats(habit);

  return (
    <tr className={`${hIdx % 2 === 0 ? 'bg-[#f0ebe6] dark:bg-slate-800' : 'bg-[#e9e4df] dark:bg-slate-800/80'} transition-colors duration-150`}>
      <td className="sticky left-0 z-10 border-r border-t border-[#cfc8c0] dark:border-slate-600 bg-inherit p-2 text-left font-medium truncate max-w-[200px]">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-base">{habit.emoji}</span>
            <div className="flex flex-col min-w-0">
              <span className="truncate font-bold text-sm leading-tight flex items-center gap-1">
                {habit.name}
                {habit.type === 'temporary' && <Calendar className="w-2.5 h-2.5 text-[#8b7f74]" />}
              </span>
              {habit.type === 'temporary' && (
                <span className="text-[8px] opacity-40 truncate">{habit.startDate} to {habit.endDate}</span>
              )}
            </div>
          </div>
          <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-rose-500 hover:scale-110 transition-all"><Trash2 className="w-3 h-3" /></button>
        </div>
      </td>
      {days.map((day: number) => {
        const currentDate = new Date(currentYear, currentMonth, day);
        const dateStr = formatDate(currentDate);
        const isCompleted = entries[dateStr]?.completions[habit.id] || false;
        const isToday = new Date().toDateString() === currentDate.toDateString();

        // Disabled logic for temporary habits
        let isDisabled = !isToday;
        if (habit.type === 'temporary') {
          const start = new Date(habit.startDate);
          const end = new Date(habit.endDate);
          currentDate.setHours(0, 0, 0, 0);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);
          if (currentDate < start || currentDate > end) isDisabled = true;
        }

        return (
          <td key={day} className={`border-r border-t border-[#cfc8c0] dark:border-slate-600 p-0 ${isToday ? 'bg-[#8b7f74]/5' : ''}`}>
            <button disabled={isDisabled} onClick={() => toggleHabit(dateStr, habit.id, !isCompleted)} className={`w-full h-8 flex items-center justify-center transition-colors ${isDisabled ? 'opacity-10' : 'hover:bg-white/30'}`}>
              {isCompleted ? <div className="w-3 h-3 bg-[#8b7f74] rounded-full shadow-sm animate-in zoom-in-50 duration-200"></div> : <div className="w-3 h-3 border border-gray-400 rounded-full"></div>}
            </button>
          </td>
        );
      })}
      <td className="border-r border-t border-[#cfc8c0] font-bold text-[#8b7f74] text-center">{stats.goal}</td>
      <td className="border-r border-t border-[#cfc8c0] font-bold text-[#5c544d] text-center">{stats.actual}</td>
      <td className="border-r border-t border-[#cfc8c0] font-bold text-[#a39a92] text-center">{stats.left}</td>
      <td className="border-t border-[#cfc8c0] p-1"><div className="h-2 w-full bg-gray-300 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-[#d1c7bc] to-[#8b7f74] transition-all duration-700" style={{ width: `${stats.progress}%` }}></div></div></td>
    </tr>
  );
});

HabitRow.displayName = 'HabitRow';

export default function MegaDashboard() {
  const { habits, addHabit, deleteHabit } = useHabits();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { entries, toggleHabit } = useMonthEntries(currentYear, currentMonth);
  const { completionDays, streak } = useAnnualStats();

  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '', emoji: '📝', type: 'permanent' as 'permanent' | 'temporary',
    startDate: formatDate(new Date()), endDate: formatDate(new Date())
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Keyboard listeners for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddingHabit(false);
        setShowFullReport(false);
      }
      if (e.key === 'Enter' && isAddingHabit && newHabit.name.trim()) {
        addHabit(newHabit.name, newHabit.emoji, newHabit.type, newHabit.startDate, newHabit.endDate);
        setNewHabit({ name: '', emoji: '📝', type: 'permanent', startDate: formatDate(new Date()), endDate: formatDate(new Date()) });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddingHabit, newHabit, showFullReport]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const deferredEntries = useDeferredValue(entries);

  const monthPercent = useMemo(() => {
    const totalPossible = daysInMonth * habits.length;
    if (totalPossible === 0) return 0;
    const completed = Object.values(deferredEntries).reduce((sum, entry) => sum + Object.values(entry.completions).filter(Boolean).length, 0);
    return (completed / totalPossible) * 100;
  }, [deferredEntries, habits.length, daysInMonth]);

  const dailyData = useMemo(() => days.map(day => {
    const dateStr = formatDate(new Date(currentYear, currentMonth, day));
    const entry = deferredEntries[dateStr];
    const completed = habits.filter(h => entry?.completions[h.id]).length;
    return {
      day: `Day ${day}`,
      completed,
      pending: Math.max(0, habits.length - completed),
      percentage: habits.length > 0 ? Number(((completed / habits.length) * 100).toFixed(2)) : 0
    };
  }), [days, currentYear, currentMonth, deferredEntries, habits]);

  const getHabitStats = useCallback((habit: any) => {
    const actual = Object.values(entries).filter(e => e.completions[habit.id]).length;
    let goal = daysInMonth;
    if (habit.type === 'temporary' && habit.startDate && habit.endDate) {
      goal = getDateDiff(habit.startDate, habit.endDate);
    }
    const progress = Number(((actual / goal) * 100).toFixed(2));
    return { goal, actual, left: Math.max(0, goal - actual), progress };
  }, [entries, daysInMonth]);

  const todayStr = formatDate(new Date());
  const todayEntry = entries[todayStr];
  const todayCompleted = habits.filter(h => todayEntry?.completions[h.id]).length;
  const todayProgress = habits.length > 0 ? Number(((todayCompleted / habits.length) * 100).toFixed(2)) : 0;

  const topHabits = useMemo(() => {
    return habits
      .map(h => ({ ...h, stats: getHabitStats(h) }))
      .sort((a, b) => b.stats.progress - a.stats.progress)
      .slice(0, 10);
  }, [habits, entries, daysInMonth, getHabitStats]);

  const gridWeeks = useMemo(() => {
    const res: { name: string, days: number[] }[] = [];
    let currentGridWeek = { name: 'Week 1', days: [] as number[] };
    days.forEach(day => {
      currentGridWeek.days.push(day);
      if (currentGridWeek.days.length === 7 || day === daysInMonth) {
        res.push(currentGridWeek);
        currentGridWeek = { name: `Week ${res.length + 1}`, days: [] };
      }
    });
    return res;
  }, [days, daysInMonth]);

  const handleAddHabit = () => {
    if (newHabit.name.trim()) {
      addHabit(newHabit.name, newHabit.emoji, newHabit.type, newHabit.startDate, newHabit.endDate);
      setNewHabit({
        name: '', emoji: '📝', type: 'permanent',
        startDate: formatDate(new Date()), endDate: formatDate(new Date())
      });
      setIsAddingHabit(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#f0ebe6] dark:bg-slate-900" />;

  return (
    <div className="flex flex-col gap-6 bg-[#fcfaf9] dark:bg-slate-950 min-h-screen p-4 md:p-8 lg:p-12 pb-20 font-sans text-[#5c544d] dark:text-slate-200">

      {/* Add Habit Modal - Extended for Type support */}
      {isAddingHabit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-800 border border-white/20">
            <h2 className="text-2xl font-heading italic text-[#5c544d] dark:text-white mb-6">Create New Habit</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-20 relative">
                  <label className="block text-[10px] font-black text-[#8b7f74] mb-1 uppercase tracking-widest">Icon</label>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-full h-14 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-2xl hover:bg-white transition-all shadow-sm">{newHabit.emoji}</button>
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-3 z-[110] shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                      <EmojiPicker onEmojiClick={(e) => { setNewHabit({ ...newHabit, emoji: e.emoji }); setShowEmojiPicker(false); }} width={300} height={400} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-[#8b7f74] mb-1 uppercase tracking-widest">Habit Name</label>
                  <input type="text" placeholder="e.g. Morning Yoga" className="w-full h-14 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 px-4 outline-none focus:ring-2 ring-[#8b7f74]/20 transition-all text-sm font-bold" value={newHabit.name} onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })} autoFocus />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-[#8b7f74] uppercase tracking-widest">Habit Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setNewHabit({ ...newHabit, type: 'permanent' })} className={`h-12 rounded-2xl border transition-all text-xs font-bold flex flex-col items-center justify-center ${newHabit.type === 'permanent' ? 'bg-[#5c544d] text-white border-transparent' : 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-700'}`}>
                    <span>Permanent</span>
                    <span className="text-[8px] opacity-60">Forever tracking</span>
                  </button>
                  <button onClick={() => setNewHabit({ ...newHabit, type: 'temporary' })} className={`h-12 rounded-2xl border transition-all text-xs font-bold flex flex-col items-center justify-center ${newHabit.type === 'temporary' ? 'bg-[#5c544d] text-white border-transparent' : 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-700'}`}>
                    <span>Temporary</span>
                    <span className="text-[8px] opacity-60">Specific range</span>
                  </button>
                </div>
              </div>

              {newHabit.type === 'temporary' && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-[10px] font-black text-[#8b7f74] mb-1 uppercase tracking-widest">Starts From</label>
                    <input type="date" className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 px-3 text-xs font-bold outline-none" value={newHabit.startDate} onChange={(e) => setNewHabit({ ...newHabit, startDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#8b7f74] mb-1 uppercase tracking-widest">Ends At</label>
                    <input type="date" className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 px-3 text-xs font-bold outline-none" value={newHabit.endDate} onChange={(e) => setNewHabit({ ...newHabit, endDate: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsAddingHabit(false)} className="flex-1 h-12 rounded-2xl bg-gray-100 dark:bg-slate-700 text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all">Cancel</button>
                <button
                  onClick={() => {
                    if (!newHabit.name.trim()) return;
                    addHabit(newHabit.name, newHabit.emoji, newHabit.type, newHabit.startDate, newHabit.endDate);
                    setNewHabit({ name: '', emoji: '📝', type: 'permanent', startDate: formatDate(new Date()), endDate: formatDate(new Date()) });
                  }}
                  disabled={!newHabit.name.trim()}
                  className="flex-[2] h-12 rounded-2xl bg-white border-2 border-[#5c544d] text-sm font-bold text-[#5c544d] hover:bg-[#5c544d] hover:text-white disabled:opacity-40 transition-all"
                >
                  Save &amp; Add Habit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP CONTROLS & HEADER */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-[#5c544d] dark:text-white tracking-tighter">Mastery</h1>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#8b7f74] opacity-60">Elite Human Performance Tracker</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAddingHabit(true)} 
              className="flex items-center gap-2 bg-[#5c544d] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95 group/add"
            >
              <Plus size={14} className="group-hover/add:rotate-90 transition-transform duration-300" />
              <span>New Habit</span>
            </button>
            <div className="flex gap-2">
              <select value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))} className="p-2 bg-white/60 dark:bg-slate-800 rounded-xl text-[10px] font-bold outline-none border-none shadow-sm">{[2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}</select>
              <select value={currentMonth} onChange={(e) => setCurrentMonth(Number(e.target.value))} className="p-2 bg-white/60 dark:bg-slate-800 rounded-xl text-[10px] font-bold outline-none border-none shadow-sm">{Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{getMonthName(i)}</option>)}</select>
            </div>
          </div>
        </div>

        <DashboardCharts dailyData={dailyData} streak={streak} monthPercent={monthPercent} completionDays={completionDays} totalHabits={habits.length} />
      </div>

      {/* THE GRID SECTION - Circles & Zero-Lag */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[32px] shadow-2xl overflow-x-auto border border-white dark:border-slate-800 scrollbar-thin scrollbar-thumb-[#8b7f74]/20">
        <table className="w-full text-[10px] border-collapse min-w-[1000px]">
          <thead className="bg-[#fcfaf9]/80 dark:bg-slate-900 sticky top-0 z-20">
            <tr className="text-[#8b7f74] dark:text-slate-400">
              <th rowSpan={2} className="sticky left-0 z-30 bg-[#fcfaf9] dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 p-4 text-left w-44">
                <div className="flex items-center justify-between">
                  <span className="font-heading italic text-xl text-[#5c544d] dark:text-white">Habits</span>
                  <button onClick={() => setIsAddingHabit(true)} className="p-1 rounded-lg bg-[#5c544d] text-white hover:scale-110 transition-all shadow-md active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </th>
              {gridWeeks.map((week, idx) => <th key={idx} colSpan={week.days.length} className="border-r border-b border-white/50 p-1 text-[8px] uppercase tracking-widest font-black opacity-60">{week.name}</th>)}
              <th colSpan={4} className="bg-[#8b7f74] text-white p-1 text-[8px] border-b border-[#8b7f74] font-black uppercase tracking-widest">Mastery Metrics</th>
            </tr>
            <tr className="bg-[#e0d9d2]/50 dark:bg-slate-700 text-[#5c544d] dark:text-slate-300">
              {days.map(day => <th key={day} className="w-8 border-r border-white/50 p-1 font-bold">{day}</th>)}
              <th className="w-10 border-r border-white/50">Goal</th><th className="w-10 border-r border-white/50">Act.</th><th className="w-10 border-r border-white/50">Left</th><th className="w-20">Progress</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit, hIdx) => (
              <HabitRow key={habit.id} habit={habit} days={days} entries={entries} toggleHabit={toggleHabit} deleteHabit={deleteHabit} getHabitStats={getHabitStats} formatDate={formatDate} currentYear={currentYear} currentMonth={currentMonth} hIdx={hIdx} />
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER INSIGHTS SECTION - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">

        {/* LEFT COLUMN: Focus Center & Today's Momentum */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#5c544d] p-2 rounded-xl shadow-lg">
              <Zap className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-heading italic text-[#5c544d] dark:text-white">Focus Center</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74] opacity-60">Today's Live Momentum</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[32px] md:rounded-[48px] p-8 md:p-12 shadow-2xl border border-white dark:border-slate-700 flex flex-col md:flex-row items-center gap-8 md:gap-16 relative overflow-hidden">
            {todayProgress === 100 && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#5c544d] to-[#8b7f74] z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Trophy size={160} /></div>
                <div className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white mb-4">Mastery Achieved</div>
                <h3 className="text-3xl font-heading italic text-white mb-6">" {getQuoteOfDay()} "</h3>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">100% Complete • See you tomorrow</p>
                <div className="mt-8 flex gap-2">
                  {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
                </div>
              </div>
            )}

            <div className="relative w-40 h-40 flex-shrink-0 group">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-[#f0ebe6] dark:text-slate-900" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={439.8} strokeDashoffset={439.8 - (439.8 * todayProgress) / 100} className="text-[#8b7f74] transition-all duration-1000" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-heading italic text-[#5c544d] dark:text-white">{todayProgress.toFixed(0)}%</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-[#8b7f74]">Today</span>
              </div>
            </div>

            <div className="flex-1 space-y-8 w-full text-center md:text-left">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74] mb-2">Current Status</h4>
                <p className={`text-xl font-black uppercase tracking-tighter ${
                  streak < 3 ? 'text-slate-400' : 
                  streak < 7 ? 'text-amber-700' : 
                  streak < 15 ? 'text-slate-300' : 
                  streak < 30 ? 'text-yellow-500' : 
                  streak < 50 ? 'text-cyan-400' : 
                  streak < 80 ? 'text-blue-400' : 
                  streak < 120 ? 'text-emerald-400' : 
                  streak < 200 ? 'text-rose-500' : 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]'
                }`}>
                  {streak < 3 ? 'Iron' : 
                   streak < 7 ? 'Bronze' : 
                   streak < 15 ? 'Silver' : 
                   streak < 30 ? 'Gold' : 
                   streak < 50 ? 'Platinum' : 
                   streak < 80 ? 'Diamond' : 
                   streak < 120 ? 'Ascendant' : 
                   streak < 200 ? 'Immortal' : 'Radiant'}
                </p>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden mt-2">
                  <div className={`h-full transition-all duration-1000 ${
                    streak < 3 ? 'bg-slate-400' : 
                    streak < 7 ? 'bg-amber-700' : 
                    streak < 15 ? 'bg-slate-300' : 
                    streak < 30 ? 'bg-yellow-500' : 
                    streak < 50 ? 'bg-cyan-400' : 
                    streak < 80 ? 'bg-blue-400' : 
                    streak < 120 ? 'bg-emerald-400' : 
                    streak < 200 ? 'bg-rose-500' : 'bg-yellow-300'
                  }`} style={{ 
                    width: `${streak < 3 ? (streak/3)*100 : 
                            streak < 7 ? ((streak-3)/4)*100 : 
                            streak < 15 ? ((streak-7)/8)*100 : 
                            streak < 30 ? ((streak-15)/15)*100 : 
                            streak < 50 ? ((streak-30)/20)*100 : 
                            streak < 80 ? ((streak-50)/30)*100 : 
                            streak < 120 ? ((streak-80)/40)*100 : 
                            streak < 200 ? ((streak-120)/80)*100 : 100}%` 
                  }} />
                </div>
                <p className="text-xl font-bold text-[#5c544d] dark:text-white leading-tight mt-3">
                  You've completed <span className="text-[#8b7f74]">{todayCompleted}</span> out of <span className="opacity-40">{habits.length}</span> habits for today.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#8b7f74]">
                  <span>Annual Milestone</span>
                  <span>Day {completionDays} / 365</span>
                </div>
                <div className="h-3 w-full bg-[#f0ebe6] dark:bg-slate-900 rounded-full overflow-hidden shadow-inner border border-white/50">
                  <div className="h-full bg-gradient-to-r from-[#d1c7bc] to-[#5c544d] transition-all duration-1000" style={{ width: `${(completionDays / 365) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

            {/* NEW STANDALONE SECTION: Visual Mastery Map */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-2xl border border-white dark:border-slate-700 flex flex-col gap-6 md:gap-8 group">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                <div>
                  <h3 className="text-xl md:text-2xl font-heading italic text-[#5c544d] dark:text-white">Visual Mastery Map</h3>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#8b7f74] opacity-60">Monthly Performance Density</p>
                </div>
                <div className="flex gap-1 bg-gray-50 dark:bg-slate-900 p-2 rounded-xl">
                  {[0.2, 0.4, 0.6, 0.8, 1].map(op => <div key={op} className="w-2 h-2 md:w-3 md:h-3 rounded-sm bg-[#5c544d]" style={{ opacity: op }} />)}
                </div>
              </div>

              <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-7 xl:grid-cols-10 gap-2 justify-center">
                {dailyData.map((data, i) => {
                  const intensity = data.percentage / 100;
                  return (
                    <div key={i} className="relative group/day">
                      <div
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl border border-white/50 dark:border-slate-700 shadow-sm transition-all duration-500 hover:scale-125 hover:z-10 cursor-help flex items-center justify-center text-[8px] md:text-[10px] font-black ${intensity > 0.5 ? 'text-white' : 'text-[#8b7f74]'}`}
                        style={{
                          backgroundColor: '#5c544d',
                          opacity: intensity === 0 ? 0.05 : 0.1 + (intensity * 0.9)
                        }}
                      >
                        {i + 1}
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#5c544d] text-white text-[8px] md:text-[10px] font-bold rounded-lg opacity-0 group-hover/day:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-xl">
                        Day {i + 1}: {data.percentage.toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center pt-6 md:pt-8 border-t border-[#d1c7bc]/30 gap-4">
                <p className="text-[10px] md:text-xs font-black text-[#8b7f74] uppercase tracking-widest text-center sm:text-left">
                  Current Momentum: <span className="text-[#5c544d] dark:text-white">{Math.round(monthPercent)}% Consistency</span>
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black text-[#8b7f74] uppercase tracking-widest italic opacity-40">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5c544d] animate-pulse" />
                  Live Intelligence
                </div>
              </div>
            </div>

          {/* NEW STANDALONE SECTION: Elite Performance Insights */}
          <div className="bg-[#5c544d] rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-8 opacity-10 rotate-12"><Zap size={120} className="text-white" /></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-lg font-heading italic text-white">Elite Performance Insights</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Strategic Data Points</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-white border border-white/10 uppercase">
                  Current Status: Active
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Peak Performance Day</span>
                  <p className="text-2xl font-heading italic text-white">
                    Day {dailyData.reduce((prev, current) => (prev.percentage > current.percentage) ? prev : current).day.split(' ')[1]}
                  </p>
                  <p className="text-[9px] font-bold text-white/60">Highest completion density recorded this month.</p>
                </div>
                <div className="space-y-2 text-right">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Mastery Momentum</span>
                  <p className="text-2xl font-heading italic text-white">{monthPercent > 50 ? 'RISING' : 'STABLE'}</p>
                  <div className="flex justify-end gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`w-1 h-3 rounded-full ${i <= (monthPercent / 20) ? 'bg-white' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-black text-xs">
                    {Math.round(completionDays / 10)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Mastery Level Progress</p>
                    <p className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Keep maintaining 100% to rank up.</p>
                  </div>
                </div>
                <button onClick={() => setShowFullReport(true)} className="bg-white text-[#5c544d] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg">VIEW FULL REPORT</button>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: FULL PERFORMANCE REPORT OVERLAY */}
        {showFullReport && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-[#5c544d]/90 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowFullReport(false)} />

            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 border border-white/20">
              {/* Header */}
              <div className="p-8 md:p-12 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-[#fcfaf9] dark:bg-slate-900/50">
                <div>
                  <h2 className="text-4xl font-heading italic text-[#5c544d] dark:text-white mb-2">Mastery Intelligence Report</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8b7f74]">Strategic Analysis • Confidental</p>
                </div>
                <button onClick={() => setShowFullReport(false)} className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center hover:rotate-90 transition-all duration-300">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Mastery Grade */}
                  <div className="bg-[#5c544d] rounded-3xl p-10 text-center text-white relative overflow-hidden group flex flex-col justify-center">
                    <div className="absolute -right-4 -top-4 opacity-10 rotate-12"><Trophy size={100} /></div>
                    <span className="text-xs font-black uppercase tracking-widest opacity-40 mb-6 block">Mastery Grade</span>
                    <div className="text-8xl font-heading italic mb-4">
                      {monthPercent >= 90 ? 'A+' : monthPercent >= 75 ? 'A' : monthPercent >= 50 ? 'B' : 'C'}
                    </div>
                    <p className="text-xl font-bold text-white mb-4">
                      {monthPercent >= 90 ? 'Absolute Mastery' :
                        monthPercent >= 75 ? 'Outstanding Consistency' :
                          monthPercent >= 50 ? 'Solid Performance' : 'Critical Attention Required'}
                    </p>
                    <p className="text-xs font-medium text-white/60 leading-relaxed max-w-[200px] mx-auto">
                      {monthPercent >= 90 ? 'You are in the top 0.1% of elite performers. A true master.' :
                        monthPercent >= 75 ? 'Legendary status is within reach. Maintain this momentum.' :
                          monthPercent >= 50 ? 'Strong roots, but there is still room for elite growth.' :
                            'Your discipline is slipping. Reclaim your mastery before it’s too late.'}
                    </p>
                  </div>

                  {/* Insights */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[32px] border border-gray-100 dark:border-slate-700 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600 shadow-sm"><Trophy size={20} /></div>
                          <span className="text-xs font-black uppercase tracking-widest text-[#8b7f74]">Lifetime Mastery</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-5xl font-heading italic text-[#5c544d] dark:text-white">{completionDays} <span className="text-sm not-italic opacity-40">Days</span></p>
                          <p className="text-xs font-black text-[#8b7f74] uppercase tracking-[0.2em] leading-none">Total Mastered Milestones</p>
                        </div>
                      </div>

                      {/* NEW: Mastery Badges Unlocked */}
                      <div className="mt-8 grid grid-cols-5 gap-2">
                        {[
                          { days: 0, label: 'Iron', icon: '🔘' },
                          { days: 50, label: 'Silver', icon: '🥈' },
                          { days: 90, label: 'Gold', icon: '🟡' },
                          { days: 200, label: 'Diamond', icon: '💎' },
                          { days: 365, label: 'Radiant', icon: '✨' }
                        ].map(badge => (
                          <div key={badge.days} className={`flex flex-col items-center gap-1 ${completionDays < badge.days ? 'opacity-20 grayscale' : 'opacity-100'}`}>
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-lg">{badge.icon}</div>
                            <span className="text-[8px] font-black uppercase tracking-tighter text-[#8b7f74]">{badge.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800">
                        <p className="text-sm font-bold text-[#5c544d] dark:text-white italic leading-relaxed">
                          "{completionDays < 10 ? 'Every legend starts with a single day.' :
                            completionDays < 50 ? 'You are building a powerful legacy.' :
                              'Your mastery is becoming permanent.'}"
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[32px] border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm"><Clock size={20} /></div>
                        <span className="text-xs font-black uppercase tracking-widest text-[#8b7f74]">Focus Needed</span>
                      </div>
                      <div className="space-y-3">
                        {habits
                          .map(h => ({ ...h, score: habits.length > 0 ? (Object.values(entries).filter(e => e.completions[h.id]).length / Object.keys(entries).length) * 100 : 0 }))
                          .sort((a, b) => a.score - b.score)
                          .slice(0, 5)
                          .map((h, i) => (
                            <div key={h.id} className="flex justify-between items-center bg-white/80 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm group/item hover:border-rose-200 transition-all">
                              <span className="text-sm font-bold text-[#5c544d] dark:text-white truncate pr-4">{h.emoji} {h.name}</span>
                              <span className="text-xs font-black text-rose-500 uppercase">{Math.round(h.score)}%</span>
                            </div>
                          ))}
                      </div>
                      <p className="text-[10px] font-black text-[#8b7f74] uppercase tracking-widest mt-6 opacity-40">Precision focus required in these 5 areas.</p>
                    </div>
                  </div>
                </div>

                {/* Performance Timeline Breakdown */}
                <div className="space-y-8">
                  <h3 className="text-2xl font-heading italic text-[#5c544d] dark:text-white">Mastery Timeline Distribution</h3>
                  <div className="flex h-16 w-full rounded-[24px] overflow-hidden shadow-2xl bg-gray-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700">
                    <div className="bg-[#5c544d] h-full transition-all duration-1000 relative group" style={{ width: `${monthPercent}%` }}>
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="bg-[#8b7f74] h-full opacity-20 transition-all duration-1000" style={{ width: `${100 - monthPercent}%` }} />
                  </div>
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-[#8b7f74]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#5c544d] shadow-sm" />
                      <span>{Math.round(monthPercent)}% Perfect Mastery Achieved</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#8b7f74] opacity-20" />
                      <span>{Math.round(100 - monthPercent)}% Strategic Growth Potential</span>
                    </div>
                  </div>
                </div>

                {/* NEW: Strategic Path & Forecast */}
                <div className="bg-[#fcfaf9] dark:bg-slate-800/20 p-10 rounded-[40px] border border-gray-100 dark:border-slate-800 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-heading italic text-[#5c544d] dark:text-white mb-1">The Mastery Path</h3>
                      <p className="text-xs font-black uppercase tracking-widest text-[#8b7f74] opacity-60">Strategic Forecast & Projections</p>
                    </div>
                    <div className="bg-[#5c544d] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Phase: {completionDays < 50 ? 'Foundation' : 'Domination'}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-[#8b7f74] uppercase tracking-widest">Growth Trajectory</span>
                      <p className="text-sm font-bold text-[#5c544d] dark:text-white leading-relaxed">
                        Based on your current momentum of <span className="text-[#8b7f74]">{Math.round(monthPercent)}%</span>, you are projected to reach the <span className="text-[#5c544d] dark:text-white italic">
                          "{completionDays < 10 ? 'Bronze' : 
                            completionDays < 25 ? 'Silver' : 
                            completionDays < 50 ? 'Gold' : 
                            completionDays < 90 ? 'Platinum' : 
                            completionDays < 140 ? 'Diamond' : 
                            completionDays < 200 ? 'Ascendant' : 
                            completionDays < 270 ? 'Immortal' : 'Radiant'}"
                        </span> within the next <span className="text-[#8b7f74]">
                          {completionDays < 10 ? 10 - completionDays : 
                           completionDays < 25 ? 25 - completionDays : 
                           completionDays < 50 ? 50 - completionDays : 
                           completionDays < 90 ? 90 - completionDays : 
                           completionDays < 140 ? 140 - completionDays : 
                           completionDays < 200 ? 200 - completionDays : 
                           completionDays < 270 ? 270 - completionDays : 
                           completionDays < 330 ? 330 - completionDays : 0} days
                        </span>.
                      </p>
                      <div className="h-2 w-full bg-gray-100 dark:bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-[#5c544d] transition-all" style={{ 
                          width: `${completionDays < 10 ? (completionDays/10)*100 : 
                                  completionDays < 25 ? ((completionDays-10)/15)*100 : 
                                  completionDays < 50 ? ((completionDays-25)/25)*100 : 
                                  completionDays < 90 ? ((completionDays-50)/40)*100 : 
                                  completionDays < 140 ? ((completionDays-90)/50)*100 : 
                                  completionDays < 200 ? ((completionDays-140)/60)*100 : 
                                  completionDays < 270 ? ((completionDays-200)/70)*100 : 
                                  completionDays < 330 ? ((completionDays-270)/60)*100 : 100}%` 
                        }} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <span className="text-xs font-black text-[#8b7f74] uppercase tracking-widest">Mastery Velocity</span>
                      <div className="flex items-end gap-1 h-12">
                        {[0.3, 0.5, 0.8, 0.4, 0.9, 0.6, 0.8].map((h, i) => (
                          <div key={i} className="flex-1 bg-[#d1c7bc] rounded-t-sm" style={{ height: `${h * 100}%`, opacity: 0.2 + (h * 0.8) }} />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-[#8b7f74] uppercase tracking-widest">Consistency is stabilizing at elite levels.</p>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-center">
                    <div className="text-center bg-[#5c544d] text-white px-16 py-8 rounded-[32px] shadow-xl hover:scale-105 transition-all">
                      <p className="text-6xl font-heading italic mb-2">{365 - completionDays}</p>
                      <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Days Remaining to Year Mastery</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="p-8 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-center">
                <button onClick={() => setShowFullReport(false)} className="bg-[#5c544d] text-white px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">Close Intelligence Briefing</button>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Top 10 Habits Leaderboard */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#5c544d] p-2 rounded-xl shadow-lg">
              <Trophy className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-heading italic text-[#5c544d] dark:text-white">Performance Elite</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74] opacity-60">Global Rankings</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[32px] p-6 shadow-2xl border border-white dark:border-slate-700 overflow-hidden">
            <div className="space-y-4">
              {topHabits.map((h, i) => (
                <div key={h.id} className="flex items-center gap-4 p-4 bg-[#f0ebe6]/40 dark:bg-slate-900/30 rounded-2xl border border-[#d1c7bc]/10 hover:border-[#8b7f74]/30 transition-all group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${i < 3 ? 'bg-[#5c544d] text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{h.emoji}</span>
                      <span className="font-bold text-sm text-[#5c544d] dark:text-white truncate">{h.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#5c544d] dark:text-white">{h.stats.progress.toFixed(2)}%</div>
                    <div className="h-1.5 w-20 bg-gray-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-[#8b7f74]" style={{ width: `${h.stats.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {topHabits.length === 0 && (
                <div className="py-20 text-center text-[10px] font-bold text-[#8b7f74] uppercase tracking-widest opacity-40">
                  No habits ranked yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
