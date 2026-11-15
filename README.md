# VisionForgeX for React Native

Ads for React Native apps monetized with [VisionForgeX](https://apps.visionforgex.com): Google Ad Manager demand (Google Ad
Exchange) through your VisionForgeX account. A thin package over the native VisionForgeX SDKs; **every decision**
(pacing, floors, refresh, preloading, consent, experiments) is made on the platform and changes without an app update.

Needs a React Native app with native modules (not Expo Go; Expo works with a development build).

## Add it

```sh
npm install github:VisionForgeX/visionforgex-react-native#1.0.0
```

(Once the package is on npm this becomes `npm install @visionforgex/react-native-sdk`.)

**iOS**: until the native SDK is on CocoaPods' catalogue, add this line inside your app's target in `ios/Podfile`, then
`cd ios && pod install`:

```ruby
pod 'VisionForgeX', :git => 'https://github.com/VisionForgeX/visionforgex-ios-sdk.git', :tag => '1.2.0'
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

**Google's SDK on Android**: the package runs on Google's GMA Next-Gen SDK, which needs `compileSdkVersion = 35` or higher
in `android/build.gradle` (React Native 0.76 and later have it). To stay on Google Mobile Ads 25.x instead (Google retires it
on 30 Jun 2028), add `visionforgexEngine=gma` to `android/gradle.properties`.

**Older React Native (0.74 and earlier) on Android**: Google's ads library is built with a newer Kotlin than those versions
use. In `android/build.gradle` of your app add
`allprojects { tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach { kotlinOptions.freeCompilerArgs += ["-Xskip-metadata-version-check"] } }`
(or use a newer React Native).

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

1.0.0 is released on GitHub (15 Nov 2026). Its TypeScript layer is tested; the Android and iOS modules are built by this repository's CI on every push.
