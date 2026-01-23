'use client';

import { clsx } from 'clsx';

interface MetaBadgeProps {
  icon: React.ElementType;
  label: string;
  value: string;
  variant?: 'terracotta' | 'olive' | 'honey';
}

export default function MetaBadge({
  icon: Icon,
  label,
  value,
  variant = 'terracotta',
}: MetaBadgeProps) {
  const variants = {
    terracotta: 'bg-terracotta-100 text-terracotta-700',
    olive: 'bg-olive-100 text-olive-700',
    honey: 'bg-honey-100 text-honey-700',
  };

  return (
    <div className={clsx('badge', variants[variant])}>
      <Icon className="w-4 h-4" />
      <span className="font-medium">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  );
}
