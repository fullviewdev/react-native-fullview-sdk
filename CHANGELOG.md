# Changelog

Written for the people installing this package. One section per released version; the release
workflow reads the section matching the version being published and will not publish without it.

## 1.1.0

### Added

- **Chat works during a support call.** When an agent types in a meeting, the message now reaches
  the phone — as a banner over your app, and in a chat panel the customer opens from the call
  controls — and the customer can reply. Until now the agent's messages went nowhere and the
  customer had no way to answer, on either platform. Nothing to call: it follows the chat setting
  already on your Fullview workspace, and if that is off the button never appears. Text only for
  now; a message carrying only a file shows as an attachment rather than an empty bubble.

## 1.0.0

### Breaking

- **`attach()` is now `init({ region, organisationId })`**, and `registerCustomer()` no longer
  takes the region or organisation id. This mirrors the web SDK, where the script tag carries the
  workspace and the identity carries only the customer.
- **`registerCustomer()` takes one identity object** instead of six positional arguments, shaped
  like the web SDK's `$fvIdentity`.
- **The device id is gone from the API.** Fullview assigns one and the SDK keeps it across
  launches, so an app had nothing to gain by passing one and could only disagree with the system
  of record.

```diff
- await FullviewSDK.attach();
- await FullviewSDK.registerCustomer(region, orgId, userId, null, name, email, options);
+ await FullviewSDK.init({ region, organisationId: orgId });
+ await FullviewSDK.registerCustomer({ id: userId, name, email });
```

### Added

- **`env` and `roles` on the identity**, the same fields the web SDK carries. The dashboard uses
  them to decide which customers are recorded; before this a phone could not say either.
- **`isAnonymous` on the identity.** It was always `false` from a phone, whatever the app knew.
- **The agent's cursor is in the recording.** A replay of a support call now shows where the agent
  pointed, not only what the customer did. It is drawn over the recording rather than burned into
  the screenshots, so it stays sharp and costs almost nothing.
- **Rage taps are recorded.** When someone jabs at the same control three or more times in quick
  succession, the session now shows one rage tap with the number of taps instead of a row of
  ordinary ones — the same signal Fullview has always picked up from a website, and usually the
  clearest sign in a replay that something in your app did not respond. Nothing to call: it is
  recorded for you, on both platforms.

### Changed

- **The camera and microphone are asked for when a support call starts**, not when a customer is
  registered. Your users no longer meet a permission dialog moments after signing in, for a call
  most of them will never have.
- **Clearer replay frames.** Screenshots were compressed hard enough to mottle flat areas of a
  screen; they now carry about a third more detail, at about a third more data.
- **Time when only the agent was working now counts as activity.** A stretch of a call where the
  agent moved, pointed or clicked while the customer sat still used to read as dead time on the
  replay timeline, and "skip inactivity" skipped straight over the part where support was doing
  the work.

### Fixed

- **A meeting that reconnects mid-call no longer leaves the agent looking at a frozen screen.**
  When the socket dropped and came back, the SDK resumed sending incremental frames against a
  document the agent's player had already reset, so nothing moved until the next full frame.

## 0.13.0

Session replay for React Native apps. Until now this package recorded only live support sessions;
it now records ordinary app usage too, so a support agent can watch back what the customer did
before they got in touch.

### Breaking

- **`register()` is now `registerCustomer()`.** Same arguments, same behaviour. The name had to
  change: `register` is a reserved word in C++, and React Native's New Architecture code generator
  emits C++ from the module definition, so a method called `register` cannot compile on 0.81.
- **New Architecture only**, and **React Native 0.81 or newer**. Legacy-architecture apps must stay
  on 0.12.
- **The native SDKs ship inside the package.** Nothing to add to your `Podfile` or Gradle files, and
  if you pinned the `Daily` pods yourself, remove those pins.

### Added

- **Session replay.** Sessions are recorded outside live support calls, subject to your workspace's
  replay settings. Nothing to call: once `registerCustomer()` has run, recording follows the
  organisation's configuration.
- **Network requests in the replay.** The SDK observes HTTP traffic through `XMLHttpRequest`, which
  React Native implements `fetch` on top of, so `fetch`, `axios` and Apollo are covered by one patch
  with no change to your code. Authorization headers, cookies, API keys and anything shaped like a
  token are redacted on the device.
- **`setScreen()`** — tell the replay which screen the customer is on, so the timeline reads like a
  web one. It has to be called: a React Native app draws every screen inside the one activity and
  view controller the platform gives it, so navigating changes nothing the SDK could observe.
- **Taps say what was tapped**, not only where, so the timeline reads "Tapped *Pay now*". Where no
  control can be read — plain content, anything your redaction hides, every Flutter host — it falls
  back to the position alone.
- **Expo**, through a development build or EAS Build, with the config plugin shipped in the package.
  Expo Go cannot run it and never will; the SDK says so explicitly if you try.

### Fixed

- **Apps that minify now build and run.** Previously an app with
  `enableProguardInReleaseBuilds = true` failed to compile against this package and, once made to
  compile, crashed on launch or registered the customer and then silently recorded nothing. The AAR
  now ships the keep rules your R8 pass needs, so there is nothing to add to your own
  `proguard-rules.pro`.
- **Android:** the SDK's own overlay no longer swallows taps before the app sees them; a dropped
  socket reconnects on its own; data redaction is applied on every frame.
- **iOS:** meetings no longer end after ten seconds; a screen that changes without being touched is
  captured; identical consecutive frames are dropped from recordings.
