import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { RetroTheme } from '../theme/RetroTheme';

interface RetroInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const RetroInput: React.FC<RetroInputProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={RetroTheme.colors.textMuted}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: RetroTheme.spacing.md,
  },
  
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: RetroTheme.colors.text,
    marginBottom: RetroTheme.spacing.sm,
    fontFamily: RetroTheme.fonts.primary,
  },
  
  input: {
    backgroundColor: RetroTheme.colors.input,
    borderWidth: 2,
    borderColor: RetroTheme.colors.border,
    borderRadius: RetroTheme.borderRadius.md,
    paddingHorizontal: RetroTheme.spacing.md,
    paddingVertical: RetroTheme.spacing.md,
    fontSize: 16,
    color: RetroTheme.colors.text,
    fontFamily: RetroTheme.fonts.primary,
  },
  
  inputError: {
    borderColor: RetroTheme.colors.error,
  },
  
  error: {
    fontSize: 12,
    color: RetroTheme.colors.error,
    marginTop: RetroTheme.spacing.xs,
    fontFamily: RetroTheme.fonts.primary,
  },
});