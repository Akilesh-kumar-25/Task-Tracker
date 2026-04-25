'use client';

interface StatCardProps {
  icon?: string;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

export default function StatCard({
  icon,
  label,
  value,
  subtext,
  trend,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 cursor-pointer hover:shadow-lg smooth-transition"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {icon} {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtext && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {subtext}
            </p>
          )}
        </div>
        {trend && (
          <span
            className={`text-2xl ${
              trend === 'up'
                ? 'text-green-500'
                : trend === 'down'
                ? 'text-red-500'
                : 'text-gray-500'
            }`}
          >
            {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}
