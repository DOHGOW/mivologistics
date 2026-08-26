/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useState, useEffect, Suspense, lazy } from 'react';
import { Toaster } from 'sonner';
import React from 'react';

import { AuthProvider } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import ProtectedRoute from './components/ProtectedRoute';
import Preloader from './components/Preloader';

import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import RoleSelection from './pages/RoleSelection';
import Auth from './pages/Auth';
import Home from './pages/Home';
import SelectTruck from './pages/SelectTruck';
import TruckDetails from './pages/TruckDetails';
import Payment from './pages/Payment';
import BookingSuccess from './pages/BookingSuccess';
import LiveTracking from './pages/LiveTracking';
import ShipmentStatus from './pages/ShipmentStatus';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import History from './pages/History';
import Notifications from './pages/Notifications';
import Support from './pages/Support';
import Chat from './pages/Chat';
import Call from './pages/Call';
import Wallet from './pages/Wallet';
import Reviews from './pages/Reviews';

// Driver + Admin pages are lazy-loaded — most sessions are customers only,
// so there's no reason to ship the driver/admin bundle up front.
const DriverDashboard = lazy(() => import('./pages/driver/Dashboard'));
const ActiveTrip = lazy(() => import('./pages/driver/ActiveTrip'));
const DriverEarnings = lazy(() => import('./pages/driver/Earnings'));
const DriverAuth = lazy(() => import('./pages/driver/Auth'));
const DriverOnboarding = lazy(() => import('./pages/driver/DriverOnboarding'));
const DocumentUpload = lazy(() => import('./pages/driver/DocumentUpload'));
const DriverHistory = lazy(() => import('./pages/driver/History'));
const VehicleInfo = lazy(() => import('./pages/driver/VehicleInfo'));

const AdminAuth = lazy(() => import('./pages/admin/Auth'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminDrivers = lazy(() => import('./pages/admin/Drivers'));
const AdminTrips = lazy(() => import('./pages/admin/Trips'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminFleet = lazy(() => import('./pages/admin/Fleet'));
const AdminFinancials = lazy(() => import('./pages/admin/Financials'));
const AdminLiveTracking = lazy(() => import('./pages/admin/LiveTracking'));
const AdminCompliance = lazy(() => import('./pages/admin/Compliance'));
const AdminDispatch = lazy(() => import('./pages/admin/Dispatch'));
const AdminSupport = lazy(() => import('./pages/admin/Support'));

const pageVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
};

function PageTransition() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
      >
        <Suspense fallback={<Preloader />}>
        <Routes location={location}>
          <Route path="/" element={<Onboarding />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/auth" element={<Auth />} />

          {/* Customer routes */}
          <Route path="/home" element={<ProtectedRoute allow={['user']} redirectTo="/auth"><Home /></ProtectedRoute>} />
          <Route path="/select-truck" element={<ProtectedRoute allow={['user']} redirectTo="/auth"><SelectTruck /></ProtectedRoute>} />
          <Route path="/truck-details/:id" element={<ProtectedRoute allow={['user']} redirectTo="/auth"><TruckDetails /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute allow={['user']} redirectTo="/auth"><Payment /></ProtectedRoute>} />
          <Route path="/booking-success" element={<ProtectedRoute allow={['user']} redirectTo="/auth"><BookingSuccess /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute allow={['user']} redirectTo="/auth"><LiveTracking /></ProtectedRoute>} />
          <Route path="/shipment-status" element={<ProtectedRoute allow={['user']} redirectTo="/auth"><ShipmentStatus /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allow={['user', 'driver', 'admin']} redirectTo="/auth"><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allow={['user', 'driver', 'admin']} redirectTo="/auth"><Settings /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute allow={['user']} redirectTo="/auth"><History /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allow={['user', 'driver', 'admin']} redirectTo="/auth"><Notifications /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute allow={['user', 'driver']} redirectTo="/auth"><Support /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute allow={['user', 'driver']} redirectTo="/auth"><Chat /></ProtectedRoute>} />
          <Route path="/call" element={<ProtectedRoute allow={['user', 'driver']} redirectTo="/auth"><Call /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute allow={['user']} redirectTo="/auth"><Wallet /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute allow={['user']} redirectTo="/auth"><Reviews /></ProtectedRoute>} />

          {/* Driver Routes */}
          <Route path="/driver/auth" element={<DriverAuth />} />
          <Route path="/driver/onboarding" element={<ProtectedRoute allow={['driver']} redirectTo="/driver/auth"><DriverOnboarding /></ProtectedRoute>} />
          <Route path="/driver/documents" element={<ProtectedRoute allow={['driver']} redirectTo="/driver/auth"><DocumentUpload /></ProtectedRoute>} />
          <Route path="/driver/dashboard" element={<ProtectedRoute allow={['driver']} redirectTo="/driver/auth"><DriverDashboard /></ProtectedRoute>} />
          <Route path="/driver/history" element={<ProtectedRoute allow={['driver']} redirectTo="/driver/auth"><DriverHistory /></ProtectedRoute>} />
          <Route path="/driver/vehicle" element={<ProtectedRoute allow={['driver']} redirectTo="/driver/auth"><VehicleInfo /></ProtectedRoute>} />
          <Route path="/driver/trip/:id" element={<ProtectedRoute allow={['driver']} redirectTo="/driver/auth"><ActiveTrip /></ProtectedRoute>} />
          <Route path="/driver/earnings" element={<ProtectedRoute allow={['driver']} redirectTo="/driver/auth"><DriverEarnings /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/auth" element={<AdminAuth />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allow={['admin']} redirectTo="/admin/auth"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allow={['admin']} redirectTo="/admin/auth"><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/drivers" element={<ProtectedRoute allow={['admin']} redirectTo="/admin/auth"><AdminDrivers /></ProtectedRoute>} />
          <Route path="/admin/trips" element={<ProtectedRoute allow={['admin']} redirectTo="/admin/auth"><AdminTrips /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allow={['admin']} redirectTo="/admin/auth"><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allow={['admin']} redirectTo="/admin/auth"><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/fleet" element={<ProtectedRoute allow={['admin']} redirectTo="/admin/auth"><AdminFleet /></ProtectedRoute>} />
          <Route path="/admin/financials" element={<ProtectedRoute allow={['admin']} redirectTo="/admin/auth"><AdminFinancials /></ProtectedRoute>} />
          <Route path="/admin/live-tracking" element={<ProtectedRoute allow={['admin']} redirectTo="/admin/auth"><AdminLiveTracking /></ProtectedRoute>} />
          <Route path="/admin/compliance" element={<ProtectedRoute allow={['admin']} redirectTo="/admin/auth"><AdminCompliance /></ProtectedRoute>} />
          <Route path="/admin/dispatch" element={<ProtectedRoute allow={['admin']} redirectTo="/admin/auth"><AdminDispatch /></ProtectedRoute>} />
          <Route path="/admin/support" element={<ProtectedRoute allow={['admin']} redirectTo="/admin/auth"><AdminSupport /></ProtectedRoute>} />
        </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Minimum brand-moment splash; real auth/profile resolution happens
    // independently inside ProtectedRoute once we're past this.
    const timer = setTimeout(() => setShowSplash(false), 1600);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <Splash />;
  }

  return (
    <AuthProvider>
      <BookingProvider>
        <Router>
          <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }} />
          <PageTransition />
        </Router>
      </BookingProvider>
    </AuthProvider>
  );
}
