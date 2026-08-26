import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { listDriversPage, updateDriverProfile, type DriverProfile } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';

const DEMO_QUEUE: DriverProfile[] = [
  { uid: 'd2', displayName: 'Chidi E.', email: 'chidi@mivo.app', vehicleModel: 'Volvo FH16', plateNumber: 'ABJ-456-ZZ', vehicleType: 'Heavy Duty', vehicleColor: 'Blue', rating: 0, isVerified: false, documentsStatus: 'submitted', isOnline: false, totalTrips: 0, totalEarnings: 0 },
];

export default function AdminCompliance() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<DriverProfile[]>(isDemoMode ? DEMO_QUEUE : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [busyId, setBusyId] = useState<string | null>(null);

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
            {queue.map((driver) => (
              <div key={driver.uid} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-orange-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-gray-900">{driver.displayName}</h4>
                    <p className="text-xs text-gray-400 font-medium">{driver.vehicleModel || driver.vehicleType} · {driver.plateNumber || 'No plate on file'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDecision(driver, true)} disabled={busyId === driver.uid} className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-all disabled:opacity-50">
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDecision(driver, false)} disabled={busyId === driver.uid} className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
