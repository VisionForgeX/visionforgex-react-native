import { NativeEventEmitter, NativeModules } from 'react-native';

/** What the native modules offer (VisionForgeXModule in Kotlin and Swift). */
export interface NativeApi {
  initialize(appKey: string, options: Record<string, unknown>): Promise<{ ready: boolean; reason: string; fromCache: boolean }>;
  isReady(): Promise<boolean>;
  fullScreenReady(placement: string, format: string): Promise<boolean>;
  load(placement: string, format: string): Promise<void>;
  show(placement: string, format: string, id: number): Promise<{ shown: boolean; reason?: string | null }>;
  preloadAll(): Promise<void>;
  setKeyValue(key: string, value: string | null): Promise<void>;
  isPrivacyOptionsRequired(): Promise<boolean>;
  showPrivacyOptions(): Promise<string | null>;
  setMuted(muted: boolean): Promise<void>;
  openAdInspector(): Promise<void>;
  settingsSource(): Promise<string>;
  flush(): Promise<void>;
  addListener(name: string): void;
  removeListeners(count: number): void;
}

const LINKING_ERROR =
  "The VisionForgeX native module is not linked. Rebuild the app (iOS: run 'pod install' first) and do not use Expo Go.";

export function nativeModule(): NativeApi {
  const m = (NativeModules as { VisionForgeXModule?: NativeApi }).VisionForgeXModule;
  if (!m) throw new Error(LINKING_ERROR);
  return m;
}

let emitter: NativeEventEmitter | null = null;
export function eventEmitter(): NativeEventEmitter {
  if (!emitter) emitter = new NativeEventEmitter(nativeModule() as never);
  return emitter;
}

/** The one event name the native side emits on; the payload says what it is (`kind`). */
export const EVENT_NAME = 'vfx';
