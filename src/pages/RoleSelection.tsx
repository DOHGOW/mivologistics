import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Truck, User, ArrowRight, ShieldCheck, Briefcase, LayoutDashboard } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'user',
      title: "Book a Truck",
      description: "Ship your goods across the country with ease.",
      icon: <User className="w-6 h-6" />,
      color: "from-orange-400 to-[#ff8c00]",
      path: "/auth"
    },
    {
      id: 'driver',
      title: "Join as Driver",
      description: "Join our fleet and earn on your schedule.",
      icon: <Truck className="w-6 h-6" />,
      color: "from-orange-500 to-orange-700",
      path: "/driver/auth"
    },
    {
      id: 'admin',
      title: "Admin Panel",
      description: "Manage users, drivers, and monitor trips.",
      icon: <LayoutDashboard className="w-6 h-6" />,
      color: "from-gray-700 to-gray-900",
      path: "/admin/auth"
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center px-6 py-12">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-10"
      >
        <div className="w-16 h-16 bg-[#ff8c00] rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-orange-100">
          <Truck className="w-8 h-8" />
        </div>
        <h1 className="font-display font-black text-3xl text-gray-900 tracking-tighter mb-2">Welcome to Mivo</h1>
        <p className="text-gray-500 font-medium text-base">Choose your path to get started</p>
      </motion.div>

      <div className="w-full max-w-md space-y-3">
        {roles.map((role, i) => (
          <motion.button
            key={role.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(role.path)}
            className="w-full group relative bg-white p-6 rounded-3xl shadow-xl shadow-gray-100 border border-gray-50 flex items-center text-left active:scale-[0.98] transition-all overflow-hidden"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white mr-5 shadow-lg shrink-0`}>
              {role.icon}
            </div>

            <div className="flex-1">
              <h2 className="font-display font-black text-lg text-gray-900 leading-tight">{role.title}</h2>
              <p className="text-gray-500 font-medium text-xs leading-relaxed">
                {role.description}
              </p>
            </div>

            <ArrowRight className="w-5 h-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-[#ff8c00]" />
          </motion.button>
        ))}
      </div>

      <div className="mt-12 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-500" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Secure</span>
        </div>
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-orange-500" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verified</span>
        </div>
      </div>
    </div>
  );
}
