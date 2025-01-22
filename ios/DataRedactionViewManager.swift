import FullviewSDK
import React

@objc(DataRedactionViewManager)
class DataRedactionViewManager: RCTViewManager {
  override func view() -> UIView! {
    return ReactContainerView()
  }
}
