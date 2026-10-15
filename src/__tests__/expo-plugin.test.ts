import type { ExpoConfig } from 'expo/config';
import withFullview from '../../plugin/src';

/**
 * What the Expo config plugin writes into `Info.plist`.
 *
 * The plugin is the whole of our Expo support - a customer adds it to `app.json`, runs
 * `expo prebuild`, and these keys are the difference between a build that can use the camera and
 * one the OS kills when it tries. Until now it was only ever compiled, never run, while the README
 * tells people to rely on it.
 *
 * This applies it the way Expo does: call the plugin, then execute the `ios.infoPlist` mod it
 * registered. No network, no simulator, no prebuild. What it cannot cover is `expo prebuild`
 * resolving the plugin by package name through `app.plugin.js`, which needs a real project; that is
 * DEV-3648.
 */
type InfoPlist = Record<string, unknown>;

/** What a plugin leaves behind: the config, plus the mods it registered for prebuild to run. */
type ConfigWithMods = ExpoConfig & {
  mods?: {
    ios?: {
      infoPlist?: (config: unknown) => Promise<{ modResults: InfoPlist }>;
    };
  };
};

const applyPlugin = async (
  props?: Parameters<typeof withFullview>[1],
  existingPlist: InfoPlist = {}
) => {
  const config = withFullview(
    { name: 'demo', slug: 'demo' } as ExpoConfig,
    props as Parameters<typeof withFullview>[1]
  ) as ConfigWithMods;

  const mod = config.mods?.ios?.infoPlist;
  if (!mod) throw new Error('the plugin registered no ios.infoPlist mod');

  const result = await mod({
    ...config,
    modResults: existingPlist,
    modRequest: {},
    modRawConfig: config,
  });

  return result.modResults;
};

describe('the Expo config plugin', () => {
  it('asks for the camera, the microphone and voip by default', async () => {
    const plist = await applyPlugin();

    expect(plist.NSCameraUsageDescription).toContain('camera');
    expect(plist.NSMicrophoneUsageDescription).toContain('microphone');
    expect(plist.UIBackgroundModes).toEqual(['voip']);
  });

  it('uses the words the app chose', async () => {
    const plist = await applyPlugin({
      cameraPermission: 'So an agent can see your camera.',
      microphonePermission: 'So you can talk to an agent.',
    });

    expect(plist.NSCameraUsageDescription).toBe(
      'So an agent can see your camera.'
    );
    expect(plist.NSMicrophoneUsageDescription).toBe(
      'So you can talk to an agent.'
    );
  });

  it('leaves a key alone when the app opts out of it', async () => {
    const plist = await applyPlugin({
      cameraPermission: false,
      microphonePermission: false,
      voipBackgroundMode: false,
    });

    expect(plist).not.toHaveProperty('NSCameraUsageDescription');
    expect(plist).not.toHaveProperty('NSMicrophoneUsageDescription');
    expect(plist).not.toHaveProperty('UIBackgroundModes');
  });

  /**
   * An app that already wrote its own usage description has said what it wants its users to read,
   * and overwriting it would change a string that has been through someone's App Store review.
   */
  it('keeps a usage description the app already wrote', async () => {
    const plist = await applyPlugin(undefined, {
      NSCameraUsageDescription: 'Acme uses the camera to scan receipts.',
    });

    expect(plist.NSCameraUsageDescription).toBe(
      'Acme uses the camera to scan receipts.'
    );
    expect(plist.NSMicrophoneUsageDescription).toContain('microphone');
  });

  it("adds voip alongside the app's own background modes", async () => {
    const plist = await applyPlugin(undefined, {
      UIBackgroundModes: ['audio'],
    });

    expect(plist.UIBackgroundModes).toEqual(['audio', 'voip']);
  });

  it('does not add voip twice when it is already declared', async () => {
    const plist = await applyPlugin(undefined, {
      UIBackgroundModes: ['audio', 'voip'],
    });

    expect(plist.UIBackgroundModes).toEqual(['audio', 'voip']);
  });

  /**
   * The plugin is reached as `"plugins": ["@fullview/react-native-fullview-sdk"]`, which resolves
   * through the `./app.plugin.js` export to `plugin/build`. Dropping either from package.json
   * breaks every Expo customer at prebuild and nothing else would notice.
   */
  it('is published and reachable by package name', () => {
    const pkg = require('../../package.json');

    expect(pkg.exports['./app.plugin.js']).toBe('./app.plugin.js');
    expect(pkg.files).toContain('plugin/build');
    expect(pkg.peerDependenciesMeta.expo.optional).toBe(true);
  });
});
