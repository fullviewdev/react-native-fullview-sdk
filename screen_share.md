# Screen Share

## Overview
The **Screen Share** feature in the **FullviewSDK** is provided through [Daily](https://www.daily.co/) so part of this documentation can also be found in the [Daily Documentation](https://docs.daily.co/). This feature allows the agent to view the user screen even when going outside of the host application. 

*Note*: The screen share feature on iOS relies in Apple's [ReplayKit](https://developer.apple.com/documentation/replaykit/) framework. In Android there's not additional setup required.


## iOS Setup

### Broadcast Extension

In order to use the screen sharing functionality for iOS, you will need to create a Broadcast Upload Extension for your app.

The DailySystemBroadcast framework provides all the files needed for capturing the contents of the user's screen and sending it to Daily.

Follow the steps below to learn how to create a new broadcast upload extension using Daily's framework.

1. Ensure that `DailySystemBroadcast` framework is integrated into the project. See previous steps if you haven't done so.
2. Create a new Broadcast Upload Extension target in Xcode.
![image](https://docs.daily.co/assets/screenshare/new_upload_extension.png)
	- Do not select "include UI extension".
	- Recommended naming: `ScreenCaptureExtension`, since it’s an independent process responsible for ingesting and processing the captured video & audio frames that the OS captures and passing it to your app, which then actually sends the media via WebRTC.
3. Add the `DailySystemBroadcast` framework as dependency of your app target and of your new **ScreenCaptureExtension** target.
4. Add the same [App Group](https://developer.apple.com/documentation/xcode/configuring-app-groups) capability in your main app target as well as in this new Broadcast Upload Extension target.
5. Replace your `SampleHandler.swift` default code that has been created by this code below:

	```
	import DailySystemBroadcast

	public class SampleHandler: DailyBroadcastSampleHandler {
	    override init() {
			super.init(appGroupIdentifier: "group.replace.yours.app.group.identifier")
    	}
	}
	```
	- Remember to change the `appGroupIdentifier` to use yours.
6. Edit your app target’s `Info.plist`
	- Add an `RTCAppGroupIdentifier` key with your app group identifier.
	- Add a `DailyScreenCaptureExtensionBundleIdentifier` key with your screen share extension’s bundle identifier.

	If you view the raw file contents of `Info.plist`, it should look like this:

	```
    <dict>
        ...
        <key>DailyScreenCaptureExtensionBundleIdentifier</key>
        <string>yours.broadcast.upload.extension.identifier</string>
        <key>RTCAppGroupIdentifier</key>
        <string>group.replace.yours.app.group.identifier</string>
        ...
    </dict>
	```


Then the screen share button will appear during **CoBrowse** if you have `Screen Share` enabled in your organisation config.

### Troubleshooting

- The screen share starts on the phone but nothing is displayed on the shared screen of the agent:
	- Check that the **App Group** defined in **Capabilities** matches the one defined in `Info.plist`. (under the key `RTCAppGroupIdentifier `)
	- Check that the values for **App Group** match between the `Info.plist` and the value in the `SampleHandler.swift`.
	- Check that the extension bundle identifier defined in the extension target matches the one defined in the `Info.plist` (under the key `DailyScreenCaptureExtensionBundleIdentifier`)
