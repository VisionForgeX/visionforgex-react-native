# VisionForgeX for React Native

Ads for React Native apps monetized with [VisionForgeX](https://apps.visionforgex.com): Google Ad Manager demand (Google Ad
Exchange) through your VisionForgeX account. A thin package over the native VisionForgeX SDKs; **every decision**
(pacing, floors, refresh, preloading, consent, experiments) is made on the platform and changes without an app update.

Needs a React Native app with native modules (not Expo Go; Expo works with a development build).

## Add it

```sh
npm install @visionforgex/react-native-sdk
```

**Android**: in `android/app/src/main/AndroidManifest.xml`, inside `<application>`, the App ID shown on your app's page
on VisionForgeX (minSdk 24):

```xml
<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-…~…"/>
```

**iOS**: in `ios/<YourApp>/Info.plist` (iOS 13 or later):

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-…~…</string>
```

plus Google's SKAdNetwork identifiers (list on Google's site). Then `cd ios && pod install`.

## Start it and show ads

```tsx
import { VisionForgeX, VfxBanner } from '@visionforgex/react-native-sdk';

// once, as early as you can (App.tsx)
await VisionForgeX.initialize('vfx_…your app key…');

// at a natural pause: call at every one; the platform decides whether an ad shows now
const r = await VisionForgeX.interstitial('level_complete').show();   // r.shown, r.reason

// rewarded
await VisionForgeX.rewarded('extra_life').show({ onReward: (type, amount) => giveReward() });

// a banner
<VfxBanner placement="home_banner" style={{ height: 60 }} />
```

The key and the placement names are on your app's page on VisionForgeX. App open ads show by themselves on return to
the app when the platform turns that on.

## Test before you have an account

```ts
await VisionForgeX.initialize('demo', { googleDemoAds: true });
```

Placements: `banner`, `collapsible_banner`, `interstitial`, `rewarded`, `rewarded_interstitial`, `app_open`.

## Status

1.0.0 has not been released. Its TypeScript layer is tested; the Android and iOS modules are checked by this repository's CI.
