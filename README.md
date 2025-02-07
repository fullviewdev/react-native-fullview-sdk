# React Native Developer Documentation

**Current version:** 0.10.1

Fullview React Native SDK supports following platforms:

- React Native
  - Android
  - iOS

Other platforms supported:

  - Android
  - iOS
  - Flutter

Soon-supported platforms:

  - Ionic
  - Cordova

## Installation

### Expo

```sh
npm expo install @fullview/react-native-fullview-sdk
```

### npm

```sh
npm install @fullview/react-native-fullview-sdk
```


## Configuration

### Expo specific requirements

`react-native-fullview-sdk` implements native code and libraries so you will need to use an `Expo Development Build`, `Expo Go` applications are not supported.

### iOS Requirements

#### Expo 
- If you are using *Expo SDK 42* or above, in your `app.json` add the following values if you don't already have them:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "This app uses the microphone for customer support interactions",
        "NSCameraUsageDescription": "This app uses the camera for customer support interactions.",
        "UIBackgroundModes": ["voip"]
      }
    }
  }
}

```

#### React Native
- Add the following permissions in your *app's xcodeproject Info.plist*, if you don't already have them:
	- **NSMicrophoneUsageDescription**
	- **NSCameraUsageDescription**
	- **UIBackgroundModes** **voip**


## Usage

Add `import FullviewSDK from '@fullview/react-native-fullview-sdk';` and then use the different functions in **FullviewSDK** to configure and start the SDK.

A minimal implementation looks like the following:

```js
import FullviewSDK from '@fullview/react-native-fullview-sdk';
import { FullviewRegion } from '@fullview/react-native-fullview-sdk';

// ...

FullviewSDK.attach() // Ideally this should be run as soon as the app starts.

FullviewSDK.register(
	 <FullviewRegion>
    '<string>', 
    '<string>', 
    '<string>', 
    '<string>', 
    '<string>'
)
.then(() => {
    console.log('SDK Registered');
})
.catch((error) => {
    console.error('SDK Register Error:', error);
});
```

*Note*: `device_id` must be a correct unique UUID. 

And use `FullviewSDK.logout()` to disconnect and disable the SDK.
 
## Additional features usage
- [Data Redaction](data_redaction.md)
- [Screen Sharing](screen_share.md) (additional configuration required for iOS)


## Fullview SDK API

- `function attach(): Promise<void>`
   Attaches fullview SDK to the host app. Should be called as soon as the app starts.

- `function register(
    region: FullviewRegion,
    organisationId: string,
    userId: string,
    deviceId: string,
    name: string,
    email: string
  ): Promise<void>`

	Registers user to be available in Fullview.

- `function logout(): Promise<void>`

	Logs out the current user from Fullview.

- `function requestCoBrowse(): Promise<void>`

	Puts the user into a waiting queue requesting help from agents.

- `function cancelCoBrowseRequest(): Promise<void>`

	Remove the user from the waiting queue.

- `function getPositionInCoBrowseQueue(): Promise<number>`

	Position in the request cobrowse queue. 0 if there's no request/queue.

- `function getState(): Promise<FullviewState>`

	Current state of the SDK. Used to update the UI if necessary.
