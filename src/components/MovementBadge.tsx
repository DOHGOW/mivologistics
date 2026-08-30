import type { MovementStatus } from '../hooks/useMovementStatus';

const CONFIG: Record<MovementStatus, { label: string; dot: string; text: string; bg: string }> = {
  moving: { label: 'Moving', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
  parked: { label: 'Parked', dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-100' },
  offline: { label: 'Offline', dot: 'bg-red-400', text: 'text-red-600', bg: 'bg-red-50' },
  unknown: { label: 'Locating…', dot: 'bg-gray-300', text: 'text-gray-400', bg: 'bg-gray-50' },
};

interface MovementBadgeProps {
  status: MovementStatus;
  speedKmh?: number;
  className?: string;
}

export default function MovementBadge({ status, speedKmh, className = '' }: MovementBadgeProps) {
  const c = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${c.bg} ${c.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'moving' ? 'animate-pulse' : ''}`} />
      {c.label}
      {status === 'moving' && typeof speedKmh === 'number' && speedKmh > 0 && (
        <span className="font-bold normal-case tracking-normal">· {speedKmh} km/h</span>
      )}
    </span>
  );
}
