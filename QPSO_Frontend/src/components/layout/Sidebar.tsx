import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network as NetworkIcon,
  Cpu,
  CheckCircle2,
  TrendingDown,
  BarChart3,
  BookOpen,
  FileSpreadsheet,
  Sun,
  Moon,
  Zap,
  Package,
} from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { cn } from '../../lib/cn';

const PRIMARY_NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/orders', label: 'Bulk Orders', icon: Package },
  { path: '/network', label: 'Network', icon: NetworkIcon },
  { path: '/optimizer', label: 'Optimizer', icon: Cpu },
  { path: '/results', label: 'Results', icon: CheckCircle2 },
  { path: '/convergence', label: 'Convergence', icon: TrendingDown },
  { path: '/benchmark', label: 'Benchmark', icon: BarChart3 },
];

const SECONDARY_NAV_ITEMS = [
  { path: '/formulation', label: 'Formulation', icon: BookOpen },
  { path: '/deliverables', label: 'Deliverables', icon: FileSpreadsheet },
];

export const Sidebar: React.FC = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const { isRunning, currentIteration, params } = useOptimizerStore();

  return (
    <aside className="w-56 h-screen bg-bg-surface border-r border-border-subtle flex flex-col justify-between shrink-0 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-accent flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h1 className="text-xs font-semibold tracking-tight text-text-primary uppercase">
                Q-Ways
              </h1>
              <p className="text-[10px] text-text-muted leading-none mt-0.5">
                Quantum Route Optimizer
              </p>
            </div>
          </div>
        </div>

        {/* Primary 6-Item Navigation */}
        <nav className="p-2 space-y-0.5">
          <div className="px-2 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
            Workspace
          </div>
          {PRIMARY_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-bg-subtle text-accent-text font-semibold border-l-2 border-accent rounded-l-none'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle/60'
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0 stroke-[1.5]" />
              <span>{item.label}</span>
              {item.path === '/optimizer' && isRunning && (
                <span className="ml-auto w-2 h-2 rounded-full bg-accent animate-pulse" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Secondary Specifications */}
        <nav className="p-2 pt-2 border-t border-border-subtle space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
            Reference
          </div>
          {SECONDARY_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-bg-subtle text-accent-text font-semibold border-l-2 border-accent rounded-l-none'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle/60'
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0 stroke-[1.5]" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Controls & Live State */}
      <div className="p-3 border-t border-border-subtle bg-bg-base/40 space-y-2.5">
        {/* Live solver status */}
        <div className="flex items-center justify-between text-[11px] px-1 text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isRunning ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
              )}
            />
            <span className="font-mono text-[10px]">
              {isRunning ? `Iter ${currentIteration}/${params.iterations}` : 'Engine Ready'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">{params.algorithm}</span>
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded border border-border-subtle bg-bg-surface hover:bg-bg-subtle text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <span className="flex items-center gap-2 text-[11px]">
            {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span>Theme</span>
          </span>
          <span className="font-mono text-[10px] uppercase text-text-muted">
            {isDark ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>
    </aside>
  );
};
