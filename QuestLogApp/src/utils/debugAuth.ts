import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export const debugAuthUrls = async () => {
  console.log('🔍 DEBUG - Auth URL Configuration Check');
  
  // Check current Expo URL
  const initialUrl = await Linking.getInitialURL();
  console.log('📱 DEBUG - Initial URL:', initialUrl);
  
  // Test different redirect URL formats
  const testUrls = [
    'exp://192.168.1.101:8081/--/auth/callback',
    'exp://192.168.1.101:8082/--/auth/callback', 
    'questlog://auth/callback'
  ];
  
  console.log('🔗 DEBUG - Testing redirect URL formats:');
  
  for (const testUrl of testUrls) {
    try {
      const canOpen = await Linking.canOpenURL(testUrl);
      console.log(`  ${testUrl} - Can open: ${canOpen}`);
    } catch (error) {
      console.log(`  ${testUrl} - Error: ${error}`);
    }
  }
  
  // Test Supabase OAuth URL generation
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'exp://192.168.1.101:8081/--/auth/callback',
      },
    });
    
    console.log('🎯 DEBUG - Supabase OAuth URL test:', {
      success: !error,
      hasUrl: !!data?.url,
      url: data?.url,
      error: error?.message
    });
  } catch (error) {
    console.log('❌ DEBUG - Supabase OAuth test failed:', error);
  }
};