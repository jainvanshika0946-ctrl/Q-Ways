import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, CheckCircle } from 'lucide-react';
import { Card } from '../components/common/Card';

interface DeliverableItem {
  id: number;
  name: string;
  description: string;
  location: string;
  route: string;
}

const DELIVERABLES: DeliverableItem[] = [
  {
    id: 1,
    name: 'Graph-based network model',
    description: 'Road network as a weighted graph with editable edges and traffic levels',
    location: 'Network',
    route: '/network',
  },
  {
    id: 2,
    name: 'Mathematical formulation',
    description: 'Objective function + constraints for CVRPTW and QPSO tunneling in KaTeX',
    location: 'Formulation',
    route: '/formulation',
  },
  {
    id: 3,
    name: 'QPSO optimization engine',
    description: 'Quantum-inspired metaheuristic solver avoiding premature local minima',
    location: 'Optimizer',
    route: '/optimizer',
  },
  {
    id: 4,
    name: 'Constraint handling',
    description: 'Fleet capacity, customer demand, time-windows, and dynamic congestion penalties',
    location: 'Optimizer / Formulation',
    route: '/optimizer',
  },
  {
    id: 5,
    name: 'Convergence analysis',
    description: 'Best-cost vs iteration trajectories for QPSO, PSO, GA, and ACO',
    location: 'Convergence',
    route: '/convergence',
  },
  {
    id: 6,
    name: 'Performance benchmarking',
    description: 'Sortable Monte Carlo benchmark comparing QPSO vs PSO/GA/ACO/Dijkstra/OR-Tools',
    location: 'Benchmark',
    route: '/benchmark',
  },
  {
    id: 7,
    name: 'Scalability demonstration',
    description: 'Runtime and quality scaling vs network size across 50, 100, 200, 500 nodes',
    location: 'Benchmark',
    route: '/benchmark',
  },
  {
    id: 8,
    name: 'Route visualization',
    description: 'Interactive OpenStreetMap with color-coded per-vehicle dispatch routes',
    location: 'Optimizer / Results',
    route: '/results',
  },
  {
    id: 9,
    name: 'Documentation and demo',
    description: 'Usage guide, problem statement context, and pre-seeded metropolitan dataset',
    location: 'Overview',
    route: '/',
  },
];

export const Deliverables: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-border-subtle pb-3">
        <h2 className="text-base font-semibold text-text-primary">Deliverables Matrix</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Compliance mapping for Smart India Hackathon technical specification
        </p>
      </div>

      <Card title="Project Milestones & Platform Realization">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-medium text-text-secondary bg-bg-subtle border-b border-border-subtle">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-4">Deliverable</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 w-44">Where in Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {DELIVERABLES.map((item) => (
                <tr key={item.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-text-muted">{item.id}</td>
                  <td className="py-3 px-4 font-medium text-text-primary flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-traffic-low shrink-0" />
                    <span>{item.name}</span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary leading-relaxed">{item.description}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => navigate(item.route)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent-subtle hover:bg-accent/20 text-accent-text text-[11px] font-medium transition-colors"
                    >
                      <span>{item.location}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
