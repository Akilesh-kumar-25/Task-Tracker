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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#8b7f74] border-t-transparent" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col min-h-screen overflow-hidden">
        {/* Sticky Top Bar */}
        <div className="p-4 flex items-center justify-between sticky top-0 z-30 bg-gray-50/90 dark:bg-slate-950/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <span className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
              HabitTracker | Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={() => {
                document.documentElement.classList.toggle('dark');
              }}
              className="p-2 rounded-full bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Dark Mode"
            >
              💡
            </button>

            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </div>

        <div className="flex-1 p-2 md:p-6 w-full max-w-[100vw] overflow-x-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
