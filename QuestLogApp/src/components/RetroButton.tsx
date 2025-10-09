import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import { RetroTheme } from '../theme/RetroTheme';

interface RetroButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

export const RetroButton: React.FC<RetroButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  style,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[size],
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RetroTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    ...RetroTheme.shadows.small,
  },
  
  // Variants
  primary: {
    backgroundColor: RetroTheme.colors.button,
    borderColor: RetroTheme.colors.primary,
  },
  secondary: {
    backgroundColor: RetroTheme.colors.buttonSecondary,
    borderColor: RetroTheme.colors.border,
  },
  
  // Sizes
  small: {
    paddingHorizontal: RetroTheme.spacing.md,
    paddingVertical: RetroTheme.spacing.sm,
  },
  medium: {
    paddingHorizontal: RetroTheme.spacing.lg,
    paddingVertical: RetroTheme.spacing.md,
  },
  large: {
    paddingHorizontal: RetroTheme.spacing.xl,
    paddingVertical: RetroTheme.spacing.lg,
  },
  
  // Text styles
  text: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: RetroTheme.fonts.primary,
  },
  primaryText: {
    color: RetroTheme.colors.text,
  },
  secondaryText: {
    color: RetroTheme.colors.text,
  },
});