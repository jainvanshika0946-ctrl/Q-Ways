import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, RotateCcw } from 'lucide-react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useOptimizerStore } from '../../store/useOptimizerStore';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { graph } = useNetworkStore();
  const { isRunning, runOptimization, params } = useOptimizerStore();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Overview';
      case '/orders':
        return 'Bulk Orders & Dispatch Manifest';
      case '/network':
        return 'Road Network & Graph Topology';
      case '/optimizer':
        return 'Metaheuristic Solver';
      case '/results':
        return 'Vehicle Routing Results';
      case '/convergence':
        return 'Convergence & Multi-Algorithm Analysis';
      case '/benchmark':
        return 'Performance Benchmark & Scalability';
      case '/formulation':
        return 'Mathematical Formulation';
      case '/deliverables':
        return 'Deliverables Matrix';
      default:
        return 'Quantum Traffic Optimizer';
    }
  };

  return (
    <header className="h-12 border-b border-border-subtle bg-bg-surface px-6 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-semibold text-text-primary tracking-tight">
          {getPageTitle(location.pathname)}
        </h2>
        <span className="text-border-default">/</span>
        <div className="flex items-center gap-2 text-[11px] text-text-secondary font-mono">
          <span>{graph.name}</span>
          <span className="text-text-muted">({graph.nodes.length} nodes, {graph.edges.length} edges)</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {location.pathname !== '/optimizer' && (
          <button
            onClick={() => {
              if (location.pathname !== '/optimizer') {
                navigate('/optimizer');
              }
              runOptimization(graph);
            }}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-subtle disabled:opacity-50"
          >
            {isRunning ? (
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>{isRunning ? 'Solving...' : 'Run Optimization'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
