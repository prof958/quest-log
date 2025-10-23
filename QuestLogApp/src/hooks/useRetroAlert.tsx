import React, { useState, ReactElement } from 'react';
import { RetroAlert } from '../components/RetroAlert';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface UseRetroAlertReturn {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  hideAlert: () => void;
  AlertComponent: () => ReactElement;
}

export function useRetroAlert(): UseRetroAlertReturn {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({
    title: '',
    message: '',
    buttons: [],
  });

  function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
    setConfig({
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
    setVisible(true);
  }

  function hideAlert() {
    setVisible(false);
  }

  function AlertComponent(): ReactElement {
    return (
      <RetroAlert
        visible={visible}
        title={config.title}
        message={config.message}
        buttons={config.buttons}
        onDismiss={hideAlert}
      />
    );
  }

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
}
