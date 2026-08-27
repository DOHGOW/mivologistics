import type { LocationPing } from './firestore';

export interface SafetyReport {
  score: number; // 0-100
  pingCount: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  harshSpeedEvents: number;
  harshBrakingEvents: number;
}

const HARSH_SPEED_KMH = 100; // sustained speed above this on a federal highway is a real risk
const HARSH_BRAKE_DROP_KMH = 25; // speed drop between consecutive pings suggesting sudden braking
const MAX_BRAKE_GAP_SECONDS = 6; // only count a drop as "sudden" if pings are close together in time

/**
 * Computes a rough trip safety score purely from GPS speed samples -- no
 * external service, no cost. This is self-reported by the driver's own
 * device, same trust tier as odometer/mileage self-reporting on any MVP
 * telematics setup; a tamper-resistant version would need a server-side
 * (Cloud Functions) pipeline, which needs Firebase's Blaze plan.
 */
export function computeSafetyScore(pings: LocationPing[]): SafetyReport {
  const withSpeed = pings.filter((p) => typeof p.speedKmh === 'number');
  const speeds = withSpeed.map((p) => p.speedKmh as number);

  let harshSpeedEvents = 0;
  let harshBrakingEvents = 0;

  for (let i = 0; i < withSpeed.length; i++) {
    if (speeds[i] > HARSH_SPEED_KMH) harshSpeedEvents++;

    if (i > 0) {
      const prev = withSpeed[i - 1];
      const cur = withSpeed[i];
      const prevMs = prev.timestamp?.toMillis?.();
      const curMs = cur.timestamp?.toMillis?.();
      const gapSeconds = prevMs && curMs ? (curMs - prevMs) / 1000 : null;
      const drop = speeds[i - 1] - speeds[i];
      if (drop >= HARSH_BRAKE_DROP_KMH && gapSeconds !== null && gapSeconds <= MAX_BRAKE_GAP_SECONDS) {
        harshBrakingEvents++;
      }
    }
  }

  const maxSpeedKmh = speeds.length ? Math.max(...speeds) : 0;
  const avgSpeedKmh = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
  const score = Math.max(0, 100 - harshSpeedEvents * 10 - harshBrakingEvents * 15);

  return {
    score,
    pingCount: pings.length,
    maxSpeedKmh: Math.round(maxSpeedKmh),
    avgSpeedKmh: Math.round(avgSpeedKmh),
    harshSpeedEvents,
    harshBrakingEvents,
  };
}
