import {
  codegenNativeComponent,
  type HostComponent,
  type ViewProps,
} from 'react-native';

interface NativeProps extends ViewProps {}

/** iOS only. Children mounted inside are masked in every screenshot the SDK takes. */
export default codegenNativeComponent<NativeProps>('DataRedactionView', {
  excludedPlatforms: ['android'],
}) as HostComponent<NativeProps>;
