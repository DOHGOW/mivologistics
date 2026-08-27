import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Truck, Star, CheckCircle2, Ban, FileWarning } from 'lucide-react';
import { toast } from 'sonner';
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';
import { listDriversPage, updateDriverProfile, getDriverStats, getDriverRating, type DriverProfile } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';
import Pagination from '../../components/Pagination';

const DEMO_DRIVERS: DriverProfile[] = [
  { uid: '1', displayName: 'John Driver', email: 'john@mivo.app', vehicleModel: 'Mercedes Actros', plateNumber: 'LAG-123-XY', vehicleType: 'Heavy Duty', vehicleColor: 'White', rating: 4.9, isVerified: true, documentsStatus: 'verified', isOnline: true, totalTrips: 142, totalEarnings: 845000 },
  { uid: '2', displayName: 'Chidi E.', email: 'chidi@mivo.app', vehicleModel: 'Volvo FH16', plateNumber: 'ABJ-456-ZZ', vehicleType: 'Heavy Duty', vehicleColor: 'Blue', rating: 4.7, isVerified: false, documentsStatus: 'submitted', isOnline: false, totalTrips: 85, totalEarnings: 420000 },
  { uid: '3', displayName: 'Blessing O.', email: 'blessing@mivo.app', vehicleModel: 'MAN TGX', plateNumber: 'PHC-012-BB', vehicleType: 'Medium', vehicleColor: 'Red', rating: 4.5, isVerified: true, documentsStatus: 'verified', isOnline: false, totalTrips: 34, totalEarnings: 150000 },
];

export default function AdminDrivers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const { items, page, hasMore, loading, next, prev, reload } = usePaginatedQuery<DriverProfile>(
    (pageSize, cursor) => listDriversPage(pageSize, cursor),
    10
  );

  // totalTrips/totalEarnings on DriverProfile are never actually written
  // (firestore.rules doesn't let a driver self-update them) -- derive the
  // real numbers per row, live, from delivered bookings instead. Keyed by
  // uid and only fetched once per driver so paging back and forth doesn't
  // re-fetch what's already known.
  const [driverStats, setDriverStats] = useState<Record<string, { totalTrips: number; totalEarnings: number }>>({});
  // Same story for rating -- derived live from the reviews collection.
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isDemoMode) return;
    const toFetch = items.filter((d) => !(d.uid in driverStats));
    if (toFetch.length === 0) return;
    toFetch.forEach((d) => {
      getDriverStats(d.uid).then((stats) => {
        setDriverStats((prev) => ({ ...prev, [d.uid]: stats }));
      });
      getDriverRating(d.uid).then((r) => {
        setRatings((prev) => ({ ...prev, [d.uid]: r.rating || 4.9 }));
      });
    });
  }, [items]);

  const drivers = (isDemoMode ? DEMO_DRIVERS : items).filter((d) =>
    !searchQuery.trim() || d.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || d.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVerify = async (driver: DriverProfile) => {
    if (isDemoMode) { toast.info('Demo mode — connect Firebase to verify real drivers.'); return; }
    setBusyId(driver.uid);
    try {
      await updateDriverProfile(driver.uid, { isVerified: true, documentsStatus: 'verified' });
      toast.success(`${driver.displayName} is now verified.`);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not verify driver.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSuspend = async (driver: DriverProfile) => {
    if (isDemoMode) { toast.info('Demo mode — connect Firebase to suspend real drivers.'); return; }
    setBusyId(driver.uid);
    try {
      await updateDriverProfile(driver.uid, { isVerified: false, isOnline: false, documentsStatus: 'rejected' });
      toast.success(`${driver.displayName} has been suspended.`);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not suspend driver.');
    } finally {
      setBusyId(null);
    }
  };

  const statusLabel = (d: DriverProfile) => (d.isVerified ? 'Verified' : d.documentsStatus === 'rejected' ? 'Suspended' : d.documentsStatus === 'submitted' ? 'Pending' : 'Incomplete');
  const statusColor = (d: DriverProfile) => (d.isVerified ? 'bg-green-50 text-green-600' : d.documentsStatus === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600');

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="font-display font-bold text-lg text-gray-900">Driver Management</h1>
          </div>
          <div className="hidden sm:flex items-center bg-gray-50 rounded-xl px-4 h-10 border border-transparent focus-within:bg-white focus-within:border-orange-100 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-3" />
            <input type="text" placeholder="Search drivers..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-medium text-gray-900" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-50">
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Driver</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Performance</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {drivers.length === 0 && !loading && (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-400 font-medium">No drivers found.</td></tr>
                )}
                {drivers.map((driver) => (
                  <tr key={driver.uid} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-display font-black text-sm">
                          {driver.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-display font-bold text-gray-900">{driver.displayName}</p>
                          <p className="text-xs text-gray-400 font-medium">{driver.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-900 font-bold">
                          <Truck className="w-3 h-3 text-gray-400" />
                          {driver.vehicleModel || 'Not set'}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{driver.plateNumber || '—'}</div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-orange-400 fill-current" />
                        <span className="font-display font-bold text-gray-900">{(isDemoMode ? driver.rating : ratings[driver.uid] ?? 4.9).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {isDemoMode ? (
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-900">₦{driver.totalEarnings.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{driver.totalTrips} Trips</p>
                        </div>
                      ) : driverStats[driver.uid] ? (
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-900">₦{driverStats[driver.uid].totalEarnings.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{driverStats[driver.uid].totalTrips} Trips</p>
                        </div>
                      ) : (
                        <div className="space-y-1 animate-pulse">
                          <div className="h-4 w-16 bg-gray-100 rounded" />
                          <div className="h-3 w-12 bg-gray-100 rounded" />
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${statusColor(driver)}`}>
                        {statusLabel(driver)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {!driver.isVerified && (
                          <button onClick={() => handleVerify(driver)} disabled={busyId === driver.uid} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all disabled:opacity-50" title="Verify driver">
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                        {driver.isVerified && (
                          <button onClick={() => handleSuspend(driver)} disabled={busyId === driver.uid} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50" title="Suspend driver">
                            <Ban className="w-5 h-5" />
                          </button>
                        )}
                        {driver.documentsStatus === 'pending' && (
                          <span className="p-2 text-gray-300" title="No documents submitted yet"><FileWarning className="w-5 h-5" /></span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isDemoMode && (
            <div className="px-8">
              <Pagination page={page} hasMore={hasMore} loading={loading} onPrev={prev} onNext={next} itemCount={drivers.length} totalLabel="drivers" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
