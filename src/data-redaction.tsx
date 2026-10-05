import React, { type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import DataRedactionView from './DataRedactionViewNativeComponent';
import BlockingLayoutView from './BlockingLayoutViewNativeComponent';
import BlockingView from './BlockingViewNativeComponent';

/**
 * Wrap anything that must never reach a support agent. The wrapped content is
 * masked in every screenshot the SDK captures.
 */
const DataRedaction: React.FC<PropsWithChildren> = ({ children }) => {
  if (Platform.OS === 'ios') {
    return <DataRedactionView>{children}</DataRedactionView>;
  }
  return (
    <BlockingLayoutView>
      <BlockingView />
      {children}
    </BlockingLayoutView>
  );
};

export default DataRedaction;
