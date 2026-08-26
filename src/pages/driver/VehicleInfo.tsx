import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, ShieldCheck, Hash, Palette, Edit2, Check, FileWarning } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { getDriverProfile, updateDriverProfile, type DriverProfile } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';

const DEMO_VEHICLE: Partial<DriverProfile> = {
  vehicleType: 'Heavy Duty', vehicleModel: 'Mercedes-Benz Actros', plateNumber: 'LAG-123-XY', vehicleColor: 'White', isVerified: true, documentsStatus: 'verified',
};

export default function VehicleInfo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Partial<DriverProfile>>(isDemoMode ? DEMO_VEHICLE : {});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ vehicleModel: '', plateNumber: '', vehicleColor: '' });

  useEffect(() => {
    if (isDemoMode || !user) return;
    getDriverProfile(user.uid).then((p) => {
      if (p) {
        setVehicle(p);
        setForm({ vehicleModel: p.vehicleModel, plateNumber: p.plateNumber, vehicleColor: p.vehicleColor });
      }
    });
  }, [user]);

  const startEdit = () => {
    setForm({ vehicleModel: vehicle.vehicleModel || '', plateNumber: vehicle.plateNumber || '', vehicleColor: vehicle.vehicleColor || '' });
    setEditing(true);
  };

  const handleSave = async () => {
    if (isDemoMode || !user) {
      setVehicle((v) => ({ ...v, ...form }));
      setEditing(false);
      toast.info('Demo mode — connect Firebase to save changes.');
      return;
    }
    setSaving(true);
    try {
      await updateDriverProfile(user.uid, form);
      setVehicle((v) => ({ ...v, ...form }));
      setEditing(false);
      toast.success('Vehicle details updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const isVerified = isDemoMode || vehicle.isVerified;

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-12">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="font-display font-bold text-lg text-gray-900">Vehicle Details</h1>
          </div>
          {!editing ? (
            <button onClick={startEdit} className="p-2 rounded-xl bg-orange-50 text-[#ff8c00]">
              <Edit2 className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="p-2 rounded-xl bg-green-50 text-green-600 disabled:opacity-60">
              <Check className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 mb-8 text-center">
          <div className="w-24 h-24 bg-orange-50 rounded-[2rem] flex items-center justify-center text-[#ff8c00] mx-auto mb-6 shadow-lg shadow-orange-50">
            <Truck className="w-12 h-12" />
          </div>
          {editing ? (
            <input
              value={form.vehicleModel}
              onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
              placeholder="Vehicle model"
              className="font-display font-black text-2xl text-gray-900 mb-1 text-center bg-gray-50 rounded-xl px-4 py-2 w-full"
            />
          ) : (
            <h2 className="font-display font-black text-2xl text-gray-900 mb-1">{vehicle.vehicleModel || 'Not set'}</h2>
          )}
          <p className="text-gray-400 font-medium mb-6">{vehicle.plateNumber || 'No plate on file'}</p>
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${isVerified ? 'bg-green-50' : 'bg-orange-50'}`}>
              {isVerified ? <ShieldCheck className="w-3 h-3 text-green-500" /> : <FileWarning className="w-3 h-3 text-orange-500" />}
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isVerified ? 'text-green-600' : 'text-orange-500'}`}>
                {isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-50 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><Truck className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle Type</p>
              <p className="font-display font-bold text-gray-900">{vehicle.vehicleType || '—'}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-50 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><Hash className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">License Plate</p>
              {editing ? (
                <input value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} className="font-display font-bold text-gray-900 bg-gray-50 rounded-lg px-2 py-1 w-full" />
              ) : (
                <p className="font-display font-bold text-gray-900">{vehicle.plateNumber || 'Not set'}</p>
              )}
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-50 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><Palette className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle Color</p>
              {editing ? (
                <input value={form.vehicleColor} onChange={(e) => setForm({ ...form, vehicleColor: e.target.value })} className="font-display font-bold text-gray-900 bg-gray-50 rounded-lg px-2 py-1 w-full" />
              ) : (
                <p className="font-display font-bold text-gray-900">{vehicle.vehicleColor || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {!isVerified && (
          <div className="mt-10 bg-orange-50 p-6 rounded-[2rem] border border-orange-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#ff8c00] shadow-sm">
              <FileWarning className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-gray-900">Verification pending</h4>
              <p className="text-sm text-gray-500 font-medium mb-4">Make sure your documents are uploaded — our team verifies within 24 hours.</p>
              <button onClick={() => navigate('/driver/documents')} className="bg-white text-[#ff8c00] px-6 py-2.5 rounded-xl font-display font-bold text-xs shadow-sm active:scale-95 transition-all">
                Review Documents
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
