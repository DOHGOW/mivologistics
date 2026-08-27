import { useEffect, useRef, useState } from 'react';
import { pushDriverLocation, pushLocationPing } from '../lib/firestore';

/**
 * While `active` is true, watches the driver's browser geolocation and
 * pushes it to Firestore (throttled) so the customer's LiveMap updates
 * in near-real-time. Cleans up the watch on unmount or when deactivated.
 */
export function useLiveLocationBroadcast(bookingId: string | undefined, active: boolean) {
  const [error, setError] = useState<string | null>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    if (!active || !bookingId || !('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent.current < 4000) return; // throttle to ~1 push / 4s
        lastSent.current = now;
        // coords.speed is meters/second and can be null (unsupported device,
        // or GPS hasn't got a fix yet) -- omit it rather than send a bogus 0.
        const speedKmh = typeof pos.coords.speed === 'number' && pos.coords.speed >= 0
          ? Math.round(pos.coords.speed * 3.6)
          : undefined;
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
          speedKmh,
        };
        pushDriverLocation(bookingId, loc).catch((e) => setError(e instanceof Error ? e.message : String(e)));
        pushLocationPing(bookingId, loc).catch(() => {
          // Non-fatal: live tracking still works even if a ping write fails,
          // it just means this sample is missing from the safety report.
        });
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [bookingId, active]);

  return { error };
}
