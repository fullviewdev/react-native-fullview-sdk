# React Native Developer Documentation

**Current version:** 0.13.0-rc.1

The Fullview React Native SDK brings live support meetings (screen sharing, camera, agent cursor and highlights) and data redaction to React Native apps on iOS and Android. The native iOS and Android libraries ship inside this package, so there is nothing to add to your Podfile or Gradle files beyond installing the package.

## Requirements

- React Native **0.82 or newer** with the New Architecture (the only architecture those versions ship). Tested on 0.87.
- iOS **15.1+**, Swift projects (the default for React Native).
- Android **minSdk 27**, **compileSdk 36 or newer**, Kotlin 2.x.
- Expo: a **development build** (Expo Go is not supported because the package contains native code). SDK 57 or newer.

If your app already embeds the Daily WebRTC client (`co.daily:client` or the `Daily` pod), it must be on the same major version as this package (0.40.x).

## Installation

```sh
npm install @fullview/react-native-fullview-sdk
cd ios && pod install
```

### Expo

```sh
npx expo install @fullview/react-native-fullview-sdk
```

Add the config plugin to `app.json` and rebuild the development client. The plugin writes the camera and microphone usage descriptions and the `voip` background mode into `Info.plist`; Android needs nothing.

```json
{
  "expo": {
    "plugins": [
      [
        "@fullview/react-native-fullview-sdk",
        {
          "cameraPermission": "This app uses the camera during live support sessions.",
          "microphonePermission": "This app uses the microphone during live support sessions."
        }
      ]
    ]
  }
}
```

### Bare React Native, iOS

Add to your app's `Info.plist` if not already present:

- `NSMicrophoneUsageDescription`
- `NSCameraUsageDescription`
- `UIBackgroundModes` containing `voip`

## Usage

```ts
import FullviewSDK, { FullviewRegion } from '@fullview/react-native-fullview-sdk';

// As early as possible after the app mounts (required on Android, no-op on iOS).
await FullviewSDK.attach();

await FullviewSDK.register(
  FullviewRegion.EU1,   // or EU2 / US1, matching your Fullview workspace
  '<organisationId>',
  '<userId>',
  '<deviceId>',         // a stable UUID for this install
  '<name>',
  '<email>'
);
```

Call `FullviewSDK.logout()` to disconnect and disable the SDK.

## API

| Method | Description |
|---|---|
| `attach(): Promise<void>` | Attaches the SDK to the host activity. Call once on start. |
| `register(region, organisationId, userId, deviceId, name, email): Promise<void>` | Identifies the user with Fullview. |
| `logout(): Promise<void>` | Logs the user out. |
| `requestCoBrowse(): Promise<void>` | Puts the user in the support queue. |
| `cancelCoBrowseRequest(): Promise<void>` | Removes the user from the queue. |
| `getPositionInCoBrowseQueue(): Promise<number>` | Queue position, 0 when not queued. |
| `getState(): Promise<FullviewState>` | `Idle`, `Invitation`, `Active` or `CoBrowseRequested`. |

## Data redaction

Wrap anything that must never reach a support agent. The wrapped content is masked in every frame the SDK captures.

```tsx
import { DataRedaction } from '@fullview/react-native-fullview-sdk';

<DataRedaction>
  <Text>Card number</Text>
</DataRedaction>
```

## Screen sharing outside the app (iOS)

Sharing the whole device screen, including other apps, needs a Broadcast Upload Extension in your app. See [screen_share.md](screen_share.md).

## Testing with Jest

The native module is resolved at import time. Mock it in your test setup:

```js
jest.mock('@fullview/react-native-fullview-sdk/src/NativeFullviewSdk', () => ({
  __esModule: true,
  default: {
    attach: jest.fn(() => Promise.resolve()),
    register: jest.fn(() => Promise.resolve()),
    logout: jest.fn(() => Promise.resolve()),
    requestCoBrowse: jest.fn(() => Promise.resolve()),
    cancelCoBrowseRequest: jest.fn(() => Promise.resolve()),
    getPositionInCoBrowseQueue: jest.fn(() => Promise.resolve(0)),
    getState: jest.fn(() => Promise.resolve('IDLE')),
  },
}));
```

## Upgrading from 0.12

- The package is New Architecture only. Legacy-architecture apps must stay on 0.12.
- `FullviewSDK` and `DataRedaction` keep the same API. Do not import `NativeModules.FullviewSdk` or `requireNativeComponent('DataRedactionView')` directly.
- The `Daily` and `DailySystemBroadcast` pods are pulled in by this package; remove any explicit pins from your Podfile.
