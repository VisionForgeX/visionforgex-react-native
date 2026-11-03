import { EVENT_NAME, eventEmitter, nativeModule } from './native';
import type { VfxEvent, VfxFormat, VfxOptions, VfxRevenue, VfxShowCallbacks, VfxShowResult, VfxStatus } from './types';

type Payload = { kind: string; [k: string]: unknown };
type Subscription = { remove(): void };

let showId = 0;

function onNative(f: (p: Payload) => void): Subscription {
  return eventEmitter().addListener(EVENT_NAME, f as (e: unknown) => void) as Subscription;
}

/** One full-screen placement: `VisionForgeX.interstitial('level_complete')`. */
export class VfxFullScreen {
  constructor(readonly placement: string, readonly format: VfxFormat) {}

  /** An ad is loaded and fresh, so `show` will show it (if the pacing allows). */
  isReady(): Promise<boolean> {
    return nativeModule().fullScreenReady(this.placement, this.format);
  }

  /** Loads one if none is waiting (placements that preload do this by themselves). */
  load(): Promise<void> {
    return nativeModule().load(this.placement, this.format);
  }

  /**
   * Shows it if one is ready and the pacing allows. Resolves when the ad has been closed, or at once with the reason nothing
   * was shown; the app carries on either way. Safe to call at every opportunity: the platform's pacing decides.
   */
  async show(callbacks: VfxShowCallbacks = {}): Promise<VfxShowResult> {
    const id = ++showId;
    const sub = onNative((p) => {
      if (p.kind !== 'show' || p.id !== id) return;
      if (p.event === 'shown') callbacks.onShown?.();
      else if (p.event === 'clicked') callbacks.onClicked?.();
      else if (p.event === 'reward') callbacks.onReward?.(String(p.type ?? ''), Number(p.amount ?? 0));
    });
    try {
      const r = await nativeModule().show(this.placement, this.format, id);
      await Promise.resolve(); // let a reward event that raced the answer be delivered
      return { shown: !!r.shown, reason: r.reason ?? undefined };
    } finally {
      sub.remove();
    }
  }
}

/**
 * The VisionForgeX SDK. Start it once, as early as you can (before the first screen):
 *
 *     await VisionForgeX.initialize('vfx_…your app key…');
 *
 * Then show ads by placement name, as set on apps.visionforgex.com. Everything else (what each placement requests, how often,
 * when it may show, floors, consent, experiments) is decided by the platform.
 */
export const VisionForgeX = {
  /** This package's version. */
  version: '1.0.0',

  /** Starts the SDK; resolves when it is ready or has found out why it is not. Calling it again does nothing new. */
  initialize(appKey: string, options: VfxOptions = {}): Promise<VfxStatus> {
    eventEmitter(); // listen from the start
    return nativeModule().initialize(appKey, { ...options });
  },

  /** True once the SDK has settings that allow ads and consent allows requests. */
  isReady: (): Promise<boolean> => nativeModule().isReady(),

  interstitial: (placement: string) => new VfxFullScreen(placement, 'interstitial'),
  rewarded: (placement: string) => new VfxFullScreen(placement, 'rewarded'),
  rewardedInterstitial: (placement: string) => new VfxFullScreen(placement, 'rewarded_interstitial'),
  /** Shown by itself on return to the app when the platform turns that on; or call show(). */
  appOpen: (placement: string) => new VfxFullScreen(placement, 'app_open'),

  /** Loads every placement that preloads (only needed with `autoPreload: false`). */
  preloadAll: (): Promise<void> => nativeModule().preloadAll(),

  /**
   * A key-value of the app's own added to every request (e.g. "level" → "12"), for targeting and reports in Ad Manager.
   * Keys: lowercase letters, digits and _, at most 20; "vfx_" is ours. Null removes it.
   */
  setKeyValue: (key: string, value: string | null): Promise<void> => nativeModule().setKeyValue(key, value),

  /** Whether the app must offer a "Privacy options" button (users in the EEA, UK, Switzerland, some US states). */
  isPrivacyOptionsRequired: (): Promise<boolean> => nativeModule().isPrivacyOptionsRequired(),

  /** Opens Google's privacy options form. Resolves with an error message, or null. */
  showPrivacyOptions: (): Promise<string | null> => nativeModule().showPrivacyOptions(),

  /** Mutes video ads (the app's own sound setting). */
  setMuted: (muted: boolean): Promise<void> => nativeModule().setMuted(muted),

  /** Google's ad inspector, for checking a live build. */
  openAdInspector: (): Promise<void> => nativeModule().openAdInspector(),

  /** Where the settings came from: "platform", "cache", "testing", or "none". */
  settingsSource: (): Promise<string> => nativeModule().settingsSource(),

  /** Sends the events waiting now (they are sent by themselves too). */
  flush: (): Promise<void> => nativeModule().flush(),

  /** Every ad event as it happens. Returns a subscription: call `.remove()` to stop. */
  onEvent(f: (e: VfxEvent) => void): Subscription {
    return onNative((p) => {
      if (p.kind === 'event') f({ type: String(p.type), placement: String(p.placement), format: (p.format as VfxEvent['format']) ?? '', details: (p.details as Record<string, unknown>) ?? {}, time: Number(p.time ?? 0) });
    });
  },

  /** What each impression earned, for the app's own analytics. Returns a subscription: call `.remove()` to stop. */
  onRevenue(f: (r: VfxRevenue) => void): Subscription {
    return onNative((p) => {
      if (p.kind === 'revenue') {
        f({ placement: String(p.placement), format: (p.format as VfxRevenue['format']) ?? '', valueMicros: Number(p.valueMicros ?? 0), currency: String(p.currency ?? ''), precision: String(p.precision ?? ''), source: p.source == null ? undefined : String(p.source) });
      }
    });
  },
};
