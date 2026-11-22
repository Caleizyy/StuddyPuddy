import { createContext } from 'react';
import type { AuthUser } from '@/api/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'unavailable';

export type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  retry: () => void;
  // Lets a page that changed the profile update what the navbar shows
  // Swaps in a fresh token after the password changed or other sessions were signed out
  replaceToken: (token: string) => void;
  // Ends the session on this device without asking the server (the account is already gone)
  endSession: () => void;
  updateUser: (changes: Partial<AuthUser>) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
