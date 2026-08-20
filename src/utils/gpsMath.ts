import { GPSPoint } from '../types';

/**
 * Calculates distance between two lat/lng coordinates in miles using the Haversine formula
 */
export function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate total distance across an array of GPS points
 */
export function calculateTotalDistanceMiles(points: GPSPoint[]): number {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    total += haversineDistanceMiles(p1.lat, p1.lng, p2.lat, p2.lng);
  }
  return Number(total.toFixed(3));
}

/**
 * Calculate cumulative elevation gain in feet from GPS altitude readings (meters to feet)
 */
export function calculateElevationGainFt(points: GPSPoint[]): number {
  if (!points || points.length < 2) return 0;
  let gainMeters = 0;
  for (let i = 1; i < points.length; i++) {
    const prevAlt = points[i - 1].altitude;
    const currAlt = points[i].altitude;
    if (
      typeof prevAlt === 'number' &&
      typeof currAlt === 'number' &&
      currAlt > prevAlt
    ) {
      // Ignore minor jitter under 1.5 meter
      const delta = currAlt - prevAlt;
      if (delta >= 1.5 && delta < 50) {
        gainMeters += delta;
      }
    }
  }
  return Math.round(gainMeters * 3.28084);
}

/**
 * Format minutes per mile to MM:SS /mi
 */
export function formatPace(minutesPerMile: number): string {
  if (!minutesPerMile || !isFinite(minutesPerMile) || minutesPerMile <= 0 || minutesPerMile > 99) {
    return '--:-- /mi';
  }
  let mins = Math.floor(minutesPerMile);
  let secs = Math.round((minutesPerMile - mins) * 60);
  if (secs >= 60) {
    mins += 1;
    secs = 0;
  }
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mins}:${formattedSecs} /mi`;
}

/**
 * Convert speed in MPH to pace in MM:SS /mi
 */
export function speedMphToPace(speedMph: number): string {
  if (!speedMph || speedMph <= 0.1 || !isFinite(speedMph)) return '--:-- /mi';
  const paceMinutes = 60 / speedMph;
  return formatPace(paceMinutes);
}

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
export function formatSecondsToTime(totalSeconds: number): string {
  const sec = Math.floor(totalSeconds % 60);
  const min = Math.floor((totalSeconds / 60) % 60);
  const hrs = Math.floor(totalSeconds / 3600);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (hrs > 0) {
    return `${hrs}:${pad(min)}:${pad(sec)}`;
  }
  return `${pad(min)}:${pad(sec)}`;
}

/**
 * Filter out erratic GPS jumps (accuracy > 35m, or teleports faster than 55mph)
 */
export function isValidGpsPoint(
  newPoint: GPSPoint,
  lastPoint: GPSPoint | null,
  maxAllowedMph = 55
): boolean {
  // Reject low accuracy fixes
  if (typeof newPoint.accuracy === 'number' && newPoint.accuracy > 35) {
    return false;
  }

  if (!lastPoint) return true;

  const timeDeltaSec = (newPoint.timestamp - lastPoint.timestamp) / 1000;
  if (timeDeltaSec <= 0) return false;

  const distMiles = haversineDistanceMiles(
    lastPoint.lat,
    lastPoint.lng,
    newPoint.lat,
    newPoint.lng
  );

  // Minimum movement threshold to prevent stationary GPS drift (approx 2 meters)
  if (distMiles < 0.0012) {
    return false;
  }

  // Speed check for impossible teleports
  const calculatedMph = (distMiles / (timeDeltaSec / 3600));
  if (calculatedMph > maxAllowedMph) {
    return false;
  }

  return true;
}

/**
 * Generates standard GPX XML content compatible with Strava, Garmin, Apple Health, etc.
 */
export function generateGpxString(
  activityName: string,
  points: GPSPoint[],
  startTime: number
): string {
  const startIso = new Date(startTime || Date.now()).toISOString();

  let trkptsXml = '';
  for (const pt of points) {
    const timeIso = new Date(pt.timestamp).toISOString();
    const eleXml = pt.altitude != null ? `\n        <ele>${pt.altitude.toFixed(1)}</ele>` : '';
    const speedMs = pt.speed_mph ? (pt.speed_mph * 0.44704).toFixed(2) : null;
    const extXml = speedMs
      ? `\n        <extensions><speed>${speedMs}</speed></extensions>`
      : '';

    trkptsXml += `      <trkpt lat="${pt.lat.toFixed(6)}" lon="${pt.lng.toFixed(6)}">${eleXml}\n        <time>${timeIso}</time>${extXml}\n      </trkpt>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Workout Tracker PWA" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${activityName} Route</name>
    <time>${startIso}</time>
  </metadata>
  <trk>
    <name>${activityName}</name>
    <type>${activityName.toLowerCase().includes('cycl') ? 'Cycling' : 'Running'}</type>
    <trkseg>
${trkptsXml}    </trkseg>
  </trk>
</gpx>`;
}

/**
 * Triggers a client-side download of a .gpx file
 */
export function downloadGpxFile(filename: string, gpxContent: string): void {
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.gpx') ? filename : `${filename}.gpx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
