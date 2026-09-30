import React from 'react';
import { cn } from '../../lib/cn';

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: string;
    isPositive?: boolean; // e.g. saved is positive
  };
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const Stat: React.FC<StatProps> = ({
  label,
  value,
  unit,
  delta,
  description,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-subtle rounded-md p-4 flex flex-col justify-between shadow-subtle',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-semibold tracking-tight text-text-primary">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-text-muted">{unit}</span>
        )}
      </div>

      {(delta || description) && (
        <div className="mt-2 flex items-center justify-between text-xs">
          {delta && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-mono font-medium',
                delta.isPositive ? 'text-traffic-low' : 'text-text-secondary'
              )}
            >
              {delta.value}
            </span>
          )}
          {description && (
            <span className="text-text-muted truncate ml-1">{description}</span>
          )}
        </div>
      )}
    </div>
  );
};
