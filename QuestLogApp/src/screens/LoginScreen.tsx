import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RetroButton } from '../components/RetroButton';
import { RetroTheme } from '../theme/RetroTheme';

// Simple gaming controller icon component
const GameControllerIcon = () => (
  <View style={styles.iconContainer}>
    <View style={styles.controllerBody}>
      <View style={styles.dPad} />
      <View style={styles.buttons}>
        <View style={[styles.button, styles.buttonA]} />
        <View style={[styles.button, styles.buttonB]} />
      </View>
    </View>
  </View>
);

export const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    // TODO: Implement Google Sign In
    console.log('Google Sign In');
    
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[RetroTheme.colors.background, '#1a150e']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.appTitle}>QuestLog</Text>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              <GameControllerIcon />
              
              <Text style={styles.welcomeTitle}>Welcome Back!</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to track your progress, earn XP, and level up your gaming experience.
              </Text>
            </View>

            {/* Footer with Sign In */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.googleButton, loading && styles.googleButtonLoading]}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.termsText}>
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
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
  
  keyboardView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: RetroTheme.spacing.lg,
  },
  
  // Header
  header: {
    alignItems: 'center',
    paddingTop: RetroTheme.spacing.md,
  },
  
  appTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: RetroTheme.colors.text,
    fontFamily: RetroTheme.fonts.primary,
  },
  
  // Main Content
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: RetroTheme.spacing.lg,
  },
  
  // Game Controller Icon
  iconContainer: {
    width: 96,
    height: 96,
    backgroundColor: RetroTheme.colors.primary + '33', // 20% opacity
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RetroTheme.spacing.xl,
  },
  
  controllerBody: {
    width: 48,
    height: 32,
    backgroundColor: RetroTheme.colors.primary,
    borderRadius: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  dPad: {
    position: 'absolute',
    left: 8,
    width: 12,
    height: 12,
    backgroundColor: RetroTheme.colors.background,
    borderRadius: 2,
  },
  
  buttons: {
    position: 'absolute',
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  
  button: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  
  buttonA: {
    backgroundColor: RetroTheme.colors.success,
  },
  
  buttonB: {
    backgroundColor: RetroTheme.colors.error,
  },
  
  // Welcome Text
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: RetroTheme.colors.text,
    textAlign: 'center',
    marginBottom: RetroTheme.spacing.sm,
    fontFamily: RetroTheme.fonts.primary,
  },
  
  welcomeSubtitle: {
    fontSize: 16,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
    fontFamily: RetroTheme.fonts.primary,
  },
  
  // Footer
  footer: {
    paddingBottom: RetroTheme.spacing.lg,
    gap: RetroTheme.spacing.md,
  },
  
  googleButton: {
    width: '100%',
    height: 48,
    backgroundColor: RetroTheme.colors.primary,
    borderRadius: RetroTheme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RetroTheme.spacing.sm,
    ...RetroTheme.shadows.small,
  },
  
  googleButtonLoading: {
    opacity: 0.7,
  },
  
  googleIcon: {
    width: 20,
    height: 20,
    backgroundColor: RetroTheme.colors.text,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  googleIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: RetroTheme.colors.primary,
  },
  
  googleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: RetroTheme.colors.background,
    fontFamily: RetroTheme.fonts.primary,
  },
  
  termsText: {
    fontSize: 12,
    color: RetroTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: RetroTheme.fonts.primary,
  },
});