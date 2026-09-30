import React, { useState } from 'react';
import { Play, Square, RotateCcw, Sparkles, ChevronDown, ChevronUp, Dices, Sliders } from 'lucide-react';
import { useOptimizerStore } from '../store/useOptimizerStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { Card } from '../components/common/Card';
import { ParamField } from '../components/common/ParamField';
import { MapView } from '../components/map/MapView';
import { MapLegend } from '../components/map/MapLegend';
import { AlgorithmType } from '../api/types';
import { formatDistance, formatTime, formatMs } from '../lib/formatters';
import { cn } from '../lib/cn';

export const Optimizer: React.FC = () => {
  const { graph } = useNetworkStore();
  const {
    params,
    setParams,
    advancedParams,
    setAdvancedParams,
    isRunning,
    progress,
    currentIteration,
    result,
    runOptimization,
    stopOptimization,
    reset,
  } = useOptimizerStore();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);

  const handleRun = () => {
    runOptimization(graph);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* Parameter Controls Form */}
      <div className="w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto">
        <Card title="Solver Parameters" subtitle="Configure swarm & routing constraints">
          <div className="space-y-3.5 text-xs">
            <ParamField
              label="Optimization Algorithm"
              type="select"
              value={params.algorithm}
              options={[
                { value: 'QPSO', label: 'QPSO (Quantum-Inspired PSO)' },
                { value: 'PSO', label: 'Classical PSO' },
                { value: 'GA', label: 'Genetic Algorithm (GA)' },
                { value: 'ACO', label: 'Ant Colony Optimization (ACO)' },
                { value: 'Dijkstra', label: 'Dijkstra (Shortest-Path)' },
                { value: 'OR-Tools', label: 'OR-Tools (Branch-and-Bound)' },
              ]}
              onChange={(val: any) => setParams({ algorithm: val as AlgorithmType })}
            />

            <div className="grid grid-cols-2 gap-2">
              <ParamField
                label="Fleet Size"
                unit="Vehicles"
                type="number"
                min={2}
                max={8}
                value={params.numVehicles}
                onChange={(val: any) => setParams({ numVehicles: Number(val) })}
              />
              <ParamField
                label="Capacity"
                unit="Units"
                type="number"
                min={50}
                max={400}
                step={25}
                value={params.vehicleCapacity}
                onChange={(val: any) => setParams({ vehicleCapacity: Number(val) })}
              />
            </div>

            <ParamField
              label="Traffic Dynamics Mode"
              type="select"
              value={params.trafficMode}
              options={[
                { value: 'simulated-live', label: 'Simulated Live Congestion' },
                { value: 'static', label: 'Static Historical Speeds' },
              ]}
              onChange={(val: any) => setParams({ trafficMode: val as any })}
            />

            <div className="p-2 rounded bg-bg-subtle/60 border border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-text-primary block">Max Shift Limit</span>
                <span className="text-[10px] text-text-muted">Legal driving SLA constraint</span>
              </div>
              <span className="text-xs font-mono font-medium text-text-secondary bg-bg-surface px-2 py-0.5 rounded border border-border-subtle">
                8.0 hrs / vehicle
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              {!isRunning ? (
                <button
                  onClick={handleRun}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded bg-accent hover:bg-accent-hover text-white font-medium text-xs shadow-subtle transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run Optimizer</span>
                </button>
              ) : (
                <button
                  onClick={stopOptimization}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-subtle transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Stop Run</span>
                </button>
              )}
              <button
                onClick={reset}
                disabled={isRunning}
                className="px-2.5 py-2 rounded border border-border-default hover:bg-bg-subtle text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors"
                title="Reset solution"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Progress line */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] mb-1 text-text-secondary">
                <span>Progress</span>
                <span className="font-mono">{isRunning ? `${currentIteration}/${params.iterations} iter` : `${progress}%`}</span>
              </div>
              <div className="w-full h-1.5 bg-bg-subtle rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="h-full bg-accent transition-all duration-150 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Advanced Optimization Section */}
        <Card
          title="Advanced Optimization"
          subtitle="Swarm hyperparameters, convergence & stochastic tuning"
          action={
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors flex items-center gap-1 text-[11px]"
              title={isAdvancedOpen ? 'Collapse Advanced' : 'Expand Advanced'}
            >
              <span>{isAdvancedOpen ? 'Hide' : 'Show'}</span>
              {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          }
        >
          {isAdvancedOpen && (
            <div className="space-y-3.5 text-xs">
              {/* Population / Swarm Size */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-primary">Population / Swarm Size</label>
                  <span className="text-[11px] font-mono text-text-muted">{advancedParams.swarmSize} particles</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={200}
                    step={5}
                    value={advancedParams.swarmSize}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAdvancedParams({ swarmSize: val });
                      setParams({ swarmParticles: val });
                    }}
                    className="flex-1 h-1.5 bg-bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <input
                    type="number"
                    min={10}
                    max={200}
                    step={5}
                    value={advancedParams.swarmSize}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val)) {
                        setAdvancedParams({ swarmSize: val });
                        setParams({ swarmParticles: val });
                      }
                    }}
                    className="w-14 text-xs font-mono bg-bg-surface border border-border-default rounded px-2 py-1 text-right text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Maximum Iterations */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-primary">Maximum Iterations</label>
                  <span className="text-[11px] font-mono text-text-muted">{advancedParams.maxIterations} iters</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={10}
                    value={advancedParams.maxIterations}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAdvancedParams({ maxIterations: val });
                      setParams({ iterations: val });
                    }}
                    className="flex-1 h-1.5 bg-bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <input
                    type="number"
                    min={50}
                    max={500}
                    step={10}
                    value={advancedParams.maxIterations}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val)) {
                        setAdvancedParams({ maxIterations: val });
                        setParams({ iterations: val });
                      }
                    }}
                    className="w-14 text-xs font-mono bg-bg-surface border border-border-default rounded px-2 py-1 text-right text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Convergence Threshold */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-primary">Convergence Threshold</label>
                  <span className="text-[11px] font-mono text-text-muted">ε tol</span>
                </div>
                <select
                  value={advancedParams.convergenceThreshold}
                  onChange={(e) => setAdvancedParams({ convergenceThreshold: parseFloat(e.target.value) })}
                  className="w-full text-xs font-mono bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                >
                  <option value={0.005}>5 × 10⁻³ (0.005 - Fast Early Exit)</option>
                  <option value={0.001}>1 × 10⁻³ (0.001 - Standard Default)</option>
                  <option value={0.0005}>5 × 10⁻⁴ (0.0005 - Balanced Precision)</option>
                  <option value={0.0001}>1 × 10⁻⁴ (0.0001 - High Fidelity)</option>
                  <option value={0.00001}>1 × 10⁻⁵ (0.00001 - Extreme Strict)</option>
                </select>
                <span className="text-[10px] text-text-muted">Halts execution once objective change between iterations is below ε.</span>
              </div>

              {/* QPSO Contraction-Expansion Coeff (α) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-primary">QPSO Contraction-Expansion (α)</label>
                  <span className="text-[11px] font-mono text-accent-text font-semibold">
                    {params.contractionExpansionCoeff.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.5}
                    max={1.2}
                    step={0.05}
                    value={params.contractionExpansionCoeff}
                    onChange={(e) => setParams({ contractionExpansionCoeff: parseFloat(e.target.value) })}
                    className="flex-1 h-1.5 bg-bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <span className="font-mono text-xs text-text-primary w-10 text-right">
                    {params.contractionExpansionCoeff.toFixed(2)}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted">Quantum potential well attraction parameter controlling particle superposition spread.</span>
              </div>

              {/* Inertia Weight (w) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-primary">Inertia Weight (w)</label>
                  <span className="text-[11px] font-mono text-accent-text font-semibold">{advancedParams.inertiaWeight.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.02}
                    value={advancedParams.inertiaWeight}
                    onChange={(e) => setAdvancedParams({ inertiaWeight: parseFloat(e.target.value) })}
                    className="flex-1 h-1.5 bg-bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <span className="font-mono text-xs text-text-primary w-10 text-right">
                    {advancedParams.inertiaWeight.toFixed(2)}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted">Balances global exploration and local trajectory exploitation.</span>
              </div>

              {/* Cognitive & Social Coefficients */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-primary">Cognitive (c₁)</label>
                    <span className="text-[10px] font-mono text-text-muted">{advancedParams.cognitiveCoeff.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.05}
                    value={advancedParams.cognitiveCoeff}
                    onChange={(e) => setAdvancedParams({ cognitiveCoeff: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <span className="text-[10px] text-text-muted">Personal best pull</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-primary">Social (c₂)</label>
                    <span className="text-[10px] font-mono text-text-muted">{advancedParams.socialCoeff.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.05}
                    value={advancedParams.socialCoeff}
                    onChange={(e) => setAdvancedParams({ socialCoeff: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <span className="text-[10px] text-text-muted">Global swarm pull</span>
                </div>
              </div>

              {/* Random Seed */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-primary">Random Seed</label>
                  <span className="text-[10px] font-mono text-text-muted">Deterministic RNG</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={advancedParams.randomSeed}
                    onChange={(e) => setAdvancedParams({ randomSeed: parseInt(e.target.value) || 0 })}
                    className="flex-1 text-xs font-mono bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setAdvancedParams({ randomSeed: Math.floor(Math.random() * 90000) + 10000 })}
                    className="p-1.5 rounded border border-border-default bg-bg-surface hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 text-[11px]"
                    title="Randomize Seed"
                  >
                    <Dices className="w-3.5 h-3.5 text-accent" />
                    <span>Randomize</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Traffic Adaptation Toggle */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                <div>
                  <label className="text-xs font-medium text-text-primary block">
                    Dynamic Traffic Adaptation
                  </label>
                  <span className="text-[10px] text-text-muted block">
                    {advancedParams.dynamicTrafficAdaptation ? 'Active real-time re-weighting' : 'Static congestion penalty matrix'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={advancedParams.dynamicTrafficAdaptation}
                  onClick={() => setAdvancedParams({ dynamicTrafficAdaptation: !advancedParams.dynamicTrafficAdaptation })}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    advancedParams.dynamicTrafficAdaptation ? 'bg-accent' : 'bg-bg-subtle border-border-default'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                      advancedParams.dynamicTrafficAdaptation ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Live Metrics chip if result exists */}
        {result && (
          <Card title="Latest Solution Stats" subtitle={`${result.routes.length} vehicle routes generated`}>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-bg-subtle border border-border-subtle">
                <span className="text-[10px] text-text-muted block">Distance</span>
                <span className="font-semibold text-text-primary">{formatDistance(result.totalDistance)}</span>
              </div>
              <div className="p-2 rounded bg-bg-subtle border border-border-subtle">
                <span className="text-[10px] text-text-muted block">Duration</span>
                <span className="font-semibold text-text-primary">{formatTime(result.totalTime)}</span>
              </div>
              <div className="p-2 rounded bg-bg-subtle border border-border-subtle">
                <span className="text-[10px] text-text-muted block">Runtime</span>
                <span className="font-semibold text-text-primary">{formatMs(result.runtimeMs)}</span>
              </div>
              <div className="p-2 rounded bg-bg-subtle border border-border-subtle">
                <span className="text-[10px] text-text-muted block">Congestion Score</span>
                <span className="font-semibold text-text-primary">{result.congestionScore} / 100</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Right Map View */}
      <div className="flex-1 min-h-[480px] relative rounded-md border border-border-subtle overflow-hidden bg-bg-surface">
        <MapView
          nodes={graph.nodes}
          edges={graph.edges}
          routes={result?.routes || []}
          depotId={graph.depotId}
          className="h-full w-full"
        />

        <div className="absolute top-3 left-3 z-20 bg-bg-surface/90 backdrop-blur px-3 py-1.5 rounded border border-border-subtle shadow-subtle text-xs flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="font-medium text-text-primary">
            {isRunning ? 'Solving VRP with Quantum Superposition...' : `${params.algorithm} Active Route Plan`}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 z-20">
          <MapLegend showVehicles={Boolean(result?.routes?.length)} activeVehicleCount={result?.routes?.length || params.numVehicles} />
        </div>
      </div>
    </div>
  );
};
