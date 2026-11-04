'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';

/**
 * This fork has no accounts: there is no auth backend and nobody is ever
 * signed in. The module keeps the old `useAuth()` shape so existing screens
 * compile unchanged and simply see an anonymous, offline reader.
 */
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refresh: () => Promise<boolean>;
}

const noop = () => {};
const anonymous: AuthContextType = {
  token: null,
  user: null,
  login: noop,
  logout: noop,
  refresh: async () => false,
};

const AuthContext = createContext<AuthContextType>(anonymous);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const value = useMemo(() => anonymous, []);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => useContext(AuthContext);
