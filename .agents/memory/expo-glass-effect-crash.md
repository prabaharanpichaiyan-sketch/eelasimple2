---
name: expo-glass-effect crash
description: expo-glass-effect and expo-router/unstable-native-tabs crash on web due to missing native modules
---

## Rule
Never import `expo-glass-effect` (`isLiquidGlassAvailable`) or `expo-router/unstable-native-tabs` (`NativeTabs`, `Icon`, `Label`) in the tabs layout or any web-rendered component. Both packages have broken/missing native builds that throw at module load time on web.

**Why:** `expo-glass-effect` tries to resolve `GlassView` which doesn't exist in the web bundle. `unstable-native-tabs` is iOS-only experimental API.

**How to apply:** Use only the standard `Tabs` component from `expo-router` for all platforms. For iOS-only icons, guard with `Platform.OS === 'ios'` inside the `tabBarIcon` render prop using `SymbolView` vs `Feather`.
