import { create } from 'zustand';
import { GraphEdge, GraphNode, NetworkGraph, TrafficLevel } from '../api/types';
import { createSampleGraph } from '../api/mock';
import { apiClient } from '../api/client';

interface NetworkState {
  graph: NetworkGraph;
  selectedEdge: GraphEdge | null;
  selectedNode: GraphNode | null;
  isLoading: boolean;
  activeCityPreset: string;
  
  // Actions
  loadSampleCity: (cityName: string, nodeCount?: number) => Promise<void>;
  generateRandomGraph: (nodeCount: number) => void;
  importGraphFromJSON: (jsonString: string) => boolean;
  updateEdge: (edgeId: string, updates: Partial<GraphEdge>) => void;
  setDepot: (nodeId: string) => void;
  updateNodeDemand: (nodeId: string, demand: number) => void;
  selectEdge: (edge: GraphEdge | null) => void;
  selectNode: (node: GraphNode | null) => void;
  
  // --- NEW ACTIONS FOR SYNCING TABLE & MAP ---
  addNode: (nodeData: Omit<GraphNode, 'id' | 'isDepot'>) => void;
  removeNode: (nodeId: string) => void;
  clearNodes: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  // Keeps the impressive 24-node graph as the default when the app opens!
  graph: createSampleGraph(24, 'Bengaluru Urban Grid'),
  selectedEdge: null,
  selectedNode: null,
  isLoading: false,
  activeCityPreset: 'Bengaluru Urban Grid',

  loadSampleCity: async (cityName: string, nodeCount: number = 24) => {
    set({ isLoading: true, activeCityPreset: cityName });
    try {
      const newGraph = await apiClient.getSampleGraph(nodeCount, cityName);
      set({ graph: newGraph, selectedEdge: null, selectedNode: null, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  generateRandomGraph: (nodeCount: number) => {
    const cityName = `Synthetic Network (${nodeCount} Nodes)`;
    set({ graph: createSampleGraph(nodeCount, cityName), activeCityPreset: cityName, selectedEdge: null, selectedNode: null });
  },

  importGraphFromJSON: (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        const depotId = parsed.depotId || parsed.nodes[0]?.id || '';
        set({
          graph: { name: parsed.name || 'Imported Custom Network', nodes: parsed.nodes, edges: parsed.edges, depotId },
          activeCityPreset: 'Custom Imported', selectedEdge: null, selectedNode: null,
        });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  updateEdge: (edgeId: string, updates: Partial<GraphEdge>) => {
    const { graph, selectedEdge } = get();
    const updatedEdges = graph.edges.map((edge) => {
      if (edge.id === edgeId) {
        let congestionFactor = edge.congestionFactor;
        if (updates.trafficLevel) {
          const factorMap: Record<TrafficLevel, number> = { low: 1.0, moderate: 1.4, heavy: 1.9, jammed: 2.8 };
          congestionFactor = factorMap[updates.trafficLevel] || 1.0;
        }
        return { ...edge, ...updates, congestionFactor };
      }
      return edge;
    });
    set({
      graph: { ...graph, edges: updatedEdges },
      selectedEdge: selectedEdge?.id === edgeId ? { ...selectedEdge, ...updates } : selectedEdge,
    });
  },

  setDepot: (nodeId: string) => {
    const { graph } = get();
    const updatedNodes = graph.nodes.map((node) => ({ ...node, isDepot: node.id === nodeId }));
    set({ graph: { ...graph, nodes: updatedNodes, depotId: nodeId } });
  },

  updateNodeDemand: (nodeId: string, demand: number) => {
    const { graph } = get();
    const updatedNodes = graph.nodes.map((node) => node.id === nodeId ? { ...node, demand: Math.max(0, demand) } : node );
    set({ graph: { ...graph, nodes: updatedNodes } });
  },

  selectEdge: (edge) => set({ selectedEdge: edge }),
  selectNode: (node) => set({ selectedNode: node }),

  // --- NEW: LOGIC TO ADD AND REMOVE ORDERS FROM THE GLOBAL MAP ---
  addNode: (nodeData) => {
    const { graph } = get();
    const newId = `ORD-${Math.floor(Math.random() * 10000)}`;
    const newNode: GraphNode = { ...nodeData, id: newId, isDepot: graph.nodes.length === 0 };
    
    set({
      graph: {
        ...graph,
        nodes: [...graph.nodes, newNode],
        depotId: graph.nodes.length === 0 ? newId : graph.depotId
      }
    });
  },

  removeNode: (nodeId: string) => {
    const { graph } = get();
    const updatedNodes = graph.nodes.filter(n => n.id !== nodeId);
    let newDepotId = graph.depotId;
    
    // If we deleted the depot, assign the first remaining node as the new depot
    if (newDepotId === nodeId && updatedNodes.length > 0) {
      newDepotId = updatedNodes[0].id;
      updatedNodes[0].isDepot = true;
    }
    
    set({ graph: { ...graph, nodes: updatedNodes, depotId: newDepotId } });
  },

  clearNodes: () => {
    const { graph } = get();
    set({ graph: { ...graph, nodes: [], edges: [], depotId: '' } });
  }
}));