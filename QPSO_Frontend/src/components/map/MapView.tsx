import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { GraphEdge, GraphNode, VehicleRoute } from '../../api/types';
import { VEHICLE_PALETTE } from '../../api/mock';

/* ---------------------------------------------------------------
 * OSRM helpers: snap stops to roads + fetch real road geometry
 * Everything is cached in memory + localStorage.
 * --------------------------------------------------------------- */
const OSRM = 'https://router.project-osrm.org';
type LL = [number, number];

const cache = new Map<string, any>(
  (() => {
    try {
      return JSON.parse(localStorage.getItem('osrm-cache') || '[]');
    } catch {
      return [];
    }
  })()
);

let persistTimer: number | undefined;
const persist = () => {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      localStorage.setItem('osrm-cache', JSON.stringify([...cache]));
    } catch {
      /* quota exceeded: ignore */
    }
  }, 500);
};

// Simple concurrency limiter so the public OSRM server doesn't rate-limit us
const MAX_PARALLEL = 3;
let active = 0;
const queue: (() => void)[] = [];
const limited = <T,>(fn: () => Promise<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    const run = () => {
      active++;
      fn()
        .then(resolve, reject)
        .finally(() => {
          active--;
          queue.shift()?.();
        });
    };
    if (active < MAX_PARALLEL) run();
    else queue.push(run);
  });

async function osrmSnap(p: LL): Promise<LL> {
  const key = 's:' + p.join(',');
  if (cache.has(key)) return cache.get(key);
  try {
    const j = await limited(() =>
      fetch(`${OSRM}/nearest/v1/driving/${p[1]},${p[0]}`).then((r) => r.json())
    );
    const [lng, lat] = j.waypoints[0].location;
    cache.set(key, [lat, lng]);
    persist();
    return [lat, lng];
  } catch {
    return p; // fall back to original position
  }
}

async function osrmRoute(pts: LL[]): Promise<LL[] | null> {
  if (pts.length < 2) return null;
  const key = 'r:' + pts.map((p) => p.join(',')).join('|');
  if (cache.has(key)) return cache.get(key);
  try {
    const q = pts.map((p) => `${p[1]},${p[0]}`).join(';');
    const j = await limited(() =>
      fetch(`${OSRM}/route/v1/driving/${q}?overview=full&geometries=geojson`).then((r) => r.json())
    );
    const line: LL[] = j.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]);
    cache.set(key, line);
    persist();
    return line;
  } catch {
    console.warn('[MapView] OSRM route request failed');
    return null; // keep straight line if request fails
  }
}

