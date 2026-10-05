import {
  codegenNativeComponent,
  type HostComponent,
  type ViewProps,
} from 'react-native';

interface NativeProps extends ViewProps {}

/** Android only. Secure SurfaceView that blacks out the area in screenshots. */
export default codegenNativeComponent<NativeProps>('BlockingView', {
  excludedPlatforms: ['iOS'],
}) as HostComponent<NativeProps>;
