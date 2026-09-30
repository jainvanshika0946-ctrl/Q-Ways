import React from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  headerBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  headerBorder = false,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-subtle rounded-md shadow-subtle flex flex-col',
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div
          className={cn(
            'px-4 py-3 flex items-center justify-between',
            headerBorder && 'border-b border-border-subtle'
          )}
        >
          <div>
            {title && (
              <h3 className="text-sm font-medium text-text-primary tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
};
