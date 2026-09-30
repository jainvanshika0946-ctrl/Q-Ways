import React, { useState } from 'react';
import { RefreshCw, MapPin, Check } from 'lucide-react';
import { useNetworkStore } from '../store/useNetworkStore';
import { Card } from '../components/common/Card';
import { MapView } from '../components/map/MapView';
import { MapLegend } from '../components/map/MapLegend';
import { Modal } from '../components/common/Modal';
import { ParamField } from '../components/common/ParamField';
import { TrafficBadge } from '../components/common/Badge';
import { GraphEdge, GraphNode, TrafficLevel } from '../api/types';

export const Network: React.FC = () => {
  const {
    graph,
    selectedEdge,
    selectedNode,
    selectEdge,
    selectNode,
    updateEdge,
    setDepot,
    updateNodeDemand,
    loadSampleCity,
    generateRandomGraph,
  } = useNetworkStore();

  const [randomNodeCount, setRandomNodeCount] = useState(24);
  const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
  const [editingEdge, setEditingEdge] = useState<GraphEdge | null>(null);

  const handleEdgeClick = (edge: GraphEdge) => {
    selectEdge(edge);
    setEditingEdge({ ...edge });
    setIsEdgeModalOpen(true);
  };

  const handleNodeClick = (node: GraphNode) => {
    selectNode(node);
  };

  const handleSaveEdge = () => {
    if (editingEdge) {
      updateEdge(editingEdge.id, editingEdge);
      setIsEdgeModalOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* Controls Sidebar */}
      <div className="w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto">
        <Card title="City Topology & Generators" subtitle="Load or synthesize road network">
          <div className="space-y-4 text-xs">
            {/* Presets */}
            <div>
              <label className="text-text-secondary font-medium block mb-1.5">Preset Urban Grid</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['Bengaluru Urban Grid', 'New Delhi Ring', 'Mumbai Arterial', 'Hyderabad HITEC'].map((city) => (
                  <button
                    key={city}
                    onClick={() => loadSampleCity(city, 24)}
                    className="px-2.5 py-1.5 rounded border border-border-default hover:bg-bg-subtle text-text-primary text-[11px] font-medium text-left truncate transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Random Generator */}
            <div className="pt-3 border-t border-border-subtle space-y-2">
              <ParamField
                label="Procedural Node Count"
                unit="|V|"
                type="slider"
                min={10}
                max={50}
                step={2}
                value={randomNodeCount}
                onChange={setRandomNodeCount}
              />
              <button
                onClick={() => generateRandomGraph(randomNodeCount)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-border-default hover:bg-bg-subtle text-text-primary text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate Synthetic Graph</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Selected Node Details */}
        {selectedNode && (
          <Card title="Selected Node Inspector" subtitle={selectedNode.name}>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Type:</span>
                <span className="font-semibold text-text-primary">
                  {selectedNode.id === graph.depotId ? 'Central Logistics Depot' : 'Customer Delivery Stop'}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-text-secondary">Coordinates:</span>
                <span>{selectedNode.lat.toFixed(4)}, {selectedNode.lng.toFixed(4)}</span>
              </div>
              <ParamField
                label="Customer Parcel Demand"
                unit="units"
                type="number"
                min={0}
                max={100}
                value={selectedNode.demand}
                onChange={(v: number | string) => updateNodeDemand(selectedNode.id, Number(v))}
              />
              {selectedNode.id !== graph.depotId && (
                <button
                  onClick={() => setDepot(selectedNode.id)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Set as Central Depot</span>
                </button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Main Interactive Map */}
      <div className="flex-1 min-h-[480px] relative rounded-md border border-border-subtle overflow-hidden bg-bg-surface">
        <MapView
          nodes={graph.nodes}
          edges={graph.edges}
          depotId={graph.depotId}
          selectedEdgeId={selectedEdge?.id}
          selectedNodeId={selectedNode?.id}
          onEdgeClick={handleEdgeClick}
          onNodeClick={handleNodeClick}
          className="h-full w-full"
        />

        <div className="absolute top-3 left-3 z-20 bg-bg-surface/90 backdrop-blur px-3 py-1.5 rounded border border-border-subtle shadow-subtle text-xs flex items-center gap-2">
          <span className="font-medium text-text-primary">Click any edge</span>
          <span className="text-text-muted">to adjust weight or traffic congestion</span>
        </div>

        <div className="absolute bottom-3 left-3 z-20">
          <MapLegend />
        </div>
      </div>

      {/* Edit Edge Modal */}
      {editingEdge && (
        <Modal
          isOpen={isEdgeModalOpen}
          onClose={() => setIsEdgeModalOpen(false)}
          title="Edit Road Segment / Edge Weight"
          subtitle={`Segment ${editingEdge.source} ↔ ${editingEdge.target}`}
          footer={
            <>
              <button
                onClick={() => setIsEdgeModalOpen(false)}
                className="px-3 py-1.5 rounded border border-border-default hover:bg-bg-subtle text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdge}
                className="px-3 py-1.5 rounded bg-accent hover:bg-accent-hover text-white text-xs font-medium flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Edge Weight</span>
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <ParamField
              label="Segment Distance"
              unit="km"
              type="number"
              step={0.1}
              min={0.2}
              max={50}
              value={editingEdge.distanceKm}
              onChange={(val: number | string) => setEditingEdge({ ...editingEdge, distanceKm: Number(val) })}
            />
            <ParamField
              label="Traffic Congestion Profile"
              type="select"
              value={editingEdge.trafficLevel}
              options={[
                { value: 'low', label: 'Low Congestion (1.0x factor)' },
                { value: 'moderate', label: 'Moderate Flow (1.4x factor)' },
                { value: 'heavy', label: 'Heavy Traffic (1.9x factor)' },
                { value: 'jammed', label: 'Gridlock / Jammed (2.8x factor)' },
              ]}
              onChange={(val: any) => setEditingEdge({ ...editingEdge, trafficLevel: val as TrafficLevel })}
            />
            <div className="p-2.5 rounded bg-bg-subtle border border-border-subtle text-xs flex items-center justify-between">
              <span className="text-text-secondary">Active Status:</span>
              <TrafficBadge level={editingEdge.trafficLevel} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
