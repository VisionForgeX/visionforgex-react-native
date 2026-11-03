# Changelog

## 1.0.0 (not released)
First version. A thin bridge over the VisionForgeX SDKs: Android 1.0.2 (JitPack) and iOS 1.0.0 (CocoaPods). Every decision is made by the platform.
- `VisionForgeX.initialize`, `interstitial`, `rewarded`, `rewardedInterstitial`, `appOpen` with `show()` returning why nothing was shown, `setKeyValue`, consent (`isPrivacyOptionsRequired`, `showPrivacyOptions`), `onEvent` and `onRevenue` subscriptions, `VfxBanner` component.
- Not in 1.0.0: native ads, the debug panel.
- The TypeScript layer is tested (7 tests against a mock). The Kotlin and Swift modules were written without an Android or iOS build: the first CI run is their first compile.
