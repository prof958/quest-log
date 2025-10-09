import { supabase } from '../lib/supabase';
import { AuthError, User, Session } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export class AuthService {
  // Sign out
  static async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as AuthError };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        // AuthSessionMissingError is expected when no user is logged in
        if (error.message.includes('Auth session missing')) {
          return null;
        }
        console.error('Get user error:', error);
        return null;
      }

      return user;
    } catch (error: any) {
      // Handle AuthSessionMissingError gracefully
      if (error.message?.includes('Auth session missing')) {
        return null;
      }
      console.error('Get user exception:', error);
      return null;
    }
  }

  // Get current session
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        // AuthSessionMissingError is expected when no session exists
        if (error.message.includes('Auth session missing')) {
          return null;
        }
        console.error('Get session error:', error);
        return null;
      }

      return session;
    } catch (error: any) {
      // Handle AuthSessionMissingError gracefully
      if (error.message?.includes('Auth session missing')) {
        return null;
      }
      console.error('Get session exception:', error);
      return null;
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await AuthService.getCurrentUser();
  return user !== null;
};