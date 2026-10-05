#import "DataRedactionView.h"

#import <react/renderer/components/FullviewSdkSpec/ComponentDescriptors.h>
#import <react/renderer/components/FullviewSdkSpec/Props.h>
#import <react/renderer/components/FullviewSdkSpec/RCTComponentViewHelpers.h>
#import "RCTFabricComponentsPlugins.h"

#if __has_include("react_native_fullview_sdk-Swift.h")
#import "react_native_fullview_sdk-Swift.h"
#else
#import <react_native_fullview_sdk/react_native_fullview_sdk-Swift.h>
#endif

using namespace facebook::react;

@implementation DataRedactionView {
  UIView *_redactionView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<DataRedactionViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const DataRedactionViewProps>();
    _props = defaultProps;

    _redactionView = [[UIView alloc] initWithFrame:self.bounds];
    _redactionView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _redactionView.tag = FullviewDataRedaction.tag; // not a React view, safe to tag
    [self addSubview:_redactionView];
  }
  return self;
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [_redactionView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [childComponentView removeFromSuperview];
}

@end

Class<RCTComponentViewProtocol> DataRedactionViewCls(void) {
  return DataRedactionView.class;
}
