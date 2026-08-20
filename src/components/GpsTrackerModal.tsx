import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  RotateCcw,
  Navigation,
  Footprints,
  Bike,
  MapPin,
  Flame,
  Radio,
  Download,
  Eye,
  SlidersHorizontal,
  Sun,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock
} from 'lucide-react';
import { useGpsTracker } from '../hooks/useGpsTracker';
import { RouteMap } from './RouteMap';
import { formatSecondsToTime, generateGpxString, downloadGpxFile } from '../utils/gpsMath';
import { GPSPoint } from '../types';

interface GpsTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishWorkout: (data: {
    activityType: string;
    durationMins: number;
    distanceMiles: number;
    speedMph: number;
    pacePerMile: string;
    elevationGainFt: number;
    routePoints: GPSPoint[];
    zone2?: boolean;
  }) => void;
  onOpenPreferences?: () => void;
}

export const GpsTrackerModal: React.FC<GpsTrackerModalProps> = ({
  isOpen,
  onClose,
  onFinishWorkout,
  onOpenPreferences
}) => {
  const {
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
  } = useGpsTracker({ activityType: 'running' });

  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [isZone2, setIsZone2] = useState(true);
  const [mapAutoCenter, setMapAutoCenter] = useState(true);

  if (!isOpen) return null;

  const handleFinish = () => {
    stopTracking();
    const durationMins = Number((durationSeconds / 60).toFixed(2));
    const speed = avgSpeedMph > 0 ? avgSpeedMph : (distanceMiles > 0 && durationMins > 0 ? Number((distanceMiles / (durationMins / 60)).toFixed(2)) : 0);

    onFinishWorkout({
      activityType,
      durationMins: durationMins > 0 ? durationMins : 1,
      distanceMiles: distanceMiles,
      speedMph: speed,
      pacePerMile: avgPace,
      elevationGainFt,
      routePoints: points,
      zone2: isZone2
    });
    onClose();
  };

  const handleExportGpx = () => {
    if (points.length === 0) return;
    const gpx = generateGpxString(
      activityType === 'cycling' ? 'Outdoor Cycling' : 'Outdoor Run',
      points,
      Date.now() - durationSeconds * 1000
    );
    downloadGpxFile(`${activityType}_route_${new Date().toISOString().split('T')[0]}`, gpx);
  };

  const handleSafeClose = () => {
    if (status === 'tracking' || status === 'paused') {
      setIsConfirmingDiscard(true);
    } else {
      resetTracking();
      onClose();
    }
  };

  const activities = [
    { id: 'running', name: 'Outdoor Run', icon: Footprints, color: 'text-emerald-400' },
    { id: 'cycling', name: 'Outdoor Cycling', icon: Bike, color: 'text-blue-400' },
    { id: 'walking', name: 'Walk / Ruck', icon: MapPin, color: 'text-amber-400' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div
        id="gps-tracker-modal"
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl shadow-black my-4 max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Tracker Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-950 text-emerald-400 border border-zinc-800 relative">
              <Navigation className={`w-5 h-5 ${status === 'tracking' ? 'animate-pulse text-emerald-400' : 'text-zinc-400'}`} />
              {status === 'tracking' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
                  Outdoor GPS Activity Tracker
                </h2>
                {status === 'tracking' && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full font-bold">
                    LIVE RECORDING
                  </span>
                )}
                {status === 'paused' && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-full font-bold">
                    PAUSED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                {/* GPS Signal Status Badge */}
                <div className="flex items-center gap-1.5 font-mono">
                  <Radio className={`w-3.5 h-3.5 ${
                    gpsSignalQuality === 'high' ? 'text-emerald-400' :
                    gpsSignalQuality === 'medium' ? 'text-amber-400' :
                    gpsSignalQuality === 'low' ? 'text-rose-400' : 'text-zinc-500 animate-spin'
                  }`} />
                  <span>
                    GPS: {gpsSignalQuality === 'high' ? 'High Fix' : gpsSignalQuality === 'medium' ? 'Fair' : gpsSignalQuality === 'low' ? 'Poor' : 'Searching...'}
                    {gpsAccuracy != null && ` (±${Math.round(gpsAccuracy)}m)`}
                  </span>
                </div>

                {/* Wake Lock Status */}
                {wakeLockActive && (
                  <div className="hidden sm:flex items-center gap-1 text-emerald-400/90 font-mono text-[11px]">
                    <Lock className="w-3 h-3" />
                    <span>Screen Awake</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulation toggle button for easy testing / troubleshooting */}
            <button
              type="button"
              id="gps-sim-toggle-btn"
              onClick={toggleSimulation}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                isSimulating
                  ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle simulated GPS route for testing without walking outside"
            >
              <span>🧪</span>
              <span className="hidden sm:inline">{isSimulating ? 'Simulating' : 'Simulate'}</span>
            </button>

            {onOpenPreferences && (
              <button
                type="button"
                onClick={onOpenPreferences}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 transition-colors"
                title="Settings & Disable Options"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSafeClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 transition-colors"
              title="Close tracker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error / Alert Banner if permission or signal issue */}
        {error && (
          <div className="px-5 py-3 bg-rose-950/80 border-b border-rose-900 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={toggleSimulation}
              className="px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded-lg font-semibold shrink-0"
            >
              Run Simulation Mode
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Activity Selector (Only enabled before starting) */}
          {status === 'idle' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Select Outdoor Sport
              </label>
              <div className="grid grid-cols-3 gap-2">
                {activities.map(act => {
                  const Icon = act.icon;
                  const isSelected = activityType === act.id;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActivityType(act.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-zinc-900 border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? act.color : 'text-zinc-500'}`} />
                      <div>
                        <span className="text-xs font-bold block">{act.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">Auto-mapped</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Primary High-Contrast Outdoor Telemetry HUD */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Distance */}
            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Distance
              </span>
              <div className="my-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono-numbers tracking-tight">
                  {distanceMiles.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-zinc-500 ml-1.5">MI</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {points.length} GPS Waypoints
              </span>
            </div>

            {/* Elapsed Time */}
            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Elapsed Time
              </span>
              <div className="my-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono-numbers tracking-tight">
                  {formatSecondsToTime(durationSeconds)}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {status === 'tracking' ? 'Live Timer' : status === 'paused' ? 'Timer Paused' : 'Ready'}
              </span>
            </div>

            {/* Current & Avg Speed (MPH) */}
            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Speed (MPH)
              </span>
              <div className="my-1 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-amber-300 font-mono-numbers tracking-tight">
                  {currentSpeedMph.toFixed(1)}
                </span>
                <span className="text-xs font-mono text-zinc-500">MPH</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                Avg: <strong className="text-amber-200">{avgSpeedMph.toFixed(1)}</strong> mph
              </span>
            </div>

            {/* Pace */}
            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Pace (/mi)
              </span>
              <div className="my-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-300 font-mono-numbers tracking-tight">
                  {currentPace}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                Avg: <strong className="text-blue-200">{avgPace}</strong>
              </span>
            </div>
          </div>

          {/* Secondary Stats Strip: Elevation, Zone 2, GPX */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="text-zinc-500">Elevation Climb:</span>
                <span className="font-bold font-mono text-emerald-400">+{elevationGainFt} ft</span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isZone2}
                  onChange={e => setIsZone2(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0"
                />
                <span className="text-zinc-300 font-medium">Zone 2 Aerobic</span>
              </label>
            </div>

            {points.length > 1 && (
              <button
                type="button"
                id="export-gpx-btn"
                onClick={handleExportGpx}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export GPX</span>
              </button>
            )}
          </div>

          {/* Live Interactive Route Map */}
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                Live Route Map
              </span>
              <button
                type="button"
                onClick={() => setMapAutoCenter(!mapAutoCenter)}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                  mapAutoCenter
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                {mapAutoCenter ? 'Auto-Following' : 'Free Pan'}
              </button>
            </div>

            <RouteMap
              points={points}
              currentLocation={currentLocation}
              autoCenter={mapAutoCenter}
              className="h-72 sm:h-96 w-full rounded-2xl shadow-inner border border-zinc-800"
              theme="dark"
            />
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            {status === 'idle' && 'Click Start when ready to begin tracking your route.'}
            {status === 'tracking' && 'Live GPS recording active. Keep screen visible or locked.'}
            {status === 'paused' && 'Workout paused. Press Resume to continue or Finish to save.'}
            {status === 'stopped' && 'Workout finished. Save below to add to your workout history.'}
          </div>

          <div className="flex items-center gap-2">
            {/* IDLE STATE: START */}
            {status === 'idle' && (
              <button
                type="button"
                id="start-gps-workout-btn"
                onClick={startTracking}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Outdoor {activityType === 'cycling' ? 'Ride' : 'Run'}</span>
              </button>
            )}

            {/* TRACKING STATE: PAUSE */}
            {status === 'tracking' && (
              <>
                <button
                  type="button"
                  id="pause-gps-workout-btn"
                  onClick={pauseTracking}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </button>
                <button
                  type="button"
                  id="finish-gps-workout-btn"
                  onClick={handleFinish}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finish & Save</span>
                </button>
              </>
            )}

            {/* PAUSED STATE: RESUME & FINISH */}
            {status === 'paused' && (
              <>
                <button
                  type="button"
                  id="resume-gps-workout-btn"
                  onClick={resumeTracking}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finish & Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDiscard(true)}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 text-rose-400 rounded-2xl font-bold text-sm transition-all"
                  title="Discard workout"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}

            {/* STOPPED STATE */}
            {status === 'stopped' && (
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save to History</span>
              </button>
            )}
          </div>
        </div>

        {/* Discard Confirmation Overlay */}
        {isConfirmingDiscard && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full space-y-4 text-center">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Discard GPS Activity?</h3>
              <p className="text-xs text-zinc-400">
                You have recorded {distanceMiles.toFixed(2)} miles over {formatSecondsToTime(durationSeconds)}. Are you sure you want to discard this route?
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDiscard(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
                >
                  Keep Tracking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetTracking();
                    setIsConfirmingDiscard(false);
                    onClose();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl"
                >
                  Yes, Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
