import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Mail, Phone, Calendar, ShieldCheck, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';
import { listUsersPage, updateUserProfile, type UserProfile } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';
import Pagination from '../../components/Pagination';

const DEMO_USERS: UserProfile[] = [
  { uid: '1', displayName: 'Oluwaseun A.', email: 'olu@example.com', phoneNumber: '+234 801 234 5678', role: 'user', status: 'active' },
  { uid: '2', displayName: 'Fatima B.', email: 'fatima@example.com', phoneNumber: '+234 802 345 6789', role: 'user', status: 'active' },
  { uid: '3', displayName: 'Tunde J.', email: 'tunde@example.com', phoneNumber: '+234 803 456 7890', role: 'user', status: 'suspended' },
];

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const { items, page, hasMore, loading, next, prev, reload } = usePaginatedQuery<UserProfile>(
    (pageSize, cursor) => listUsersPage(pageSize, cursor),
    10
  );

  const users = (isDemoMode ? DEMO_USERS : items)
    .filter((u) => u.role === 'user')
    .filter((u) => !searchQuery.trim() || u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleStatus = async (user: UserProfile) => {
    if (isDemoMode) { toast.info('Demo mode — connect Firebase to manage real users.'); return; }
    const next = user.status === 'active' ? 'suspended' : 'active';
    setBusyId(user.uid);
    try {
      await updateUserProfile(user.uid, { status: next });
      toast.success(`${user.displayName} ${next === 'active' ? 'reactivated' : 'suspended'}.`);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update user.');
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
            <h1 className="font-display font-bold text-lg text-gray-900">User Management</h1>
          </div>
          <div className="hidden sm:flex items-center bg-gray-50 rounded-xl px-4 h-10 border border-transparent focus-within:bg-white focus-within:border-orange-100 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-3" />
            <input type="text" placeholder="Search users..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-medium text-gray-900" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-50">
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.length === 0 && !loading && (
                  <tr><td colSpan={5} className="text-center py-16 text-gray-400 font-medium">No users found.</td></tr>
                )}
                {users.map((user) => (
                  <tr key={user.uid} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ff8c00] flex items-center justify-center font-display font-black text-sm">
                          {user.displayName.charAt(0)}
                        </div>
                        <p className="font-display font-bold text-gray-900">{user.displayName}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <Phone className="w-3 h-3" />
                            {user.phoneNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                        <Calendar className="w-4 h-4 text-gray-300" />
                        {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : '—'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${user.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(user)}
                          disabled={busyId === user.uid}
                          className={`p-2 rounded-xl bg-gray-50 transition-all disabled:opacity-50 ${user.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                          title={user.status === 'active' ? 'Suspend user' : 'Reactivate user'}
                        >
                          {user.status === 'active' ? <Ban className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isDemoMode && (
            <div className="px-8">
              <Pagination page={page} hasMore={hasMore} loading={loading} onPrev={prev} onNext={next} itemCount={users.length} totalLabel="users" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
