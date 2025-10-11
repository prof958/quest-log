import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RetroTheme } from '../theme/RetroTheme';
import { AuthService } from '../services/AuthService';
import { supabase } from '../lib/supabase';
import MainAppScreen from './MainAppScreen';

export const AuthSuccessScreen: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Check current session
      const currentUser = await AuthService.getCurrentUser();
      console.log('Current user:', currentUser);
      
      if (currentUser) {
        setUser(currentUser);
        
        // Check if user exists in our users table
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        console.log('User profile from database:', userProfile);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[RetroTheme.colors.background, '#1a150e']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <ActivityIndicator size="large" color={RetroTheme.colors.primary} />
            <Text style={styles.loadingText}>Completing your quest setup...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // If user is authenticated, show the main app
  if (user) {
    return <MainAppScreen />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[RetroTheme.colors.background, '#1a150e']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          
          <Text style={styles.title}>Welcome to QuestLog!</Text>
          <Text style={styles.subtitle}>Your adventure begins now</Text>
          
          <Text style={styles.nextText}>
            🎮 Authentication complete - preparing your gaming journey!
          </Text>
          
          <Text style={styles.nextText}>
            🎮 Ready to start tracking your games and earning XP!
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RetroTheme.colors.background,
  },
  
  gradient: {
    flex: 1,
  },
  
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: RetroTheme.spacing.lg,
  },
  
  // Loading state
  loadingText: {
    fontSize: 16,
    color: RetroTheme.colors.text,
    fontFamily: RetroTheme.fonts.primary,
    marginTop: RetroTheme.spacing.lg,
    textAlign: 'center',
  },
  
  // Success state
  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: RetroTheme.colors.success + '33',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RetroTheme.spacing.xl,
  },
  
  checkmark: {
    fontSize: 32,
    color: RetroTheme.colors.success,
    fontWeight: 'bold',
  },
  
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: RetroTheme.colors.text,
    textAlign: 'center',
    marginBottom: RetroTheme.spacing.sm,
    fontFamily: RetroTheme.fonts.primary,
  },
  
  subtitle: {
    fontSize: 16,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: RetroTheme.spacing.xl,
    fontFamily: RetroTheme.fonts.primary,
  },
  
  userInfo: {
    backgroundColor: RetroTheme.colors.surface,
    borderRadius: RetroTheme.borderRadius.lg,
    padding: RetroTheme.spacing.lg,
    marginBottom: RetroTheme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RetroTheme.colors.border,
  },
  
  userText: {
    fontSize: 14,
    color: RetroTheme.colors.textMuted,
    fontFamily: RetroTheme.fonts.primary,
  },
  
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: RetroTheme.colors.text,
    fontFamily: RetroTheme.fonts.primary,
    marginTop: RetroTheme.spacing.xs,
  },
  
  provider: {
    fontSize: 12,
    color: RetroTheme.colors.textMuted,
    fontFamily: RetroTheme.fonts.primary,
    marginTop: RetroTheme.spacing.xs,
  },
  
  nextText: {
    fontSize: 16,
    color: RetroTheme.colors.primary,
    textAlign: 'center',
    fontFamily: RetroTheme.fonts.primary,
    lineHeight: 24,
  },
});