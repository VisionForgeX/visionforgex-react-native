import { NativeModules, emitNative, listenerCount } from '../test-support/rn-mock';
import { VisionForgeX } from '../src';

const native = {
  initialize: jest.fn(),
  isReady: jest.fn(),
  fullScreenReady: jest.fn(),
  load: jest.fn(),
  show: jest.fn(),
  preloadAll: jest.fn(),
  setKeyValue: jest.fn(),
  isPrivacyOptionsRequired: jest.fn(),
  showPrivacyOptions: jest.fn(),
  setMuted: jest.fn(),
  openAdInspector: jest.fn(),
  settingsSource: jest.fn(),
  flush: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

beforeEach(() => {
  Object.values(native).forEach((f) => f.mockReset());
  NativeModules.VisionForgeXModule = native;
});

test('initialize passes the key and the options and returns the status', async () => {
  native.initialize.mockResolvedValue({ ready: true, reason: '', fromCache: false });
  const st = await VisionForgeX.initialize('vfx_key', { autoPreload: false, logLevel: 'debug' });
  expect(st).toEqual({ ready: true, reason: '', fromCache: false });
  expect(native.initialize).toHaveBeenCalledWith('vfx_key', { autoPreload: false, logLevel: 'debug' });
});

test('show says why nothing was shown', async () => {
  native.show.mockResolvedValue({ shown: false, reason: 'interval' });
  const r = await VisionForgeX.interstitial('level_complete').show();
  expect(r).toEqual({ shown: false, reason: 'interval' });
  const [placement, format, id] = native.show.mock.calls[0];
  expect([placement, format]).toEqual(['level_complete', 'interstitial']);
  expect(typeof id).toBe('number');
});

test('a reward reaches the app once, only for its own show call, and the listener is removed afterwards', async () => {
  let finish!: (v: { shown: boolean; reason: null }) => void;
  native.show.mockImplementation(() => new Promise((res) => { finish = res; }));
  const rewards: string[] = [];
  const before = listenerCount('vfx');
  const p = VisionForgeX.rewarded('extra_life').show({ onReward: (t, n) => rewards.push(`${t}:${n}`) });
  const id = native.show.mock.calls[0][2];
  emitNative('vfx', { kind: 'show', id, event: 'reward', type: 'coins', amount: 5 });
  emitNative('vfx', { kind: 'show', id: id + 1000, event: 'reward', type: 'other', amount: 1 });
  emitNative('vfx', { kind: 'event', type: 'fill' });
  finish({ shown: true, reason: null });
  const r = await p;
  expect(rewards).toEqual(['coins:5']);
  expect(r).toEqual({ shown: true, reason: undefined });
  expect(listenerCount('vfx')).toBe(before);
});

test('shown and clicked callbacks', async () => {
  native.show.mockResolvedValue({ shown: true });
  const seen: string[] = [];
  const p = VisionForgeX.interstitial('a').show({ onShown: () => seen.push('shown'), onClicked: () => seen.push('clicked') });
  const id = native.show.mock.calls[0][2];
  emitNative('vfx', { kind: 'show', id, event: 'shown' });
  emitNative('vfx', { kind: 'show', id, event: 'clicked' });
  await p;
  expect(seen).toEqual(['shown', 'clicked']);
});

test('revenue and events arrive as typed values, and stop when removed', () => {
  const revenue: unknown[] = [];
  const events: unknown[] = [];
  const a = VisionForgeX.onRevenue((r) => revenue.push(r));
  const b = VisionForgeX.onEvent((e) => events.push(e));
  emitNative('vfx', { kind: 'revenue', placement: 'lv', format: 'interstitial', valueMicros: 4210, currency: 'USD', precision: 'PRECISE', source: 'Google AdMob' });
  emitNative('vfx', { kind: 'event', type: 'fill', placement: 'lv', format: 'interstitial', time: 1, details: { tier: 1 } });
  expect(revenue).toEqual([{ placement: 'lv', format: 'interstitial', valueMicros: 4210, currency: 'USD', precision: 'PRECISE', source: 'Google AdMob' }]);
  expect(events).toEqual([{ type: 'fill', placement: 'lv', format: 'interstitial', details: { tier: 1 }, time: 1 }]);
  a.remove(); b.remove();
  emitNative('vfx', { kind: 'revenue', placement: 'x', valueMicros: 1 });
  expect(revenue.length).toBe(1);
});

test('the small calls go to the native side', async () => {
  native.isReady.mockResolvedValue(true);
  expect(await VisionForgeX.isReady()).toBe(true);
  await VisionForgeX.setKeyValue('level', '12');
  await VisionForgeX.setKeyValue('level', null);
  expect(native.setKeyValue.mock.calls).toEqual([['level', '12'], ['level', null]]);
  await VisionForgeX.setMuted(true);
  expect(native.setMuted).toHaveBeenCalledWith(true);
});

test('a missing native module gives an error that says what to do', () => {
  delete NativeModules.VisionForgeXModule;
  expect(() => VisionForgeX.isReady()).toThrow(/not linked/);
});
