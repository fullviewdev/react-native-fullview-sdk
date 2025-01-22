import UIKit
import React
import FullviewSDK

class ReactContainerView: UIView {
  
  override init(frame: CGRect) {
    super.init(frame: frame)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // MARK: - Children
  // Called when a child is added to the StackView
  override func insertReactSubview(_ subview: UIView!, at atIndex: Int) {
    subview.tag = DataRedactionTag
    insertSubview(subview, at: atIndex)
  }
  
  // removes the view from parent
  override func removeReactSubview(_ subview: UIView!) {
    subview.removeFromSuperview()
  }
  
  // get all the subviews
  override func reactSubviews() -> [UIView]! {
    return subviews
  }
}
