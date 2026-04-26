'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfileDropdown from '@/components/ProfileDropdown';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0ebe6] dark:bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#8b7f74] border-t-transparent" />
          <p className="text-[#5c544d] dark:text-gray-400 font-medium font-sans">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f0ebe6] dark:bg-slate-950 transition-colors duration-500">
      <main className="flex-1 w-full flex flex-col min-h-screen overflow-hidden">
        {/* Sticky Top Bar - REDESIGNED */}
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-30 bg-[#f0ebe6]/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-[#d1c7bc] dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#5c544d] flex items-center justify-center text-white font-serif italic text-lg shadow-lg">H</div>
            <div className="h-8 w-px bg-[#d1c7bc] dark:bg-slate-800"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5c544d]/50 dark:text-slate-500 mb-0.5">Matrix Portal</span>
              <h1 className="text-xl font-heading italic text-[#5c544d] dark:text-white leading-none">
                Welcome back, <span className="font-bold not-italic">{user?.displayName?.split(' ')[0] || 'User'}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Theme Toggle */}
            <button
              onClick={() => {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
              }}
              className="p-2.5 rounded-2xl bg-[#d1c7bc]/20 dark:bg-slate-800/50 text-[#5c544d] dark:text-slate-400 hover:bg-[#d1c7bc]/40 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
              title="Toggle Theme"
            >
              <span className="text-xl dark:hidden">☀️</span>
              <span className="text-xl hidden dark:inline">🌙</span>
            </button>

            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 w-full max-w-[100vw] overflow-x-auto font-sans">
          {children}
        </div>
      </main>
    </div>
  );
}
