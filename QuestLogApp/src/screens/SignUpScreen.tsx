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
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RetroTheme } from '../theme/RetroTheme';
import { AuthService } from '../services/AuthService';

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

interface SignUpScreenProps {
  onBackToLogin: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert('Validation Error', 'Please enter a username');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Please enter an email address');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('🚀 Starting sign up process...');
      
      const result = await AuthService.signUp(
        formData.email.trim(),
        formData.password,
        { username: formData.username.trim() }
      );
      
      if (result.error) {
        console.error('❌ Sign up failed:', result.error);
        Alert.alert(
          'Sign Up Failed',
          result.error.message || 'An error occurred during sign up. Please try again.',
          [{ text: 'OK' }]
        );
      } else if (result.user) {
        console.log('✅ Sign up successful');
        Alert.alert(
          'Account Created! 🎉',
          `Welcome to QuestLog, ${formData.username}! Check your email to confirm your account, then you can start logging your gaming adventures.`,
          [
            {
              text: 'Continue to Login',
              onPress: () => onBackToLogin()
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('❌ Sign up error:', error);
      Alert.alert(
        'Sign Up Failed',
        'An error occurred during sign up. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
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
              <TouchableOpacity onPress={onBackToLogin} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back to Login</Text>
              </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              <GameControllerIcon />
              
              <Text style={styles.welcomeTitle}>Create Your Account</Text>
              <Text style={styles.welcomeSubtitle}>
                Join the quest and start tracking your gaming adventures!
              </Text>

              {/* Sign Up Form */}
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.username}
                    onChangeText={(value) => handleInputChange('username', value)}
                    placeholder="Choose your gamer tag"
                    placeholderTextColor={RetroTheme.colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    placeholder="your.email@example.com"
                    placeholderTextColor={RetroTheme.colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      value={formData.password}
                      onChangeText={(value) => handleInputChange('password', value)}
                      placeholder="Create a strong password"
                      placeholderTextColor={RetroTheme.colors.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.showPasswordButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.showPasswordText}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    placeholder="Confirm your password"
                    placeholderTextColor={RetroTheme.colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </View>

            {/* Footer with Sign Up Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.signUpButton, loading && styles.signUpButtonLoading]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text style={styles.signUpButtonText}>
                  {loading ? 'Creating Account...' : 'Start Your Quest!'}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.termsText}>
                By creating an account, you agree to embark on epic gaming adventures with us!
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
    marginBottom: RetroTheme.spacing.sm,
  },

  backButton: {
    alignSelf: 'flex-start',
  },

  backButtonText: {
    fontSize: 14,
    color: RetroTheme.colors.primary,
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
    fontSize: 28,
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
    marginBottom: RetroTheme.spacing.xl,
  },

  // Form
  formContainer: {
    width: '100%',
    maxWidth: 300,
  },

  inputContainer: {
    marginBottom: RetroTheme.spacing.lg,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: RetroTheme.colors.text,
    fontFamily: RetroTheme.fonts.primary,
    marginBottom: RetroTheme.spacing.xs,
  },

  textInput: {
    width: '100%',
    height: 48,
    backgroundColor: RetroTheme.colors.surface,
    borderRadius: RetroTheme.borderRadius.md,
    paddingHorizontal: RetroTheme.spacing.md,
    fontSize: 16,
    color: RetroTheme.colors.text,
    fontFamily: RetroTheme.fonts.primary,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  passwordContainer: {
    position: 'relative',
  },

  passwordInput: {
    paddingRight: 60,
  },

  showPasswordButton: {
    position: 'absolute',
    right: RetroTheme.spacing.sm,
    top: 0,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: RetroTheme.spacing.sm,
  },

  showPasswordText: {
    fontSize: 14,
    color: RetroTheme.colors.primary,
    fontFamily: RetroTheme.fonts.primary,
    fontWeight: 'bold',
  },
  
  // Footer
  footer: {
    paddingBottom: RetroTheme.spacing.lg,
    gap: RetroTheme.spacing.md,
    alignItems: 'center',
  },
  
  signUpButton: {
    width: '100%',
    height: 48,
    backgroundColor: RetroTheme.colors.primary,
    borderRadius: RetroTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...RetroTheme.shadows.small,
  },
  
  signUpButtonLoading: {
    opacity: 0.7,
  },
  
  signUpButtonText: {
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
    maxWidth: 280,
  },
});