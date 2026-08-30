import { useEffect, useRef, useState } from 'react';
import { distanceKm } from '../lib/geocode';
import type { DriverLocation } from '../lib/firestore';

export type MovementStatus = 'moving' | 'parked' | 'offline' | 'unknown';

const MOVING_THRESHOLD_KMH = 3; // below this, treat GPS jitter as stationary
const OFFLINE_AFTER_MS = 45000; // no update in 45s -- tracking has stopped

/**
 * Turns a raw DriverLocation doc into a Moving / Parked / Offline label.
 * Device-reported `speedKmh` is unreliable on a lot of hardware (often
 * missing entirely without a strong GPS fix), so this also derives a speed
 * from the distance/time between consecutive updates as a fallback, and
 * separately tracks wall-clock staleness to catch a driver/customer who
 * has closed the app or lost signal (position pushes stop entirely, which
 * onSnapshot alone can't tell you since it only fires on a real change).
 */
export function useMovementStatus(loc: DriverLocation | null): { status: MovementStatus; speedKmh?: number } {
  const [status, setStatus] = useState<MovementStatus>('unknown');
  const [speedKmh, setSpeedKmh] = useState<number | undefined>(undefined);
  const prevRef = useRef<{ lat: number; lng: number; ms: number } | null>(null);
  const lastSeenRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!loc) {
      setStatus('unknown');
      return;
    }
    lastSeenRef.current = Date.now();

    const nowMs = loc.updatedAt?.toMillis() ?? Date.now();
    const prev = prevRef.current;
    let derivedSpeed = loc.speedKmh;

    if (derivedSpeed === undefined && prev && nowMs > prev.ms) {
      const km = distanceKm({ lat: prev.lat, lng: prev.lng }, { lat: loc.lat, lng: loc.lng });
      const hours = (nowMs - prev.ms) / 3600000;
      derivedSpeed = hours > 0 ? km / hours : 0;
    }

    prevRef.current = { lat: loc.lat, lng: loc.lng, ms: nowMs };
    setSpeedKmh(loc.speedKmh ?? (derivedSpeed !== undefined ? Math.round(derivedSpeed) : undefined));
    setStatus(derivedSpeed !== undefined && derivedSpeed > MOVING_THRESHOLD_KMH ? 'moving' : 'parked');
  }, [loc?.lat, loc?.lng, loc?.speedKmh, loc?.updatedAt]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (loc && Date.now() - lastSeenRef.current > OFFLINE_AFTER_MS) setStatus('offline');
    }, 5000);
    return () => clearInterval(interval);
  }, [loc]);

  return { status, speedKmh };
}
