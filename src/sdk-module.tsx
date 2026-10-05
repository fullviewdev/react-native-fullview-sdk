import { Platform } from 'react-native';
import NativeFullviewSdk, { type Spec } from './NativeFullviewSdk';
import FullviewState from './fullview-sdk-state';
import type FullviewRegion from './fullview-sdk-region';

const LINKING_ERROR =
  `The package '@fullview/react-native-fullview-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- The New Architecture is enabled (React Native 0.82+ only ships it)\n' +
  '- You are not using Expo Go\n';

const native: Spec =
  NativeFullviewSdk ??
  (new Proxy(
    {},
    {
      get() {
        throw new Error(LINKING_ERROR);
      },
    }
  ) as Spec);

export type FullviewSdkType = {
  attach(): Promise<void>;
  register(
    region: FullviewRegion,
    organisationId: string,
    userId: string,
    deviceId: string,
    name: string,
    email: string
  ): Promise<void>;
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
  attach: () => native.attach(),
  register: (region, organisationId, userId, deviceId, name, email) =>
    native.register(region, organisationId, userId, deviceId, name, email),
  logout: () => native.logout(),
  requestCoBrowse: () => native.requestCoBrowse(),
  cancelCoBrowseRequest: () => native.cancelCoBrowseRequest(),
  getPositionInCoBrowseQueue: () => native.getPositionInCoBrowseQueue(),
  getState: () => native.getState().then(toFullviewState),
};

export default FullviewSdkModule;
