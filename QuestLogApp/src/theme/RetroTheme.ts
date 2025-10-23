// Cozy Gaming Theme
export const RetroTheme = {
  colors: {
    // Warm, nostalgic gaming palette
    primary: '#eca413',      // Golden yellow (like coins/XP)
    secondary: '#f4d03f',    // Lighter gold
    background: '#221c10',   // Warm dark brown
    backgroundLight: '#f8f7f6', // Cream for light mode
    surface: '#2c241a',      // Warm surface
    surfaceLight: '#ffffff', // White surface for light mode
    accent: '#ff6b6b',       // Friendly red accent
    
    // Text colors
    text: '#f8f7f6',         // Warm white
    textDark: '#221c10',     // Dark text for light backgrounds
    textSecondary: '#d4c5a0', // Warm secondary text
    textMuted: '#8a7960',    // Muted warm text
    
    // Status colors
    success: '#51cf66',      // Friendly green
    warning: '#ffd43b',      // Warm yellow
    error: '#d63447',        // Deeper red, coherent with warm palette
    danger: '#d63447',       // Alias for error
    
    // UI elements
    border: '#3d3426',       // Warm border
    borderLight: '#4a3f2a',  // Lighter border for depth
    input: '#2c241a',        // Input backgrounds
    button: '#eca413',       // Golden button
    buttonSecondary: '#4a3f2a', // Secondary button
    
    // Depth layers (for creating visual hierarchy)
    layer0: '#1a1410',       // Deepest layer
    layer1: '#221c10',       // Background
    layer2: '#2c241a',       // Surface
    layer3: '#3d3426',       // Elevated surface
  },
  
  fonts: {
    // Retro pixel fonts - we'll load these later
    primary: 'System', // Fallback to system font for now
    mono: 'Courier New',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 5,
      elevation: 6,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 10,
    },
  },
  
  // Button styles with depth
  buttons: {
    primary: {
      backgroundColor: '#eca413',
      borderWidth: 2,
      borderColor: '#3d3426',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
    },
    secondary: {
      backgroundColor: '#4a3f2a',
      borderWidth: 2,
      borderColor: '#3d3426',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
    },
    danger: {
      backgroundColor: '#d63447',
      borderWidth: 2,
      borderColor: '#3d3426',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: '#eca413',
    },
  },
  
  animations: {
    fast: 150,
    normal: 250,
    slow: 400,
  },

  text: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      fontFamily: 'System',
      color: '#f8f7f6',
      lineHeight: 38,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      fontFamily: 'System',
      color: '#f8f7f6',
      lineHeight: 30,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      fontFamily: 'System',
      color: '#f8f7f6',
      lineHeight: 26,
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      fontFamily: 'System',
      color: '#f8f7f6',
      lineHeight: 22,
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal' as const,
      fontFamily: 'System',
      color: '#8a7960',
      lineHeight: 18,
    },
    button: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      fontFamily: 'System',
      color: '#221c10',
    },
  },
};

export type Theme = typeof RetroTheme;