---
name: react-native Alert is a no-op on web
description: Why Alert.alert silently does nothing in react-native-web and how to fix it
---

`react-native-web` does not implement `Alert`, so **`Alert.alert(...)` is a silent
no-op on the web build**. Symptoms: error messages never appear, success toasts never
show, and — most dangerously — confirmation dialogs (delete prompts with
Cancel/Delete buttons) never fire their `onPress`, so the action silently does nothing.
On a web login screen this looks like "login fails with no error shown."

**Why:** the same Expo/React Native screens render on web via react-native-web, but a
handful of native modules (Alert, Linking edge cases, Haptics) are stubs or no-ops
there.

**How to apply:** route every `Alert.alert` through a cross-platform helper
(`lib/dialog.ts` → `showAlert`) that delegates to native `Alert.alert` off-web and
falls back to `window.alert` / `window.confirm` on web. For multi-button dialogs, map
the non-`cancel` button to the confirm action. Audit the whole app, not just auth —
delete confirmations elsewhere are broken the same way.
