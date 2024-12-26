import React, { type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import BlockingLayout from './blocking-layout';
import BlockingView from './blocking-view';
import DataRedactionView from './data-redaction-view';

const DataRedaction: React.FC<PropsWithChildren> = ({
  children
}) => {
  return (
    (Platform.OS === 'ios') ?
    (<DataRedactionView>
      {children}
    </DataRedactionView>)
    :
    (<BlockingLayout>
        <BlockingView></BlockingView>
        {children}
      </BlockingLayout>)
  );
};

export default DataRedaction;