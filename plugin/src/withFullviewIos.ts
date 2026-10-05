import { withInfoPlist, type ConfigPlugin } from 'expo/config-plugins';

export type FullviewPluginProps = {
  /** Camera permission text, or `false` to leave Info.plist untouched. */
  cameraPermission?: string | false;
  /** Microphone permission text, or `false` to leave Info.plist untouched. */
  microphonePermission?: string | false;
  /** Adds the `voip` background mode so support calls survive backgrounding. Default true. */
  voipBackgroundMode?: boolean;
};

const DEFAULT_CAMERA = 'This app uses the camera during live support sessions.';
const DEFAULT_MICROPHONE =
  'This app uses the microphone during live support sessions.';

export const withFullviewIos: ConfigPlugin<FullviewPluginProps> = (
  config,
  props = {}
) =>
  withInfoPlist(config, (c) => {
    const plist = c.modResults;
    if (props.cameraPermission !== false) {
      plist.NSCameraUsageDescription =
        props.cameraPermission ??
        plist.NSCameraUsageDescription ??
        DEFAULT_CAMERA;
    }
    if (props.microphonePermission !== false) {
      plist.NSMicrophoneUsageDescription =
        props.microphonePermission ??
        plist.NSMicrophoneUsageDescription ??
        DEFAULT_MICROPHONE;
    }
    if (props.voipBackgroundMode !== false) {
      const modes = new Set<string>(
        (plist.UIBackgroundModes as string[] | undefined) ?? []
      );
      modes.add('voip');
      plist.UIBackgroundModes = [...modes];
    }
    return c;
  });
