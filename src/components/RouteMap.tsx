import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GPSPoint } from '../types';

interface RouteMapProps {
  points: GPSPoint[];
  currentLocation?: GPSPoint | null;
  interactive?: boolean;
  autoCenter?: boolean;
  className?: string;
  showElevationProfile?: boolean;
  theme?: 'dark' | 'voyager' | 'standard';
}

export const RouteMap: React.FC<RouteMapProps> = ({
  points = [],
  currentLocation,
  interactive = true,
  autoCenter = true,
  className = 'h-64 w-full rounded-xl overflow-hidden',
  theme = 'dark'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: if points exist, use first point, else fallback
      const initialCenter: [number, number] =
        points.length > 0
          ? [points[0].lat, points[0].lng]
          : currentLocation
          ? [currentLocation.lat, currentLocation.lng]
          : [40.785091, -73.968285];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 15,
        zoomControl: interactive,
        attributionControl: false,
        dragging: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
        touchZoom: interactive,
        doubleClickZoom: interactive
      });

      // CartoDB Dark Matter or Voyager Tiles
      const tileUrl =
        theme === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : theme === 'voyager'
          ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // Create glowing polyline
      const polyline = L.polyline([], {
        color: '#10b981', // Emerald glow
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        smoothFactor: 1
      }).addTo(map);

      mapInstanceRef.current = map;
      polylineRef.current = polyline;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        polylineRef.current = null;
        startMarkerRef.current = null;
        endMarkerRef.current = null;
        currentMarkerRef.current = null;
      }
    };
  }, [theme]); // only re-run if theme changes

  // Update Polyline and Markers when points change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const polyline = polylineRef.current;
    if (!map || !polyline) return;

    const latLngs: [number, number][] = points.map(p => [p.lat, p.lng]);
    polyline.setLatLngs(latLngs);

    // Start Marker (Green Circle with Ring)
    if (points.length > 0) {
      const startPt = points[0];
      const startIcon = L.divIcon({
        className: 'custom-start-marker',
        html: `
          <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 22px; height: 22px; background: rgba(16, 185, 129, 0.3); border-radius: 50%; animation: pulse 2s infinite;"></div>
            <div style="width: 12px; height: 12px; background: #10b981; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.6);"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      if (!startMarkerRef.current) {
        startMarkerRef.current = L.marker([startPt.lat, startPt.lng], { icon: startIcon }).addTo(map);
      } else {
        startMarkerRef.current.setLatLng([startPt.lat, startPt.lng]);
      }
    } else if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }

    // End Marker (if route has ended or stopped and > 1 point)
    if (points.length > 1 && !currentLocation) {
      const endPt = points[points.length - 1];
      const endIcon = L.divIcon({
        className: 'custom-end-marker',
        html: `
          <div style="width: 14px; height: 14px; background: #ef4444; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.6);"></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      if (!endMarkerRef.current) {
        endMarkerRef.current = L.marker([endPt.lat, endPt.lng], { icon: endIcon }).addTo(map);
      } else {
        endMarkerRef.current.setLatLng([endPt.lat, endPt.lng]);
      }
    } else if (endMarkerRef.current) {
      endMarkerRef.current.remove();
      endMarkerRef.current = null;
    }

    // Fit Bounds if points exist and not actively following a single moving dot
    if (points.length > 1 && autoCenter && !currentLocation) {
      try {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [25, 25], maxZoom: 16 });
      } catch (e) {
        // ignore bounds errors
      }
    }
  }, [points, autoCenter, currentLocation]);

  // Update Live Current Position Marker (Blue radar pulsating ring)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentLocation) {
      const currentIcon = L.divIcon({
        className: 'custom-live-radar-marker',
        html: `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 32px; height: 32px; background: rgba(59, 130, 246, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; background: #3b82f6; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (!currentMarkerRef.current) {
        currentMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], {
          icon: currentIcon,
          zIndexOffset: 1000
        }).addTo(map);
      } else {
        currentMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
      }

      if (autoCenter) {
        map.panTo([currentLocation.lat, currentLocation.lng], { animate: true, duration: 0.5 });
      }
    } else if (currentMarkerRef.current) {
      currentMarkerRef.current.remove();
      currentMarkerRef.current = null;
    }
  }, [currentLocation, autoCenter]);

  return (
    <div className={`relative ${className} bg-zinc-950 border border-zinc-800`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {points.length === 0 && !currentLocation && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-xs text-xs text-zinc-500 font-mono">
          Waiting for GPS route data...
        </div>
      )}
    </div>
  );
};
