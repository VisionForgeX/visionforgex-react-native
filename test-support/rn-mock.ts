// A stand-in for react-native in the tests: the native module is a set of jest functions, and the emitter lets a test send events.
type Listener = (e: unknown) => void;
const listeners = new Map<string, Set<Listener>>();

export const NativeModules: Record<string, unknown> = {};

export class NativeEventEmitter {
  constructor(_module?: unknown) {}
  addListener(name: string, f: Listener) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name)!.add(f);
    return { remove: () => { listeners.get(name)?.delete(f); } };
  }
}

export const Platform = { OS: 'ios' };
export const View = 'View';
export function requireNativeComponent(name: string) { return name; }

/** Test helper: the native side sends an event. */
export function emitNative(name: string, payload: unknown) {
  listeners.get(name)?.forEach((f) => f(payload));
}
export function listenerCount(name: string) { return listeners.get(name)?.size ?? 0; }
