import React, { useState } from 'react';
import { Crosshair, AlertCircle, Check, Loader2, Navigation } from 'lucide-react';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { Card } from '../common/Card';
import { TrafficModeOption, CongestionSensitivity } from '../../api/types';
import { cn } from '../../lib/cn';

const CITY_PRESETS: Record<string, { lat: number; lng: number }> = {
  'Bengaluru': { lat: 12.9716, lng: 77.5946 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
};

interface OptimizationConfigCardProps {
  className?: string;
  action?: React.ReactNode;
}

export const OptimizationConfigCard: React.FC<OptimizationConfigCardProps> = ({ className, action }) => {
  const { config, setConfig, setUserLocation } = useOptimizerStore();

  const [latInput, setLatInput] = useState<string>(config.userLocation.lat.toString());
  const [lngInput, setLngInput] = useState<string>(config.userLocation.lng.toString());
  const [geoStatus, setGeoStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  });
  const [customCity, setCustomCity] = useState<string>('');
  const [isCustomCity, setIsCustomCity] = useState<boolean>(!CITY_PRESETS[config.geographicArea]);

  // Validation
  const latNum = parseFloat(latInput);
  const lngNum = parseFloat(lngInput);
  const isLatValid = !isNaN(latNum) && latNum >= -90 && latNum <= 90;
  const isLngValid = !isNaN(lngNum) && lngNum >= -180 && lngNum <= 180;

  const handleCityChange = (cityName: string) => {
    if (cityName === 'custom') {
      setIsCustomCity(true);
      return;
    }
    setIsCustomCity(false);
    setConfig({ geographicArea: cityName });

    const preset = CITY_PRESETS[cityName];
    if (preset) {
      setLatInput(preset.lat.toFixed(4));
      setLngInput(preset.lng.toFixed(4));
      setUserLocation(preset.lat, preset.lng);
      setGeoStatus({ type: 'idle' });
    }
  };

  const handleCustomCityBlur = () => {
    if (customCity.trim()) {
      setConfig({ geographicArea: customCity.trim() });
    }
  };

  const handleLatChange = (val: string) => {
    setLatInput(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n >= -90 && n <= 90) {
      setUserLocation(n, isLngValid ? lngNum : config.userLocation.lng);
    }
  };

  const handleLngChange = (val: string) => {
    setLngInput(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n >= -180 && n <= 180) {
      setUserLocation(isLatValid ? latNum : config.userLocation.lat, n);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus({
        type: 'error',
        message: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    setGeoStatus({ type: 'loading', message: 'Acquiring GPS coordinates...' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(4));
        const lng = parseFloat(position.coords.longitude.toFixed(4));
        setLatInput(lat.toString());
        setLngInput(lng.toString());
        setUserLocation(lat, lng);
        setGeoStatus({
          type: 'success',
          message: `Location locked: ${lat}° N, ${lng}° E`,
        });
      },
      (error) => {
        let msg = 'Failed to acquire location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow location in your browser or enter coordinates manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information unavailable. Please enter coordinates manually.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again or enter manually.';
        }
        setGeoStatus({ type: 'error', message: msg });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <Card
      title="Optimization Configuration"
      subtitle="Regional bounds, dispatch origin telemetry, and dynamic traffic friction weights"
      action={action}
      className={className}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Left Column: Geographic Area & User Location */}
        <div className="space-y-4">
          {/* 1. Geographic Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                <span>🌍</span>
                <span>Geographic Area</span>
              </label>
              <span className="text-[11px] font-mono text-text-muted">Metropolitan Grid</span>
            </div>

            <div className="space-y-2">
              <select
                value={isCustomCity ? 'custom' : config.geographicArea}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full text-xs bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
              >
                {Object.keys(CITY_PRESETS).map((city) => (
                  <option key={city} value={city}>
                    {city} Metropolitan Region
                  </option>
                ))}
                <option value="custom">Other / Custom Region...</option>
              </select>

              {isCustomCity && (
                <input
                  type="text"
                  placeholder="Enter custom city or region name"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  onBlur={handleCustomCityBlur}
                  className="w-full text-xs bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                />
              )}
            </div>
            <p className="text-[11px] text-text-muted mt-1 leading-normal">
              Select an urban transit network or define a custom geographic zone for route synthesis.
            </p>
          </div>

          {/* 2. User Location */}
          <div className="pt-2 border-t border-border-subtle">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                <span>📍</span>
                <span>User Location</span>
              </label>
              <span className="text-[11px] font-mono text-text-muted">Origin Depot (WGS84)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-text-secondary block mb-0.5">Latitude (-90 to 90)</label>
                <input
                  type="number"
                  step="0.0001"
                  min="-90"
                  max="90"
                  value={latInput}
                  onChange={(e) => handleLatChange(e.target.value)}
                  className={cn(
                    'w-full text-xs font-mono bg-bg-surface border rounded px-2.5 py-1.5 text-text-primary focus:outline-none transition-colors',
                    isLatValid
                      ? 'border-border-default focus:ring-1 focus:ring-accent focus:border-accent'
                      : 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                  )}
                  placeholder="12.9716"
                />
              </div>

              <div>
                <label className="text-[10px] text-text-secondary block mb-0.5">Longitude (-180 to 180)</label>
                <input
                  type="number"
                  step="0.0001"
                  min="-180"
                  max="180"
                  value={lngInput}
                  onChange={(e) => handleLngChange(e.target.value)}
                  className={cn(
                    'w-full text-xs font-mono bg-bg-surface border rounded px-2.5 py-1.5 text-text-primary focus:outline-none transition-colors',
                    isLngValid
                      ? 'border-border-default focus:ring-1 focus:ring-accent focus:border-accent'
                      : 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                  )}
                  placeholder="77.5946"
                />
              </div>
            </div>

            {(!isLatValid || !isLngValid) && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Latitude must be between -90 and 90, Longitude between -180 and 180.</span>
              </p>
            )}

            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={geoStatus.type === 'loading'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border-default bg-bg-subtle hover:bg-bg-subtle/80 text-text-primary text-[11px] font-medium transition-colors disabled:opacity-50"
              >
                {geoStatus.type === 'loading' ? (
                  <Loader2 className="w-3 h-3 animate-spin text-accent" />
                ) : (
                  <Crosshair className="w-3 h-3 text-accent" />
                )}
                <span>Use Current Location</span>
              </button>

              {geoStatus.type === 'success' && (
                <span className="text-[10px] font-mono text-traffic-low flex items-center gap-1 truncate">
                  <Check className="w-3 h-3 shrink-0" />
                  <span>GPS synced</span>
                </span>
              )}
            </div>

            {geoStatus.type === 'error' && (
              <p className="text-[11px] text-rose-500 mt-1.5 flex items-start gap-1 bg-rose-500/10 p-1.5 rounded border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="leading-tight">{geoStatus.message}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Traffic Mode & Traffic Settings */}
        <div className="space-y-4">
          {/* 3. Traffic Mode */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                <span>🚦</span>
                <span>Traffic Mode</span>
              </label>
              <span className="text-[11px] font-mono text-text-muted">Temporal Profile</span>
            </div>

            <select
              value={config.trafficMode}
              onChange={(e) => setConfig({ trafficMode: e.target.value as TrafficModeOption })}
              className="w-full text-xs bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            >
              <option value="Normal">Normal — Standard Baseline Speeds</option>
              <option value="Peak Hours">Peak Hours — High Rush-Hour Congestion (1.8x)</option>
              <option value="Low Traffic">Low Traffic — Night / Off-Peak Free Flow (1.0x)</option>
              <option value="Real-Time Traffic">Real-Time Traffic — Dynamic Telemetry Feeds</option>
            </select>

            <p className="text-[11px] text-text-muted mt-1 leading-normal">
              Dictates edge velocity factors and penalty thresholds applied across road segments.
            </p>
          </div>

          {/* 4. Traffic Settings */}
          <div className="pt-2 border-t border-border-subtle space-y-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                <span>⚙️</span>
                <span>Traffic Settings</span>
              </label>
              <span className="text-[11px] font-mono text-text-muted">Solver Coefficients</span>
            </div>

            {/* Traffic Weight Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-text-secondary">Traffic Weight</span>
                <span className="font-mono text-text-primary font-medium">
                  {Math.round(config.trafficWeight * 100)}% ({config.trafficWeight.toFixed(2)})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.trafficWeight}
                onChange={(e) => setConfig({ trafficWeight: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[9px] font-mono text-text-muted mt-0.5">
                <span>Distance First (0%)</span>
                <span>Balanced (50%)</span>
                <span>Congestion Avoidance (100%)</span>
              </div>
            </div>

            {/* Congestion Sensitivity Selector */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-text-secondary">Congestion Sensitivity</span>
                <span className="text-[10px] font-mono text-text-muted">
                  {config.congestionSensitivity === 'Low' && 'Penalty factor: 1.2x'}
                  {config.congestionSensitivity === 'Medium' && 'Penalty factor: 1.6x'}
                  {config.congestionSensitivity === 'High' && 'Penalty factor: 2.4x'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Low', 'Medium', 'High'] as CongestionSensitivity[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setConfig({ congestionSensitivity: level })}
                    className={cn(
                      'py-1.5 px-2 rounded text-[11px] font-medium border transition-colors text-center',
                      config.congestionSensitivity === level
                        ? 'bg-accent-subtle text-accent-text border-accent/40 font-semibold'
                        : 'border-border-default bg-bg-surface hover:bg-bg-subtle text-text-secondary'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
