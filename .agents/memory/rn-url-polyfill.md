---
name: React Native URL polyfill for Supabase
description: Supabase fetch on Android Expo Go fails with "Network request failed" without react-native-url-polyfill
---

## Rule
Any Expo project using `@supabase/supabase-js` must import `react-native-url-polyfill/auto` as the very first import in the app entry point, before `expo-router/entry`.

**Why:** Supabase v2 uses the WHATWG URL API internally. React Native's JS engine doesn't ship a compliant URL implementation, so `@supabase/supabase-js` falls back to `whatwg-fetch` (XHR polyfill) which fails on Android with "Network request failed".

**How to apply:**
1. `pnpm add react-native-url-polyfill` in the mobile artifact
2. Create `artifacts/mobile/index.js`:
   ```js
   import 'react-native-url-polyfill/auto';
   import 'expo-router/entry';
   ```
3. Set `"main": "./index.js"` in `package.json` (not `"expo-router/entry"`)
4. Restart the Metro workflow to pick up the new entry point
