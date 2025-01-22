#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(DataRedactionViewManager, RCTViewManager)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end 