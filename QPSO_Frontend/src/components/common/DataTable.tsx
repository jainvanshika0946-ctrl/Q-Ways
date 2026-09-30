import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  highlightBest?: 'min' | 'max';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: any) => void;
  keyExtractor: (row: T, index: number) => string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  sortKey,
  sortDirection = 'asc',
  onSort,
  keyExtractor,
  className,
}: DataTableProps<T>) {
  // Compute best value per column if highlightBest is specified
  const bestValues: Record<string, number> = {};
  columns.forEach((col) => {
    if (col.highlightBest && typeof col.key === 'string') {
      const numericValues = data
        .map((d) => Number(d[col.key]))
        .filter((v) => !isNaN(v));
      if (numericValues.length > 0) {
        bestValues[col.key] =
          col.highlightBest === 'min'
            ? Math.min(...numericValues)
            : Math.max(...numericValues);
      }
    }
  });

  return (
    <div
      className={cn(
        'w-full overflow-x-auto border border-border-subtle rounded-md bg-bg-surface shadow-subtle',
        className
      )}
    >
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-bg-subtle text-text-secondary border-b border-border-subtle font-medium">
          <tr>
            {columns.map((col) => {
              const colKey = String(col.key);
              const isSorted = sortKey === colKey;
              return (
                <th
                  key={colKey}
                  onClick={() => col.sortable && onSort?.(colKey)}
                  className={cn(
                    'px-3.5 py-2.5 font-medium select-none',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.sortable && 'cursor-pointer hover:text-text-primary'
                  )}
                >
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      col.align === 'right' && 'flex-row-reverse'
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-text-muted">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-accent" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-accent" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-text-muted text-xs"
              >
                No records to display.
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyExtractor(row, idx)}
                className="hover:bg-bg-subtle/50 transition-colors"
              >
                {columns.map((col) => {
                  const colKey = String(col.key);
                  const rawVal = row[colKey];
                  const isBest =
                    col.highlightBest &&
                    typeof rawVal === 'number' &&
                    rawVal === bestValues[colKey];

                  return (
                    <td
                      key={colKey}
                      className={cn(
                        'px-3.5 py-2 text-text-primary',
                        col.align === 'right'
                          ? 'text-right font-mono'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left',
                        isBest && 'bg-emerald-500/10 font-semibold text-traffic-low'
                      )}
                    >
                      {col.render ? col.render(row, idx) : rawVal}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
