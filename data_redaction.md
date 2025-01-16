# Data Redaction

## Overview
The **Data Redaction** feature in the **FullviewSDK** allows developers to hide sensitive information from the screen shared with support agents. This feature ensures user privacy while providing remote assistance.

## Usage

Wrap the view you want to hide within the `DataRedaction` container. Any view within this container will be excluded from the screen capture.

#### Example

```react
import { DataRedaction } from '@fullview/react-native-fullview-sdk';

<DataRedaction>
  <Text>Text that can NOT be seen by the agent</Text>
</DataRedaction>
```

### Note
This setup ensures that wrapped elements will not appear in the shared screen feed.