import { useState, useEffect, useRef, useCallback } from 'react';
import { GPSPoint } from '../types';
import {
  haversineDistanceMiles,
  calculateTotalDistanceMiles,
  calculateElevationGainFt,
  speedMphToPace,
  formatPace,
  isValidGpsPoint
} from '../utils/gpsMath';

export type TrackingStatus = 'idle' | 'tracking' | 'paused' | 'stopped';
export type GpsSignalQuality = 'high' | 'medium' | 'low' | 'searching' | 'error';

interface UseGpsTrackerOptions {
  activityType?: string;
  onPointAdded?: (point: GPSPoint) => void;
}

export function useGpsTracker(options: UseGpsTrackerOptions = {}) {
  const [activityType, setActivityType] = useState<string>(options.activityType || 'running');
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [points, setPoints] = useState<GPSPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GPSPoint | null>(null);
  const [distanceMiles, setDistanceMiles] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [currentSpeedMph, setCurrentSpeedMph] = useState<number>(0);
  const [avgSpeedMph, setAvgSpeedMph] = useState<number>(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsSignalQuality, setGpsSignalQuality] = useState<GpsSignalQuality>('searching');
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);

  // References to preserve state across intervals and handlers
  const watchIdRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const simIntervalRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const lastActiveTimestampRef = useRef<number>(0);
  const accumulatedSecondsRef = useRef<number>(0);
  const pointsRef = useRef<GPSPoint[]>([]);

  // Keep pointsRef in sync
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  // Screen Wake Lock Management
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = lock;
        setWakeLockActive(true);
        lock.addEventListener('release', () => {
          setWakeLockActive(false);
          wakeLockRef.current = null;
        });
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
        setWakeLockActive(false);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        // ignore
      }
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  }, []);

  // Compute Signal Quality from accuracy in meters
  const evaluateSignalQuality = (accuracyMeters?: number | null): GpsSignalQuality => {
    if (accuracyMeters == null) return 'searching';
    if (accuracyMeters <= 8) return 'high';
    if (accuracyMeters <= 20) return 'medium';
    return 'low';
  };

  // Add a new GPS point to the route
  const handleNewPosition = useCallback((coords: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    speed?: number | null;
    accuracy?: number | null;
    heading?: number | null;
  }) => {
    const now = Date.now();
    const accuracy = coords.accuracy ?? null;
    setGpsAccuracy(accuracy);
    setGpsSignalQuality(evaluateSignalQuality(accuracy));
    setError(null);

    // Speed conversion: browser returns meters/second -> convert to MPH (1 m/s = 2.23694 mph)
    let speedMph: number | null = null;
    if (coords.speed != null && coords.speed >= 0) {
      speedMph = Number((coords.speed * 2.23694).toFixed(1));
    }

    const newPoint: GPSPoint = {
      lat: coords.latitude,
      lng: coords.longitude,
      altitude: coords.altitude ?? null,
      speed_mph: speedMph,
      timestamp: now,
      accuracy: accuracy
    };

    setCurrentLocation(newPoint);

    // Only record points if actively tracking (not paused or idle)
    if (status === 'tracking') {
      const lastPoint = pointsRef.current[pointsRef.current.length - 1] || null;
      
      // Filter out stationary drift or erratic jumps
      if (isValidGpsPoint(newPoint, lastPoint)) {
        setPoints(prev => {
          const updated = [...prev, newPoint];
          const newDist = calculateTotalDistanceMiles(updated);
          setDistanceMiles(newDist);
          return updated;
        });

        // Set instantaneous speed (fallback to distance/time if GPS speed not provided)
        if (speedMph != null && speedMph > 0) {
          setCurrentSpeedMph(speedMph);
        } else if (lastPoint) {
          const dMiles = haversineDistanceMiles(lastPoint.lat, lastPoint.lng, newPoint.lat, newPoint.lng);
          const dtHours = (newPoint.timestamp - lastPoint.timestamp) / 3600000;
          if (dtHours > 0) {
            const calculatedSpd = Number((dMiles / dtHours).toFixed(1));
            if (calculatedSpd <= 50) {
              setCurrentSpeedMph(calculatedSpd);
            }
          }
        }
      }
    }
  }, [status]);

  // Start Real GPS Geolocation Watch
  const startGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser or device.');
      setGpsSignalQuality('error');
      return;
    }

    setGpsSignalQuality('searching');

    // Clear existing watch if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        handleNewPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading
        });
      },
      err => {
        console.warn('Geolocation watch error:', err);
        if (err.code === 1) {
          setError('Location permission denied. Please allow location access in your browser settings.');
        } else if (err.code === 2) {
          setError('GPS position unavailable. Check if device location is enabled.');
        } else {
          setError('GPS timeout. Searching for satellite fix...');
        }
        setGpsSignalQuality('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000
      }
    );
  }, [handleNewPosition]);

  // Simulation generator for easy desktop/indoor testing without walking outside
  const startSimulation = useCallback(() => {
    setIsSimulating(true);
    setError(null);
    setGpsSignalQuality('high');
    setGpsAccuracy(3);

    // Initial starting point (Central Park / scenic loop coordinates)
    let currentLat = 40.785091;
    let currentLng = -73.968285;
    let angle = 0;
    const baseSpeedMph = activityType === 'cycling' ? 14.5 : 7.2;

    simIntervalRef.current = setInterval(() => {
      angle += 0.04;
      const r = 0.0035 + Math.sin(angle * 3) * 0.0008;
      currentLat = 40.785091 + r * Math.sin(angle);
      currentLng = -73.968285 + r * Math.cos(angle) * 1.3;
      const speedVariation = baseSpeedMph + (Math.random() * 0.8 - 0.4);

      handleNewPosition({
        latitude: currentLat,
        longitude: currentLng,
        altitude: 45 + Math.sin(angle) * 10,
        speed: speedVariation * 0.44704, // m/s
        accuracy: 3.5,
        heading: (angle * 180) / Math.PI
      });
    }, 1500);
  }, [activityType, handleNewPosition]);

  const stopSimulation = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSimulating(false);
  }, []);

  // Controls
  const startTracking = useCallback(() => {
    setStatus('tracking');
    startTimeRef.current = Date.now();
    lastActiveTimestampRef.current = Date.now();
    requestWakeLock();

    if (isSimulating) {
      startSimulation();
    } else {
      startGeolocation();
    }

    // Active Timer
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastActiveTimestampRef.current) / 1000;
      lastActiveTimestampRef.current = now;
      accumulatedSecondsRef.current += delta;
      const totalSec = Math.floor(accumulatedSecondsRef.current);
      setDurationSeconds(totalSec);

      // Compute rolling average speed
      if (totalSec > 3 && pointsRef.current.length > 1) {
        const totalDist = calculateTotalDistanceMiles(pointsRef.current);
        const hours = totalSec / 3600;
        if (hours > 0) {
          setAvgSpeedMph(Number((totalDist / hours).toFixed(1)));
        }
      }
    }, 1000);
  }, [isSimulating, requestWakeLock, startGeolocation, startSimulation]);

  const pauseTracking = useCallback(() => {
    setStatus('paused');
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setCurrentSpeedMph(0);
  }, []);

  const resumeTracking = useCallback(() => {
    setStatus('tracking');
    lastActiveTimestampRef.current = Date.now();
    requestWakeLock();

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastActiveTimestampRef.current) / 1000;
      lastActiveTimestampRef.current = now;
      accumulatedSecondsRef.current += delta;
      const totalSec = Math.floor(accumulatedSecondsRef.current);
      setDurationSeconds(totalSec);

      if (totalSec > 3 && pointsRef.current.length > 1) {
        const totalDist = calculateTotalDistanceMiles(pointsRef.current);
        const hours = totalSec / 3600;
        if (hours > 0) {
          setAvgSpeedMph(Number((totalDist / hours).toFixed(1)));
        }
      }
    }, 1000);
  }, [requestWakeLock]);

  const stopTracking = useCallback(() => {
    setStatus('stopped');
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    stopSimulation();
    releaseWakeLock();
    setCurrentSpeedMph(0);
  }, [releaseWakeLock, stopSimulation]);

  const resetTracking = useCallback(() => {
    stopTracking();
    setStatus('idle');
    setPoints([]);
    setDistanceMiles(0);
    setDurationSeconds(0);
    setCurrentSpeedMph(0);
    setAvgSpeedMph(0);
    setError(null);
    accumulatedSecondsRef.current = 0;
    pointsRef.current = [];
  }, [stopTracking]);

  const toggleSimulation = useCallback(() => {
    if (isSimulating) {
      stopSimulation();
      if (status === 'tracking') {
        startGeolocation();
      }
    } else {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      startSimulation();
    }
  }, [isSimulating, startGeolocation, startSimulation, status, stopSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  // Derived metrics
  const currentPace = speedMphToPace(currentSpeedMph);
  const avgPace = avgSpeedMph > 0 ? speedMphToPace(avgSpeedMph) : formatPace(distanceMiles > 0 ? (durationSeconds / 60) / distanceMiles : 0);
  const elevationGainFt = calculateElevationGainFt(points);

  return {
    status,
    activityType,
    setActivityType,
    points,
    currentLocation,
    distanceMiles,
    durationSeconds,
    currentSpeedMph,
    avgSpeedMph,
    currentPace,
    avgPace,
    elevationGainFt,
    gpsAccuracy,
    gpsSignalQuality,
    error,
    isSimulating,
    wakeLockActive,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    resetTracking,
    toggleSimulation
  };
}
