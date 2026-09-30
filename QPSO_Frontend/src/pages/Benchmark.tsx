import React, { useMemo } from 'react';
import { Play, Download, RefreshCw } from 'lucide-react';
import { useBenchmarkStore } from '../store/useBenchmarkStore';
import { Card } from '../components/common/Card';
import { DataTable, Column } from '../components/common/DataTable';
import { ScalabilityChart } from '../components/charts/ScalabilityChart';
import { BenchmarkRow } from '../api/types';
import { exportBenchmarkToCSV } from '../lib/exportUtils';
import { formatMs, formatNumber } from '../lib/formatters';

export const Benchmark: React.FC = () => {
  const {
    instanceSize,
    setInstanceSize,
    results,
    isRunning,
    runBenchmark,
    sortColumn,
    sortDirection,
    setSorting,
    scalabilityData,
  } = useBenchmarkStore();

  const sortedRows = useMemo(() => {
    const rows = [...results.rows];
    return rows.sort((a, b) => {
      let valA: any = a[sortColumn];
      let valB: any = b[sortColumn];
      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [results.rows, sortColumn, sortDirection]);

  const columns: Column<BenchmarkRow>[] = [
    {
      key: 'algorithm',
      header: 'Algorithm',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary">{row.algorithm}</span>
          {row.algorithm === 'QPSO' && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent-subtle text-accent-text font-mono">
              Proposed
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'bestCost',
      header: 'Best Cost J(x)',
      align: 'right',
      sortable: true,
      highlightBest: 'min',
      render: (row) => formatNumber(row.bestCost, 1),
    },
    {
      key: 'avgCost',
      header: 'Mean Cost',
      align: 'right',
      sortable: true,
      highlightBest: 'min',
      render: (row) => formatNumber(row.avgCost, 1),
    },
    {
      key: 'stdDev',
      header: 'Std Dev (σ)',
      align: 'right',
      sortable: true,
      highlightBest: 'min',
      render: (row) => formatNumber(row.stdDev, 2),
    },
    {
      key: 'runtimeMs',
      header: 'Runtime (ms)',
      align: 'right',
      sortable: true,
      highlightBest: 'min',
      render: (row) => formatMs(row.runtimeMs),
    },
    {
      key: 'iterToConverge',
      header: 'Convergence Iter',
      align: 'right',
      sortable: true,
      highlightBest: 'min',
      render: (row) => `${row.iterToConverge} iter`,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Benchmark Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Performance Benchmark Matrix</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Comparative analysis over {results.runs} independent Monte Carlo runs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Instance size pill buttons */}
          <div className="flex items-center rounded border border-border-default bg-bg-surface p-0.5 text-xs font-mono">
            {[50, 100, 200, 500].map((size) => (
              <button
                key={size}
                onClick={() => setInstanceSize(size)}
                className={`px-2 py-1 rounded transition-colors ${
                  instanceSize === size
                    ? 'bg-accent text-white font-medium'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {size}n
              </button>
            ))}
          </div>

          <button
            onClick={runBenchmark}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-subtle disabled:opacity-50"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isRunning ? 'Benchmarking...' : 'Execute Run'}</span>
          </button>

          <button
            onClick={() => exportBenchmarkToCSV(results.rows, instanceSize)}
            className="p-1.5 rounded border border-border-default hover:bg-bg-subtle text-text-secondary hover:text-text-primary"
            title="Export Benchmark CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Benchmark Table */}
      <Card
        title={`Metaheuristic Comparison (${instanceSize} Nodes)`}
        subtitle="Green subtle tint denotes best performer in each respective metric"
      >
        <DataTable
          columns={columns}
          data={sortedRows}
          sortKey={sortColumn}
          sortDirection={sortDirection}
          onSort={setSorting}
          keyExtractor={(r) => r.algorithm}
        />
      </Card>

      {/* Scalability Chart */}
      <Card
        title="Computational Scalability: Runtime vs Network Size"
        subtitle="QPSO O(N log N) polynomial scaling vs OR-Tools combinatorial explosion"
      >
        <div className="pt-2">
          <ScalabilityChart data={scalabilityData} height={320} />
        </div>
      </Card>
    </div>
  );
};
