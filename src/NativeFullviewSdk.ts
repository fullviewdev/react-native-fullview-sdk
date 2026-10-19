import { TurboModuleRegistry, type TurboModule } from 'react-native';

/**
 * Codegen spec for the native module. Keep the method names in sync with the
 * iOS (ios/FullviewSdk.mm) and Android (FullviewSdkModule.kt) implementations;
 * React Native generates the native interfaces from this file.
 */
export interface Spec extends TurboModule {
  // `configure`, not `init`: codegen turns this name into an Objective-C selector, and a
  // void-returning method in the `init` family is a compile error under ARC. The public API calls
  // it `init` - see sdk-module.tsx - the same way registerCustomer renames the native `register`.
  configure(region: string, organisationId: string): Promise<void>;
  // Flat arguments rather than the object the public API takes, because codegen generates a C++
  // interface from this file and an object there costs a struct on both platforms for nothing.
  // `roles` is always an array; empty means none.
  registerCustomer(
    userId: string,
    name: string,
    email: string,
    isAnonymous: boolean,
    env: string | null,
    roles: ReadonlyArray<string>,
    recordWifiOnly: boolean,
    disableReplaysForUser: boolean
  ): Promise<void>;
  logout(): Promise<void>;
  requestCoBrowse(): Promise<void>;
  cancelCoBrowseRequest(): Promise<void>;
  getPositionInCoBrowseQueue(): Promise<number>;
  getState(): Promise<string>;
  recordNetworkRequest(payload: string): Promise<void>;
  setScreen(name: string): Promise<void>;
}

// `get`, not `getEnforcing`: a missing native module surfaces as a clear
// LINKING_ERROR on first use (see sdk-module.tsx) instead of throwing at import
// time, which keeps consumer Jest suites that import the package working.
export default TurboModuleRegistry.get<Spec>('FullviewSdk');
