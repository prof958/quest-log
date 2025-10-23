/**
 * Profile Setup Screen
 * Shown to new users after OAuth signup to complete their profile
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { RetroTheme } from '../theme/RetroTheme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRetroAlert } from '../hooks/useRetroAlert';

interface ProfileSetupScreenProps {
  onComplete: () => void;
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);
  const { showAlert, AlertComponent } = useRetroAlert();

  const handleSubmit = async () => {
    if (!username.trim()) {
      showAlert('Username Required', 'Please enter a username');
      return;
    }

    // Validate username (alphanumeric, 3-20 chars)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      showAlert(
        'Invalid Username',
        'Username must be 3-20 characters and contain only letters, numbers, and underscores'
      );
      return;
    }

    setLoading(true);

    try {
      // Check if username is taken
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existing) {
        showAlert('Username Taken', 'This username is already in use. Please choose another.');
        setLoading(false);
        return;
      }

      // Create or update profile
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user!.id,
          username: username.trim(),
          full_name: fullName.trim() || null,
          avatar_url: user?.user_metadata?.avatar_url || null,
        });

      if (error) throw error;

      console.log('✅ Profile created successfully');
      onComplete();
    } catch (error: any) {
      console.error('Failed to create profile:', error);
      showAlert('Error', error.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Let's set up your QuestLog profile!</Text>

        {user?.user_metadata?.avatar_url && (
          <Image
            source={{ uri: user.user_metadata.avatar_url }}
            style={styles.avatar}
          />
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              placeholderTextColor={RetroTheme.colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <Text style={styles.hint}>3-20 characters, letters, numbers, and underscores only</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={RetroTheme.colors.textSecondary}
              maxLength={50}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={RetroTheme.colors.background} />
            ) : (
              <Text style={styles.buttonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <AlertComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RetroTheme.colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: RetroTheme.colors.layer1,
    borderRadius: RetroTheme.borderRadius.lg,
    borderWidth: 3,
    borderColor: RetroTheme.colors.border,
    padding: 24,
    ...RetroTheme.shadows.large,
  },
  title: {
    ...RetroTheme.text.h1,
    fontSize: 28,
    color: RetroTheme.colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...RetroTheme.text.body,
    textAlign: 'center',
    marginBottom: 24,
    color: RetroTheme.colors.textSecondary,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: RetroTheme.colors.primary,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    ...RetroTheme.text.body,
    fontWeight: 'bold',
    color: RetroTheme.colors.text,
  },
  input: {
    backgroundColor: RetroTheme.colors.background,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    borderRadius: RetroTheme.borderRadius.md,
    padding: 12,
    ...RetroTheme.text.body,
    color: RetroTheme.colors.text,
  },
  hint: {
    ...RetroTheme.text.body,
    fontSize: 12,
    color: RetroTheme.colors.textSecondary,
  },
  button: {
    backgroundColor: RetroTheme.colors.primary,
    borderRadius: RetroTheme.borderRadius.md,
    borderWidth: 3,
    borderColor: RetroTheme.colors.border,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    ...RetroTheme.shadows.medium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...RetroTheme.text.body,
    fontWeight: 'bold',
    color: RetroTheme.colors.background,
    fontSize: 16,
  },
});
