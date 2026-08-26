import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../lib/firestore';
import Preloader from './Preloader';

interface ProtectedRouteProps {
  allow: UserRole[];
  redirectTo: string;
  children: React.ReactNode;
}

/**
 * Wraps a route so it only renders when the signed-in user's role
 * (read from their Firestore profile, never from the URL) is in `allow`.
 * In demo mode (no Firebase project configured yet) access checks are
 * skipped so the whole app stays browsable for a client walkthrough.
 */
export default function ProtectedRoute({ allow, redirectTo, children }: ProtectedRouteProps) {
  const { user, profile, loading, isDemoMode } = useAuth();
  const location = useLocation();

  if (isDemoMode) return <>{children}</>;

  if (loading) return <Preloader />;

  if (!user || !profile) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  if (!allow.includes(profile.role)) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname, denied: true }} />;
  }

  if (profile.status === 'suspended') {
    return <Navigate to={redirectTo} replace state={{ suspended: true }} />;
  }

  return <>{children}</>;
}
