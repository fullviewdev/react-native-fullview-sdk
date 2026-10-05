import { TurboModuleRegistry, type TurboModule } from 'react-native';

/**
 * Codegen spec for the native module. Keep the method names in sync with the
 * iOS (ios/FullviewSdk.mm) and Android (FullviewSdkModule.kt) implementations;
 * React Native generates the native interfaces from this file.
 */
export interface Spec extends TurboModule {
  attach(): Promise<void>;
  register(
    region: string,
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
  getState(): Promise<string>;
}

// `get`, not `getEnforcing`: a missing native module surfaces as a clear
// LINKING_ERROR on first use (see sdk-module.tsx) instead of throwing at import
// time, which keeps consumer Jest suites that import the package working.
export default TurboModuleRegistry.get<Spec>('FullviewSdk');
