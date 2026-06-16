---
name: Icon fonts fail on device (Expo)
description: Why @expo/vector-icons may render blank on physical devices and the SVG fix
---

Font-based icons (`@expo/vector-icons`, e.g. Feather) can render blank on a physical
device in Expo Go even when they show fine in the web preview — the icon font fails to
load on the device. The mobile app now renders icons as `react-native-svg` paths via a
single wrapper `components/Icon.tsx` (Feather MIT path data), used for ALL platforms
(tab bar dropped iOS `SymbolView` for cross-platform consistency).

**Why:** icon-font loading is unreliable in Expo Go; SVG via `react-native-svg`
(official, already a dep) renders consistently on iOS/Android/web.

**How to apply:** add new icons to the `PATHS` map in `components/Icon.tsx` (kebab-case
keys, stroke inherited from the parent `<Svg>`). `name` is typed `IconName`, so typos are
caught at compile time and a `__DEV__` warning logs unknown names before the alert-circle
fallback. Do NOT reach for `lucide-react-native` — its `1.18.0` release (anomalous; the
real package is on `0.x`) triggered an "Invalid hook call" in expo-router's TabBarIcon.
