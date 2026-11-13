'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AuthorisationDataProvider } from '../providers/authorisation.data-provider';
import type { AuthSession } from '../models/auth-state.model';

interface AuthContextValue {
  session: AuthSession | null;
  inFlight: boolean;
  signIn: (emailAddress: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const authorisationProvider = new AuthorisationDataProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [inFlight, setInFlight] = useState(true);

  const refreshSession = useCallback(async () => {
    setSession(await authorisationProvider.getSession());
  }, []);

  useEffect(() => {
    void refreshSession().finally(() => setInFlight(false));
  }, [refreshSession]);

  useEffect(() => {
    const onRefreshed = () => {
      void refreshSession();
    };
    const onCleared = () => {
      setSession(null);
    };

    window.addEventListener('system-auth-refreshed', onRefreshed);
    window.addEventListener('system-auth-cleared', onCleared);
    return () => {
      window.removeEventListener('system-auth-refreshed', onRefreshed);
      window.removeEventListener('system-auth-cleared', onCleared);
    };
  }, [refreshSession]);

  const signIn = useCallback(
    async (emailAddress: string, password: string, rememberMe = false) => {
      setInFlight(true);
      try {
        await authorisationProvider.signIn({ emailAddress, password, rememberMe });
        await refreshSession();
      } finally {
        setInFlight(false);
      }
    },
    [refreshSession]
  );

  const signOut = useCallback(async () => {
    setInFlight(true);
    try {
      await authorisationProvider.signOut();
      setSession(null);
    } finally {
      setInFlight(false);
    }
  }, []);

  const value = useMemo(
    () => ({ session, inFlight, signIn, signOut, refreshSession }),
    [session, inFlight, signIn, signOut, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
