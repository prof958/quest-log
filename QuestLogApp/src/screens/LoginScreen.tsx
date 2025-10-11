import React, { useState, useEffect } from 'react';
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

interface LoginScreenProps {
  onShowSignUp: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onShowSignUp }) => {
  const [showAuthOptions, setShowAuthOptions] = useState<false | 'buttons' | 'login'>(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    console.log('🏠 LoginScreen mounted');
    console.log('🌐 Current URL:', window.location.href);
    console.log('🔍 URL search params:', window.location.search);
    
    // Check if we're returning from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (accessToken) {
      console.log('🎉 OAuth tokens found in URL - successful OAuth return!');
      console.log('✅ Access token present:', !!accessToken);
      console.log('✅ Refresh token present:', !!refreshToken);
    }
  }, []);

  const handleBeginAdventure = () => {
    console.log('🎮 Begin Adventure clicked - showing auth options');
    setShowAuthOptions('buttons');
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailLogin = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Login Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Starting email login...');
      
      const result = await AuthService.signInWithEmail(
        formData.email.trim(),
        formData.password
      );
      
      if (result.error) {
        console.error('❌ Login failed:', result.error);
        Alert.alert(
          'Login Failed',
          result.error.message || 'Invalid credentials. Please check your email and password.',
          [{ text: 'OK' }]
        );
      } else if (result.user) {
        console.log('✅ Login successful');
        // AuthContext will handle the user state update automatically
        // No need for manual navigation - the app will re-render with authenticated user
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert(
        'Login Failed',
        'Invalid credentials or network error. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('🎯 Google login button clicked');
    console.log('📱 Current platform:', Platform.OS);
    console.log('🌐 User agent:', navigator?.userAgent || 'Unknown');
    
    setLoading(true);
    try {
      console.log('🚀 Initiating Google OAuth login...');
      
      const result = await AuthService.signInWithGoogle();
      
      if (result.error) {
        console.error('❌ Google login failed:', result.error);
        console.error('❌ Error details:', {
          message: result.error.message,
          status: result.error.status,
          name: result.error.name
        });
        Alert.alert(
          'Google Login Failed',
          result.error.message || 'Failed to sign in with Google. Please try again.',
          [{ text: 'OK' }]
        );
      } else {
        console.log('✅ Google OAuth initiated successfully');
        console.log('📝 Result data:', result.data);
        
        // Check if we got a URL for redirection
        if (result.data?.url) {
          console.log('🔗 Redirecting to:', result.data.url);
          window.location.href = result.data.url;
        } else {
          console.log('⚠️ No redirect URL received from OAuth');
        }
      }
      
    } catch (error) {
      console.error('❌ Google login exception:', error);
      Alert.alert(
        'Google Login Failed',
        'Failed to sign in with Google. Please try again.',
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
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              <GameControllerIcon />
              
              <Text style={styles.welcomeTitle}>Start Your Quest!</Text>
              <Text style={styles.welcomeSubtitle}>
                Track your games, earn XP, unlock achievements, and level up your gaming journey.
              </Text>
            </View>

            {/* Footer with Sign In */}
            <View style={styles.footer}>
              {!showAuthOptions ? (
                // Initial adventure buttons - Login and Sign Up options
                <>
                  <TouchableOpacity
                    style={styles.beginButton}
                    onPress={handleBeginAdventure}
                  >
                    <Text style={styles.beginButtonText}>Begin Your Adventure</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.termsText}>
                    Ready to level up? Join thousands of gamers tracking their epic journeys.
                  </Text>
                </>
              ) : showAuthOptions === 'buttons' ? (
                // Show Login and Sign Up buttons
                <>
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={styles.loginActionButton}
                      onPress={() => setShowAuthOptions('login')}
                    >
                      <Text style={styles.loginActionButtonText}>Login</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.signupActionButton}
                      onPress={onShowSignUp}
                    >
                      <Text style={styles.signupActionButtonText}>Sign Up</Text>
                    </TouchableOpacity>

                    {/* Google OAuth Button */}
                    <TouchableOpacity
                      style={[styles.googleButton, loading && styles.loginButtonLoading]}
                      onPress={handleGoogleLogin}
                      disabled={loading}
                    >
                      <Text style={styles.googleButtonText}>
                        {loading ? 'Signing in...' : '🚀 Continue with Google'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.backToStartButton}
                    onPress={() => setShowAuthOptions(false)}
                  >
                    <Text style={styles.backToStartButtonText}>← Back</Text>
                  </TouchableOpacity>
                </>
              ) : showAuthOptions === 'login' ? (
                // Login form
                <View style={styles.authContainer}>
                  {/* Login Form */}
                  <View style={styles.loginForm}>
                    <Text style={styles.formTitle}>Welcome Back, Adventurer!</Text>
                    
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
                          placeholder="Enter your password"
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

                    <TouchableOpacity
                      style={[styles.loginButton, loading && styles.loginButtonLoading]}
                      onPress={handleEmailLogin}
                      disabled={loading}
                    >
                      <Text style={styles.loginButtonText}>
                        {loading ? 'Logging in...' : 'Continue Quest'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Google Sign In Button */}
                  <TouchableOpacity
                    style={[styles.googleButton, loading && styles.loginButtonLoading]}
                    onPress={handleGoogleLogin}
                    disabled={loading}
                  >
                    <Text style={styles.googleButtonText}>
                      {loading ? 'Signing in...' : '🚀 Continue with Google'}
                    </Text>
                  </TouchableOpacity>

                  {/* Sign Up Option */}
                  <TouchableOpacity
                    style={styles.signUpButton}
                    onPress={onShowSignUp}
                  >
                    <Text style={styles.signUpButtonText}>Create New Account</Text>
                  </TouchableOpacity>

                  {/* Back Button */}
                  <TouchableOpacity
                    style={styles.backToStartButton}
                    onPress={() => setShowAuthOptions(false)}
                  >
                    <Text style={styles.backToStartButtonText}>← Back</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Show Login/Sign Up buttons
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.loginActionButton]}
                    onPress={() => setShowAuthOptions('login')}
                  >
                    <Text style={[styles.actionButtonText, { color: RetroTheme.colors.background }]}>Login</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, styles.signupActionButton]}
                    onPress={() => {
                      // Navigate to SignUp screen
                      // This would typically use navigation prop
                    }}
                  >
                    <Text style={[styles.actionButtonText, { color: RetroTheme.colors.primary }]}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              )}
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
    alignItems: 'center',
    width: '100%',
  },
  
  // Initial adventure button
  beginButton: {
    width: '100%',
    height: 48,
    backgroundColor: RetroTheme.colors.primary,
    borderRadius: RetroTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...RetroTheme.shadows.small,
  },
  
  beginButtonText: {
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

  // Auth container
  authContainer: {
    width: '100%',
    alignItems: 'center',
  },

  // Login form
  loginForm: {
    width: '100%',
    maxWidth: 300,
    marginBottom: RetroTheme.spacing.lg,
  },

  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: RetroTheme.colors.text,
    fontFamily: RetroTheme.fonts.primary,
    textAlign: 'center',
    marginBottom: RetroTheme.spacing.lg,
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

  loginButton: {
    width: '100%',
    height: 48,
    backgroundColor: RetroTheme.colors.primary,
    borderRadius: RetroTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...RetroTheme.shadows.small,
  },

  loginButtonLoading: {
    opacity: 0.7,
  },

  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: RetroTheme.colors.background,
    fontFamily: RetroTheme.fonts.primary,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: RetroTheme.spacing.lg,
    width: '100%',
    maxWidth: 300,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: RetroTheme.colors.textMuted,
    opacity: 0.3,
  },

  dividerText: {
    marginHorizontal: RetroTheme.spacing.md,
    fontSize: 14,
    color: RetroTheme.colors.textMuted,
    fontFamily: RetroTheme.fonts.primary,
  },

  // Google OAuth button
  googleButton: {
    width: '100%',
    maxWidth: 300,
    height: 48,
    backgroundColor: '#4285F4', // Google Blue
    borderRadius: RetroTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RetroTheme.spacing.md,
    ...RetroTheme.shadows.small,
  },

  googleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: RetroTheme.fonts.primary,
  },

  // Sign up button
  signUpButton: {
    width: '100%',
    maxWidth: 300,
    height: 48,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: RetroTheme.colors.primary,
    borderRadius: RetroTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RetroTheme.spacing.md,
  },

  signUpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: RetroTheme.colors.primary,
    fontFamily: RetroTheme.fonts.primary,
  },

  // Action buttons container
  actionButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    alignSelf: 'center',
    gap: RetroTheme.spacing.md,
    marginBottom: RetroTheme.spacing.lg,
  },

  // Login action button
  loginActionButton: {
    width: '100%',
    maxWidth: 300,
    height: 56,
    backgroundColor: RetroTheme.colors.primary,
    borderRadius: RetroTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    ...RetroTheme.shadows.small,
  },

  loginActionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: RetroTheme.colors.background,
    fontFamily: RetroTheme.fonts.primary,
    textAlign: 'center',
  },

  // Signup action button
  signupActionButton: {
    width: '100%',
    maxWidth: 300,
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: RetroTheme.colors.primary,
    borderRadius: RetroTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  signupActionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: RetroTheme.colors.primary,
    fontFamily: RetroTheme.fonts.primary,
    textAlign: 'center',
  },

  // Back to start button
  backToStartButton: {
    padding: RetroTheme.spacing.sm,
  },

  backToStartButtonText: {
    fontSize: 14,
    color: RetroTheme.colors.textMuted,
    fontFamily: RetroTheme.fonts.primary,
  },

  // Base action button
  actionButton: {
    width: '100%',
    height: 56,
    borderRadius: RetroTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },

  // Base action button text
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: RetroTheme.fonts.primary,
  },
});