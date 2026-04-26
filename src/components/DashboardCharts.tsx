'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, LineChart, Line, Cell } from 'recharts';
import { Trophy } from 'lucide-react';

interface Props {
  dailyData: any[];
  streak: number;
  monthPercent: number;
  completionDays: number;
  totalHabits: number;
}

export default function DashboardCharts({ dailyData, streak, monthPercent, completionDays, totalHabits }: Props) {
  const chartProps = { isAnimationActive: true, animationDuration: 1000 };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">

      {/* 1. THE MASTERY HUB - Redesigned for "Premium" feel */}
      <div className="xl:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#8b7f74]/5 rounded-full blur-3xl group-hover:bg-[#8b7f74]/10 transition-all duration-500" />

        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74]">Monthly Mastery</h3>
            <div className="text-3xl font-heading italic text-[#5c544d] dark:text-white">
              {Math.round(monthPercent)}<span className="text-lg not-italic opacity-40">%</span>
            </div>
          </div>

          {/* THE STREAK 🔥 - Made very prominent */}
          <div className="flex flex-col items-center bg-rose-50 dark:bg-rose-950/20 px-4 py-2 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-inner group/streak hover:scale-105 transition-transform cursor-default">
            <span className="text-2xl drop-shadow-sm group-hover/streak:animate-bounce">🔥</span>
            <span className="text-sm font-black text-rose-600 dark:text-rose-400">{streak}</span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-rose-400 opacity-60">Streak</span>
          </div>
        </div>

        {/* Big Progress Ring */}
        <div className="mt-6 flex items-center gap-6">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100 dark:text-slate-700" />
              <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * monthPercent) / 100} className="text-[#8b7f74] transition-all duration-1000 ease-out" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#8b7f74] rounded-full animate-ping" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-gray-400">Total Progress</span>
              <span className="text-[#5c544d] dark:text-white">{Math.round(monthPercent)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#d1c7bc] to-[#8b7f74] transition-all duration-1000" style={{ width: `${monthPercent}%` }} />
            </div>
            <p className="text-[9px] text-gray-400 leading-tight">Your work is calculated from day 1 of the month.</p>
          </div>
        </div>
      </div>

      {/* 2. DAILY VELOCITY - Bar chart with sleek colors */}
      <div className="xl:col-span-5 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xl border border-gray-100 dark:border-slate-700 h-52">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74]">Daily Velocity</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400"><div className="w-2 h-2 bg-[#5c544d] rounded-full" /> DONE</div>
            <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400"><div className="w-2 h-2 bg-[#e9e4df] rounded-full" /> PENDING</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -35, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.03} />
            <XAxis dataKey="day" hide />
            <YAxis tick={{ fontSize: 9 }} stroke="#a39a92" axisLine={false} tickLine={false} domain={[0, Math.max(totalHabits, 1)]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }}
              cursor={{ fill: 'rgba(92, 84, 77, 0.05)' }}
            />
            <Bar dataKey="completed" stackId="a" fill="#5c544d" radius={[0, 0, 0, 0]} {...chartProps} />
            <Bar dataKey="pending" stackId="a" fill="#e9e4df" radius={[4, 4, 0, 0]} {...chartProps} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. ANNUAL MASTERY - Quick metrics */}
      <div className="xl:col-span-3 flex flex-col gap-4">
        <div className="flex-1 bg-[#5c544d] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10"><Trophy size={60} /></div>
          <h3 className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Annual Goal</h3>
          <div className="text-3xl font-heading italic">{completionDays} <span className="text-sm not-italic opacity-40">/ 365 Days</span></div>
          <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(completionDays / 365) * 100}%` }} />
          </div>
        </div>
        <div className="flex-1 bg-[#d1c7bc] dark:bg-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-center">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-[#5c544d] dark:text-slate-400 mb-1">Consistency</h3>
          <div className="text-2xl font-bold text-[#5c544d] dark:text-white">{Math.round((completionDays / 365) * 100)}%</div>
          <p className="text-[8px] font-bold text-[#5c544d]/50 dark:text-slate-500 uppercase mt-1">Year-to-date completion</p>
        </div>
      </div>

      {/* 4. LONG TERM TREND - Full width at bottom of charts */}
      <div className="xl:col-span-12 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-gray-100 dark:border-slate-700 h-40 group/trend">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8b7f74]">Consistency Trend</h3>
          <span className="text-[9px] font-bold text-[#8b7f74] opacity-0 group-hover/trend:opacity-100 transition-opacity">Dynamic month-over-month view</span>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="min-w-[500px] h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b7f74" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#8b7f74" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" hide />
                <YAxis hide domain={[0, 100]} />
                <Line type="monotone" dataKey="percentage" stroke="#5c544d" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#8b7f74' }} {...chartProps} />
                <Tooltip 
                  contentStyle={{ fontSize: '10px', borderRadius: '12px' }} 
                  formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Consistency']}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
