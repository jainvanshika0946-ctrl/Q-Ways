import React from 'react';
import { cn } from '../../lib/cn';

interface Option {
  value: string | number;
  label: string;
  badge?: string;
}

interface ParamFieldProps {
  label: string;
  description?: string;
  unit?: string;
  type?: 'number' | 'slider' | 'select';
  value: string | number;
  onChange: (val: any) => void;
  min?: number;
  max?: number;
  step?: number;
  options?: Option[];
  disabled?: boolean;
  className?: string;
}

export const ParamField: React.FC<ParamFieldProps> = ({
  label,
  description,
  unit,
  type = 'number',
  value,
  onChange,
  min,
  max,
  step = 1,
  options = [],
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-primary">
          {label}
        </label>
        {unit && (
          <span className="text-[11px] font-mono text-text-muted">{unit}</span>
        )}
      </div>

      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full text-xs bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:opacity-50 transition-colors"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'slider' ? (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className="flex-1 h-1.5 bg-bg-subtle rounded-lg appearance-none cursor-pointer accent-accent disabled:opacity-50"
          />
          <span className="font-mono text-xs text-text-primary w-12 text-right">
            {value}
          </span>
        </div>
      ) : (
        <div className="relative">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className="w-full text-xs font-mono bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:opacity-50 transition-colors"
          />
        </div>
      )}

      {description && (
        <span className="text-[11px] text-text-muted leading-tight">
          {description}
        </span>
      )}
    </div>
  );
};
