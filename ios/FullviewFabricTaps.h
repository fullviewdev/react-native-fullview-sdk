#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// Delivers an agent's tap to React Native's own touch pipeline.
@interface FullviewFabricTaps : NSObject
+ (BOOL)tapView:(UIView *)view atWindowPoint:(CGPoint)point;
@end

NS_ASSUME_NONNULL_END