/* --------------------------------------------------------------- */

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
  const runRef = useRef(0);
  const [snapped, setSnapped] = useState<Record<string, LL>>({});
  const [snapInfo, setSnapInfo] = useState('Road snap: loading…');

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

  // Snap every stop onto the nearest road (re-runs only when the node set changes)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        nodes.map(async (n) => [n.id, await osrmSnap([n.lat, n.lng])] as [string, LL])
      );
      if (cancelled) return;
      setSnapped(Object.fromEntries(results));
      const moved = results.filter(([id, p]) => {
        const n = nodes.find((x) => x.id === id)!;
        return p[0] !== n.lat || p[1] !== n.lng;
      }).length;
      setSnapInfo(`Road snap: ${moved}/${nodes.length} stops on-road`);
      if (moved === 0) console.warn('[MapView] OSRM snapping failed - check network/CORS');
    })();
    return () => {
      cancelled = true;
    };
  }, [nodes]);

  // Draw edges, routes and nodes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    if (nodes.length === 0) return;

    const runId = ++runRef.current;
    const nodeMap = new Map<string, GraphNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const pos = (id: string): LL => {
      if (snapped[id]) return snapped[id];
      const n = nodeMap.get(id);
      return n ? [n.lat, n.lng] : [0, 0];
    };

    const hasRoutes = routes.length > 0;
    const colorMap: Record<string, string> = {
      low: '#10B981',
      moderate: '#F59E0B',
      heavy: '#F97316',
      jammed: '#EF4444',
    };

    // 1. Network edges: ALWAYS drawn (faint when routes exist), following real roads
    edges.forEach((edge) => {
      const u = nodeMap.get(edge.source);
      const v = nodeMap.get(edge.target);
      if (!u || !v) return;

      const isSelected = edge.id === selectedEdgeId;
      const a = pos(u.id);
      const b = pos(v.id);

      const line = L.polyline([a, b], {
        color: isSelected ? '#0F766E' : colorMap[edge.trafficLevel] || '#94A3B8',
        weight: isSelected ? 4 : hasRoutes ? 2 : 2.5,
        opacity: isSelected ? 1 : hasRoutes ? 0.3 : 0.8,
        dashArray: isSelected ? '4, 4' : undefined,
      }).addTo(layerGroup);

      if (interactive && onEdgeClick) {
        line.on('click', () => onEdgeClick(edge));
        line.bindTooltip(
          `<strong>${edge.distanceKm} km</strong> • ${edge.trafficLevel.toUpperCase()} (${edge.congestionFactor}x)`,
          { sticky: true, className: 'text-xs font-mono' }
        );
      }

      // upgrade straight line to real road geometry
      osrmRoute([a, b]).then((g) => {
        if (g && runId === runRef.current) line.setLatLngs(g);
      });
    });

    // 2. Vehicle routes: one OSRM call per vehicle through all its stops, in order
    routes.forEach((route, idx) => {
      const color = route.color || VEHICLE_PALETTE[idx % VEHICLE_PALETTE.length];

      const ids: string[] = (
        route.nodeIds?.length ? [...route.nodeIds] : (route.stops || []).map((st) => st.nodeId)
      ).filter(Boolean);

      // make sure the route starts and ends at the depot
      if (depotId) {
        if (ids[0] !== depotId) ids.unshift(depotId);
        if (ids[ids.length - 1] !== depotId) ids.push(depotId);
      }

      const pts = ids.map(pos);
      const line = L.polyline(pts, { color, weight: 4.5, opacity: 0.95 }).addTo(layerGroup);

      line.bindTooltip(
        `Vehicle ${route.vehicleId}: ${route.distanceKm} km, ${route.stops.length - 1} stops`,
        { sticky: true, className: 'text-xs' }
      );

      osrmRoute(pts).then((g) => {
        if (g && runId === runRef.current) line.setLatLngs(g);
      });
    });

    // 3. Nodes (drawn at snapped, on-road positions, above the lines)
    nodes.forEach((node) => {
      const isDepot = node.id === depotId || node.isDepot;
      const isSelected = node.id === selectedNodeId;
      const p = pos(node.id);

      const iconHtml = isDepot
        ? `<div style="background-color:#0F766E;width:22px;height:22px;border-radius:50%;border:3px solid #FFFFFF;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;">D</div>`
        : `<div style="background-color:${isSelected ? '#0F766E' : '#334155'};width:14px;height:14px;border-radius:50%;border:2px solid #FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,0.25);"></div>`;

      const marker = L.marker(p, {
        icon: L.divIcon({
          html: iconHtml,
          className: 'custom-node-icon',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
        zIndexOffset: 1000,
      });

      if (interactive && onNodeClick) {
        marker.on('click', () => onNodeClick(node));
        marker.bindTooltip(
          `${node.name} ${isDepot ? '(Central Depot)' : `[Demand: ${node.demand}]`}`,
          { direction: 'top', offset: [0, -10] }
        );
      }

      marker.addTo(layerGroup);
    });
  }, [nodes, edges, routes, depotId, selectedEdgeId, selectedNodeId, snapped]);

  // Fit map to stops only when the node set / snapped positions change
  // (so clicking an edge or node doesn't re-zoom the map)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || nodes.length === 0) return;
    const bounds = L.latLngBounds([]);
    nodes.forEach((n) => bounds.extend(snapped[n.id] ?? [n.lat, n.lng]));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }, [nodes, snapped]);

  return (
    <div className={`relative overflow-hidden rounded-md ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />
      <div className="absolute top-3 right-3 z-[1000] rounded bg-white/90 px-2 py-1 text-[10px] font-mono text-slate-700 shadow">
        {snapInfo}
      </div>
    </div>
  );
};