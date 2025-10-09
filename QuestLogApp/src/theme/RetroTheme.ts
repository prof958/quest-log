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
    error: '#ff6b6b',        // Friendly red
    
    // UI elements
    border: '#3d3426',       // Warm border
    input: '#2c241a',        // Input backgrounds
    button: '#eca413',       // Golden button
    buttonSecondary: '#4a3f2a', // Secondary button
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
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    medium: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
  
  animations: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
};

export type Theme = typeof RetroTheme;