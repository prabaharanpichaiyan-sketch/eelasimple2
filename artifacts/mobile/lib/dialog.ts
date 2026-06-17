import { Alert, Platform } from 'react-native';

export type DialogButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Cross-platform alert/confirm.
 *
 * `react-native-web` does not implement `Alert`, so `Alert.alert(...)` is a
 * silent no-op on the web — errors, confirmations and delete prompts simply
 * never appear. This helper mirrors the `Alert.alert` signature and falls back
 * to the browser's native `window.alert` / `window.confirm` on web.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: DialogButton[],
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  // No buttons, or a single acknowledge button → simple alert.
  if (!buttons || buttons.length <= 1) {
    if (typeof window !== 'undefined') window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  // Multiple buttons → treat as a confirm dialog.
  const cancelButton = buttons.find((b) => b.style === 'cancel');
  const confirmButton = buttons.find((b) => b.style !== 'cancel') ?? buttons[buttons.length - 1];

  const confirmed = typeof window !== 'undefined' ? window.confirm(text) : false;
  if (confirmed) {
    confirmButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
