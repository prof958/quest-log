/**
 * RetroAlert Component
 * A custom alert/modal component matching the app's retro design
 * Replaces native Alert.alert() with styled modal
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { RetroTheme } from '../theme/RetroTheme';

interface RetroAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface RetroAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: RetroAlertButton[];
  onDismiss?: () => void;
}

export const RetroAlert: React.FC<RetroAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onDismiss,
}) => {
  const handleButtonPress = (button: RetroAlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          {message && (
            <ScrollView style={styles.messageScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.message}>{message}</Text>
            </ScrollView>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'destructive' && styles.buttonDestructive,
                  button.style === 'cancel' && styles.buttonCancel,
                ]}
                onPress={() => handleButtonPress(button)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'destructive' && styles.buttonTextDestructive,
                    button.style === 'cancel' && styles.buttonTextCancel,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: RetroTheme.colors.layer1,
    borderRadius: RetroTheme.borderRadius.lg,
    borderWidth: 3,
    borderColor: RetroTheme.colors.border,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...RetroTheme.shadows.large,
  },
  title: {
    ...RetroTheme.text.h2,
    color: RetroTheme.colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  messageScroll: {
    maxHeight: 300,
    marginBottom: 20,
  },
  message: {
    ...RetroTheme.text.body,
    color: RetroTheme.colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: RetroTheme.colors.primary,
    borderRadius: RetroTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: RetroTheme.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    ...RetroTheme.shadows.small,
  },
  buttonCancel: {
    backgroundColor: RetroTheme.colors.layer2,
  },
  buttonDestructive: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    ...RetroTheme.text.body,
    fontWeight: 'bold',
    color: RetroTheme.colors.background,
    textAlign: 'center',
  },
  buttonTextCancel: {
    color: RetroTheme.colors.text,
  },
  buttonTextDestructive: {
    color: '#ffffff',
  },
});

/**
 * Helper function to show RetroAlert (similar to Alert.alert API)
 * Usage: showRetroAlert('Title', 'Message', [{ text: 'OK', onPress: () => {} }])
 */
export const showRetroAlert = (
  title: string,
  message?: string,
  buttons?: RetroAlertButton[]
) => {
  // This is a helper that components can use
  // Components need to manage the visible state themselves
  return {
    title,
    message,
    buttons: buttons || [{ text: 'OK', style: 'default' as const }],
  };
};
