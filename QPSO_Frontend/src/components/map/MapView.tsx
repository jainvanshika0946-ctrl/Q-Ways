import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GraphEdge, GraphNode, VehicleRoute } from '../../api/types';
import { VEHICLE_PALETTE } from '../../api/mock';

interface MapViewProps {
  nodes: GraphNode[];
  edges?: GraphEdge[];
  routes?: VehicleRoute[];
  depotId?: string;
  selectedEdgeId?: string;
  selectedNodeId?: string;
  onEdgeClick?: (edge: GraphEdge) => void;
  onNodeClick?: (node: GraphNode) => void;
  interactive?: boolean;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  nodes,
  edges = [],
  routes = [],
  depotId,
  selectedEdgeId,
  selectedNodeId,
  onEdgeClick,
  onNodeClick,
  interactive = true,
  className = 'h-full w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = nodes[0]?.lat || 12.9716;
    const initialLng = nodes[0]?.lng || 77.5946;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Layers & Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (nodes.length === 0) return;

    const nodeMap = new Map<string, GraphNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // 1. Draw Network Edges if no vehicle routes are displayed, or as subtle background
    if (routes.length === 0) {
      edges.forEach((edge) => {
        const u = nodeMap.get(edge.source);
        const v = nodeMap.get(edge.target);
        if (!u || !v) return;

        const isSelected = edge.id === selectedEdgeId;
        const colorMap = {
          low: '#10B981',
          moderate: '#F59E0B',
          heavy: '#F97316',
          jammed: '#EF4444',
        };
        const edgeColor = colorMap[edge.trafficLevel] || '#94A3B8';

        const polyline = L.polyline(
          [
            [u.lat, u.lng],
            [v.lat, v.lng],
          ],
          {
            color: isSelected ? '#0F766E' : edgeColor,
            weight: isSelected ? 4 : 2.5,
            opacity: isSelected ? 1 : 0.8,
            dashArray: isSelected ? '4, 4' : undefined,
          }
        );

        if (interactive && onEdgeClick) {
          polyline.on('click', () => onEdgeClick(edge));
          polyline.bindTooltip(
            `<strong>${edge.distanceKm} km</strong> • ${edge.trafficLevel.toUpperCase()} (${edge.congestionFactor}x)`,
            { sticky: true, className: 'text-xs font-mono' }
          );
        }

        polyline.addTo(layerGroup);
      });
    }

    // 2. Draw Vehicle Routes if present
    if (routes.length > 0) {
      routes.forEach((route, idx) => {
        const color = route.color || VEHICLE_PALETTE[idx % VEHICLE_PALETTE.length];
        const polyline = L.polyline(route.coordinates, {
          color,
          weight: 3.5,
          opacity: 0.9,
          smoothFactor: 1.0,
        });

        polyline.bindTooltip(
          `Vehicle ${route.vehicleId}: ${route.distanceKm} km, ${route.stops.length - 1} stops`,
          { sticky: true, className: 'text-xs' }
        );

        polyline.addTo(layerGroup);
      });
    }

    // 3. Draw Nodes
    const bounds = L.latLngBounds([]);

    nodes.forEach((node) => {
      const isDepot = node.id === depotId || node.isDepot;
      const isSelected = node.id === selectedNodeId;

      bounds.extend([node.lat, node.lng]);

      const iconHtml = isDepot
        ? `<div style="background-color: #0F766E; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">D</div>`
        : `<div style="background-color: ${isSelected ? '#0F766E' : '#334155'}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.25);"></div>`;

      const markerIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-node-icon',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([node.lat, node.lng], { icon: markerIcon });

      if (interactive && onNodeClick) {
        marker.on('click', () => onNodeClick(node));
        marker.bindTooltip(
          `${node.name} ${isDepot ? '(Central Depot)' : `[Demand: ${node.demand}]`}`,
          { direction: 'top', offset: [0, -10] }
        );
      }

      marker.addTo(layerGroup);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }, [nodes, edges, routes, depotId, selectedEdgeId, selectedNodeId]);

  return (
    <div className={`relative overflow-hidden rounded-md ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};
