import {
  codegenNativeComponent,
  type HostComponent,
  type ViewProps,
} from 'react-native';

interface NativeProps extends ViewProps {}

/** Android only. Container that lays out a BlockingView over its children. */
export default codegenNativeComponent<NativeProps>('BlockingLayoutView', {
  excludedPlatforms: ['iOS'],
}) as HostComponent<NativeProps>;
