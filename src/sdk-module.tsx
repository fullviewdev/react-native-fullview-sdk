import { Platform } from 'react-native';
import NativeFullviewSdk, { type Spec } from './NativeFullviewSdk';
import FullviewState from './fullview-sdk-state';
import type FullviewRegion from './fullview-sdk-region';
import { observeNetwork } from './network-observer';

/**
 * Whether this is Expo Go, Expo's prebuilt sandbox app from the store.
 *
 * It matters because it is the one cause of a missing native module that nothing the developer
 * does to their project can fix. Expo Go's native half was compiled by Expo and contains only the
 * Expo SDK's own libraries; this package ships a compiled xcframework and an AAR, and native code
 * cannot be added to an app that is already built. Every third-party native library is in the same
 * position, and the answer is always a development build.
 *
 * `expo` is an optional peer dependency, so a bare React Native app does not have it to ask. A
 * require() in a try is the only way to put the question without making the dependency a real one.
 */
const isRunningInExpoGo = (): boolean => {
  try {
    const expo = require('expo');
    return (
      typeof expo?.isRunningInExpoGo === 'function' && expo.isRunningInExpoGo()
    );
  } catch {
    return false;
  }
};

const EXPO_GO_ERROR =
  `Fullview cannot run in Expo Go.\n\n` +
  'Expo Go ships a fixed set of native libraries and this package brings its own, so it has to be\n' +
  'compiled into the app. Make a development build instead - the JavaScript workflow is unchanged:\n\n' +
  '  npx expo install @fullview/react-native-fullview-sdk\n' +
  '  npx expo prebuild\n' +
  '  npx expo run:ios   # or run:android, or an EAS build\n\n' +
  'Add the config plugin to app.json first: "plugins": ["@fullview/react-native-fullview-sdk"]\n';

const LINKING_ERROR =
  `The package '@fullview/react-native-fullview-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- The New Architecture is enabled (React Native 0.82+ only ships it)\n';

/** The reason the native module is missing, named as precisely as it can be. */
const missingNativeModuleError = () =>
  new Error(isRunningInExpoGo() ? EXPO_GO_ERROR : LINKING_ERROR);

/**
 * The bridge refusing an event must not become a warning per request, but it must not be silent
 * either: a native module that is too old to have the method would otherwise drop every request
 * with no sign at all.
 */
let networkBridgeFailureReported = false;
const reportNetworkBridgeFailure = (error: unknown) => {
  if (networkBridgeFailureReported) return;
  networkBridgeFailureReported = true;
  console.warn('[fullview] could not record a network request:', error);
};

const native: Spec =
  NativeFullviewSdk ??
  (new Proxy(
    {},
    {
      get() {
        throw missingNativeModuleError();
      },
    }
  ) as Spec);

export type FullviewSdkType = {
  attach(): Promise<void>;
  registerCustomer(
    region: FullviewRegion,
    organisationId: string,
    userId: string,
    /**
     * Optional. The backend owns the device id: it resolves it as its own cookie, then this
     * value, then a freshly minted id, and the native SDKs keep the cookie across launches. Pass
     * one only to carry over an id the app already persists; on iOS it has to be a UUID string.
     */
    deviceId: string | null | undefined,
    name: string,
    email: string,
    /**
     * Options.
     *
     * `recordWifiOnly` records sessions only while the device is on wifi; it is off by default,
     * because a frame is ~10 KB and a static screen sends nothing, so an hour of normal use costs
     * ~36 MB at most.
     *
     * `disableReplaysForUser` opts this user out of session replay entirely, the same flag the web
     * SDK passes in its identity. Neither affects a live session with an agent.
     */
    options?: { recordWifiOnly?: boolean; disableReplaysForUser?: boolean }
  ): Promise<void>;
  /**
   * Records that the app has moved to another screen, so the session timeline reads like a web
   * one: "Visited Checkout" beside the taps that got there.
   *
   * It has to be called, because nothing native can see it. A React Native app draws every
   * screen inside one activity and one view controller, so navigating from Dashboard to Invoices
   * changes nothing the SDK could observe. Wire it to your navigator once - with React
   * Navigation that is `onStateChange` - and every screen is reported from then on.
   *
   * The name is whatever an agent should read, not a route path or a component name: "Checkout",
   * not "CheckoutScreen" or "/checkout/:id".
   *
   * Safe to call at any time. Before `registerCustomer`, after `logout`, or while nothing is
   * being recorded, it does nothing rather than failing.
   */
  setScreen(name: string): Promise<void>;
  logout(): Promise<void>;
  requestCoBrowse(): Promise<void>;
  cancelCoBrowseRequest(): Promise<void>;
  getPositionInCoBrowseQueue(): Promise<number>;
  getState(): Promise<FullviewState>;
};

/** Maps the native state string (shared by iOS and Android) to the public enum. */
export function toFullviewState(nativeState: string): FullviewState {
  switch (nativeState) {
    case 'CO_BROWSE_ACTIVE':
      return FullviewState.Active;
    case 'CO_BROWSE_INVITATION':
      return FullviewState.Invitation;
    case 'CO_BROWSE_REQUESTED':
      return FullviewState.CoBrowseRequested;
    default:
      return FullviewState.Idle;
  }
}

const FullviewSdkModule: FullviewSdkType = {
  attach: async () => {
    // Patched here rather than at registerCustomer: a request the app makes before anyone signs in
    // belongs in the recording that follows, and `observeNetwork` only reports while something is
    // being recorded anyway. Calling attach twice does not stack two patches.
    observeNetwork((payload) => {
      native.recordNetworkRequest(payload).catch((error: unknown) => {
        reportNetworkBridgeFailure(error);
      });
    });
    await native.attach();
  },
  registerCustomer: (
    region,
    organisationId,
    userId,
    deviceId,
    name,
    email,
    options
  ) =>
    native.registerCustomer(
      region,
      organisationId,
      userId,
      deviceId ?? null,
      name,
      email,
      options?.recordWifiOnly ?? false,
      options?.disableReplaysForUser ?? false
    ),
  setScreen: (name) => native.setScreen(name),
  logout: () => native.logout(),
  requestCoBrowse: () => native.requestCoBrowse(),
  cancelCoBrowseRequest: () => native.cancelCoBrowseRequest(),
  getPositionInCoBrowseQueue: () => native.getPositionInCoBrowseQueue(),
  getState: () => native.getState().then(toFullviewState),
};

export default FullviewSdkModule;
