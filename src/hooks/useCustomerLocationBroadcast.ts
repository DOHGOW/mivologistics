import { useEffect, useRef } from 'react';
import { pushCustomerLocation } from '../lib/firestore';

/**
 * Mirrors useLiveLocationBroadcast for the customer side -- while `active`,
 * watches the customer's browser geolocation and pushes it (throttled) so
 * the driver/admin can find them at a pickup point and tell if they're
 * moving. No ping history here (that's only kept for the driver's post-trip
 * safety score); the customer just needs a current position.
 */
export function useCustomerLocationBroadcast(bookingId: string | undefined, active: boolean) {
  const lastSent = useRef(0);

  useEffect(() => {
    if (!active || !bookingId || !('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent.current < 4000) return; // throttle to ~1 push / 4s
        lastSent.current = now;
        const speedKmh = typeof pos.coords.speed === 'number' && pos.coords.speed >= 0
          ? Math.round(pos.coords.speed * 3.6)
          : undefined;
        pushCustomerLocation(bookingId, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
          speedKmh,
        }).catch((e) => {
          // Non-fatal: tracking is a courtesy for the driver/admin view, not
          // something that should ever block or alarm the customer -- but
          // still worth a console trace instead of vanishing entirely.
          console.error('pushCustomerLocation failed:', e);
        });
      },
      () => {
        // Permission denied or unavailable -- tracking just silently stays
        // off; the customer's booking flow itself never depends on this.
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [bookingId, active]);
}
