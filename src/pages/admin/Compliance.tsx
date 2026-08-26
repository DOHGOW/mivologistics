import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, CheckCircle2, XCircle, ChevronDown, FileText, ImageOff } from 'lucide-react';
import { toast } from 'sonner';
import { listDriversPage, updateDriverProfile, type DriverProfile } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';

const DEMO_QUEUE: DriverProfile[] = [
  {
    uid: 'd2', displayName: 'Chidi E.', email: 'chidi@mivo.app', vehicleModel: 'Volvo FH16', plateNumber: 'ABJ-456-ZZ',
    vehicleType: 'Heavy Duty', vehicleColor: 'Blue', rating: 0, isVerified: false, documentsStatus: 'submitted',
    isOnline: false, totalTrips: 0, totalEarnings: 0,
    dateOfBirth: '1988-03-12', address: '14 Aba Road, Port Harcourt', nin: '98765432109',
    emergencyContactName: 'Ngozi E.', emergencyContactPhone: '08033445566',
    truckYear: '2018', chassisNumber: 'DEMOCHASSIS123', capacityTons: '12',
  },
];

const DOC_FIELDS: { field: keyof NonNullable<DriverProfile['documents']>; label: string }[] = [
  { field: 'license', label: "Driver's License" },
  { field: 'insurance', label: 'Vehicle Insurance' },
  { field: 'registration', label: 'Vehicle Registration' },
  { field: 'permit', label: 'Haulage Permit' },
];

const PHOTO_FIELDS: { field: keyof NonNullable<DriverProfile['truckPhotos']>; label: string }[] = [
  { field: 'front', label: 'Front' },
  { field: 'back', label: 'Back' },
  { field: 'side', label: 'Side' },
  { field: 'plate', label: 'Plate' },
];

export default function AdminCompliance() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<DriverProfile[]>(isDemoMode ? DEMO_QUEUE : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    if (isDemoMode) return;
    setLoading(true);
    listDriversPage(50).then((res) => {
      setQueue(res.items.filter((d) => d.documentsStatus === 'submitted'));
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDecision = async (driver: DriverProfile, approve: boolean) => {
    if (isDemoMode || !driver.uid) { toast.info('Demo mode — connect Firebase to process real KYC decisions.'); return; }
    setBusyId(driver.uid);
    try {
      await updateDriverProfile(driver.uid, approve ? { isVerified: true, documentsStatus: 'verified' } : { isVerified: false, documentsStatus: 'rejected' });
      toast.success(`${driver.displayName} ${approve ? 'approved' : 'rejected'}.`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not process decision.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="font-display font-bold text-lg text-gray-900">Compliance & KYC</h1>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-8">
        <p className="text-sm text-gray-500 font-medium mb-6">
          Drivers who have submitted documents and are waiting for review. Approving here verifies them for live jobs immediately.
        </p>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50">
          {loading && <p className="text-center py-10 text-gray-400 font-medium">Loading queue…</p>}
          {!loading && queue.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No drivers waiting for review.</p>
            </div>
          )}
          <div className="space-y-4">
            {queue.map((driver) => {
              const isExpanded = expandedId === driver.uid;
              return (
                <div key={driver.uid} className="bg-gray-50 rounded-3xl border border-transparent hover:border-orange-100 transition-all overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : driver.uid)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-gray-900">{driver.displayName}</h4>
                        <p className="text-xs text-gray-400 font-medium">{driver.vehicleModel || driver.vehicleType} · {driver.plateNumber || 'No plate on file'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleDecision(driver, true); }} disabled={busyId === driver.uid} className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-all disabled:opacity-50">
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDecision(driver, false); }} disabled={busyId === driver.uid} className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50">
                        <XCircle className="w-5 h-5" />
                      </button>
                      <ChevronDown className={`w-5 h-5 text-gray-400 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-6">
                      <section>
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Biodata</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <InfoField label="Date of Birth" value={driver.dateOfBirth} />
                          <InfoField label="NIN" value={driver.nin} />
                          <InfoField label="Address" value={driver.address} />
                          <InfoField label="Emergency Contact" value={driver.emergencyContactName ? `${driver.emergencyContactName} · ${driver.emergencyContactPhone}` : undefined} />
                        </div>
                      </section>

                      <section>
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Truck Details</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <InfoField label="Year" value={driver.truckYear} />
                          <InfoField label="Chassis / VIN" value={driver.chassisNumber} />
                          <InfoField label="Capacity" value={driver.capacityTons ? `${driver.capacityTons} tons` : undefined} />
                          <InfoField label="Color" value={driver.vehicleColor} />
                        </div>
                      </section>

                      <section>
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Truck Photos</h5>
                        <div className="grid grid-cols-4 gap-3">
                          {PHOTO_FIELDS.map((f) => (
                            <div key={f.field}><ImageTile label={f.label} url={driver.truckPhotos?.[f.field]} /></div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Documents</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {DOC_FIELDS.map((f) => (
                            <div key={f.field}><DocTile label={f.label} url={driver.documents?.[f.field]} /></div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-white rounded-2xl p-3 border border-gray-100">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900 truncate">{value || '—'}</p>
    </div>
  );
}

function ImageTile({ label, url }: { label: string; url?: string }) {
  return (
    <a
      href={url || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center ${!url ? 'pointer-events-none' : ''}`}
    >
      {url ? (
        <img src={url} alt={label} className="w-full h-full object-cover" />
      ) : (
        <ImageOff className="w-5 h-5 text-gray-300" />
      )}
      <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] font-bold uppercase tracking-widest text-center py-1">{label}</span>
    </a>
  );
}

function DocTile({ label, url }: { label: string; url?: string }) {
  return (
    <a
      href={url || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 bg-white rounded-2xl p-3 border ${url ? 'border-green-100 text-gray-900' : 'border-gray-100 text-gray-300 pointer-events-none'}`}
    >
      <FileText className={`w-4 h-4 shrink-0 ${url ? 'text-green-500' : 'text-gray-300'}`} />
      <span className="text-xs font-semibold truncate">{label}</span>
    </a>
  );
}
