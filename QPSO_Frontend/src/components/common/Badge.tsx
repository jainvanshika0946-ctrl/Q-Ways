import React from 'react';
import { cn } from '../../lib/cn';
import { TrafficLevel } from '../../api/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'traffic-low' | 'traffic-moderate' | 'traffic-heavy' | 'traffic-jammed' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  const variantStyles = {
    default: 'bg-bg-subtle text-text-secondary border-border-subtle',
    accent: 'bg-accent-subtle text-accent-text border-accent/20 font-medium',
    'traffic-low': 'bg-emerald-500/10 text-traffic-low border-emerald-500/20',
    'traffic-moderate': 'bg-amber-500/10 text-traffic-moderate border-amber-500/20',
    'traffic-heavy': 'bg-orange-500/10 text-traffic-heavy border-orange-500/20',
    'traffic-jammed': 'bg-rose-500/10 text-traffic-jammed border-rose-500/20',
    outline: 'bg-transparent text-text-secondary border-border-default',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-md',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border font-medium whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const TrafficBadge: React.FC<{ level: TrafficLevel; className?: string }> = ({
  level,
  className,
}) => {
  const map: Record<TrafficLevel, { label: string; variant: BadgeProps['variant'] }> = {
    low: { label: 'Free Flow (1.0x)', variant: 'traffic-low' },
    moderate: { label: 'Moderate (1.4x)', variant: 'traffic-moderate' },
    heavy: { label: 'Heavy (1.9x)', variant: 'traffic-heavy' },
    jammed: { label: 'Gridlock (2.8x)', variant: 'traffic-jammed' },
  };

  const info = map[level] || map.low;
  return (
    <Badge variant={info.variant} className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-0.5" />
      {info.label}
    </Badge>
  );
};
