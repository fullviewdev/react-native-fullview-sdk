# @fullview/react-native-fullview-sdk

Fullview for React Native: session replay and live support sessions — screen sharing, camera, agent
cursor and highlights — with data redaction, on iOS and Android.

The native iOS and Android libraries ship inside this package, so there is nothing to add to your
`Podfile` or your Gradle files beyond installing it.

## Requirements

- React Native **0.81 or newer**, with the **New Architecture** enabled — the default from Expo SDK
  54 and React Native 0.82 onwards. Tested on 0.81.5 and 0.87.
- iOS **15.1+**, Swift projects (the default for React Native).
- Android **minSdk 27**, **compileSdk 36 or newer**, Kotlin 2.x.
- Expo: **SDK 54 or newer**, built with EAS Build or `expo run`. Expo Go cannot run this package —
  see [Expo](#expo).

If your app already embeds the Daily WebRTC client (`co.daily:client`, or the `Daily` pod), it must
be on the same major version as this package (0.40.x).

## Install

```sh
npm install @fullview/react-native-fullview-sdk
cd ios && pod install
```

Rebuild the app afterwards — a JavaScript reload is not enough, because the package brings native
code with it.

### Expo

```sh
npx expo install @fullview/react-native-fullview-sdk
```

Add the config plugin to `app.json`, then rebuild the development client:

```json
{
  "expo": {
    "plugins": ["@fullview/react-native-fullview-sdk"]
  }
}
```

```sh
npx expo prebuild
npx expo run:ios      # or run:android
```

With **EAS Build** there is nothing further to do: `eas build` runs prebuild on the build server, so
adding the plugin and building is enough.

The plugin writes the camera and microphone usage descriptions and the `voip` background mode into
`Info.plist`. Android needs nothing: the bundled library's manifest merges its own permissions.

**If `ios/` and `android/` are committed to your repository**, the plugin will not run — config
plugins only apply during prebuild, and a project with native directories already in place skips
it. Either run `npx expo prebuild --clean` to regenerate them, or add the three keys listed under
[Bare React Native, iOS](#bare-react-native-ios) to `Info.plist` yourself.

Override the wording, or opt out of any of it:

```json
{
  "plugins": [
    ["@fullview/react-native-fullview-sdk", {
      "cameraPermission": "Used so a support agent can see your camera.",
      "microphonePermission": "Used so you can talk to a support agent.",
      "voipBackgroundMode": false
    }]
  ]
}
```

Passing `false` for `cameraPermission` or `microphonePermission` leaves `Info.plist` untouched for
that key, for an app that sets its own.

### Which Expo SDK

The requirement is React Native 0.81 with the New Architecture, which is Expo SDK 54 (released
September 2025) — that is the first SDK where the New Architecture is on by default:

| Expo SDK | React Native | |
|---|---|---|
| 53 and below | 0.79 and below | not supported |
| 54 | 0.81 | supported, verified |
| 55 | 0.83 | supported |
| 56 | 0.85 | supported |
| 57 | 0.86 | supported, verified |

On Expo SDK 54 npm will complain that the package wants a newer React Native if your lockfile was
built against an older range; `npm install --legacy-peer-deps` is not needed from 0.13.0 onwards.


**Expo Go is not supported, and cannot be.** It is a prebuilt app from the store carrying only the
Expo SDK's own native libraries, and this package brings its own compiled code, which has to be
built into the app. That is true of every third-party native library. Running in Expo Go throws an
error saying so.

### Bare React Native, iOS

Add to your app's `Info.plist` if they are not already there:

- `NSCameraUsageDescription`
- `NSMicrophoneUsageDescription`
- `UIBackgroundModes` containing `voip`

## Usage

```ts
import FullviewSDK, { FullviewRegion } from '@fullview/react-native-fullview-sdk';

// As early as possible after the app mounts. Required on Android, a no-op on iOS.
await FullviewSDK.attach();

await FullviewSDK.registerCustomer(
  FullviewRegion.EU1,   // or EU2 / US1, matching your Fullview workspace
  '<organisationId>',
  '<userId>',
  null,                 // deviceId: optional, see below
  '<name>',
  '<email>'
);
```

`attach()` before `registerCustomer()`: attaching starts watching the app's HTTP requests, and a request
made before anybody signs in still belongs in the recording that follows.

Call `FullviewSDK.logout()` to disconnect and disable the SDK.

**The device id is optional.** Fullview assigns one on the first registration and the SDK keeps it
across launches, so pass `null` unless your app already persists a stable UUID per install that you
want Fullview to use. On iOS a provided value must be a UUID string.

### Reporting screens

Fullview records what the customer sees and what they tapped, but it cannot tell which *screen*
they were on: React Native draws every screen inside the one activity and view controller the
platform gives the app, so navigating from one to another changes nothing the SDK can observe.

Tell it, and the session timeline reads like a web one — "Visited Checkout" beside the taps that
got there, and the screens become searchable across sessions.

```ts
await FullviewSDK.setScreen('Checkout');
```

Wire it to your navigator once and every screen is reported from then on. With React Navigation:

```tsx
<NavigationContainer
  onStateChange={(state) => {
    const route = state && state.routes[state.index];
    if (route) FullviewSDK.setScreen(route.name);
  }}
>
```

**Send the name an agent should read**, not a route path or a component name — `Checkout`, not
`CheckoutScreen` or `/checkout/:id`. Include a record number where it helps a support agent
(`Invoice #1042`) and leave it out where it would only fill the timeline with values nobody can
search for; that judgement is yours, not the SDK's.

Safe to call at any time. Before `registerCustomer`, after `logout`, or while nothing is being
recorded, it does nothing rather than failing — so you never have to guard the call.

### Live support

```ts
await FullviewSDK.requestCoBrowse();              // ask for an agent
await FullviewSDK.getPositionInCoBrowseQueue();   // 0 when nobody is ahead
await FullviewSDK.cancelCoBrowseRequest();
const state = await FullviewSDK.getState();       // FullviewState
```

`FullviewState` is `Idle`, `CoBrowseRequested`, `Invitation` or `Active`.

### Options

```ts
await FullviewSDK.registerCustomer(region, orgId, userId, null, name, email, {
  recordWifiOnly: true,       // default false
  disableReplaysForUser: true // default false
});
```

`recordWifiOnly` records only while the device is on wifi. `disableReplaysForUser` opts this user
out of session replay entirely — the same flag the web SDK sends in its identity. **Neither affects
a live support session with an agent.**

## API

| Method | Description |
|---|---|
| `attach(): Promise<void>` | Attaches the SDK to the host activity. Call once on start. |
| `registerCustomer(region, organisationId, userId, deviceId, name, email, options?): Promise<void>` | Identifies the user with Fullview. `deviceId` may be `null`; `options.recordWifiOnly` records only on wifi, `options.disableReplaysForUser` opts the user out of replay. |
| `setScreen(name): Promise<void>` | Records that the app moved to another screen. Call it from your navigator; see [Reporting screens](#reporting-screens). |
| `logout(): Promise<void>` | Logs the user out. |
| `requestCoBrowse(): Promise<void>` | Puts the user in the support queue. |
| `cancelCoBrowseRequest(): Promise<void>` | Removes the user from the queue. |
| `getPositionInCoBrowseQueue(): Promise<number>` | Queue position, 0 when not queued. |
| `getState(): Promise<FullviewState>` | `Idle`, `Invitation`, `Active` or `CoBrowseRequested`. |

## Hiding sensitive content

Wrap anything that must never reach a support agent. The content is masked in every frame the SDK
captures, live or recorded.

```tsx
import { DataRedaction } from '@fullview/react-native-fullview-sdk';

<DataRedaction>
  <Text>{account.iban}</Text>
</DataRedaction>
```

Text inputs are never read for anything else either: a tap on a field is recorded as a tap, never
with what is in it. More in
[data_redaction.md](https://github.com/fullviewdev/react-native-fullview-sdk/blob/main/data_redaction.md).

## What is recorded

Once a user is registered, the SDK records what they do so the session can be replayed from the
Fullview dashboard.

- **The screen**, as compressed frames: about one a second while something changes, and nothing at
  all while the screen is still. Roughly 10–15 KB a frame, so an hour of continuous use is about
  36 MB at the very most.
- **Taps**, with the label of the control that was pressed where it can be read, and never the
  contents of a text field or of anything inside `DataRedaction`.
- **HTTP requests** the app makes through `fetch`, `XMLHttpRequest`, axios or anything built on
  them — method, URL, status, duration and sizes. Credential-bearing headers such as
  `Authorization` and `Cookie` are redacted on the device, before anything is sent.

Requests made by native modules on their own, image loading and WebSocket traffic do not pass
through JavaScript and are not recorded.

Recording follows the customer: it runs while they have touched the screen in the last minute and
stops when they put the phone down, so a screen nobody is using costs nothing. After five idle
minutes the SDK closes its connection so the radio can sleep, and opens it again on the next touch.

Your Fullview workspace decides whether sessions are kept at all, and the SDK honours that answer
as soon as it connects. **A live support session is never affected by any of this:** while an agent
is watching, the screen is sent whatever the recording settings say.

## Screen sharing outside the app (iOS)

Sharing the whole device screen, including other apps, needs a Broadcast Upload Extension in your
app. See
[screen_share.md](https://github.com/fullviewdev/react-native-fullview-sdk/blob/main/screen_share.md).

## Testing with Jest

The native module is resolved at import time. Mock it in your test setup:

```js
jest.mock('@fullview/react-native-fullview-sdk/src/NativeFullviewSdk', () => ({
  __esModule: true,
  default: {
    attach: jest.fn(() => Promise.resolve()),
    registerCustomer: jest.fn(() => Promise.resolve()),
    logout: jest.fn(() => Promise.resolve()),
    requestCoBrowse: jest.fn(() => Promise.resolve()),
    cancelCoBrowseRequest: jest.fn(() => Promise.resolve()),
    getPositionInCoBrowseQueue: jest.fn(() => Promise.resolve(0)),
    getState: jest.fn(() => Promise.resolve('IDLE')),
  },
}));
```

## Upgrading from 0.12

- **`register()` is now `registerCustomer()`.** Same arguments, same behaviour. The name had to
  change: `register` is a reserved word in C++, and React Native's New Architecture code generator
  emits C++ from the module definition, so a method called `register` cannot compile on 0.81.
- **New: [`setScreen()`](#reporting-screens)**, so the session timeline says which screen the
  customer was on. Nothing breaks without it; the timeline is simply quieter.
- The package is New Architecture only. Legacy-architecture apps must stay on 0.12.
- `DataRedaction` is unchanged. Do not import `NativeModules.FullviewSdk` or
  `requireNativeComponent('DataRedactionView')` directly.
- The `Daily` and `DailySystemBroadcast` pods are pulled in by this package; remove any explicit
  pins from your `Podfile`.

## Troubleshooting

**`Fullview cannot run in Expo Go`** — exactly what it says. Make a development build; see
[Expo](#expo).

**`The package … doesn't seem to be linked`** — the native module is missing. Run `pod install`,
rebuild the app rather than reloading the JavaScript, and check the New Architecture is on.

**Nothing appears in the dashboard** — session replay has to be enabled for your organisation, and
mobile replay is a separate switch from web. Check with your Fullview contact before debugging the
app.

## License

See [LICENSE](./LICENSE).
