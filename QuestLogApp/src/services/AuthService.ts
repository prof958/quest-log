import { supabase } from '../lib/supabase';
import { AuthError, User, Session } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, userData?: { username?: string }): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      console.log('🚀 Starting email sign up...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData?.username || email.split('@')[0],
          }
        }
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        return { user: null, error };
      }

      console.log('✅ Sign up successful:', { userId: data.user?.id, email: data.user?.email });
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Sign up exception:', error);
      return { user: null, error: error as AuthError };
    }
  }

  // Sign in with email and password
  static async signInWithEmail(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> {
    try {
      console.log('🚀 Starting email sign in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        return { user: null, session: null, error };
      }

      console.log('✅ Sign in successful:', { userId: data.user?.id, email: data.user?.email });
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { user: null, session: null, error: error as AuthError };
    }
  }

  // Sign in with Google OAuth
  static async signInWithGoogle(): Promise<{ data: any; error: AuthError | null }> {
    try {
      console.log('🚀 Starting Google OAuth sign in...');
      console.log('📍 Current URL:', window.location.href);
      console.log('📍 Redirect URL will be:', `${window.location.origin}/auth/callback`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        console.error('❌ Google OAuth error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          details: error
        });
        return { data: null, error };
      }

      console.log('✅ Google OAuth initiated successfully');
      console.log('✅ OAuth data:', data);
      console.log('📝 OAuth URL:', data?.url);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Google OAuth exception:', error);
      return { data: null, error: error as AuthError };
    }
  }

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