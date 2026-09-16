/**
 * Auth state — Firebase user + Firestore profile (role).
 * Tourists: public /auth signup.
 * Partners: /partner signup with role at creation + admin document approval.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  loginWithEmail,
  loginWithGoogle,
  logout as firebaseLogout,
  registerWithEmail,
  registerPartnerWithEmail,
  loadUserProfile,
  subscribeToAuth,
} from '../services/auth';
import {
  isPartnerApproved,
  isPartnerPending,
  isPartnerRole,
} from '../utils/partnerRoles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const p = await loadUserProfile(firebaseUser);
        setProfile(p);
      } catch (err) {
        console.error('[Auth] profile load failed', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const approved = isPartnerApproved(profile);
  const pending = isPartnerPending(profile);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      /** Verified guide (or admin) — can use guide dashboard / trip programs. */
      isGuide:
        profile?.role === 'admin' ||
        (profile?.role === 'guide' && approved),
      /** Verified artisan or cooperative. */
      isArtisan:
        (profile?.role === 'artisan' || profile?.role === 'cooperative') &&
        approved,
      isPartnerPending: pending,
      isPartnerRole: isPartnerRole(profile?.role),
      partnerStatus: profile?.partnerStatus || null,
      async register(email, password, name) {
        const result = await registerWithEmail(email, password, name);
        setProfile(result.profile);
        return result;
      },
      async registerPartner(payload) {
        const result = await registerPartnerWithEmail(payload);
        setProfile(result.profile);
        return result;
      },
      async login(email, password) {
        const result = await loginWithEmail(email, password);
        setProfile(result.profile);
        return result;
      },
      async loginGoogle() {
        const result = await loginWithGoogle();
        setProfile(result.profile);
        return result;
      },
      async refreshProfile() {
        if (!user) return null;
        const p = await loadUserProfile(user);
        setProfile(p);
        return p;
      },
      async logout() {
        await firebaseLogout();
        setProfile(null);
      },
    }),
    [user, profile, loading, approved, pending]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
