import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export class DemoAuthService {
  // Create a demo session for development/testing
  static async createDemoSession(): Promise<{ session?: Session; error: any }> {
    try {
      console.log('DemoAuthService - Creating demo session...');
      
      // Create a demo user object
      const demoUser: Partial<User> = {
        id: 'demo-user-123',
        email: 'demo@questlog.app',
        user_metadata: {
          name: 'Demo Player',
          avatar_url: 'https://via.placeholder.com/150',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Simulate session creation by directly setting user state
      // Note: This is for development only - not a real authentication
      console.log('DemoAuthService - Demo user created:', demoUser.email);
      
      // Return a mock session-like object
      const mockSession = {
        user: demoUser as User,
        access_token: 'demo-access-token',
        refresh_token: 'demo-refresh-token',
        expires_at: Date.now() + (60 * 60 * 1000), // 1 hour from now
        token_type: 'bearer',
        expires_in: 3600,
      };

      return { session: mockSession as Session, error: null };
    } catch (error) {
      console.error('DemoAuthService - Error creating demo session:', error);
      return { error };
    }
  }

  // Sign out (same as regular auth)
  static async signOut(): Promise<{ error: any }> {
    try {
      console.log('DemoAuthService - Signing out...');
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('DemoAuthService - Sign out error:', error);
      return { error };
    }
  }
}