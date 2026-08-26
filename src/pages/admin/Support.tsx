import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Mail, Phone, User, Truck } from 'lucide-react';
import { listUsersPage, listDriversPage, type UserProfile, type DriverProfile } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';

const DEMO_USERS: UserProfile[] = [
  { uid: '1', displayName: 'Oluwaseun A.', email: 'olu@example.com', phoneNumber: '+234 801 234 5678', role: 'user', status: 'active' },
];
const DEMO_DRIVERS: DriverProfile[] = [
  { uid: 'd1', displayName: 'John Driver', email: 'john@mivo.app', vehicleModel: 'Mercedes Actros', plateNumber: 'LAG-123-XY', vehicleType: 'Heavy Duty', vehicleColor: 'White', rating: 4.9, isVerified: true, documentsStatus: 'verified', isOnline: true, totalTrips: 142, totalEarnings: 0 },
];

export default function AdminSupport() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserProfile[]>(isDemoMode ? DEMO_USERS : []);
  const [drivers, setDrivers] = useState<DriverProfile[]>(isDemoMode ? DEMO_DRIVERS : []);

  useEffect(() => {
    if (isDemoMode) return;
    listUsersPage(20).then((res) => setUsers(res.items));
    listDriversPage(20).then((res) => setDrivers(res.items));
  }, []);

  const q = search.toLowerCase();
  const filteredUsers = users.filter((u) => !q || u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  const filteredDrivers = drivers.filter((d) => !q || d.displayName.toLowerCase().includes(q) || d.email.toLowerCase().includes(q));

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="font-display font-bold text-lg text-gray-900">Support Center</h1>
          </div>
          <div className="hidden sm:flex items-center bg-gray-50 rounded-xl px-4 h-10 border border-transparent focus-within:bg-white focus-within:border-orange-100 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-3" />
            <input type="text" placeholder="Search people..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-medium text-gray-900" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-8 space-y-10">
        <p className="text-sm text-gray-500 font-medium">
          A quick directory to reach any customer or driver directly by email or phone while a full in-app support inbox is on the roadmap.
        </p>

        <section>
          <h2 className="font-display font-black text-xl text-gray-900 mb-4">Customers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => (
              <div key={u.uid} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff8c00] flex items-center justify-center shrink-0"><User className="w-5 h-5" /></div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-gray-900 truncate">{u.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <a href={`mailto:${u.email}`} className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-blue-600"><Mail className="w-4 h-4" /></a>
                  {u.phoneNumber && <a href={`tel:${u.phoneNumber}`} className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-green-600"><Phone className="w-4 h-4" /></a>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display font-black text-xl text-gray-900 mb-4">Drivers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map((d) => (
              <div key={d.uid} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Truck className="w-5 h-5" /></div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-gray-900 truncate">{d.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{d.email}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <a href={`mailto:${d.email}`} className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-blue-600"><Mail className="w-4 h-4" /></a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
