import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface LatLng {
  lat: number;
  lng: number;
}

function truckIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:38px;height:38px;background:linear-gradient(135deg,#904d00,#ff8c00);border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(255,140,0,0.45);border:3px solid white;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/></svg>
    </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function customerIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#2563eb,#3b82f6);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(37,99,235,0.45);border:3px solid white;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [JSON.stringify(points), map]);
  return null;
}

function PanTo({ point }: { point: LatLng }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      map.setView([point.lat, point.lng], 14);
      first.current = false;
    } else {
      map.panTo([point.lat, point.lng], { animate: true, duration: 0.8 });
    }
  }, [point.lat, point.lng, map]);
  return null;
}

interface LiveMapProps {
  pickup?: LatLng;
  destination?: LatLng;
  driverPosition?: LatLng | null;
  customerPosition?: LatLng | null;
  fleetMarkers?: { id: string; lat: number; lng: number; label: string }[];
  customerMarkers?: { id: string; lat: number; lng: number; label: string }[];
  height?: string;
  className?: string;
  tileStyle?: 'street' | 'satellite';
}

/** Free OSM + Leaflet map — no API key required. */
export default function LiveMap({ pickup, destination, driverPosition, customerPosition, fleetMarkers, customerMarkers, height = '100%', className = '', tileStyle = 'street' }: LiveMapProps) {
  const center = driverPosition || customerPosition || pickup || (fleetMarkers && fleetMarkers[0]) || { lat: 6.5244, lng: 3.3792 }; // default: Lagos
  const routePoints = [pickup, destination].filter(Boolean) as LatLng[];
  const allPoints = [pickup, destination, driverPosition, customerPosition, ...(fleetMarkers || []), ...(customerMarkers || [])].filter(Boolean) as LatLng[];

  return (
    <div style={{ height }} className={className}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {tileStyle === 'satellite' ? (
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        {routePoints.length === 2 && (
          <Polyline
            positions={routePoints.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#ff8c00', weight: 4, opacity: 0.8, dashArray: '1,10', lineCap: 'round' }}
          />
        )}
        {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pinIcon('#22c55e')} />}
        {destination && <Marker position={[destination.lat, destination.lng]} icon={pinIcon('#ef4444')} />}
        {driverPosition && <Marker position={[driverPosition.lat, driverPosition.lng]} icon={truckIcon()} />}
        {customerPosition && <Marker position={[customerPosition.lat, customerPosition.lng]} icon={customerIcon()} />}
        {fleetMarkers?.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={truckIcon()}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        {customerMarkers?.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={customerIcon()}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        {allPoints.length >= 2 ? <FitBounds points={allPoints} /> : driverPosition ? <PanTo point={driverPosition} /> : null}
      </MapContainer>
    </div>
  );
}
