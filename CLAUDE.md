# Working on the VisionForgeX package for React Native

A thin package over the native VisionForgeX SDKs (`VisionForgeX/visionforgex-android-sdk`, `VisionForgeX/visionforgex-ios-sdk`).
This repository is **public** and holds only what runs inside an app. It makes **no decision**: pacing, floors, refresh,
consent tags and experiments all live on the platform (private repository `VisionForgeX/visionforgex-apps`) and arrive
through the native SDKs. If a feature needs a decision, it is built there, not here.

## Rules
- **Push after every change**, with a CHANGELOG line; tag releases (`1.0.0`); `npm publish` is the owner's step.
- Keep the TypeScript API compatible within a major version. Mirror the native SDKs' names and the reason strings of
  `docs/PROTOCOL.md` (in the native repositories).
- The method names, the `vfx` event and its payload keys are a contract between `src/native.ts`, the Kotlin module
  (`android/`) and the Swift module (`ios/`): change all three together.
- **Test what you change.** `npm run typecheck && npm test && npm run build` run anywhere and test the TypeScript layer
  against a mock. The native modules are only compiled by CI (Android and iOS builds of the example). Never report a pass
  you did not watch: Claude's workspace has no Swift, Xcode or Android build for this package, so native code written
  there is "not compiled" until CI is green.
- Publisher-facing wording says VisionForgeX and support@visionforgex.com.
