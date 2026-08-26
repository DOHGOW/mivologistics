import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { uploadDriverDocument } from '../../lib/storage';
import { updateDriverProfile } from '../../lib/firestore';
import { isDemoMode } from '../../firebase';

interface DocItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'uploaded';
  url?: string;
  icon: React.ReactNode;
}

const INITIAL_DOCS: DocItem[] = [
  { id: 'license', title: "Driver's License", description: 'Front and back view of your valid license', status: 'pending', icon: <FileText className="w-6 h-6" /> },
  { id: 'insurance', title: 'Vehicle Insurance', description: 'Current insurance certificate for your truck', status: 'pending', icon: <ShieldCheck className="w-6 h-6" /> },
  { id: 'registration', title: 'Vehicle Registration', description: 'Proof of ownership and registration', status: 'pending', icon: <FileText className="w-6 h-6" /> },
  { id: 'permit', title: 'Haulage Permit', description: 'Valid permit for commercial haulage', status: 'pending', icon: <FileText className="w-6 h-6" /> },
];

export default function DocumentUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocItem[]>(INITIAL_DOCS);
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePicked = async (file: File) => {
    if (!selectedDoc) return;

    if (isDemoMode || !user) {
      setIsUploading(true);
      setTimeout(() => {
        setDocuments((prev) => prev.map((d) => (d.id === selectedDoc.id ? { ...d, status: 'uploaded' } : d)));
        setIsUploading(false);
        setSelectedDoc(null);
      }, 1200);
      return;
    }

    setIsUploading(true);
    setProgress(0);
    try {
      const url = await uploadDriverDocument(user.uid, selectedDoc.id, file, {
        onProgress: setProgress,
      });
      setDocuments((prev) => prev.map((d) => (d.id === selectedDoc.id ? { ...d, status: 'uploaded', url } : d)));
      setSelectedDoc(null);
      toast.success(`${selectedDoc.title} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed. Try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const allUploaded = documents.every((doc) => doc.status === 'uploaded');

  const handleSubmitForReview = async () => {
    if (isDemoMode || !user) {
      navigate('/driver/dashboard');
      return;
    }
    setSubmitting(true);
    try {
      await updateDriverProfile(user.uid, { documentsStatus: 'submitted' });
      toast.success('Submitted — our team reviews documents within 24 hours.');
      navigate('/driver/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-32">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg text-gray-900">Verification</h1>
            <p className="text-[10px] font-bold text-[#ff8c00] uppercase tracking-widest">Step 2 of 2</p>
          </div>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pt-8">
        <div className="mb-8">
          <h2 className="font-display font-black text-3xl text-gray-900 tracking-tighter mb-2">Upload Documents</h2>
          <p className="text-gray-500 font-medium">We need to verify your identity and vehicle before you can start accepting jobs.</p>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className="w-full bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                  doc.status === 'uploaded' ? 'bg-green-100 text-green-600' : 'bg-orange-50 text-[#ff8c00]'
                }`}>
                  {doc.status === 'uploaded' ? <CheckCircle2 className="w-7 h-7" /> : doc.icon}
                </div>
                <div className="text-left">
                  <h3 className="font-display font-bold text-gray-900">{doc.title}</h3>
                  <p className="text-xs text-gray-400 font-medium">{doc.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.status === 'pending' && (
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-lg">Required</span>
                )}
                {doc.status === 'uploaded' && (
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg">Uploaded</span>
                )}
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#ff8c00] transition-colors" />
              </div>
            </button>
          ))}
        </div>

        {allUploaded && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-green-50 rounded-3xl border border-green-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-green-500 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-green-900">All documents uploaded</h4>
              <p className="text-sm text-green-700 font-medium">Our team will review your documents within 24 hours.</p>
            </div>
          </motion.div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-2xl z-40 pb-8 pt-4 px-6 border-t border-gray-50">
        <div className="max-w-screen-md mx-auto">
          <button
            disabled={!allUploaded || submitting}
            onClick={handleSubmitForReview}
            className={`w-full py-5 rounded-2xl font-display font-extrabold text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${
              allUploaded ? 'bg-gradient-to-r from-[#904d00] to-[#ff8c00] text-white shadow-orange-200 active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {submitting ? 'Submitting…' : 'Submit for Review'}
            {!submitting && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </footer>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFilePicked(file);
          e.target.value = '';
        }}
      />

      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isUploading && setSelectedDoc(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white rounded-t-[3rem] sm:rounded-[3rem] p-10 w-full max-w-sm relative z-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight">{selectedDoc.title}</h2>
                <button onClick={() => setSelectedDoc(null)} className="p-2 rounded-full bg-gray-50 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center mb-8 group hover:border-[#ff8c00] transition-colors cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-gray-300 mb-4 shadow-sm group-hover:text-[#ff8c00] transition-colors">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-gray-400 group-hover:text-gray-600 transition-colors">Tap to choose a file</p>
              </button>

              {isUploading && (
                <div className="mb-6">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-[#ff8c00]" animate={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-2 text-center">Uploading… {Math.round(progress)}%</p>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest leading-relaxed">
                  Ensure the document is clear and all text is readable.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
