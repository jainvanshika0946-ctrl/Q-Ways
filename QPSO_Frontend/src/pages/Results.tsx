import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, ChevronDown, ChevronRight, Truck, ArrowRight, Clock, TrendingUp, TrendingDown, Send, CheckCircle2 } from 'lucide-react';
import { useOptimizerStore } from '../store/useOptimizerStore';
import { Stat } from '../components/common/Stat';
import { Card } from '../components/common/Card';
import { exportRoutesToCSV, exportRoutesToJSON } from '../lib/exportUtils';
import { formatDistance, formatTime, formatMs, formatPercent } from '../lib/formatters';
import { VehicleRoute, RouteStop } from '../api/types';
import { cn } from '../lib/cn';

export const Results: React.FC = () => {
  const navigate = useNavigate();
  const { result, timeFeedback, submitTimeFeedback } = useOptimizerStore();
  const [expandedVehicle, setExpandedVehicle] = useState<number | null>(1);

  // Time Feedback State
  const expectedTimeMin = result?.totalTime ? parseFloat(result.totalTime.toFixed(1)) : 136.0;
  const [actualTimeInput, setActualTimeInput] = useState<string>(
    timeFeedback ? timeFeedback.actualTimeMin.toString() : (expectedTimeMin + 12).toFixed(1)
  );
  const [feedbackNotes, setFeedbackNotes] = useState<string>(timeFeedback?.notes || '');
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);

  const actualTimeNum = parseFloat(actualTimeInput);
  const isValidActualTime = !isNaN(actualTimeNum) && actualTimeNum > 0;
  const timeDiff = isValidActualTime ? parseFloat((actualTimeNum - expectedTimeMin).toFixed(1)) : 0;
  const costRatePerMin = 8.5; // Estimated vehicle & driver operational cost rate (₹8.50 / min)
  const costImpact = parseFloat((timeDiff * costRatePerMin).toFixed(2));
  const isDelayed = timeDiff > 0.1;
  const isSaved = timeDiff < -0.1;
  const isOnTime = !isDelayed && !isSaved;

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidActualTime) return;
    submitTimeFeedback(actualTimeNum, costRatePerMin, feedbackNotes.trim() || undefined);
    setFeedbackSuccessMsg('Feedback logged in frontend state. Ready for backend retraining pipeline.');
    setTimeout(() => setFeedbackSuccessMsg(null), 4500);
  };

  if (!result || result.routes.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-bg-subtle border border-border-default flex items-center justify-center text-text-muted">
          <Truck className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">No routes generated yet</h3>
          <p className="text-xs text-text-secondary mt-1">
            Load a network graph and click Run Optimization to compute optimal vehicle dispatch tours.
          </p>
        </div>
        <button
          onClick={() => navigate('/optimizer')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors"
        >
          <span>Open Optimizer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const totalLoad = result.routes.reduce((acc: number, r: VehicleRoute) => acc + r.load, 0);
  const totalCapacity = result.routes.reduce((acc: number, r: VehicleRoute) => acc + r.capacity, 0);
  const avgLoadPct = totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Optimization Solution Breakdown</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Fleet allocation across {result.routes.length} vehicle circuits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportRoutesToCSV(result)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-default hover:bg-bg-subtle text-text-primary text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-text-muted" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportRoutesToJSON(result)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-default hover:bg-bg-subtle text-text-primary text-xs font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-text-muted" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Fleet Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Stat label="Total Distance" value={formatDistance(result.totalDistance)} description="All vehicle legs combined" />
        <Stat label="Total Travel Time" value={formatTime(result.totalTime)} description="With congestion weights" />
        <Stat label="Capacity Utilization" value={formatPercent(avgLoadPct)} description={`${totalLoad} / ${totalCapacity} units`} />
        <Stat label="Solver Execution" value={formatMs(result.runtimeMs)} description="QPSO convergence time" />
      </div>

      {/* Real-World Execution Time Feedback */}
      <Card
        title="Execution Time Feedback & Cost Impact"
        subtitle="Empirical post-dispatch validation: compare QPSO schedule against real-world driver logs"
        action={
          timeFeedback ? (
            <span className="text-traffic-low text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Feedback Saved ({new Date(timeFeedback.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
            </span>
          ) : (
            <span className="text-text-muted text-xs font-mono">Awaiting telemetry entry</span>
          )
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-3.5 rounded-md bg-bg-subtle/50 border border-border-subtle items-center">
            {/* 1. Expected Time from QPSO */}
            <div>
              <span className="text-[11px] text-text-secondary block font-medium">Expected Time (QPSO)</span>
              <div className="font-mono text-sm font-semibold text-text-primary mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-accent shrink-0" />
                <span>{expectedTimeMin.toFixed(1)} min</span>
                <span className="text-xs text-text-muted font-normal">({formatTime(expectedTimeMin)})</span>
              </div>
              <span className="text-[10px] text-text-muted mt-0.5 block">Estimated by solver</span>
            </div>

            {/* 2. Actual Time Input */}
            <div>
              <label className="text-[11px] text-text-secondary block font-medium mb-1">
                Actual Time (Minutes) *
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={actualTimeInput}
                  onChange={(e) => setActualTimeInput(e.target.value)}
                  placeholder="e.g. 148"
                  className={cn(
                    'w-full text-xs font-mono bg-bg-surface border rounded px-2.5 py-1.5 text-text-primary focus:outline-none transition-colors',
                    isValidActualTime ? 'border-border-default focus:border-accent' : 'border-rose-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setActualTimeInput(expectedTimeMin.toFixed(1))}
                  className="px-2 py-1.5 text-[11px] rounded border border-border-default bg-bg-surface hover:bg-bg-subtle text-text-secondary shrink-0 font-medium"
                  title="Copy Expected Time"
                >
                  Match
                </button>
              </div>
              <span className="text-[10px] text-text-muted mt-0.5 block">Recorded post-delivery</span>
            </div>

            {/* 3. Time Difference */}
            <div>
              <span className="text-[11px] text-text-secondary block font-medium">Time Difference</span>
              <div className="mt-1 flex items-center gap-1 font-mono text-xs font-semibold">
                {isDelayed ? (
                  <span className="text-rose-500 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span>+{timeDiff.toFixed(1)} min (Delayed)</span>
                  </span>
                ) : isSaved ? (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 shrink-0" />
                    <span>{timeDiff.toFixed(1)} min (Saved)</span>
                  </span>
                ) : (
                  <span className="text-text-muted flex items-center gap-1">
                    <span>±0.0 min (On-Time)</span>
                  </span>
                )}
              </div>
              <span className="text-[10px] text-text-muted mt-0.5 block">
                {isDelayed ? 'Actual > Expected' : isSaved ? 'Actual < Expected' : 'Target Achieved'}
              </span>
            </div>

            {/* 4. Cost Impact & Action */}
            <div className="flex flex-col justify-between">
              <span className="text-[11px] text-text-secondary block font-medium">Cost Impact (₹8.50/min)</span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'font-mono text-sm font-bold',
                    isDelayed ? 'text-rose-500' : isSaved ? 'text-emerald-500' : 'text-text-muted'
                  )}
                >
                  {isDelayed && `+₹${Math.abs(costImpact).toFixed(2)}`}
                  {isSaved && `-₹${Math.abs(costImpact).toFixed(2)}`}
                  {isOnTime && '₹0.00'}
                </span>

                <button
                  type="button"
                  onClick={handleSubmitFeedback}
                  disabled={!isValidActualTime}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors disabled:opacity-50 shadow-subtle shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Actual Time</span>
                </button>
              </div>
              <span className="text-[10px] text-text-muted mt-0.5 block">
                {isDelayed ? 'Increased fleet cost' : isSaved ? 'Reduced operating cost' : 'Cost neutral'}
              </span>
            </div>
          </div>

          {feedbackSuccessMsg && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackSuccessMsg}</span>
            </p>
          )}

          <p className="text-xs text-text-muted leading-normal">
            Empirical feedback records variance between algorithmic simulation and real-world traffic conditions. This feedback is stored in frontend state and queued for backend metaheuristic model tuning.
          </p>
        </div>
      </Card>

      {/* Per-Vehicle Route List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
          Individual Vehicle Circuits
        </h3>

        {result.routes.map((route: VehicleRoute) => {
          const isExpanded = expandedVehicle === route.vehicleId;
          const loadPct = Math.round((route.load / route.capacity) * 100);

          return (
            <div
              key={route.vehicleId}
              className="bg-bg-surface border border-border-subtle rounded-md overflow-hidden shadow-subtle"
            >
              {/* Route Summary Row */}
              <div
                onClick={() => setExpandedVehicle(isExpanded ? null : route.vehicleId)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-bg-subtle/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: route.color }}
                  />
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-xs text-text-primary">
                      Vehicle #{route.vehicleId}
                    </span>
                    <span className="text-xs text-text-muted">
                      ({route.stops.length - 1} customer stops)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs font-mono">
                  <div className="hidden sm:block text-right">
                    <span className="text-text-muted text-[10px] block">Distance</span>
                    <span className="text-text-primary">{formatDistance(route.distanceKm)}</span>
                  </div>
                  <div className="hidden sm:block text-right">
                    <span className="text-text-muted text-[10px] block">Duration</span>
                    <span className="text-text-primary">{formatTime(route.timeMin)}</span>
                  </div>
                  <div className="text-right w-24">
                    <span className="text-text-muted text-[10px] block">Load {loadPct}%</span>
                    <div className="w-full h-1.5 bg-bg-subtle rounded-full overflow-hidden mt-1 border border-border-subtle">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${Math.min(100, loadPct)}%` }}
                      />
                    </div>
                  </div>
                  <button className="text-text-muted hover:text-text-primary p-0.5">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Stops Sequence Table */}
              {isExpanded && (
                <div className="border-t border-border-subtle bg-bg-base/30 p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] font-medium text-text-secondary border-b border-border-subtle">
                        <tr>
                          <th className="py-1.5 px-3">#</th>
                          <th className="py-1.5 px-3">Location Name</th>
                          <th className="py-1.5 px-3 text-right">ETA (min)</th>
                          <th className="py-1.5 px-3 text-right">Cumulative Dist</th>
                          <th className="py-1.5 px-3 text-right">Load Onboard</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle font-mono text-[11px]">
                        {route.stops.map((stop: RouteStop, sIdx: number) => (
                          <tr key={sIdx} className="hover:bg-bg-subtle/40">
                            <td className="py-2 px-3 text-text-muted">{sIdx === 0 ? 'Start' : sIdx}</td>
                            <td className="py-2 px-3 font-sans text-text-primary font-medium">
                              {stop.nodeName}
                            </td>
                            <td className="py-2 px-3 text-right text-text-secondary">
                              +{stop.arrivalMin} min
                            </td>
                            <td className="py-2 px-3 text-right text-text-secondary">
                              {stop.cumulativeDistanceKm} km
                            </td>
                            <td className="py-2 px-3 text-right text-text-primary">
                              {stop.cumulativeLoad} / {route.capacity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
