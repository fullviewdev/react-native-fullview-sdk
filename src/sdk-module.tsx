import { NativeModules, Platform } from 'react-native';
import FullviewState from './fullview-sdk-state';

const LINKING_ERROR =
  `The package 'react-native-fullview-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const FullviewSdk = NativeModules.FullviewSdk
  ? NativeModules.FullviewSdk
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

type FullviewSdkType = {
  attach(): Promise<void>;
  register(
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

const FullviewSdkModule: FullviewSdkType = {
  attach: () => {
    if (Platform.OS === 'android') {
      return FullviewSdk.attach();
    }
    return Promise.resolve();
  },
  register: (organisationId, userId, deviceId, name, email) =>
    FullviewSdk.register(organisationId, userId, deviceId, name, email),
  logout: () => FullviewSdk.logout(),
  requestCoBrowse: () => FullviewSdk.requestCoBrowse(),
  cancelCoBrowseRequest: () => FullviewSdk.cancelCoBrowseRequest(),
  getPositionInCoBrowseQueue: () => FullviewSdk.getPositionInCoBrowseQueue(),
  getState: function (): Promise<FullviewState> {
    return FullviewSdk.getState().then((className: String) => {
      let state: FullviewState;

      if (className == "CO_BROWSE_ACTIVE") {
        state = FullviewState.Active;
      } else if (className == "CO_BROWSE_INVITATION") {
        state = FullviewState.Invitation;
      } else if (className == "CO_BROWSE_REQUESTED") {
        state = FullviewState.CoBrowseRequested;
      } else {
        state = FullviewState.Idle;
      }

      return new Promise((resolve) => {
        resolve(state);
      });
    });
  },
};

export default FullviewSdkModule; 