import { createContext } from 'react';
import type { AuthUser } from '@/api/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'unavailable';

export type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
  // Lets a page that changed the profile update what the navbar shows
  updateUser: (changes: Partial<AuthUser>) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
