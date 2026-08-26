import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Clock } from 'lucide-react';

const steps = [
  {
    title: "Book a Truck Instantly",
    description: "Fast and reliable logistics at your fingertips. Experience the next generation of logistics orchestration.",
    icon: <Truck className="w-12 h-12" />,
    image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Real-time Precision",
    description: "Track your cargo with millisecond precision and high-definition route mapping in our latest version.",
    icon: <Clock className="w-12 h-12" />,
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Secure & Verified",
    description: "Our partners are verified and trained for secure freight handling. Safety first, always.",
    icon: <Shield className="w-12 h-12" />,
    image: "https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&q=80&w=800"
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/role-selection');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="p-6 flex justify-end">
        <button 
          onClick={() => navigate('/role-selection')}
          className="text-gray-400 font-display font-semibold text-sm hover:text-[#ff8c00] transition-colors"
        >
          Skip
        </button>
      </header>

      <main className="flex-1 flex flex-col px-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col"
          >
            <div className="relative mt-8 mb-12 aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl">
              <img 
                src={steps[currentStep].image} 
                alt={steps[currentStep].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#ff8c00] flex items-center justify-center text-white">
                  {steps[currentStep].icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#ff8c00] tracking-wider uppercase">Mivo Logistics</p>
                  <p className="text-sm font-semibold text-gray-900">Swift. Precise. Seamless.</p>
                </div>
              </div>
            </div>

            <h1 className="font-display font-extrabold text-4xl leading-tight text-gray-900 tracking-tight mb-4">
              {steps[currentStep].title}
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed font-medium">
              {steps[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 mt-8">
          {steps.map((_, i) => (
            <div 
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-[#ff8c00]' : 'w-2 bg-gray-200'}`}
            />
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-8 flex items-center justify-between bg-white border-t border-gray-50">
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Step</span>
          <span className="text-gray-900 font-black text-xl">{currentStep + 1} of {steps.length}</span>
        </div>
        <button 
          onClick={next}
          className="bg-gradient-to-br from-[#904d00] to-[#ff8c00] px-10 py-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-orange-200 active:scale-95 transition-all"
        >
          <span className="text-white font-display font-extrabold text-base">
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </span>
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
      </footer>
    </div>
  );
}
