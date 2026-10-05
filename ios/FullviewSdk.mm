#import "FullviewSdk.h"

#if __has_include("react_native_fullview_sdk-Swift.h")
#import "react_native_fullview_sdk-Swift.h"
#else
#import <react_native_fullview_sdk/react_native_fullview_sdk-Swift.h>
#endif

@implementation FullviewSdk {
  FullviewSdkImpl *_impl;
}

+ (NSString *)moduleName {
  return @"FullviewSdk";
}

// FullviewCore drives UIKit (overlay window, dialogs), so every call lands on main.
- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (instancetype)init {
  if (self = [super init]) {
    _impl = [FullviewSdkImpl new];
  }
  return self;
}

- (void)attach:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  // Nothing to attach on iOS: FullviewCore installs its overlay on register().
  resolve(nil);
}

- (void)register:(NSString *)region
  organisationId:(NSString *)organisationId
          userId:(NSString *)userId
        deviceId:(NSString *)deviceId
            name:(NSString *)name
           email:(NSString *)email
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject {
  [_impl registerWithRegion:region
             organisationId:organisationId
                     userId:userId
                   deviceId:deviceId
                       name:name
                      email:email
                    resolve:^(id _Nullable value) { resolve(value); }
                     reject:^(NSString *code, NSString *message) { reject(code, message, nil); }];
}

- (void)logout:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_impl logoutWithResolve:^(id _Nullable value) { resolve(value); }
                    reject:^(NSString *code, NSString *message) { reject(code, message, nil); }];
}

- (void)requestCoBrowse:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_impl requestCoBrowseWithResolve:^(id _Nullable value) { resolve(value); }
                             reject:^(NSString *code, NSString *message) { reject(code, message, nil); }];
}

- (void)cancelCoBrowseRequest:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_impl cancelCoBrowseRequestWithResolve:^(id _Nullable value) { resolve(value); }
                                   reject:^(NSString *code, NSString *message) { reject(code, message, nil); }];
}

- (void)getPositionInCoBrowseQueue:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_impl getPositionInCoBrowseQueueWithResolve:^(id _Nullable value) { resolve(value); }
                                        reject:^(NSString *code, NSString *message) { reject(code, message, nil); }];
}

- (void)getState:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_impl getStateWithResolve:^(id _Nullable value) { resolve(value); }
                      reject:^(NSString *code, NSString *message) { reject(code, message, nil); }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeFullviewSdkSpecJSI>(params);
}

@end
