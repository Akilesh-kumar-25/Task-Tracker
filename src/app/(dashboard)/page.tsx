'use client';

import { useState, useEffect, useMemo, memo, useDeferredValue, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Trash2, Clock, Zap, Trophy, Calendar, Info, Maximize2, X, MoreHorizontal, LayoutDashboard, Target, GraduationCap, BarChart3, History as HistoryIcon, User, Sparkles, Edit3, Archive, RefreshCw, Check } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown';
import TaskDetailModal from '@/components/TaskDetailModal';
import MilestoneModal from '@/components/MilestoneModal';
import ActionCenter from '@/components/ActionCenter';
import AIAgentWidget from '@/components/AIAgentWidget';
import { useAuth } from '@/context/AuthContext';
import { useHabits, useMonthEntries, useAnnualStats } from '@/lib/hooks';
import { formatDate, getDaysInMonth, getMonthName, getDateDiff } from '@/lib/calendar';
import { getQuoteOfDay } from '@/lib/quotes';
import NotificationManager from '@/components/NotificationManager';

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
const HabitRow = memo(({ habit, days, entries, toggleHabit, updateHabit, deleteHabit, getHabitStats, formatDate, currentYear, currentMonth, hIdx, onOpenDeepDive }: any) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const stats = getHabitStats(habit);

  const handleNameSave = () => {
    setIsEditingName(false);
    if (editName.trim() && editName !== habit.name) {
      updateHabit(habit.id, { name: editName.trim() });
    } else {
      setEditName(habit.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameSave();
    if (e.key === 'Escape') {
      setIsEditingName(false);
      setEditName(habit.name);
    }
  };

  return (
    <tr className={`${hIdx % 2 === 0 ? 'bg-[#f0ebe6] dark:bg-slate-800' : 'bg-[#e9e4df] dark:bg-slate-800/80'} transition-colors duration-150`}>
      <td className="sticky left-0 z-10 border-r border-t border-[#cfc8c0] dark:border-slate-600 bg-inherit p-2 text-left font-medium truncate max-w-[200px]">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[8px] font-black opacity-20 w-4 text-right">{hIdx + 1}</span>
            <button 
              onClick={() => onOpenDeepDive(habit)}
              className="text-base hover:scale-110 hover:bg-white/30 rounded-lg p-1 transition-all flex items-center justify-center relative group/emoji"
              title="Open Detail View"
            >
              {habit.emoji}
              <Maximize2 size={10} className="absolute -top-1 -right-1 opacity-0 group-hover/emoji:opacity-100 text-[#5c544d] dark:text-white bg-white/80 rounded-full" />
            </button>
            <div className="flex flex-col min-w-0">
              {isEditingName ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="bg-white/50 dark:bg-slate-700 text-sm font-bold w-full outline-none px-1 rounded-md"
                />
              ) : (
                <span 
                  className="truncate font-bold text-sm leading-tight flex items-center gap-1 cursor-text hover:bg-white/20 px-1 -mx-1 rounded"
                  onClick={() => setIsEditingName(true)}
                >
                  {habit.name}
                  {habit.type === 'temporary' && <Calendar className="w-2.5 h-2.5 text-[#8b7f74]" />}
                </span>
              )}
              {habit.type === 'temporary' && (
                <span className="text-[8px] opacity-40 truncate">{habit.startDate} to {habit.endDate}</span>
              )}
              {habit.startTime && habit.endTime && (
                <span className="text-[8px] font-black text-[#8b7f74] flex items-center gap-1 mt-0.5">
                  <Clock size={8} /> {habit.startTime} - {habit.endTime}
                </span>
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

        // Time blocking logic
        if (isToday && habit.endTime) {
          const now = new Date();
          const [endHour, endMinute] = habit.endTime.split(':').map(Number);
          const endTime = new Date();
          endTime.setHours(endHour, endMinute, 0, 0);
          if (now > endTime) {
            isDisabled = true;
          }
        }

        return (
          <td key={day} className={`border-r border-t border-[#cfc8c0] dark:border-slate-600 p-0 ${isToday ? 'bg-[#8b7f74]/5' : ''}`}>
            <button 
              disabled={isDisabled || isCompleted} 
              onClick={() => !isCompleted && toggleHabit(dateStr, habit.id, true)} 
              className={`w-full h-8 flex items-center justify-center transition-colors ${isDisabled ? 'opacity-10' : isCompleted ? 'cursor-default' : 'hover:bg-white/30'}`}
            >
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
  const { habits, addHabit, updateHabit, deleteHabit } = useHabits();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { entries, toggleHabit, updateEntryData } = useMonthEntries(currentYear, currentMonth);
  const { completionDays, streak, totalCompletions } = useAnnualStats();

  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '', emoji: '📝', type: 'permanent' as 'permanent' | 'temporary' | 'milestone',
    startDate: formatDate(new Date()), endDate: formatDate(new Date()),
    category: 'active' as 'active' | 'passive',
    startTime: '', endTime: ''
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [deepDiveHabit, setDeepDiveHabit] = useState<any>(null);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'focus'>('profile');
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ message: string, xp: number } | null>(null);
  const [questXP, setQuestXP] = useState(0);
  const [localXPDelta, setLocalXPDelta] = useState(0);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [showArchivedMilestones, setShowArchivedMilestones] = useState(false);
  const [examGroups, setExamGroups] = useState<any[]>([]);

  // Service Worker Registration for Push Notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Sync exam groups for notification manager
  useEffect(() => {
    const checkExams = () => {
      const savedGroups = localStorage.getItem('mock_exam_groups');
      if (savedGroups) {
        try {
          setExamGroups(JSON.parse(savedGroups));
        } catch (e) {
          console.error("Failed to parse exams for notifications", e);
        }
      }
    };
    checkExams();
    const interval = setInterval(checkExams, 10000); // Check every 10s for changes
    return () => clearInterval(interval);
  }, []);

  // Persistence fix for Quest XP: Load even if ActionCenter isn't mounted
  useEffect(() => {
    const savedTodos = localStorage.getItem('mock_todos');
    if (savedTodos) {
      try {
        const todos = JSON.parse(savedTodos);
        const earnedXP = todos.filter((t: any) => t.completed).reduce((sum: number, t: any) => sum + (t.xp || 5), 0);
        setQuestXP(earnedXP);
      } catch (e) {
        console.error("Failed to parse todos for XP", e);
      }
    }
  }, []);

  useEffect(() => { 
    setMounted(true); 
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleToggleHabit = useCallback(async (dateStr: string, habitId: string, completed: boolean) => {
    // Random XP between 1-10
    const xpGained = Math.floor(Math.random() * 10) + 1;
    
    // Update local XP for real-time feel
    setLocalXPDelta(prev => completed ? prev + 10 : prev - 10);
    
    // Update completion
    await toggleHabit(dateStr, habitId, completed);
    
    if (completed) {
      setToast({ message: 'Finished a habit!', xp: xpGained });
      setTimeout(() => setToast(null), 3000);
    }
  }, [toggleHabit]);

  // Passive Reminder Notifications
  useEffect(() => {
    if (!mounted || !('Notification' in window) || Notification.permission !== 'granted') return;
    
    const checkPassive = () => {
      const now = new Date();
      const todayStr = now.toDateString();
      const lastPassiveNotified = localStorage.getItem('last_passive_notified_date');
      
      if (lastPassiveNotified !== todayStr) {
        const passiveHabits = habits.filter(h => h.category === 'passive');
        if (passiveHabits.length > 0) {
           new Notification('Mastery Hub Reminders', { body: `Don't forget your daily reminders: ${passiveHabits.map(h => h.name).join(', ')}`, icon: '/favicon.ico' });
           localStorage.setItem('last_passive_notified_date', todayStr);
        }
      }
    };
    
    const timeoutId = setTimeout(checkPassive, 5000);
    return () => clearTimeout(timeoutId);
  }, [habits, mounted]);

  // Keyboard listeners for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddingHabit(false);
        setShowFullReport(false);
        setDeepDiveHabit(null);
        setShowLeagueModal(false);
        setShowEmojiPicker(false);
        setShowSidebar(false);
      }
      if (e.key === 'Enter' && isAddingHabit && newHabit.name.trim()) {
        handleAddHabit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddingHabit, newHabit, showFullReport]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const deferredEntries = useDeferredValue(entries);

  const monthPercent = useMemo(() => {
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth, daysInMonth);
    
    const activeInMonth = habits.filter(h => {
      // Exclude milestones from habit statistics
      if (h.type === 'milestone') return false;
      
      if (h.type === 'temporary' && h.startDate && h.endDate) {
        return new Date(h.startDate) <= monthEnd && new Date(h.endDate) >= monthStart;
      }
      return true;
    });

    const totalPossible = daysInMonth * activeInMonth.length;
    if (totalPossible === 0) return 0;
    const completed = Object.values(deferredEntries).reduce((sum, entry) => {
      // Only count completions for habits active in that month
      return sum + Object.keys(entry.completions).filter(hId => 
        activeInMonth.some(ah => ah.id === hId) && entry.completions[hId]
      ).length;
    }, 0);
    return (completed / totalPossible) * 100;
  }, [deferredEntries, habits, daysInMonth, currentYear, currentMonth]);

  const dailyData = useMemo(() => days.map(day => {
    const currentDate = new Date(currentYear, currentMonth, day);
    currentDate.setHours(0,0,0,0);
    const dateStr = formatDate(currentDate);
    const entry = deferredEntries[dateStr];
    
    const activeOnThisDay = habits.filter(h => {
      if (h.type === 'temporary' && h.startDate && h.endDate) {
        const start = new Date(h.startDate);
        const end = new Date(h.endDate);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);
        return currentDate >= start && currentDate <= end;
      }
      return true;
    });

    const completed = activeOnThisDay.filter(h => entry?.completions[h.id]).length;
    return {
      day: `Day ${day}`,
      completed,
      pending: Math.max(0, activeOnThisDay.length - completed),
      percentage: activeOnThisDay.length > 0 ? Number(((completed / activeOnThisDay.length) * 100).toFixed(2)) : 0
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
  
  const activeToday = useMemo(() => {
    const now = new Date();
    now.setHours(0,0,0,0);
    return habits.filter(h => {
      // Exclude milestones from daily habit statistics
      if (h.type === 'milestone') return false;
      
      if (h.type === 'temporary' && h.startDate && h.endDate) {
        return new Date(h.startDate) <= now && new Date(h.endDate) >= now;
      }
      return true;
    });
  }, [habits]);

  const todayCompleted = activeToday.filter(h => todayEntry?.completions[h.id]).length;
  const todayProgress = activeToday.length > 0 ? Number(((todayCompleted / activeToday.length) * 100).toFixed(2)) : 0;

  const topHabits = useMemo(() => {
    return habits
      .map(h => ({ ...h, stats: getHabitStats(h) }))
      .sort((a, b) => b.stats.progress - a.stats.progress)
      .slice(0, 10);
  }, [habits, entries, daysInMonth, getHabitStats]);

  const visibleHabits = useMemo(() => {
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth, daysInMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return habits
      .filter(habit => habit.type !== 'milestone') // Remove milestones from grid
      .filter(habit => {
        if (habit.type === 'temporary' && habit.startDate && habit.endDate) {
          const hStart = new Date(habit.startDate);
          const hEnd = new Date(habit.endDate);
          hStart.setHours(0, 0, 0, 0);
          hEnd.setHours(0, 0, 0, 0);
          // Only show if the habit overlaps with the current month
          return hStart <= monthEnd && hEnd >= monthStart;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort ended temporary habits to the bottom
        const aIsEnded = a.type === 'temporary' && a.endDate && new Date(a.endDate) < today;
        const bIsEnded = b.type === 'temporary' && b.endDate && new Date(b.endDate) < today;
        
        if (aIsEnded && !bIsEnded) return 1;
        if (!aIsEnded && bIsEnded) return -1;

        // Then sort by start time
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
        if (a.startTime) return -1;
        if (b.startTime) return 1;
        
        return a.position - b.position;
      });
  }, [habits, currentYear, currentMonth, daysInMonth]);

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

  const handleAddHabit = async () => {
    if (newHabit.name.trim()) {
      await addHabit(
        newHabit.name.trim(), 
        newHabit.emoji, 
        newHabit.type as any, 
        newHabit.startDate, 
        newHabit.endDate,
        newHabit.category,
        newHabit.startTime,
        newHabit.endTime
      );
      setNewHabit({
        name: '', emoji: '📝', type: 'permanent',
        startDate: formatDate(new Date()), endDate: formatDate(new Date()),
        category: 'active', startTime: '', endTime: ''
      });
      setIsAddingHabit(false);
    }
  };

  // persistence fix: Total XP = Global completions * 10 + Quest XP + Local Delta
  const totalXP = (totalCompletions * 10) + questXP + localXPDelta;

  const LEAGUES = useMemo(() => [
    { name: 'Novice', xp: 0, icon: '🌱', image: '/badges/novice_badge_1778329860193.png', bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { name: 'Apprentice', xp: 100, icon: '📜', image: '/badges/novice_badge_1778329860193.png', bg: 'bg-blue-50', color: 'text-blue-600' },
    { name: 'Adept', xp: 500, icon: '🛡️', image: '/badges/novice_badge_1778329860193.png', bg: 'bg-indigo-50', color: 'text-indigo-600' },
    { name: 'Master', xp: 1000, icon: '👁️', image: '/badges/master_badge_1778329880430.png', bg: 'bg-purple-50', color: 'text-purple-600' },
    { name: 'Grandmaster', xp: 2500, icon: '🦅', image: '/badges/master_badge_1778329880430.png', bg: 'bg-pink-50', color: 'text-pink-600' },
    { name: 'Ascendant', xp: 5000, icon: '💎', image: '/badges/master_badge_1778329880430.png', bg: 'bg-cyan-50', color: 'text-cyan-600' },
    { name: 'Radiant', xp: 10000, icon: '☀️', image: '/badges/master_badge_1778329880430.png', bg: 'bg-amber-50', color: 'text-amber-600' },
    { name: 'Immortal', xp: 25000, icon: '💀', image: '/badges/titan_badge_1778330005209.png', bg: 'bg-slate-900', color: 'text-slate-100' },
    { name: 'God Tier', xp: 50000, icon: '🌌', image: '/badges/titan_badge_1778330005209.png', bg: 'bg-black', color: 'text-white' },
    { name: 'Titan', xp: 100000, icon: '🔥', image: '/badges/titan_badge_1778330005209.png', bg: 'bg-orange-600', color: 'text-white' },
  ], []);

  const userLevel = useMemo(() => {
    return LEAGUES.slice().reverse().find(l => totalXP >= l.xp) || LEAGUES[0];
  }, [totalXP, LEAGUES]);

  const activeMilestones = useMemo(() => habits.filter(h => h.type === 'milestone' && !h.archived), [habits]);
  const archivedMilestones = useMemo(() => habits.filter(h => h.type === 'milestone' && h.archived), [habits]);

  if (!mounted) return <div className="min-h-screen bg-[#f0ebe6] dark:bg-slate-900" />;

  return (
    <div className="flex flex-col gap-6 bg-[#fcfaf9] dark:bg-slate-950 min-h-screen p-4 md:p-8 lg:p-12 pb-20 font-sans text-[#5c544d] dark:text-slate-200 relative overflow-x-hidden">
      
      {/* SIDEBAR NAVIGATION OVERLAY */}
      {showSidebar && (
        <div className="fixed inset-0 z-[600] flex">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowSidebar(false)} />
          <div className="w-72 h-full bg-white dark:bg-slate-900 shadow-2xl relative z-10 p-8 flex flex-col border-r border-gray-100 dark:border-slate-800 animate-in slide-in-from-left duration-500">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5c544d] rounded-xl flex items-center justify-center text-white font-heading italic text-xl">M</div>
                <h2 className="font-heading italic text-2xl text-[#5c544d] dark:text-white">Mastery Hub</h2>
              </div>
              <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-2 flex-1">
              <button onClick={() => { setActiveTab('profile'); setShowSidebar(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${activeTab === 'profile' ? 'bg-[#5c544d] text-white shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${activeTab === 'profile' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-500'}`}><User size={20} /></div>
                <span className="font-bold text-sm">Mastery Profile</span>
              </button>
              <button onClick={() => { setActiveTab('dashboard'); setShowSidebar(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${activeTab === 'dashboard' ? 'bg-[#5c544d] text-white shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${activeTab === 'dashboard' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-500'}`}><LayoutDashboard size={20} /></div>
                <span className="font-bold text-sm">Habit Grid</span>
              </button>
              <button onClick={() => { setActiveTab('focus'); setShowSidebar(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${activeTab === 'focus' ? 'bg-[#5c544d] text-white shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${activeTab === 'focus' ? 'bg-white/20 text-white' : 'bg-[#8b7f74] text-white'}`}><Target size={20} /></div>
                <span className="font-bold text-sm">Academic Hub</span>
              </button>
              <button onClick={() => { setShowSidebar(false); setShowFullReport(true); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform"><BarChart3 size={20} /></div>
                <span className="font-bold text-sm">Full Data Report</span>
              </button>
            </div>

            <div className="pt-8 border-t border-gray-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8b7f74] opacity-40 mb-4 px-4">Support & Credits</p>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-[#5c544d] dark:text-slate-400">Mastery Hub v2.1 • Reliable Ed.</p>
                <p className="text-[8px] text-[#8b7f74] mt-1 italic">Built for high performance.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XP Toast */}
      {toast && (
        <div className="fixed top-8 right-8 z-[300] bg-[#5c544d] text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-500 flex items-center gap-4 border border-white/20">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
            +{toast.xp}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Quest Complete</p>
            <p className="text-sm font-bold">{toast.message}</p>
          </div>
        </div>
      )}

      {deepDiveHabit && deepDiveHabit.type === 'milestone' && (
        <MilestoneModal 
          milestone={deepDiveHabit} 
          onClose={() => setDeepDiveHabit(null)} 
          onUpdate={(items, completions) => {
            updateHabit(deepDiveHabit.id, { checklistItems: items, milestoneCompletions: completions });
          }} 
        />
      )}

      {deepDiveHabit && deepDiveHabit.type !== 'milestone' && (
        <TaskDetailModal
          habit={deepDiveHabit}
          dateStr={formatDate(new Date())}
          entry={entries[formatDate(new Date())] || null}
          onClose={() => setDeepDiveHabit(null)}
          onUpdateMode={(mode) => updateHabit(deepDiveHabit.id, { mode })}
          onUpdateChecklistItems={(items) => updateHabit(deepDiveHabit.id, { checklistItems: items })}
          onUpdateEntry={(completions, note) => {
            updateEntryData(formatDate(new Date()), deepDiveHabit.id, completions, note);
          }}
        />
      )}

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
                  <button onClick={() => setNewHabit({ ...newHabit, type: 'milestone' })} className={`h-12 rounded-2xl border transition-all text-xs font-bold flex flex-col items-center justify-center col-span-2 ${newHabit.type === 'milestone' ? 'bg-[#5c544d] text-white border-transparent' : 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-700'}`}>
                    <span>Milestone Goal</span>
                    <span className="text-[8px] opacity-60">One-time project</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-[#8b7f74] uppercase tracking-widest">Time Block (Optional)</label>
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <input type="time" className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 px-3 text-xs font-bold outline-none" value={newHabit.startTime} onChange={(e) => setNewHabit({ ...newHabit, startTime: e.target.value })} />
                    <span className="text-[8px] opacity-60 mt-1 block">Start Time</span>
                  </div>
                  <div>
                    <input type="time" className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 px-3 text-xs font-bold outline-none" value={newHabit.endTime} onChange={(e) => setNewHabit({ ...newHabit, endTime: e.target.value })} />
                    <span className="text-[8px] opacity-60 mt-1 block">End Time</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-[#8b7f74] uppercase tracking-widest">Category</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setNewHabit({ ...newHabit, category: 'active' })} className={`h-10 rounded-2xl border transition-all text-xs font-bold ${newHabit.category === 'active' ? 'bg-[#8b7f74] text-white border-transparent' : 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-700'}`}>
                    Active Habit
                  </button>
                  <button onClick={() => setNewHabit({ ...newHabit, category: 'passive' })} className={`h-10 rounded-2xl border transition-all text-xs font-bold ${newHabit.category === 'passive' ? 'bg-[#8b7f74] text-white border-transparent' : 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-700'}`}>
                    Passive / Reminder
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
                  onClick={handleAddHabit}
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
          <div className="space-y-1 text-center sm:text-left flex items-center gap-4">
            <button 
              onClick={() => setShowSidebar(true)} 
              className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:scale-110 transition-all border border-gray-100 dark:border-slate-700 group mr-2"
              title="Open Navigation"
            >
              <MoreHorizontal size={24} className="text-[#5c544d] dark:text-white group-hover:rotate-90 transition-transform duration-500" />
            </button>
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-[#5c544d] dark:text-white tracking-tighter">
                {activeTab === 'dashboard' ? 'Daily Mastery' : 
                 activeTab === 'profile' ? 'Identity & Stats' : 'Academic Hub'}
              </h1>
              <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#8b7f74] opacity-60">
                {activeTab === 'dashboard' ? 'Elite Human Performance Tracker' : 
                 activeTab === 'profile' ? 'Confidential Performance Profile' : 'Strategic Academic Management'}
              </p>
            </div>
            
            {/* NEW: Level & Badge Widget */}
            <div className={`hidden sm:flex flex-col items-center justify-center p-2 rounded-xl ${userLevel.bg} border border-[#5c544d]/20 dark:border-white/10 shadow-md ml-4 animate-in zoom-in duration-500 relative group`}>
              <button 
                onClick={() => setShowLeagueModal(true)} 
                className="absolute -top-2 -right-2 bg-[#5c544d] text-white rounded-full p-1.5 shadow-md hover:scale-110 hover:rotate-12 transition-all z-20 cursor-pointer border-2 border-white group-hover:bg-[#8b7f74]"
                title="League Details"
              >
                <Info size={12} />
              </button>
              <div className="relative">
                <img src={userLevel.image} alt={userLevel.name} className="w-10 h-10 mb-1 drop-shadow-sm group-hover:scale-105 transition-transform duration-500" />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${userLevel.color} drop-shadow-sm`}>{userLevel.name}</span>
              <span className="text-[10px] font-black text-[#5c544d] dark:text-white mt-0.5 bg-white/40 px-1.5 py-0.5 rounded-full shadow-inner">{totalXP.toLocaleString()} XP</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === 'dashboard' && (
              <button 
                onClick={() => setIsAddingHabit(true)} 
                className="flex items-center gap-2 bg-[#5c544d] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95 group/add"
              >
                <Plus size={14} className="group-hover/add:rotate-90 transition-transform duration-300" />
                <span>New Habit</span>
              </button>
            )}
            <div className="flex gap-2">
              <select value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))} className="p-2 bg-white/60 dark:bg-slate-800 rounded-xl text-[10px] font-bold outline-none border-none shadow-sm">{[2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}</select>
              <select value={currentMonth} onChange={(e) => setCurrentMonth(Number(e.target.value))} className="p-2 bg-white/60 dark:bg-slate-800 rounded-xl text-[10px] font-bold outline-none border-none shadow-sm">{Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{getMonthName(i)}</option>)}</select>
            </div>
          </div>
        </div>

        {/* NEW: Leagues Modal */}
        {showLeagueModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 px-4" onClick={() => setShowLeagueModal(false)}>
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-800 border border-white/20" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-heading italic text-[#5c544d] dark:text-white">Mastery Leagues</h2>
                <button onClick={() => setShowLeagueModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3 p-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#8b7f74]/20">
                {LEAGUES.map((league, idx) => {
                  const isCurrent = userLevel.name === league.name;
                  const nextLeague = LEAGUES[idx + 1];
                  const pointsNeeded = isCurrent && nextLeague ? nextLeague.xp - totalXP : 0;
                  
                  return (
                    <div key={league.name} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isCurrent ? `${league.bg} border-transparent shadow-md scale-[1.02] my-2 ring-2 ring-[#5c544d]/10` : 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-700 opacity-60'}`}>
                      <img src={league.image} alt={league.name} className="w-14 h-14 drop-shadow-md" />
                      <div className="flex-1">
                        <h4 className={`font-bold text-base ${isCurrent ? league.color : 'text-[#5c544d] dark:text-slate-300'}`}>{league.name}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8b7f74]">{league.xp.toLocaleString()}+ XP</p>
                      </div>
                      {isCurrent && pointsNeeded > 0 && (
                        <div className="text-right">
                          <span className="text-sm font-black text-[#5c544d] dark:text-white">{pointsNeeded.toLocaleString()} XP</span>
                          <p className="text-[8px] font-black uppercase tracking-widest text-[#8b7f74]">to rank up</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MAIN VIEWPORT */}
        <div className="flex-1 min-h-0">
          
          {/* TAB 1: DAILY MASTERY (HABITS) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* FOCUS CENTER SECTION */}
              <div className="bg-[#5c544d] text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute right-0 top-0 opacity-10 -translate-y-8 translate-x-8 rotate-12">
                  <Target size={200} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                   <div className="relative w-32 h-32 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/10" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={364.42} strokeDashoffset={364.42 - (364.42 * todayProgress) / 100} className="text-white transition-all duration-1000" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-heading italic">{todayProgress.toFixed(0)}%</span>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Today</span>
                      </div>
                   </div>
                   <div className="flex-1 text-center md:text-left">
                      <h2 className="text-3xl font-heading italic mb-2">Focus Centre</h2>
                      <p className="text-sm text-white/80 leading-relaxed mb-6">
                        You've completed <span className="font-bold text-white">{todayCompleted}</span> of your <span className="font-bold text-white">{habits.length}</span> daily habits. 
                        Keep pushing towards your {userLevel.name} rank!
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <button onClick={() => setActiveTab('focus')} className="bg-white text-[#5c544d] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg">View Tactical Hub</button>
                        <button onClick={() => setShowFullReport(true)} className="bg-white/10 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/20">Intelligence Report</button>
                      </div>
                   </div>
                </div>
              </div>
              {(activeMilestones.length > 0 || archivedMilestones.length > 0) && (
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[40px] p-8 shadow-2xl border border-white dark:border-slate-700 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-heading italic text-[#5c544d] dark:text-white flex items-center gap-3">
                      <Trophy size={24} className="text-amber-500" />
                      Active Milestones
                    </h3>
                    {archivedMilestones.length > 0 && (
                      <button 
                        onClick={() => setShowArchivedMilestones(!showArchivedMilestones)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                      >
                        <HistoryIcon size={14} />
                        {showArchivedMilestones ? 'Hide History' : `History (${archivedMilestones.length})`}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeMilestones.map((milestone) => {
                      const totalItems = milestone.checklistItems?.length || 0;
                      const completedCount = milestone.milestoneCompletions?.length || 0;
                      const progressPct = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
                      const isEditing = editingMilestone === milestone.id;

                      return (
                        <div key={milestone.id} className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 group relative">
                          <div className="flex items-start justify-between mb-4">
                            <div className="text-3xl group-hover:scale-110 transition-transform">{milestone.emoji}</div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => { setEditingMilestone(milestone.id); setNewMilestoneName(milestone.name); }} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-[#8b7f74]"><Edit3 size={14} /></button>
                              <button onClick={() => updateHabit(milestone.id, { archived: true })} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-rose-500"><Archive size={14} /></button>
                            </div>
                          </div>
                          
                          <div className="mb-6 cursor-pointer" onClick={() => !isEditing && setDeepDiveHabit(milestone)}>
                            {isEditing ? (
                              <div className="flex gap-2">
                                <input 
                                  value={newMilestoneName} 
                                  onChange={(e) => setNewMilestoneName(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 border-none rounded-lg p-2 text-sm font-bold focus:ring-2 ring-[#5c544d]/20"
                                  autoFocus
                                />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateHabit(milestone.id, { name: newMilestoneName }); setEditingMilestone(null); }}
                                  className="p-2 bg-[#5c544d] text-white rounded-lg shadow-md"
                                >
                                  <Check size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <h4 className="font-bold text-base text-[#5c544d] dark:text-slate-200 mb-1">{milestone.name}</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#8b7f74]">{completedCount} / {totalItems} Phases Mastered</p>
                              </>
                            )}
                          </div>

                          <div className="space-y-2">
                             <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-[#8b7f74]">
                                <span>Momentum</span>
                                <span>{Math.round(progressPct)}%</span>
                             </div>
                             <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-[#5c544d] transition-all duration-1000 shadow-[0_0_10px_rgba(92,84,77,0.3)]" style={{ width: `${progressPct}%` }} />
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {showArchivedMilestones && (
                    <div className="pt-8 border-t border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-4 duration-500">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8b7f74] mb-6">Archive Vault</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {archivedMilestones.map((milestone) => (
                          <div key={milestone.id} className="bg-gray-100/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700 opacity-60 hover:opacity-100 transition-all group">
                            <div className="flex items-center gap-4 mb-4">
                              <span className="text-2xl">{milestone.emoji}</span>
                              <div className="flex-1">
                                <h4 className="font-bold text-sm text-[#5c544d] dark:text-slate-300">{milestone.name}</h4>
                                <p className="text-[8px] font-black uppercase tracking-widest text-[#8b7f74]">Archived Project</p>
                              </div>
                              <button 
                                onClick={() => updateHabit(milestone.id, { archived: false })}
                                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-emerald-500 shadow-sm"
                                title="Restore to Active"
                              >
                                <RefreshCw size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div id="habit-grid" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[32px] shadow-2xl overflow-x-auto border border-white dark:border-slate-800 scrollbar-thin scrollbar-thumb-[#8b7f74]/20">
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
                    {visibleHabits.map((habit, hIdx) => (
                      <HabitRow 
                        key={habit.id} 
                        habit={habit} 
                        days={days} 
                        entries={entries} 
                        toggleHabit={handleToggleHabit} 
                        updateHabit={updateHabit} 
                        deleteHabit={deleteHabit} 
                        getHabitStats={getHabitStats} 
                        formatDate={formatDate} 
                        currentYear={currentYear} 
                        currentMonth={currentMonth} 
                        hIdx={hIdx} 
                        onOpenDeepDive={setDeepDiveHabit} 
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: IDENTITY & STATS (PROFILE) */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[40px] p-8 shadow-2xl border border-white dark:border-slate-700 flex flex-col items-center text-center">
                   <div className="relative mb-6">
                      <div className={`w-32 h-32 rounded-full ${userLevel.bg} flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-700 relative group`}>
                         <img src={userLevel.image} alt={userLevel.name} className="w-24 h-24 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                      </div>
                   </div>
                   <h2 className="text-3xl font-heading italic text-[#5c544d] dark:text-white mb-1">Elite Operator</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8b7f74] mb-8">Level: {userLevel.name}</p>
                   <div className="w-full space-y-4 pt-8 border-t border-gray-100 dark:border-slate-700">
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl">
                         <span className="text-[10px] font-black uppercase tracking-widest text-[#8b7f74]">Total XP</span>
                         <span className="text-lg font-black text-[#5c544d] dark:text-white">{totalXP.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl">
                         <span className="text-[10px] font-black uppercase tracking-widest text-[#8b7f74]">Streak</span>
                         <span className="text-lg font-black text-amber-500">{streak} Days</span>
                      </div>
                      
                      {/* NEW: RANK ADVANCEMENT FILLER */}
                      <div className="bg-[#5c544d] rounded-3xl p-6 text-white text-left relative overflow-hidden shadow-xl mt-4">
                         <div className="absolute right-0 bottom-0 opacity-10 -translate-x-2 -translate-y-2"><Trophy size={60} /></div>
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-4">Rank Advancement</p>
                         <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold">{userLevel.name}</span>
                            <span className="text-[8px] opacity-60 italic">Next: {LEAGUES[Math.min(LEAGUES.indexOf(userLevel) + 1, LEAGUES.length - 1)].name}</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, (totalXP % 1000) / 10)}%` }} />
                         </div>
                         <p className="text-[8px] font-bold opacity-80 leading-relaxed">
                            Complete {Math.ceil((LEAGUES[Math.min(LEAGUES.indexOf(userLevel) + 1, LEAGUES.length - 1)].xp - totalXP) / 10)} more habits to reach the next tier.
                         </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                         <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl text-center">
                            <p className="text-[8px] font-black uppercase tracking-widest text-[#8b7f74] mb-1">Density</p>
                            <p className="text-sm font-black text-[#5c544d] dark:text-white">{Math.round(monthPercent)}%</p>
                         </div>
                         <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl text-center">
                            <p className="text-[8px] font-black uppercase tracking-widest text-[#8b7f74] mb-1">Percentile</p>
                            <p className="text-sm font-black text-[#5c544d] dark:text-white">Top 2%</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Stats & Charts */}
                <div className="lg:col-span-8 space-y-8">
                   {/* Focus Center Summary */}
                   <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[40px] p-8 shadow-2xl border border-white dark:border-slate-700 flex items-center gap-8 relative overflow-hidden">
                      <div className="relative w-28 h-28 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-slate-900" />
                          <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={314.16} strokeDashoffset={314.16 - (314.16 * todayProgress) / 100} className="text-[#5c544d] transition-all duration-1000" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-heading italic text-[#5c544d] dark:text-white">{todayProgress.toFixed(0)}%</span>
                          <span className="text-[7px] font-black uppercase tracking-widest text-[#8b7f74]">Today</span>
                        </div>
                      </div>
                      <div className="flex-1">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74] mb-1">Today's Momentum</h4>
                         <p className="text-xl font-bold text-[#5c544d] dark:text-white leading-tight">
                           You've completed <span className="text-[#8b7f74]">{todayCompleted}</span> habits today.
                         </p>
                      </div>
                   </div>

                   <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[40px] p-8 shadow-2xl border border-white dark:border-slate-700">
                      <DashboardCharts dailyData={dailyData} streak={streak} monthPercent={monthPercent} completionDays={completionDays} totalHabits={habits.length} />
                   </div>
                   
                   {/* Visual Mastery Map */}
                   <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[40px] p-8 shadow-2xl border border-white dark:border-slate-700">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-heading italic text-[#5c544d] dark:text-white">Mastery Density</h3>
                        <div className="flex gap-1">
                          {[0.2, 0.4, 0.6, 0.8, 1].map(op => <div key={op} className="w-2.5 h-2.5 rounded-sm bg-[#5c544d]" style={{ opacity: op }} />)}
                        </div>
                      </div>
                      <div className="grid grid-cols-10 gap-2">
                        {dailyData.map((data, i) => (
                          <div key={i} className="w-full aspect-square rounded-md bg-[#5c544d] relative group/cell transition-all hover:scale-110" style={{ opacity: 0.1 + (data.percentage / 100) * 0.9 }}>
                            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white drop-shadow-sm">
                              {i + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                   </div>

                   {/* Leaderboard Section */}
                   <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[40px] p-8 shadow-2xl border border-white dark:border-slate-700">
                      <h2 className="text-2xl font-heading italic text-[#5c544d] dark:text-white mb-6">Performance Elite</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topHabits.map((h, i) => (
                          <div key={h.id} className="flex items-center gap-4 p-4 bg-[#f0ebe6]/40 dark:bg-slate-900/30 rounded-2xl border border-[#d1c7bc]/10">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${i < 3 ? 'bg-[#5c544d] text-white' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</div>
                            <span className="text-xl">{h.emoji}</span>
                            <span className="font-bold text-xs flex-1 truncate">{h.name}</span>
                            <span className="font-black text-xs">{h.stats.progress.toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FOCUS CENTRE (MISSIONS + EXAMS) */}
          {activeTab === 'focus' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
              <ActionCenter onQuestXPUpdate={setQuestXP} viewMode="all" />
            </div>
          )}
        </div>

        {/* FULL PERFORMANCE REPORT OVERLAY */}
        {showFullReport && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-[#5c544d]/95 backdrop-blur-2xl animate-in fade-in duration-700" onClick={() => setShowFullReport(false)} />
            <div className="bg-[#fcfaf9] dark:bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 border border-white/20">
              
              {/* Header */}
              <div className="p-10 md:p-14 flex justify-between items-start">
                <div>
                  <h2 className="text-5xl font-heading italic text-[#5c544d] dark:text-white mb-3">Mastery Intelligence Report</h2>
                  <p className="text-[12px] font-black uppercase tracking-[0.4em] text-[#8b7f74] opacity-70">Strategic Analysis • Confidential</p>
                </div>
                <button onClick={() => setShowFullReport(false)} className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center hover:rotate-90 transition-all duration-500 group">
                  <X size={28} className="text-[#5c544d] dark:text-white group-hover:scale-110" />
                </button>
              </div>

              {/* Main Content: 3-Column Layout */}
              <div className="flex-1 overflow-y-auto px-10 md:px-14 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  
                  {/* Column 1: Mastery Grade */}
                  <div className="bg-[#5c544d] rounded-[40px] p-10 flex flex-col items-center text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 opacity-5 -translate-y-4 translate-x-4 rotate-12"><Trophy size={200} /></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-16 relative z-10">Mastery Grade</h3>
                    <div className="relative z-10 mb-8">
                       <span className="text-[160px] font-heading italic leading-none block">
                         {monthPercent >= 90 ? 'A' : monthPercent >= 75 ? 'B' : monthPercent >= 50 ? 'C' : 'D'}
                       </span>
                    </div>
                    <div className="relative z-10 mt-auto">
                       <h4 className="text-2xl font-heading italic mb-4">
                         {monthPercent >= 90 ? 'Elite Performance' : monthPercent >= 75 ? 'High Potential' : monthPercent >= 50 ? 'Critical Attention Required' : 'Compromised Momentum'}
                       </h4>
                       <p className="text-sm text-white/60 leading-relaxed max-w-[200px] mx-auto">
                         {monthPercent >= 90 ? 'You are dominating the path to mastery.' : 
                          monthPercent >= 75 ? 'Consistency is strong. Keep refining your approach.' : 
                          monthPercent >= 50 ? 'Your discipline is slipping. Reclaim your mastery before it\'s too late.' : 
                          'Strategic overhaul required immediately to salvage progress.'}
                       </p>
                    </div>
                  </div>

                  {/* Column 2: Lifetime Mastery */}
                  <div className="bg-white dark:bg-slate-800 rounded-[40px] p-10 flex flex-col border border-gray-100 dark:border-slate-700 shadow-xl">
                    <div className="flex items-center gap-4 mb-12">
                      <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
                        <Trophy size={24} />
                      </div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8b7f74]">Lifetime Mastery</h3>
                    </div>
                    
                    <div className="mb-12">
                      <div className="flex items-baseline gap-2">
                        <span className="text-8xl font-heading italic text-[#5c544d] dark:text-white">{completionDays}</span>
                        <span className="text-xl font-heading italic text-[#8b7f74]">Days</span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74] mt-2 opacity-60">Total Mastered Milestones</p>
                    </div>

                    <div className="mt-auto pt-10 border-t border-gray-50 dark:border-slate-700">
                       <div className="flex justify-between items-center mb-6">
                         {LEAGUES.slice(0, 5).map((league, idx) => (
                           <div key={idx} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${totalXP >= league.xp ? 'bg-[#fcfaf9] dark:bg-slate-900 border-[#5c544d] shadow-lg' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 opacity-20'}`}>
                             <span className="text-xs">{league.icon}</span>
                           </div>
                         ))}
                       </div>
                       <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-[#8b7f74] opacity-40">
                         <span>Iron</span>
                         <span>Silver</span>
                         <span>Gold</span>
                         <span>Diamond</span>
                         <span>Radiant</span>
                       </div>
                    </div>
                  </div>

                  {/* Column 3: Focus Needed */}
                  <div className="bg-white dark:bg-slate-800 rounded-[40px] p-10 flex flex-col border border-gray-100 dark:border-slate-700 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
                        <Clock size={24} />
                      </div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8b7f74]">Focus Needed</h3>
                    </div>

                    <div className="space-y-4">
                      {habits
                        .map(h => ({ ...h, stats: getHabitStats(h) }))
                        .sort((a, b) => a.stats.progress - b.stats.progress)
                        .slice(0, 6)
                        .map((habit, idx) => (
                          <div key={idx} className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-[#8b7f74]/20 transition-all cursor-default">
                            <div className="flex items-center gap-3">
                              <span className="text-xl group-hover:scale-110 transition-transform">{habit.emoji}</span>
                              <span className="text-xs font-bold text-[#5c544d] dark:text-slate-300 truncate max-w-[120px]">{habit.name}</span>
                            </div>
                            <span className={`text-[10px] font-black ${habit.stats.progress < 30 ? 'text-rose-500' : 'text-amber-500'}`}>
                              {Math.round(habit.stats.progress)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Mastery Projections: Integrated below */}
                <div className="mt-10 p-10 bg-[#fcfaf9] dark:bg-slate-800/30 rounded-[40px] border border-white dark:border-slate-700 shadow-inner">
                   <h3 className="text-xl font-heading italic text-[#5c544d] dark:text-white mb-6">Strategic Trajectory</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div>
                        <p className="text-sm text-[#8b7f74] leading-relaxed mb-6">
                          Current velocity indicates <span className="font-bold text-[#5c544d] dark:text-white">Elite Status</span> within {365 - completionDays} days. 
                          Maintaining consistency above 75% is required for rank retention.
                        </p>
                        <div className="flex gap-4">
                          <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                             <p className="text-[9px] font-black uppercase tracking-widest text-[#8b7f74] mb-1">Consistency</p>
                             <p className="text-xl font-bold text-[#5c544d] dark:text-white">{Math.round(monthPercent)}%</p>
                          </div>
                          <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                             <p className="text-[9px] font-black uppercase tracking-widest text-[#8b7f74] mb-1">Current XP</p>
                             <p className="text-xl font-bold text-[#5c544d] dark:text-white">{totalXP}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74]">
                            <span>Projected Mastery Rank</span>
                            <span className="text-[#5c544d] dark:text-white">{userLevel.name}</span>
                         </div>
                         <div className="h-3 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-[#5c544d] transition-all duration-1000 shadow-[0_0_15px_rgba(92,84,77,0.3)]" style={{ width: `${Math.min(100, (totalXP / (userLevel.xp + 1000)) * 100)}%` }} />
                         </div>
                         <p className="text-[10px] text-[#8b7f74] italic opacity-60 italic">Strategic assessment based on current 30-day performance window.</p>
                      </div>
                   </div>
                </div>

                {/* FOCUS CENTRE SUMMARY */}
                <div className="mt-10 bg-[#5c544d] rounded-[48px] p-12 text-white relative overflow-hidden shadow-2xl">
                   <div className="absolute right-0 top-0 opacity-10 -translate-y-8 translate-x-8 rotate-12"><Target size={220} /></div>
                   <div className="relative z-10">
                      <h3 className="text-3xl font-heading italic mb-8">Academic Hub Status</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="bg-white/10 p-8 rounded-[32px] backdrop-blur-md border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Tactical Missions</p>
                            <p className="text-2xl font-bold">In Operation</p>
                            <p className="text-[10px] mt-4 opacity-40">Synchronizing daily tasks...</p>
                         </div>
                         <div className="bg-white/10 p-8 rounded-[32px] backdrop-blur-md border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Academic Hub</p>
                            <p className="text-2xl font-bold">Active Shield</p>
                            <p className="text-[10px] mt-4 opacity-40">Monitoring exam windows...</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* ADDITIONAL REPORT SECTIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
                   {/* Tactical Advice */}
                   <div className="bg-[#8b7f74]/10 rounded-[40px] p-10 border border-[#8b7f74]/20">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-[#5c544d] shadow-sm">
                           <Sparkles size={20} />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74]">Tactical Advice</h3>
                      </div>
                      <p className="text-xl font-heading italic text-[#5c544d] dark:text-white leading-relaxed">
                        "The distance between who you are and who you want to be is separated only by what you do consistently."
                      </p>
                      <p className="text-xs text-[#8b7f74] mt-6 font-bold uppercase tracking-widest opacity-60">— Mastery Protocol 01</p>
                   </div>

                   {/* Key Performance Indicators */}
                   <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                         <p className="text-[9px] font-black uppercase tracking-widest text-[#8b7f74] mb-1">Active Habits</p>
                         <p className="text-2xl font-bold text-[#5c544d] dark:text-white">{habits.length}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                         <p className="text-[9px] font-black uppercase tracking-widest text-[#8b7f74] mb-1">Total Streak</p>
                         <p className="text-2xl font-bold text-amber-500">{streak}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                         <p className="text-[9px] font-black uppercase tracking-widest text-[#8b7f74] mb-1">Year Progress</p>
                         <p className="text-2xl font-bold text-[#5c544d] dark:text-white">{Math.round((completionDays / 365) * 100)}%</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-10 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-center shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <button 
                  onClick={() => setShowFullReport(false)} 
                  className="bg-[#5c544d] text-white px-16 py-5 rounded-[24px] text-xs font-black uppercase tracking-[0.3em] hover:scale-105 hover:bg-[#4a433d] transition-all shadow-[0_20px_40px_-12px_rgba(92,84,77,0.4)] active:scale-95"
                >
                  Close Intelligence Briefing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI AGENT WIDGET (Always present) */}
      <AIAgentWidget habits={habits} />

      {/* NOTIFICATION CENTER */}
      <NotificationManager habits={habits} examGroups={examGroups} />
    </div>
  );
}
