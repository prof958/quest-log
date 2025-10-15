import { supabase } from '../lib/supabase';
import { AuthError, User, Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

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
      
      if (Platform.OS === 'web') {
        // Web OAuth flow
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
          return { data: null, error };
        }
        
        return { data, error: null };
      } else {
        // Mobile OAuth flow using proper Expo approach
        console.log('📱 Starting mobile OAuth flow...');
        
        // Create proper redirect URI for mobile
        const redirectTo = makeRedirectUri();
        console.log('📝 Redirect URI:', redirectTo);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          }
        });

        if (error || !data?.url) {
          console.error('❌ Mobile OAuth initiation failed:', error);
          return { data: null, error: error || { message: 'No OAuth URL received' } as AuthError };
        }

        console.log('✅ Mobile OAuth URL generated:', data.url);
        
        // Open OAuth session using WebBrowser (proper Expo way)
        try {
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
          console.log('🌐 WebBrowser result:', result);
          
          if (result.type === 'success' && result.url) {
            console.log('✅ OAuth completed, processing session...');
            
            // Parse the returned URL and create session
            const { params, errorCode } = QueryParams.getQueryParams(result.url);
            
            if (errorCode) {
              console.error('❌ OAuth error code:', errorCode);
              return { data: null, error: { message: errorCode } as AuthError };
            }
            
            const { access_token, refresh_token } = params;
            
            if (!access_token) {
              console.error('❌ No access token in OAuth response');
              return { data: null, error: { message: 'No access token received' } as AuthError };
            }
            
            // Create the session in Supabase
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (sessionError) {
              console.error('❌ Failed to set session:', sessionError);
              return { data: null, error: sessionError };
            }
            
            console.log('🎉 Mobile OAuth successful!');
            return { data: { session: sessionData.session }, error: null };
          } else if (result.type === 'cancel') {
            console.log('👤 User cancelled OAuth');
            return { data: null, error: { message: 'OAuth cancelled by user' } as AuthError };
          } else {
            console.error('❌ Unexpected WebBrowser result:', result);
            return { data: null, error: { message: 'OAuth flow failed' } as AuthError };
          }
        } catch (browserError) {
          console.error('❌ WebBrowser error:', browserError);
          return { data: null, error: { message: 'Failed to open authentication browser' } as AuthError };
        }
      }
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