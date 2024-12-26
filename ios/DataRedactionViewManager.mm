#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

#define DATAREDACTION_TAG_ID 619133742

@interface DataRedactionViewManager : RCTViewManager
@end

@implementation DataRedactionViewManager

RCT_EXPORT_MODULE(DataRedactionView)

- (UIView *)view
{
  UIView *view = [[UIView alloc] init];
  view.tag = DATAREDACTION_TAG_ID;
  return view;
}

@end
