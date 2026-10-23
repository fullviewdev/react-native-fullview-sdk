# Changelog

Written for the people installing this package. One section per released version; the release
workflow reads the section matching the version being published and will not publish without it.

Write notes as you go under `## Unreleased`. Preparing a release renames that heading to the
version being released, so there is nothing to remember at release time.

## 1.4.0

### Changed

- **Replays and co-browse sessions from a phone can now be checked for missing events.** Every
  event the SDK sends carries its position in a sequence, which is what lets us tell whether
  anything was lost on the way and how often — something that was not measurable for mobile
  before. Nothing changes in what the SDK records, how much it sends, or what it keeps on the
  device.

## 1.3.0

### Changed

- **Co-browse on mobile is now a setting on your organisation, and it starts switched off.** Until
  Fullview turns it on for you, `requestCoBrowse()` returns without contacting the server and an
  incoming co-browse or meeting invitation is ignored, so the customer is never shown one. Nothing
  else changes: recording, replays and the rest of the SDK behave as before. Ask Fullview to enable
  it for the organisations whose apps should be able to co-browse.

### Fixed

- **iOS: the agent sees modals, sheets and alerts.** A React Native `<Modal>` — and any sheet or
  alert — is presented onto the window beside the screen it covers, not inside it, so the capture
  was drawing the screen *behind* it: an agent watching a co-browse saw the app as it had been
  before the modal opened, with nothing to suggest the customer was looking at something else. A
  full-screen modal fared worse and sent a blank frame. The picture also stopped updating for as
  long as the modal was open, because the check that notices the screen changed was looking at the
  same wrong place. Redaction now follows what is drawn, so a masked field inside a modal stays
  masked.
- **Android: the agent sees the customer's screen in every meeting, not just the first.** From the
  second meeting of an app session onwards the agent opened on a blank screen and stayed there,
  while the phone looked like it was streaming normally. The SDK was waiting, on the socket's own
  callback thread, for a message that could not be sent until that thread let go — so the
  connection deadlocked the instant it opened, still reporting itself healthy, and nothing reached
  the agent or the recording. Nothing logged an error at either end. The first meeting escaped it
  because the frame that triggered it is a cached one, and the cache is empty when an app starts.
- **Android: the agent can hear the customer in a meeting.** Unmuting on an Android phone sent the
  agent nothing — not intermittently, but never: a meeting reported the customer's state through
  the co-browse endpoint, which has no field for the track states, and the agent's dashboard only
  plays a customer's audio for a track it has been told is ready. Nothing logged an error at any
  point, on either side. Two further faults in the same path are fixed with it: turning an input on
  opened the device without publishing the track, and the state updates raced each other, so a
  stale "muted" could land after the update that followed it.
- **The agent sees the customer's microphone and camera state during a co-browse.** Both SDKs
  reported it to an endpoint that no longer exists, so every update was refused and thrown away
  without surfacing an error: the agent's view of the customer stayed frozen at whatever it was
  when the session opened, however many times the customer muted or unmuted afterwards. Meetings
  were fixed separately and are unaffected by this.

## 1.2.0

### Changed

- **A video, map or camera preview that Android cannot capture now says so.** These render on a
  separate layer that a frame has no access to, so the area used to arrive as a transparent
  rectangle an agent would read as the app being blank or black. It is now filled with a hatch
  captioned `not captured`. Nothing else in the frame changes, and the marking only appears where
  the frame genuinely has nothing — if your app draws anything over the area, that is what the
  agent sees. To have the content captured instead, render it into the view tree: see
  [Video, maps and camera previews](./README.md#video-maps-and-camera-previews).

### Fixed

- **Android: the customer's screen reaches the agent again.** Every frame an Android device sent
  was encoded as WebP but labelled a JPEG, and a browser trusts that label rather than the bytes —
  so the agent's view, and every Android replay, has been blank since the switch to WebP. Nothing
  reported an error at any point: the frames arrived whole and simply could not be decoded. If you
  have been seeing empty Android sessions, they were never empty.
- **Android: a dialog or a modal is part of the recording.** A React Native `<Modal>`, an alert and
  anything else Android gives a window of its own were missing from the frame altogether: the agent
  saw the screen behind the modal, with nothing to suggest the customer was looking at something
  else. Every window the app has on screen is now captured, stacked in the order the system draws
  them, dimming included.
- **Android: a React Native tap says what the customer tapped.** Taps on a button, a row or a link
  all arrived as "Tapped the screen", because the SDK asked which view under the finger was
  clickable — a question React Native answers inconsistently — and stopped at the wrong one. A tap
  is now named after the control it landed on, "Tapped *View all*", and falls back to "Tapped the
  screen" only where there is genuinely no label to use. iOS was already naming them.
- **iOS: a frame the WebP encoder refuses is labelled as what it actually is.** The SDK falls back
  to JPEG for a frame WebP cannot encode, but the `data:` URL kept saying WebP, and a browser
  decodes by that label without ever looking at the bytes — so those frames would have arrived
  blank. Nobody has reported it and the fallback is rare, but it is the same mistake that blanked
  Android, so the label now travels with the bytes instead of sitting in a template.
- **Android: the app no longer freezes during a support call.** Touching the screen as a meeting
  started, or tapping "end", could lock the app for several seconds and leave Android offering to
  close it. Both went through the same socket lock on the main thread; nothing does now. The freeze
  also stopped the screen updating and could drop the customer out of the meeting.
- **Android: the chat button sits with the call controls**, beside the microphone, rather than
  above the agent's name.
- **iOS: the chat button sits with the call controls too**, at the microphone's left, rather than
  as a loose icon over the agent's name.
- **iOS: closing the chat panel gives the app back.** The panel dimmed the screen behind it to
  open and only undimmed when the SDK took it down, so closing it with its own button left the
  customer's app behind a dark blur that swallowed every touch for the rest of the call.
- **The unread badge keeps counting after the chat panel has been opened once.** The badge and the
  banners share the message log with the panel, and the panel used to take the log's only callback
  on the way in and clear it on the way out — so after one visit to the chat, nothing told the
  customer another message had arrived. Both platforms.
- **iOS: the agent can hear the customer.** Unmuting the microphone left the customer inaudible —
  the agent saw an unmuted microphone and heard silence — until the customer also turned their
  camera on, and only in that order. Four things were wrong, each enough on its own: turning an
  input on opened the device without publishing the track; the state updates sent to the agent
  raced each other, so the stale "off" could land after the "playable" that followed it and decide
  what the agent saw; nothing reported the microphone again when it finished starting up; and the
  permission was read rather than requested, so a device that had never been asked never started
  the microphone at all. A call now publishes what it opens, reports it when it is really ready,
  and those reports arrive in the order they were made.

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
