import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AuthFlow } from './src/screens/AuthFlow';
import { AuthSuccessScreen } from './src/screens/AuthSuccessScreen';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { RetroTheme } from './src/theme/RetroTheme';
import { supabase } from './src/lib/supabase';

// Main app component that handles auth state
function AppContent() {
  const { user, loading } = useAuth();
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);

  // Check if user has completed their profile
  useEffect(() => {
    async function checkProfile() {
      if (!user) {
        setProfileExists(null);
        return;
      }

      setCheckingProfile(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking profile:', error);
        }

        // Profile exists if we got data and username is not null
        setProfileExists(!!(data && data.username));
        console.log('Profile check:', { hasProfile: !!(data && data.username), data });
      } catch (error) {
        console.error('Failed to check profile:', error);
        setProfileExists(false);
      } finally {
        setCheckingProfile(false);
      }
    }

    checkProfile();
  }, [user]);

  if (loading || checkingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={RetroTheme.colors.primary} />
      </View>
    );
  }

  // Show auth flow if no user
  if (!user) {
    return <AuthFlow />;
  }

  // Show profile setup if user exists but profile is incomplete
  if (profileExists === false) {
    return <ProfileSetupScreen onComplete={() => setProfileExists(true)} />;
  }

  // Show main app if user is authenticated and profile is complete
  return <AuthSuccessScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <StatusBar style="light" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RetroTheme.colors.background,
  },
});
