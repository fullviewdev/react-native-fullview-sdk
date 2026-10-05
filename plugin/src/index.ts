import { createRunOncePlugin, type ConfigPlugin } from 'expo/config-plugins';
import { withFullviewIos, type FullviewPluginProps } from './withFullviewIos';

const pkg: { name: string; version: string } = require('../../package.json');

/**
 * Expo config plugin. iOS needs the usage descriptions and the voip background
 * mode; Android needs nothing here because the bundled AAR's manifest merges its
 * permissions and services, and autolinking registers the package.
 */
const withFullview: ConfigPlugin<FullviewPluginProps> = (config, props) =>
  withFullviewIos(config, props ?? {});

export default createRunOncePlugin(withFullview, pkg.name, pkg.version);
export type { FullviewPluginProps };
