import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { AuthSuccessScreen } from './src/screens/AuthSuccessScreen';
import { RetroTheme } from './src/theme/RetroTheme';

// Main app component that handles auth state
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={RetroTheme.colors.primary} />
      </View>
    );
  }

  // Show success screen if user is authenticated
  if (user) {
    return <AuthSuccessScreen />;
  }

  // Show login screen if not authenticated
  return <LoginScreen />;
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
