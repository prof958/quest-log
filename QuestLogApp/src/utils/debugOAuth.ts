// OAuth Debugging Helper
// This file helps debug OAuth flow issues

export const debugOAuth = {
  // Test if URL scheme is properly configured
  testAppScheme: () => {
    console.log('🔧 Testing app scheme configuration...');
    console.log('📱 Expected scheme: questlog://');
    console.log('📁 Check app.json for "scheme": "questlog"');
  },

  // Log detailed OAuth flow information
  logOAuthFlow: (step: string, data: any) => {
    console.log(`🔍 OAuth Debug [${step}]:`, JSON.stringify(data, null, 2));
  },

  // Test redirect URL patterns
  testRedirectUrls: () => {
    console.log('🔧 Testing redirect URL patterns...');
    console.log('✅ questlog://auth/callback (app scheme)');
    console.log('✅ https://[PROJECT].supabase.co/auth/v1/callback (web fallback)');
    console.log('⚠️  Make sure these are added to Supabase Dashboard > Auth > URL Configuration');
  },

  // Parse callback URL for debugging
  parseCallbackUrl: (url: string) => {
    try {
      const parsed = new URL(url);
      console.log('🔍 Callback URL Analysis:');
      console.log('  Protocol:', parsed.protocol);
      console.log('  Host:', parsed.host);
      console.log('  Pathname:', parsed.pathname);
      console.log('  Search params:', parsed.search);
      console.log('  Hash fragment:', parsed.hash);
      
      // Check for common OAuth parameters
      const params = new URLSearchParams(parsed.search);
      const fragment = new URLSearchParams(parsed.hash.substring(1));
      
      console.log('🔑 OAuth Parameters:');
      console.log('  Code (PKCE):', params.get('code') || 'not found');
      console.log('  Access Token:', params.get('access_token') || fragment.get('access_token') || 'not found');
      console.log('  Error:', params.get('error') || fragment.get('error') || 'none');
      console.log('  Error Description:', params.get('error_description') || fragment.get('error_description') || 'none');
      
      return { params, fragment, parsed };
    } catch (error) {
      console.error('❌ Failed to parse URL:', error);
      return null;
    }
  }
};

export default debugOAuth;