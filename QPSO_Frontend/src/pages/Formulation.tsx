import React from 'react';
import { Card } from '../components/common/Card';
import { MathBlock } from '../components/common/MathBlock';

export const Formulation: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-border-subtle pb-3">
        <h2 className="text-base font-semibold text-text-primary">Mathematical Formulation</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Capacitated Vehicle Routing Problem with Time Windows (CVRPTW) & Dynamic Congestion Penalties
        </p>
      </div>

      {/* SECTION 0 */}
      <Card title="0. Decision Variables & Sets" subtitle="Network definitions and primary binary variables">
        <div className="space-y-3 text-xs text-text-secondary">
          <p>
            Let <span className="font-mono">G = (V, E)</span> be the urban transport network, <span className="font-mono">V = &#123;0, 1, &hellip;, n&#125;</span> where 0 is the Central Depot, <span className="font-mono">K</span> is the set of available vehicles.
          </p>
          <div className="p-3 rounded bg-bg-subtle border border-border-subtle text-text-primary space-y-2 font-mono text-[11px]">
            <p>x_ijk &isin; &#123;0, 1&#125; &mdash; 1 if vehicle k travels directly from node i to node j</p>
            <p>y_ik &isin; &#123;0, 1&#125; &mdash; 1 if stop i is served by vehicle k</p>
            <p>u_ik &isin; &reals; &mdash; auxiliary position variable for stop i on vehicle k's route (used for subtour elimination)</p>
          </div>
        </div>
      </Card>

      {/* SECTION 1 */}
      <Card title="1. Global Objective Function" subtitle="Minimizing aggregate transit distance, time delay, congestion impact, capacity overflow, and time-window violations">
        <div className="space-y-3 text-xs text-text-secondary">
          <p>
            A single soft-penalty objective, matching how the solver actually scores every candidate route.
          </p>
          <div className="p-3 rounded bg-bg-subtle border border-border-subtle my-2 text-text-primary">
            <MathBlock math="\min J = \sum_{k \in K} \sum_{i \in V} \sum_{j \in V} x_{ijk} \Big( w_1 \cdot d_{ij} + w_2 \cdot \tau_{ij}(t) \cdot c_{ij} \Big) + \lambda_{cap} \sum_{k \in K} \max\left(0, \sum_{i \in V} q_i y_{ik} - C_k\right) + \lambda_{tw} \sum_{i \in V} \max(0, \text{arrival}_i - b_i)" />
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Where <span className="font-mono">d_ij</span> is segment distance, <span className="font-mono">&tau;_ij(t)</span> is dynamic travel time under congestion, <span className="font-mono">c_ij</span> is edge congestion multiplier, <span className="font-mono">q_i</span> is parcel demand, <span className="font-mono">C_k</span> is vehicle capacity, <span className="font-mono">b_i</span> is deadline for stop i, <span className="font-mono">arrival_i</span> is actual arrival time, and <span className="font-mono">&lambda;_cap, &lambda;_tw</span> are penalty-barrier coefficients.
          </p>
          <p className="text-[11px] text-text-muted leading-relaxed border-t border-border-subtle pt-2">
            Both capacity and time-window violations are <strong>SOFT constraints</strong>: a route that overloads a vehicle or arrives late is not rejected outright — it is penalized, and the swarm learns to avoid costlier routes over time. This matches the solver's actual decoding behavior.
          </p>
        </div>
      </Card>

      {/* SECTION 2 */}
      <Card title="2. System Operational Constraints" subtitle="Flow conservation and subtour prevention">
        <div className="space-y-4 text-xs text-text-secondary">
          <div>
            <h4 className="font-medium text-text-primary mb-1">A. Flow Conservation & Single Visit:</h4>
            <p className="mb-2">Every stop is entered and left by exactly one vehicle:</p>
            <div className="p-2.5 rounded bg-bg-subtle border border-border-subtle text-text-primary space-y-2">
              <MathBlock math="\sum_{k \in K} \sum_{j \in V, j \ne i} x_{ijk} = 1, \quad \forall i \in V \setminus \{0\}" />
              <MathBlock math="\sum_{j \in V \setminus \{0\}} x_{0jk} = \sum_{j \in V \setminus \{0\}} x_{j0k} \le 1, \quad \forall k \in K" />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-text-primary mb-1">B. Subtour Elimination (MTZ Formulation):</h4>
            <p className="mb-2">Prevents a vehicle's route from forming a disconnected loop that never returns to the depot:</p>
            <div className="p-2.5 rounded bg-bg-subtle border border-border-subtle text-text-primary">
              <MathBlock math="u_{ik} - u_{jk} + |V| x_{ijk} \le |V| - 1, \quad \forall i, j \in V \setminus \{0\}, i \ne j, \forall k \in K" />
            </div>
          </div>

          <p className="text-[11px] text-text-muted border-t border-border-subtle pt-2">
            Capacity and time windows are enforced through the penalty terms in Section 1, not as separate hard constraints here — this keeps the formulation mathematically consistent.
          </p>
        </div>
      </Card>

      {/* SECTION 3 */}
      <Card title="3. Time-Window Handling" subtitle="Cumulative arrival tracking and lateness penalties">
        <div className="space-y-3 text-xs text-text-secondary">
          <p>
            Each stop <span className="font-mono">i</span> may carry an optional deadline <span className="font-mono">b_i</span> (minutes from depot departure). Arrival time is computed cumulatively along the route:
          </p>
          <div className="p-2.5 rounded bg-bg-subtle border border-border-subtle text-text-primary">
             <MathBlock math="\text{arrival}_i = \sum \Big( \tau_{ij}(t) \text{ for each edge traversed to reach } i \Big)" />
          </div>
          <p>Lateness penalty (only applied when a deadline exists):</p>
          <div className="p-2.5 rounded bg-bg-subtle border border-border-subtle text-text-primary">
             <MathBlock math="\text{penalty}_{tw}(i) = \rho \cdot \max(0, \text{arrival}_i - b_i)" />
          </div>
          <p className="text-[11px] text-text-muted">
            where <span className="font-mono">&rho;</span> is the per-minute lateness cost. A stop with no deadline contributes zero penalty. This is a soft constraint by design: a route that is slightly late to one stop is still valid and returnable — just more costly.
          </p>
        </div>
      </Card>

      {/* SECTION 4 */}
      <Card title="4. Quantum-Inspired PSO (QPSO) vs Classical PSO" subtitle="Why quantum tunneling outstrips classical velocity clamping">
        <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
          <p>
            In <span className="font-medium text-text-primary">Classical PSO</span>, each particle moves with an explicit velocity vector <span className="font-mono">v_i(t+1) = w &middot; v_i(t) + c_1 r_1 (p_i - x_i) + c_2 r_2 (g - x_i)</span>. Because particles have momentum inertia and bounded velocities, they frequently stall when particles converge toward premature local minima.
          </p>
          <p>
            In <span className="font-medium text-text-primary">QPSO</span>, the particle state is modeled in quantum Hilbert space governed by a Schr&ouml;dinger equation with a delta potential well centered at local attractor <span className="font-mono">P_i</span>, with no velocity term:
          </p>
          <div className="p-3 rounded bg-bg-subtle border border-border-subtle text-text-primary space-y-1">
            <MathBlock math="P_{i} = \phi \cdot pbest_i + (1 - \phi) \cdot gbest, \quad \phi \sim \mathcal{U}(0, 1)" />
            <MathBlock math="mbest = \frac{1}{M}\sum_{i=1}^M pbest_i" />
            <MathBlock math="X_i(t+1) = P_i \pm \alpha \cdot |mbest - X_i(t)| \cdot \ln(1/u), \quad u \sim \mathcal{U}(0, 1)" />
          </div>
          <p className="text-[11px] text-text-muted">
            The quantum wave function ensures a non-zero probability amplitude across the entire search space. This enables particles to tunnel through prohibitive cost barriers without getting trapped, requiring only one control parameter (<span className="font-mono">&alpha;</span>: contraction-expansion coefficient) instead of three tuning parameters in classical PSO.
          </p>
        </div>
      </Card>
    </div>
  );
};