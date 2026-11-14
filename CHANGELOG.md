# Changelog

## 1.0.0 (not released)
On the native SDKs 1.2.0. **Android runs on Google's GMA Next-Gen SDK by default** (Google's preferred Android SDK; the app's
compileSdk must be 35 or higher); `visionforgexEngine=gma` in the app's `android/gradle.properties` keeps Google Mobile Ads
25.x (retired by Google on 30 Jun 2028). The app's code is the same either way. iOS: Google Mobile Ads 13 (Xcode 16).
Android: the module reads dependencies built with a newer Kotlin than React Native 0.74 brings (`-Xskip-metadata-version-check`); found by the first CI run.
First version. A thin bridge over the VisionForgeX SDKs: Android 1.0.2 (JitPack) and iOS 1.0.0 (CocoaPods). Every decision is made by the platform.
- `VisionForgeX.initialize`, `interstitial`, `rewarded`, `rewardedInterstitial`, `appOpen` with `show()` returning why nothing was shown, `setKeyValue`, consent (`isPrivacyOptionsRequired`, `showPrivacyOptions`), `onEvent` and `onRevenue` subscriptions, `VfxBanner` component.
- Not in 1.0.0: native ads, the debug panel.
- The TypeScript layer is tested (7 tests against a mock). The Kotlin and Swift modules were written without an Android or iOS build: the first CI run is their first compile.
