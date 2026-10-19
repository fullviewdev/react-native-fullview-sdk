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

/**
 * Who the customer is, shaped like the web SDK's `$fvIdentity` so an app that uses both does not
 * have to learn two vocabularies.
 *
 * There is deliberately no device id. The backend owns it - it resolves its own cookie first and
 * mints one otherwise, and the native SDKs keep that across launches - so an app passing one could
 * only ever disagree with the system of record.
 */
/** Which workspace this app belongs to, and where it lives. */
export type FullviewInit = {
  /** The region your Fullview workspace is in. */
  region: FullviewRegion;
  organisationId: string;
};

export type FullviewIdentity = {
  /** Your own id for this customer. The web SDK calls this `id`. */
  id: string;
  name?: string;
  email?: string;
  /** Whether you could not name this customer. */
  isAnonymous?: boolean;
  /** Which deployment they are in - "production", "staging". Used to decide who is recorded. */
  env?: string;
  /** Their roles, used the same way. */
  roles?: string[];
  /**
   * Opts this customer out of session replay entirely, the same flag the web SDK's identity
   * carries. Does not affect a live session with an agent.
   */
  disableReplaysForUser?: boolean;
  /**
   * Records only while the device is on wifi. Mobile-only, and off by default: a frame is ~10 KB
   * and a static screen sends nothing, so an hour of normal use costs ~36 MB at most. A live
   * session with an agent is never subject to it.
   */
  recordWifiOnly?: boolean;
};

export type FullviewSdkType = {
  /**
   * Starts the SDK and names the workspace it belongs to. Call it once, as early as possible
   * after the app mounts, before anything else here.
   *
   * The web SDK carries this on its script tag; a phone has no script tag, so it is said here.
   */
  init(config: FullviewInit): Promise<void>;
  /** Identifies the customer. Call `init()` first. */
  registerCustomer(identity: FullviewIdentity): Promise<void>;
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
  init: async ({ region, organisationId }) => {
    // Patched here rather than at registerCustomer: a request the app makes before anyone signs in
    // belongs in the recording that follows, and `observeNetwork` only reports while something is
    // being recorded anyway. Calling init twice does not stack two patches.
    observeNetwork((payload) => {
      native.recordNetworkRequest(payload).catch((error: unknown) => {
        reportNetworkBridgeFailure(error);
      });
    });
    await native.configure(region, organisationId);
  },
  registerCustomer: (identity) =>
    native.registerCustomer(
      identity.id,
      identity.name ?? '',
      identity.email ?? '',
      identity.isAnonymous ?? false,
      identity.env ?? null,
      identity.roles ?? [],
      identity.recordWifiOnly ?? false,
      identity.disableReplaysForUser ?? false
    ),
  setScreen: (name) => native.setScreen(name),
  logout: () => native.logout(),
  requestCoBrowse: () => native.requestCoBrowse(),
  cancelCoBrowseRequest: () => native.cancelCoBrowseRequest(),
  getPositionInCoBrowseQueue: () => native.getPositionInCoBrowseQueue(),
  getState: () => native.getState().then(toFullviewState),
};

export default FullviewSdkModule;
