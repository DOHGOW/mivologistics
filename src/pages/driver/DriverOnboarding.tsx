import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Calendar,
  MapPin,
  Fingerprint,
  Phone,
  Truck,
  Hash,
  Palette,
  Gauge,
  Camera,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { updateDriverProfile } from '../../lib/firestore';
import { uploadDriverDocument } from '../../lib/storage';
import { isDemoMode } from '../../firebase';

const GENDERS = ['Male', 'Female', 'Prefer not to say'];

const PHOTO_SLOTS: { id: 'front' | 'back' | 'side' | 'plate'; label: string; description: string }[] = [
  { id: 'front', label: 'Front View', description: 'Full front of the truck' },
  { id: 'back', label: 'Back View', description: 'Full rear of the truck' },
  { id: 'side', label: 'Side View', description: 'Full side profile' },
  { id: 'plate', label: 'Plate Close-up', description: 'Clear shot of the license plate' },
];

type TruckPhotoMap = Partial<Record<'front' | 'back' | 'side' | 'plate', string>>;

export default function DriverOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<'front' | 'back' | 'side' | 'plate' | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const [biodata, setBiodata] = useState({
    dateOfBirth: '',
    gender: GENDERS[0],
    address: '',
    nin: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const [truckInfo, setTruckInfo] = useState({
    plateNumber: '',
    vehicleModel: '',
    vehicleColor: '',
    truckYear: '',
    chassisNumber: '',
    capacityTons: '',
  });

  const [truckPhotos, setTruckPhotos] = useState<TruckPhotoMap>({});

  const totalSteps = 3;

  const persist = async (data: Record<string, unknown>) => {
    if (isDemoMode || !user) return;
    await updateDriverProfile(user.uid, data);
  };

  const handleBiodataNext = async () => {
    setSaving(true);
    try {
      await persist(biodata);
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your details. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTruckInfoNext = async () => {
    setSaving(true);
    try {
      await persist(truckInfo);
      setStep(3);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save vehicle details. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoPicked = async (file: File) => {
    if (!activeSlot) return;

    if (isDemoMode || !user) {
      setTruckPhotos((prev) => ({ ...prev, [activeSlot]: 'demo' }));
      setActiveSlot(null);
      return;
    }

    setUploadingSlot(activeSlot);
    try {
      const url = await uploadDriverDocument(user.uid, `truck-${activeSlot}`, file);
      setTruckPhotos((prev) => ({ ...prev, [activeSlot]: url }));
      toast.success(`${PHOTO_SLOTS.find((s) => s.id === activeSlot)?.label} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed. Try again.');
    } finally {
      setUploadingSlot(null);
      setActiveSlot(null);
    }
  };

  const allPhotosUploaded = PHOTO_SLOTS.every((s) => truckPhotos[s.id]);

  const handleFinish = async () => {
    setSaving(true);
    try {
      await persist({ truckPhotos, onboardingStatus: 'complete' });
      toast.success('Profile complete — let\'s verify your documents.');
      navigate('/driver/documents');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save truck photos. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const stepTitles = ['Biodata', 'Truck Info', 'Truck Photos'];

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-32">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (step === 1 ? navigate(-1) : setStep(step - 1))}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg text-gray-900">{stepTitles[step - 1]}</h1>
            <p className="text-[10px] font-bold text-[#ff8c00] uppercase tracking-widest">Step 2 of 3</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-[#ff8c00]' : 'bg-gray-100'}`} />
          ))}
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="biodata" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
              <div className="mb-2">
                <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight mb-1">Tell us about you</h2>
                <p className="text-gray-500 text-sm font-medium">This helps us verify your identity and reach you in an emergency.</p>
              </div>

              <Field icon={<Calendar className="w-4 h-4" />} label="Date of Birth">
                <input type="date" value={biodata.dateOfBirth} onChange={(e) => setBiodata({ ...biodata, dateOfBirth: e.target.value })} className={inputClass} required />
              </Field>

              <Field icon={<User className="w-4 h-4" />} label="Gender">
                <select value={biodata.gender} onChange={(e) => setBiodata({ ...biodata, gender: e.target.value })} className={`${inputClass} appearance-none`}>
                  {GENDERS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>

              <Field icon={<MapPin className="w-4 h-4" />} label="Residential Address">
                <input value={biodata.address} onChange={(e) => setBiodata({ ...biodata, address: e.target.value })} placeholder="Street, city, state" className={inputClass} required />
              </Field>

              <Field icon={<Fingerprint className="w-4 h-4" />} label="National Identification Number (NIN)">
                <input value={biodata.nin} onChange={(e) => setBiodata({ ...biodata, nin: e.target.value })} placeholder="11-digit NIN" maxLength={11} className={inputClass} required />
              </Field>

              <Field icon={<User className="w-4 h-4" />} label="Emergency Contact Name">
                <input value={biodata.emergencyContactName} onChange={(e) => setBiodata({ ...biodata, emergencyContactName: e.target.value })} placeholder="Full name" className={inputClass} required />
              </Field>

              <Field icon={<Phone className="w-4 h-4" />} label="Emergency Contact Phone">
                <input type="tel" value={biodata.emergencyContactPhone} onChange={(e) => setBiodata({ ...biodata, emergencyContactPhone: e.target.value })} placeholder="0801 234 5678" className={inputClass} required />
              </Field>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="truck" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
              <div className="mb-2">
                <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight mb-1">Your truck's details</h2>
                <p className="text-gray-500 text-sm font-medium">Customers see this before they book you.</p>
              </div>

              <Field icon={<Hash className="w-4 h-4" />} label="Plate Number">
                <input value={truckInfo.plateNumber} onChange={(e) => setTruckInfo({ ...truckInfo, plateNumber: e.target.value })} placeholder="LAG-123-XY" className={inputClass} required />
              </Field>

              <Field icon={<Truck className="w-4 h-4" />} label="Vehicle Model">
                <input value={truckInfo.vehicleModel} onChange={(e) => setTruckInfo({ ...truckInfo, vehicleModel: e.target.value })} placeholder="Mercedes-Benz Actros" className={inputClass} required />
              </Field>

              <Field icon={<Palette className="w-4 h-4" />} label="Vehicle Color">
                <input value={truckInfo.vehicleColor} onChange={(e) => setTruckInfo({ ...truckInfo, vehicleColor: e.target.value })} placeholder="White" className={inputClass} required />
              </Field>

              <Field icon={<Calendar className="w-4 h-4" />} label="Year of Manufacture">
                <input value={truckInfo.truckYear} onChange={(e) => setTruckInfo({ ...truckInfo, truckYear: e.target.value })} placeholder="2019" maxLength={4} className={inputClass} required />
              </Field>

              <Field icon={<Hash className="w-4 h-4" />} label="Chassis / VIN Number">
                <input value={truckInfo.chassisNumber} onChange={(e) => setTruckInfo({ ...truckInfo, chassisNumber: e.target.value })} placeholder="Vehicle identification number" className={inputClass} required />
              </Field>

              <Field icon={<Gauge className="w-4 h-4" />} label="Cargo Capacity (Tons)">
                <input value={truckInfo.capacityTons} onChange={(e) => setTruckInfo({ ...truckInfo, capacityTons: e.target.value })} placeholder="10" className={inputClass} required />
              </Field>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="photos" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
              <div className="mb-2">
                <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight mb-1">Photos of your truck</h2>
                <p className="text-gray-500 text-sm font-medium">Clear, well-lit photos help customers trust who's picking up their cargo.</p>
              </div>

              {PHOTO_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => {
                    setActiveSlot(slot.id);
                    fileInputRef.current?.click();
                  }}
                  disabled={uploadingSlot === slot.id}
                  className="w-full bg-white p-5 rounded-[1.75rem] shadow-sm border border-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${truckPhotos[slot.id] ? 'bg-green-100 text-green-600' : 'bg-orange-50 text-[#ff8c00]'}`}>
                      {uploadingSlot === slot.id ? <Loader2 className="w-5 h-5 animate-spin" /> : truckPhotos[slot.id] ? <CheckCircle2 className="w-6 h-6" /> : <Camera className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <h3 className="font-display font-bold text-gray-900 text-sm">{slot.label}</h3>
                      <p className="text-xs text-gray-400 font-medium">{slot.description}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${truckPhotos[slot.id] ? 'text-green-500 bg-green-50' : 'text-orange-400 bg-orange-50'}`}>
                    {truckPhotos[slot.id] ? 'Uploaded' : 'Required'}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePhotoPicked(file);
          e.target.value = '';
        }}
      />

      <footer className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-2xl z-40 pb-8 pt-4 px-6 border-t border-gray-50">
        <div className="max-w-screen-md mx-auto">
          {step === 1 && (
            <button
              onClick={handleBiodataNext}
              disabled={saving || !biodata.dateOfBirth || !biodata.address || !biodata.nin || !biodata.emergencyContactName || !biodata.emergencyContactPhone}
              className="w-full py-5 rounded-2xl font-display font-extrabold text-lg shadow-xl bg-gradient-to-r from-[#904d00] to-[#ff8c00] text-white shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue<ArrowRight className="w-5 h-5" /></>}
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleTruckInfoNext}
              disabled={saving || !truckInfo.plateNumber || !truckInfo.vehicleModel || !truckInfo.vehicleColor || !truckInfo.truckYear || !truckInfo.chassisNumber || !truckInfo.capacityTons}
              className="w-full py-5 rounded-2xl font-display font-extrabold text-lg shadow-xl bg-gradient-to-r from-[#904d00] to-[#ff8c00] text-white shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue<ArrowRight className="w-5 h-5" /></>}
            </button>
          )}
          {step === 3 && (
            <button
              onClick={handleFinish}
              disabled={!allPhotosUploaded || saving}
              className={`w-full py-5 rounded-2xl font-display font-extrabold text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${
                allPhotosUploaded ? 'bg-gradient-to-r from-[#904d00] to-[#ff8c00] text-white shadow-orange-200 active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue to Documents<ArrowRight className="w-5 h-5" /></>}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

const inputClass = 'bg-transparent border-none focus:ring-0 w-full font-semibold text-sm text-gray-900';

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">{label}</label>
      <div className="bg-gray-50 rounded-2xl flex items-center px-4 h-12 border border-transparent focus-within:border-[#ff8c00]/20 focus-within:bg-white transition-all">
        <span className="text-[#ff8c00] mr-3">{icon}</span>
        {children}
      </div>
    </div>
  );
}
