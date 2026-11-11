import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthActionResult {
  error: string | null;
  needsEmailConfirmation?: boolean;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthActionResult>;
  signInWithGoogle: (redirectPath?: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

