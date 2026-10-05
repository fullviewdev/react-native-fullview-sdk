#import <React/RCTViewComponentView.h>

/// Fabric component for <DataRedaction> on iOS. Children are mounted inside a
/// plain UIView carrying FullviewSDK's DataRedactionTag, which the SDK masks in
/// every screenshot. Under Fabric `UIView.tag` is the React tag, so the tag must
/// live on a view React does not own.
@interface DataRedactionView : RCTViewComponentView
@end
