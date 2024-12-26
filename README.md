# React Native Developer Documentation

**Current version:** 0.9.7

Fullview React Native SDK supports following platforms:

- React Native
  - Android
  - iOS

## Installation

### NPM


```sh
npm install react-native-fullview-sdk
```


## Configuration

### iOS Requirements
- Add the following permissions in your *app's xcodeproject Info.plist*, if you don't already have them:
	- **NSMicrophoneUsageDescription**
	- **NSCameraUsageDescription**
	- **UIBackgroundModes** **voip**


## Usage

Add `import FullviewSDK from 'react-native-fullview-sdk';` and then use the different functions in ** FullviewSDK** to configure and start the SDK.

A minimal implementation looks like the following:

```js
import { FullviewSDK } from 'react-native-fullview-sdk';

// ...

FullviewSDK.attach() // Ideally this should be run as soon as the app starts.

FullviewSDK.register(
    '<organisation_id>', 
    '<user_id>', 
    '<device_id>', 
    '<name>', 
    '<email>'
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
