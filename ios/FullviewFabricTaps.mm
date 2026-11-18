#import "FullviewFabricTaps.h"

#import <QuartzCore/QuartzCore.h>
#import <React/RCTConversions.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTTouchableComponentViewProtocol.h>
#include <type_traits>
#include <utility>

using namespace facebook::react;

namespace {

// RN 0.81 stamps a touch with `timestamp` alone; later versions read `timeStamp` as well.
template <typename T, typename = void>
struct HasHighResTimeStamp : std::false_type {};
template <typename T>
struct HasHighResTimeStamp<T, std::void_t<decltype(std::declval<T &>().timeStamp)>> : std::true_type {};

template <typename T>
void Stamp(T &touch, NSTimeInterval seconds)
{
  touch.timestamp = seconds;
  if constexpr (HasHighResTimeStamp<T>::value) {
    touch.timeStamp = decltype(touch.timeStamp)::fromDOMHighResTimeStamp(seconds * 1e3);
  }
}

// Clear of the 17 identifiers the surface's own handler gives real fingers, and under the 20 the
// JavaScript responder tracks.
constexpr int kAgentTouchIdentifier = 19;
constexpr int64_t kTapNanoseconds = 60 * NSEC_PER_MSEC;

UIView *SurfaceRoot(UIView *view)
{
  for (UIView *current = view; current != nil; current = current.superview) {
    for (UIGestureRecognizer *recognizer in current.gestureRecognizers) {
      if ([recognizer isKindOfClass:[RCTSurfaceTouchHandler class]]) {
        return current;
      }
    }
  }
  return nil;
}

} // namespace

/// iOS has no public way to synthesise a touch, and React Native's pressables answer nothing else:
/// they are driven by touch events the surface's `RCTSurfaceTouchHandler` sends to JavaScript.
/// This sends the same two events - start, then end - through the same public Fabric API that
/// handler uses (`RCTTouchableComponentViewProtocol` and `TouchEventEmitter`), so a `Pressable`,
/// a `Touchable*` and anything else on the responder system sees an ordinary tap. Native controls
/// React Native wraps (`Switch`, `TextInput`) never get here: the SDK presses those through UIKit.
@implementation FullviewFabricTaps

+ (BOOL)tapView:(UIView *)view atWindowPoint:(CGPoint)point
{
  UIWindow *window = view.window;
  UIView *root = SurfaceRoot(view);
  if (window == nil || root == nil) {
    return NO;
  }
  UIView *componentView = view;
  while (componentView != nil && ![componentView respondsToSelector:@selector(touchEventEmitterAtPoint:)]) {
    componentView = componentView.superview;
  }
  if (componentView == nil) {
    return NO;
  }

  CGPoint offsetPoint = [window convertPoint:point toView:componentView];
  SharedTouchEventEmitter emitter =
      [(id<RCTTouchableComponentViewProtocol>)componentView touchEventEmitterAtPoint:offsetPoint];
  if (!emitter) {
    return NO;
  }

  CGPoint pagePoint = [window convertPoint:point toView:root];
  Touch touch{};
  touch.offsetPoint = RCTPointFromCGPoint(offsetPoint);
  touch.pagePoint = RCTPointFromCGPoint(pagePoint);
  touch.screenPoint = RCTPointFromCGPoint([root convertPoint:pagePoint toCoordinateSpace:window.screen.coordinateSpace]);
  touch.identifier = kAgentTouchIdentifier;
  touch.target = (Tag)componentView.tag;
  Stamp(touch, CACurrentMediaTime());

  TouchEvent start{};
  start.touches.insert(touch);
  start.changedTouches.insert(touch);
  start.targetTouches.insert(touch);
  emitter->onTouchStart(start);

  // Lifted a moment later, as a finger would be, so pressed styles get a frame to show.
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, kTapNanoseconds), dispatch_get_main_queue(), ^{
    Touch lifted = touch;
    Stamp(lifted, CACurrentMediaTime());
    TouchEvent end{};
    end.changedTouches.insert(lifted);
    end.targetTouches.insert(lifted);
    emitter->onTouchEnd(end);
  });
  return YES;
}

@end
