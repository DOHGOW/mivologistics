import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, watchAuthState, isDemoMode, type User } from '../firebase';
import { getUserProfile, watchUserProfile, type UserProfile } from '../lib/firestore';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isDemoMode,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    const p = await getUserProfile(auth.currentUser.uid);
    setProfile(p);
  };

  useEffect(() => {
    if (isDemoMode) {
      // No live Firebase project yet — resolve immediately so the app is
      // still fully browsable/demoable. Real auth kicks in once
      // VITE_FIREBASE_* env vars are set.
      setLoading(false);
      return;
    }

    const unsubAuth = watchAuthState((firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (isDemoMode || !user) return;
    setLoading(true);
    const unsubProfile = watchUserProfile(user.uid, (p) => {
      setProfile(p);
      setLoading(false);
    });
    return () => unsubProfile();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isDemoMode, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
