import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { ConvergencePoint } from '../../api/types';

interface ConvergenceChartProps {
  data: ConvergencePoint[];
  overlays?: {
    pso?: ConvergencePoint[];
    ga?: ConvergencePoint[];
    aco?: ConvergencePoint[];
  };
  convergedIter?: number;
  height?: number;
}

export const ConvergenceChart: React.FC<ConvergenceChartProps> = ({
  data,
  overlays,
  convergedIter = 48,
  height = 320,
}) => {
  // Merge main data with overlays if provided
  const chartData = data.map((d, index) => ({
    iter: d.iter,
    QPSO: d.best,
    MeanQPSO: d.mean,
    PSO: overlays?.pso?.[index]?.best,
    GA: overlays?.ga?.[index]?.best,
    ACO: overlays?.aco?.[index]?.best,
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
          <XAxis
            dataKey="iter"
            stroke="var(--color-text-muted)"
            fontSize={11}
            tickLine={false}
            tickMargin={8}
            label={{ value: 'Iterations (t)', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'var(--color-text-muted)' }}
          />
          <YAxis
            stroke="var(--color-text-muted)"
            fontSize={11}
            tickLine={false}
            domain={['auto', 'auto']}
            label={{ value: 'Total Cost J(x)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 10, fill: 'var(--color-text-muted)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'monospace',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
          />

          {convergedIter && (
            <ReferenceLine
              x={convergedIter}
              stroke="#0F766E"
              strokeDasharray="3 3"
              label={{
                value: `Converged (${convergedIter})`,
                fill: 'var(--color-accent-text)',
                fontSize: 10,
                position: 'top',
              }}
            />
          )}

          <Line
            type="monotone"
            dataKey="QPSO"
            name="QPSO (Quantum)"
            stroke="#0F766E"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
          {overlays?.pso && (
            <Line
              type="monotone"
              dataKey="PSO"
              name="Classical PSO"
              stroke="#D97706"
              strokeWidth={1.8}
              strokeDasharray="4 4"
              dot={false}
            />
          )}
          {overlays?.ga && (
            <Line
              type="monotone"
              dataKey="GA"
              name="Genetic Algorithm"
              stroke="#2563EB"
              strokeWidth={1.8}
              strokeDasharray="2 2"
              dot={false}
            />
          )}
          {overlays?.aco && (
            <Line
              type="monotone"
              dataKey="ACO"
              name="Ant Colony (ACO)"
              stroke="#7C3AED"
              strokeWidth={1.8}
              strokeDasharray="6 2"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
