/** The ad formats, as the platform names them. */
export type VfxFormat = 'banner' | 'interstitial' | 'rewarded' | 'rewarded_interstitial' | 'app_open' | 'native';

/** How much the SDK writes to the console. */
export type VfxLogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

/** Options for `VisionForgeX.initialize`. Everything that decides revenue comes from the platform; these are only for building and testing. */
export interface VfxOptions {
  /** Google test devices: their ads are test ads (the console prints the ID on the first request). */
  testDeviceIds?: string[];
  /** Console output; undefined: as the platform says. */
  logLevel?: VfxLogLevel;
  /** Show the consent form as if the device were in the EEA (testing only). */
  consentDebugEea?: boolean;
  consentTestDeviceHashedIds?: string[];
  /** The platform's address; only for testing against another server. */
  baseUrl?: string;
  /** Start loading as soon as the settings arrive (default true), or only when asked. */
  autoPreload?: boolean;
  /** Testing only: every format on Google's own demo ad units (nothing is sent anywhere). Never in a release. */
  googleDemoAds?: boolean;
  /** Testing only: these settings (the protocol's JSON) instead of the platform's. */
  settingsForTesting?: string;
}

/** What `initialize` found out. */
export interface VfxStatus {
  /** Ads may be shown: settings received, the app enabled, consent allows requests. */
  ready: boolean;
  /** Why not, when `ready` is false. */
  reason: string;
  /** Settings came from the cache (the platform was not reached). */
  fromCache: boolean;
}

/** Why nothing was shown: not_ready, paused, consent, interval, session, hour, day, grace, nth, gap, showing, failed, no_activity, unknown_placement. */
export interface VfxShowResult {
  /** An ad was shown (and has been closed by now). */
  shown: boolean;
  reason?: string;
}

export interface VfxShowCallbacks {
  /** Rewarded formats: the user earned the reward, before the ad is closed. */
  onReward?: (type: string, amount: number) => void;
  onShown?: () => void;
  onClicked?: () => void;
}

/** Every ad event as it happens: req, fill, nofill, show, click, close, fail, reward, paid, capped. */
export interface VfxEvent {
  type: string;
  placement: string;
  format: VfxFormat | '';
  /** The rest: tier, ms, err, why, src, and for "paid" v (micros), cur, prec. */
  details: Record<string, unknown>;
  time: number;
}

/** What one impression earned, as Google reported it (its paid event): for Firebase, AppsFlyer, Adjust. */
export interface VfxRevenue {
  placement: string;
  format: VfxFormat | '';
  /** Micros: 1,000,000 = one unit of `currency`. */
  valueMicros: number;
  currency: string;
  precision: string;
  source?: string;
}
