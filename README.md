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

// Start the SDK and name your workspace. As early as possible after the app mounts.
await FullviewSDK.init({
  region: FullviewRegion.EU1,   // or EU2 / US1, matching your Fullview workspace
  organisationId: '<organisationId>',
});

// Who the customer is.
await FullviewSDK.registerCustomer({
  id: '<your id for this customer>',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
});
```

This mirrors the web SDK: `init()` carries what the script tag carries, and the identity object is
shaped like `$fvIdentity`, so an app using both does not have to learn two vocabularies.

`init()` must come first. It also starts watching the app's HTTP requests, and a request made
before anybody signs in still belongs in the recording that follows.

Call `FullviewSDK.logout()` to disconnect and disable the SDK.

**There is no device id to pass.** Fullview assigns one and the SDK keeps it across launches, so
an app has nothing to supply and nothing to keep in step.

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

### The rest of the identity

```ts
await FullviewSDK.registerCustomer({
  id: '<your id for this customer>',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  isAnonymous: false,          // you could not name this customer
  env: 'production',           // which deployment they are in
  roles: ['admin'],            // their roles
  disableReplaysForUser: true, // opt this customer out of replay entirely
  recordWifiOnly: true,        // record only on wifi
});
```

Every field but `id` is optional. `env` and `roles` are the same fields the web SDK's identity
carries, and the dashboard uses them to decide which customers are recorded.

`recordWifiOnly` is mobile-only and off by default: a frame is ~10 KB and a static screen sends
nothing, so an hour of normal use costs ~36 MB at most. **Neither it nor `disableReplaysForUser`
affects a live support session with an agent.**

## API

| Method | Description |
|---|---|
| `init({ region, organisationId }): Promise<void>` | Starts the SDK and names the workspace. Call once on start, before anything else. |
| `registerCustomer(identity): Promise<void>` | Identifies the customer. `identity.id` is required; `name`, `email`, `isAnonymous`, `env`, `roles`, `disableReplaysForUser` and `recordWifiOnly` are optional. |
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

### Video, maps and camera previews

**On Android, playing video does not reach the agent unless you ask for it.** Nor does a map, nor a
camera preview. The area arrives as a hatched rectangle captioned `not captured`, both in a replay
and in a live session, and everything around it is captured normally.

This is not a bug the SDK can fix, so it is worth a paragraph on why. Android gives a view two ways
to put pixels on the screen. Almost everything draws into the window, which is what the SDK
captures: it asks the view tree to draw itself into a bitmap. A `SurfaceView` does not — it owns a
separate layer that only the system compositor ever composites, and all it contributes to the
window is a transparent hole for that layer to show through. Video players, maps and camera
previews use one, because it is the cheaper and better way to show a stream of frames: hardware
decoding, accurate frame timing, HDR, and, on a DRM surface, a guarantee that nothing can screenshot
it. The SDK captures the window, so where the surface is, it has nothing at all, and the caption is
there to say so rather than hand an agent a plausible black rectangle.

**The fix is a prop, in your app.** A `TextureView` renders the same stream into the view tree
instead, where the capture can see it:

| Library | Set | |
|---|---|---|
| `react-native-video` | `viewType={ViewType.TEXTURE}` | Not available with DRM: `drm` forces a `SurfaceView`, and `ViewType.SURFACE_SECURE` blocks capture deliberately. |
| `react-native-vision-camera` | `androidPreviewViewType="texture-view"` | CameraX's `COMPATIBLE` mode. |
| Any CameraX `PreviewView` | `implementationMode = COMPATIBLE` | |
| ExoPlayer / `PlayerView` | `app:surface_type="texture_view"` | |
| `react-native-maps` | No `TextureView` option exists. | `liteMode` draws a static map into an ordinary view, which is captured; a live map is not. |

**It costs something, which is why it is not the default.** Google measures `TextureView` as
increasing total power draw during video playback by as much as 30% on some devices, and it gives
up accurate frame timing, HDR output and DRM. If the video is incidental to what your support
agents need to see, leaving it as a `SurfaceView` and accepting the marked gap is a reasonable
answer — the caption means nobody is misled either way.

**On iOS the SDK captures with `drawHierarchy`, which Apple documents as capturing regardless of
how a view draws** — UIKit, Core Graphics, Metal, SpriteKit — so a Metal or Skia canvas is
recorded. Hardware video is less certain: there are credible reports that `AVPlayerLayer` and
camera preview come out blank on a physical device while appearing on the simulator, and
DRM-protected playback is blanked by design. We have not measured this on a device. If video in
your iOS app matters to your support flow, tell us and we will test it on yours.

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
    // The native module's own names, which are not always the public ones: `init()` calls
    // `configure`, because Objective-C reserves `init`.
    configure: jest.fn(() => Promise.resolve()),
    registerCustomer: jest.fn(() => Promise.resolve()),
    setScreen: jest.fn(() => Promise.resolve()),
    recordNetworkRequest: jest.fn(() => Promise.resolve()),
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
