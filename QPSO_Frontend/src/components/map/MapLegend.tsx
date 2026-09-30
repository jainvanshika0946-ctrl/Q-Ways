import React from 'react';
import { VEHICLE_PALETTE } from '../../api/mock';

interface MapLegendProps {
  showVehicles?: boolean;
  activeVehicleCount?: number;
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  showVehicles = false,
  activeVehicleCount = 4,
  className = '',
}) => {
  return (
    <div
      className={`bg-bg-surface/95 backdrop-blur border border-border-subtle rounded-md p-2.5 text-[11px] shadow-subtle flex flex-col gap-2 ${className}`}
    >
      <div className="font-medium text-text-primary text-[10px] uppercase tracking-wider">
        Map Key
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-text-secondary">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-accent/30" />
          <span>Depot (Origin)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-text-secondary" />
          <span>Customer Stop</span>
        </div>
      </div>

      <div className="border-t border-border-subtle pt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-text-secondary">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded bg-traffic-low" />
          <span>Free (1.0x)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded bg-traffic-moderate" />
          <span>Mod (1.4x)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded bg-traffic-heavy" />
          <span>Heavy (1.9x)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded bg-traffic-jammed" />
          <span>Gridlock (2.8x)</span>
        </div>
      </div>

      {showVehicles && (
        <div className="border-t border-border-subtle pt-1.5">
          <div className="text-[10px] text-text-muted mb-1">Vehicle Routes</div>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: activeVehicleCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px]">
                <span
                  className="w-3 h-1 rounded"
                  style={{ backgroundColor: VEHICLE_PALETTE[i % VEHICLE_PALETTE.length] }}
                />
                <span className="font-mono">V{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
