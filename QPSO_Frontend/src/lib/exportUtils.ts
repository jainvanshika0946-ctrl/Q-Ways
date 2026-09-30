import { BenchmarkRow, OptimizationResult, VehicleRoute } from '../api/types';

/**
 * Initiates browser file download
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export optimized vehicle routes to CSV
 */
export function exportRoutesToCSV(result: OptimizationResult) {
  const headers = [
    'Vehicle ID',
    'Stop Sequence',
    'Node ID',
    'Node Name',
    'Arrival (min)',
    'Cumulative Distance (km)',
    'Current Load (units)',
    'Vehicle Total Distance (km)',
    'Vehicle Total Time (min)',
  ];

  const rows: string[] = [];
  rows.push(headers.join(','));

  result.routes.forEach((route: VehicleRoute) => {
    route.stops.forEach((stop, index) => {
      const row = [
        `Vehicle ${route.vehicleId}`,
        index + 1,
        `"${stop.nodeId}"`,
        `"${stop.nodeName.replace(/"/g, '""')}"`,
        stop.arrivalMin,
        stop.cumulativeDistanceKm,
        stop.cumulativeLoad,
        route.distanceKm,
        route.timeMin,
      ];
      rows.push(row.join(','));
    });
  });

  const csvContent = rows.join('\n');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadFile(csvContent, `qpso-optimized-routes-${timestamp}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export optimization result to JSON
 */
export function exportRoutesToJSON(result: OptimizationResult) {
  const jsonContent = JSON.stringify(result, null, 2);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadFile(jsonContent, `qpso-optimization-run-${timestamp}.json`, 'application/json');
}

/**
 * Export benchmark rows to CSV
 */
export function exportBenchmarkToCSV(rows: BenchmarkRow[], instanceSize: number) {
  const headers = [
    'Algorithm',
    'Best Cost',
    'Average Cost',
    'Standard Deviation',
    'Runtime (ms)',
    'Iterations to Converge',
    'Network Size (nodes)',
  ];

  const csvRows = [headers.join(',')];
  rows.forEach((row) => {
    csvRows.push(
      [
        row.algorithm,
        row.bestCost,
        row.avgCost,
        row.stdDev,
        row.runtimeMs,
        row.iterToConverge,
        instanceSize,
      ].join(',')
    );
  });

  const csvContent = csvRows.join('\n');
  downloadFile(csvContent, `benchmark-results-nodes-${instanceSize}.csv`, 'text/csv;charset=utf-8;');
}
