/**
 * Formatting utilities for units and numbers
 */

export function formatDistance(km: number): string {
  if (km == null || isNaN(km)) return '0.0 km';
  return `${km.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

export function formatTime(min: number): string {
  if (min == null || isNaN(min)) return '0 min';
  const totalMin = Math.round(min);
  if (totalMin < 60) {
    return `${totalMin} min`;
  }
  const hours = Math.floor(totalMin / 60);
  const remainder = totalMin % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function formatMs(ms: number): string {
  if (ms == null || isNaN(ms)) return '0 ms';
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }
  return `${Math.round(ms)} ms`;
}

export function formatNumber(val: number, decimals: number = 1): string {
  if (val == null || isNaN(val)) return '0';
  return val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(val: number): string {
  if (val == null || isNaN(val)) return '0%';
  return `${Math.round(val)}%`;
}
