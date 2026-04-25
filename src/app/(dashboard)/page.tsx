'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHabits, useMonthEntries, useAnnualStats } from '@/lib/hooks';
import { formatDate, getDaysInMonth, getMonthName } from '@/lib/calendar';
import EmojiPicker from 'emoji-picker-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, Tooltip, CartesianGrid, AreaChart, Area
} from 'recharts';

export default function MegaDashboard() {
  const { user } = useAuth();
  const { habits, addHabit, updateHabit, deleteHabit } = useHabits();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { entries, toggleHabit } = useMonthEntries(currentYear, currentMonth);
  const { completionDays } = useAnnualStats();

  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', emoji: '📝' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddingHabit(false);
        setEditingHabit(null);
        setShowEmojiPicker(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Stats Calculations: Annual Goal (365 days)
  const totalGoal = 365;
  const totalCompleted = completionDays;
  const totalLeft = Math.max(0, totalGoal - totalCompleted);
  const overallPercent = ((totalCompleted / totalGoal) * 100).toFixed(1);

  // Daily Data
  const dailyData = days.map(day => {
    const dateStr = formatDate(new Date(currentYear, currentMonth, day));
    const entry = entries[dateStr];
    const completed = entry ? Object.values(entry.completions).filter(Boolean).length : 0;
    return {
      day: String(day),
      percentage: habits.length > 0 ? (completed / habits.length) * 100 : 0,
    };
  });

  // Weekly Data (rough grouping)
  const weeks = [];
  for (let i = 0; i < daysInMonth; i += 7) {
    const weekDays = dailyData.slice(i, i + 7);
    const avg = weekDays.reduce((sum, d) => sum + d.percentage, 0) / (weekDays.length || 1);
    weeks.push({ week: `Week ${weeks.length + 1}`, percentage: avg });
  }

  const pieData = [
    { name: 'Goal Reached', value: totalCompleted, fill: '#8b7f74' },
    { name: 'Remaining', value: totalLeft, fill: '#e5e7eb' },
  ];

  // Group days by week for the grid header
  const gridWeeks: { name: string, days: number[] }[] = [];
  let currentGridWeek = { name: 'Week 1', days: [] as number[] };
  days.forEach(day => {
    currentGridWeek.days.push(day);
    if (currentGridWeek.days.length === 7 || day === daysInMonth) {
      gridWeeks.push(currentGridWeek);
      currentGridWeek = { name: `Week ${gridWeeks.length + 1}`, days: [] };
    }
  });

  // Habit Analysis
  const getHabitStats = (habitId: string) => {
    const actual = Object.values(entries).filter(e => e.completions[habitId]).length;
    const goal = daysInMonth;
    const left = goal - actual;
    const progress = (actual / goal) * 100;
    return { goal, actual, left, progress };
  };

  const topHabits = [...habits]
    .map(h => ({ ...h, stats: getHabitStats(h.id) }))
    .sort((a, b) => b.stats.actual - a.stats.actual)
    .slice(0, 10);

  const handleAddHabit = () => {
    if (newHabit.name.trim()) {
      addHabit(newHabit.name, newHabit.emoji);
      setNewHabit({ name: '', emoji: '📝' }); // Reset for next addition
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-gray-100 dark:bg-slate-900 min-h-screen p-2 md:p-4 pb-20 font-sans text-slate-800 dark:text-slate-200">

      {/* Add Habit Modal */}
      {isAddingHabit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 border border-gray-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Habits</h2>
            <p className="text-sm text-gray-500 mb-4 mt-1">Create as many habits as you need.</p>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="w-16 relative">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">Emoji</label>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-full h-[46px] rounded-lg border border-gray-300 flex items-center justify-center text-xl dark:border-gray-600 dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    {newHabit.emoji}
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-2 z-[110] shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setNewHabit({ ...newHabit, emoji: emojiData.emoji });
                          setShowEmojiPicker(false);
                        }}
                        autoFocusSearch={false}
                        searchDisabled={true}
                        skinTonesDisabled={true}
                        width={280}
                        height={350}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">Habit Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Read 10 pages"
                    className="w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-600 dark:bg-slate-700 outline-none focus:border-[#8b7f74] focus:ring-1 focus:ring-[#8b7f74]"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setIsAddingHabit(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleAddHabit}
                  disabled={!newHabit.name.trim()}
                  className="rounded-lg bg-[#8b7f74] px-5 py-2 text-sm font-bold text-white hover:bg-[#5c544d] disabled:opacity-50 transition-colors shadow-sm"
                >
                  Save & Add Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Habit Modal */}
      {editingHabit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 border border-gray-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Habit</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-600 dark:bg-slate-700 outline-none focus:border-[#8b7f74]"
                  value={editingHabit.name}
                  onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Emoji</label>
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-16 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-xl dark:border-gray-600 dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    {editingHabit.emoji}
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-2 z-[110] shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setEditingHabit({ ...editingHabit, emoji: emojiData.emoji });
                          setShowEmojiPicker(false);
                        }}
                        autoFocusSearch={false}
                        searchDisabled={true}
                        skinTonesDisabled={true}
                        width={280}
                        height={350}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                <button
                  onClick={() => setEditingHabit(null)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateHabit(editingHabit.id, { name: editingHabit.name, emoji: editingHabit.emoji });
                    setEditingHabit(null);
                  }}
                  className="rounded-lg bg-[#8b7f74] px-5 py-2 text-sm font-bold text-white hover:bg-[#5c544d] transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP SECTION: Dashboard Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* Calendar Settings */}
        <div className="xl:col-span-2 bg-[#d1c7bc] dark:bg-slate-800 rounded-xl p-4 shadow flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-[#5c544d] dark:text-slate-300">
              Habit Tracker
            </h2>
            <div className="mt-2 text-center bg-[#5c544d] dark:bg-slate-700 text-white py-1 px-4 rounded font-bold uppercase tracking-widest text-sm">
              - {getMonthName(currentMonth)} -
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase bg-[#5c544d] dark:bg-slate-700 text-white px-2 py-1 mb-2">
              Calendar Settings
            </h3>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="w-full mb-2 p-1 text-center bg-white/50 dark:bg-slate-900 border-none rounded text-sm font-semibold"
            >
              {[2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="w-full p-1 text-center bg-white/50 dark:bg-slate-900 border-none rounded text-sm font-semibold"
            >
              {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{getMonthName(i)}</option>)}
            </select>
          </div>
        </div>

        {/* Daily Progress Chart */}
        <div className="xl:col-span-4 bg-[#e9e4df] dark:bg-slate-800 rounded-xl p-4 shadow relative">
          <h3 className="text-sm font-bold text-center text-[#5c544d] dark:text-slate-400 mb-2">Daily Progress</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#a39a92" tickFormatter={t => `${t}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', color: '#000' }} cursor={{ fill: '#00000010' }} />
                <Bar dataKey="percentage" fill="#8b7f74" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="xl:col-span-3 bg-[#e9e4df] dark:bg-slate-800 rounded-xl p-4 shadow">
          <h3 className="text-sm font-bold text-center text-[#5c544d] dark:text-slate-400 mb-2">Weekly Progress</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeks} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barCategoryGap="20%">
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#a39a92" tickFormatter={t => `${t}%`} />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="#a39a92" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', color: '#000' }} cursor={{ fill: '#00000010' }} />
                <Bar dataKey="percentage" fill="#a19488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Numeric Stats */}
        <div className="xl:col-span-1 flex flex-col gap-2">
          <div className="flex-1 bg-[#dcd5cd] dark:bg-slate-800 rounded-xl p-2 flex flex-col items-center justify-center shadow">
            <span className="text-xs uppercase font-bold text-[#5c544d] dark:text-slate-400">Goal</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">{totalGoal}</span>
          </div>
          <div className="flex-1 bg-[#dcd5cd] dark:bg-slate-800 rounded-xl p-2 flex flex-col items-center justify-center shadow">
            <span className="text-xs uppercase font-bold text-[#5c544d] dark:text-slate-400">Completed</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">{totalCompleted}</span>
          </div>
          <div className="flex-1 bg-[#dcd5cd] dark:bg-slate-800 rounded-xl p-2 flex flex-col items-center justify-center shadow">
            <span className="text-xs uppercase font-bold text-[#5c544d] dark:text-slate-400">Left</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">{totalLeft}</span>
          </div>
        </div>

        {/* Overall Stats Pie Chart */}
        <div className="xl:col-span-2 bg-[#d1c7bc] dark:bg-slate-800 rounded-xl p-4 shadow flex flex-col items-center justify-center relative">
          <h3 className="text-sm font-bold w-full bg-[#5c544d] dark:bg-slate-700 text-white text-center absolute top-4 px-2 py-1">
            Overall Progress
          </h3>
          <div className="w-full h-32 mt-6 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius="65%" outerRadius="90%" dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-sm font-bold text-[#5c544d] dark:text-white">{overallPercent}%</span>
              <p className="text-[8px] uppercase font-bold text-gray-500">Achieved</p>
            </div>
          </div>
        </div>

      </div>

      {/* MIDDLE SECTION: THE MEGA GRID */}
      <div className="bg-[#e9e4df] dark:bg-slate-800 rounded-xl shadow overflow-hidden flex flex-col">
        <div className="w-full">
          <table className="w-full text-[10px] text-center border-collapse table-fixed">
            <thead>
              {/* Top Header Row (Week Groupings & Analysis) */}
              <tr className="bg-[#dcd5cd] dark:bg-slate-700 text-[#5c544d] dark:text-slate-300">
                <th rowSpan={2} className="border-r border-[#cfc8c0] dark:border-slate-600 p-1 text-left w-32 font-bold truncate">
                  My Habits
                  <button
                    onClick={() => setIsAddingHabit(true)}
                    className="ml-1 text-[9px] bg-white/50 dark:bg-slate-800 dark:text-white px-1.5 py-0.5 rounded hover:bg-white transition-colors"
                  >
                    + Add
                  </button>
                </th>
                {gridWeeks.map((week, idx) => (
                  <th key={idx} colSpan={week.days.length} className="border-r border-[#cfc8c0] dark:border-slate-600 p-0 font-semibold border-b text-[9px]">
                    {week.name}
                  </th>
                ))}
                <th colSpan={4} className="p-0 font-bold bg-[#8b7f74] text-white dark:bg-slate-600 border-b border-[#cfc8c0] dark:border-slate-600">
                  Analysis
                </th>
              </tr>
              {/* Sub Header Row (Days of Week) */}
              <tr className="bg-[#e0d9d2] dark:bg-slate-700 text-[#5c544d] dark:text-slate-300">
                {days.map(day => {
                  const date = new Date(currentYear, currentMonth, day);
                  const dayName = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <th key={day} className={`border-r border-[#cfc8c0] dark:border-slate-600 p-0 ${isToday ? 'bg-[#d1c7bc] dark:bg-slate-600' : ''}`}>
                      <div className="flex flex-col items-center leading-tight py-0.5">
                        <span className="font-medium text-[8px]">{dayName}</span>
                        <span className="font-bold">{day}</span>
                      </div>
                    </th>
                  );
                })}
                <th className="border-r border-[#cfc8c0] dark:border-slate-600 w-8">Goal</th>
                <th className="border-r border-[#cfc8c0] dark:border-slate-600 w-8">Act.</th>
                <th className="border-r border-[#cfc8c0] dark:border-slate-600 w-8">Left</th>
                <th className="w-16">Prog.</th>
              </tr>
            </thead>
            <tbody>
              {habits.map((habit, hIdx) => {
                const stats = getHabitStats(habit.id);
                return (
                  <tr key={habit.id} className={hIdx % 2 === 0 ? 'bg-[#f0ebe6] dark:bg-slate-800' : 'bg-[#e9e4df] dark:bg-slate-800/80'}>
                    <td
                      className="group relative border-r border-t border-[#cfc8c0] dark:border-slate-600 p-2 text-left font-medium text-slate-700 dark:text-slate-300 truncate max-w-[192px] cursor-pointer hover:bg-white/50"
                      onClick={() => {
                        let e = '📝';
                        let n = habit.name;
                        const match = habit.name.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u);
                        if (match) {
                          e = match[1];
                          n = match[2];
                        } else if (habit.emoji) {
                          e = habit.emoji;
                          n = habit.name;
                        }
                        setEditingHabit({ ...habit, name: n, emoji: e });
                        setShowEmojiPicker(false);
                      }}
                    >
                      {habit.emoji || ''} {habit.name}
                      <span className="absolute right-1 top-1 hidden text-[8px] group-hover:block opacity-50">✏️</span>
                    </td>
                    {days.map(day => {
                      const dateStr = formatDate(new Date(currentYear, currentMonth, day));
                      const isCompleted = entries[dateStr]?.completions[habit.id] || false;
                      const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();
                      const isDisabled = !isToday;

                      return (
                        <td key={day} className={`border-r border-t border-[#cfc8c0] dark:border-slate-600 p-0 ${!isDisabled ? 'hover:bg-white/30 dark:hover:bg-slate-600' : ''} transition-colors`}>
                          <button
                            disabled={isDisabled}
                            onClick={() => toggleHabit(dateStr, habit.id, !isCompleted)}
                            className={`w-full h-6 flex items-center justify-center cursor-pointer ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''} ${isToday ? 'bg-white/40 dark:bg-slate-700' : ''}`}
                            title={isToday ? "Toggle for today" : "Can only track for today"}
                          >
                            {isCompleted ? (
                              <div className="w-2.5 h-2.5 bg-[#8b7f74] dark:bg-slate-400 rounded-sm"></div>
                            ) : (
                              <div className="w-2.5 h-2.5 border border-gray-400 rounded-sm dark:border-gray-500"></div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                    {/* Analysis Cells */}
                    <td className="border-r border-t border-[#cfc8c0] dark:border-slate-600 font-bold text-[#8b7f74] dark:text-slate-400">{stats.goal}</td>
                    <td className="border-r border-t border-[#cfc8c0] dark:border-slate-600 font-bold text-emerald-600">{stats.actual}</td>
                    <td className="border-r border-t border-[#cfc8c0] dark:border-slate-600 font-bold text-rose-500">{stats.left}</td>
                    <td className="border-t border-[#cfc8c0] dark:border-slate-600 p-1">
                      <div className="h-3 w-full bg-gray-300 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[#8b7f74] dark:bg-slate-400 transition-all" style={{ width: `${stats.progress}%` }}></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {habits.length === 0 && (
                <tr>
                  <td colSpan={days.length + 5} className="p-8 text-center text-gray-500 border-t border-[#cfc8c0] dark:border-slate-600">
                    No habits found. Click "+ Add" to start tracking!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTTOM SECTION: Additional Trackers (Mocked per layout) & Top Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Daily Completion Trend */}
        <div className="lg:col-span-2 bg-[#e9e4df] dark:bg-slate-800 rounded-xl p-4 shadow flex flex-col relative overflow-hidden">
          <h3 className="text-sm font-bold text-[#5c544d] dark:text-slate-400 mb-4 uppercase border-b border-[#cfc8c0] pb-1">Daily Completion Activity</h3>
          <div className="h-48 w-full z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b7f74" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b7f74" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cfc8c0" vertical={false} opacity={0.5} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#a39a92" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#a39a92" tickFormatter={t => `${t}%`} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfc8c0', color: '#5c544d', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="percentage" stroke="#8b7f74" strokeWidth={3} fillOpacity={1} fill="url(#colorPercentage)" activeDot={{ r: 6, fill: "#5c544d", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Daily Habit List */}
        <div className="bg-[#e9e4df] dark:bg-slate-800 rounded-xl p-4 shadow h-64 overflow-y-auto">
          <h3 className="text-sm font-bold text-center bg-[#8b7f74] dark:bg-slate-700 text-white py-1 uppercase tracking-wider mb-2 rounded">
            Top 10 Daily Habits
          </h3>
          <ul className="space-y-1">
            {topHabits.map((h, i) => (
              <li key={h.id} className="flex justify-between items-center text-xs p-1 border-b border-gray-300 dark:border-slate-600 last:border-0">
                <span className="font-bold text-[#5c544d] dark:text-slate-400 w-4">{i + 1}</span>
                <span className="flex-1 font-medium ml-2 text-slate-800 dark:text-slate-200 truncate">{h.emoji} {h.name}</span>
                <span className="font-bold text-[#8b7f74] dark:text-slate-300 ml-2">{h.stats.progress.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
