'use client';

interface StreakBadgeProps {
  current: number;
  best?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function StreakBadge({
  current,
  best,
  size = 'md',
}: StreakBadgeProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const getBadgeColor = () => {
    if (current === 0) return 'text-gray-400';
    if (current < 7) return 'text-orange-500';
    if (current < 30) return 'text-amber-500';
    return 'text-yellow-400';
  };

  return (
    <div className="flex items-center gap-1">
      <span className={`${sizeClasses[size]} ${getBadgeColor()}`}>🔥</span>
      <span className={`font-bold ${getBadgeColor()} ${sizeClasses[size]}`}>
        {current}
      </span>
      {best !== undefined && current < best && (
        <>
          <span className="text-xs text-gray-500">/</span>
          <span className="text-xs font-semibold text-gray-500">
            Best: {best}
          </span>
        </>
      )}
    </div>
  );
}
