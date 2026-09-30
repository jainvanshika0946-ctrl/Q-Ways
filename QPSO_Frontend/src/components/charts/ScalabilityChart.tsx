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
} from 'recharts';
import { ScalabilityPoint } from '../../api/types';

interface ScalabilityChartProps {
  data: ScalabilityPoint[];
  height?: number;
}

export const ScalabilityChart: React.FC<ScalabilityChartProps> = ({
  data,
  height = 320,
}) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
          <XAxis
            dataKey="nodes"
            stroke="var(--color-text-muted)"
            fontSize={11}
            tickLine={false}
            tickMargin={8}
            label={{ value: 'Network Size (|V| Nodes)', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'var(--color-text-muted)' }}
          />
          <YAxis
            stroke="var(--color-text-muted)"
            fontSize={11}
            tickLine={false}
            label={{ value: 'Runtime (ms, Log Scale)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: 'var(--color-text-muted)' }}
            scale="log"
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={(value: any) => [`${Number(value).toLocaleString()} ms`, '']}
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
          <Line
            type="monotone"
            dataKey="QPSO"
            name="QPSO (Proposed)"
            stroke="#0F766E"
            strokeWidth={3}
            dot={{ r: 4, fill: '#0F766E' }}
          />
          <Line
            type="monotone"
            dataKey="PSO"
            name="Classical PSO"
            stroke="#D97706"
            strokeWidth={1.8}
            strokeDasharray="4 4"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="GA"
            name="Genetic Algo"
            stroke="#2563EB"
            strokeWidth={1.8}
            strokeDasharray="2 2"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="ACO"
            name="Ant Colony (ACO)"
            stroke="#7C3AED"
            strokeWidth={1.8}
            strokeDasharray="6 2"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="ORTools"
            name="OR-Tools / B&B (Exact)"
            stroke="#DC2626"
            strokeWidth={2}
            strokeDasharray="1 1"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
