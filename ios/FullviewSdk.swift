import FullviewSDK
import React

@objc(FullviewSdk)
class FullviewSdk: NSObject {

  private var fullview: FullviewCore?
  
  @objc(register:withUserId:withDeviceId:withName:withEmail:withResolver:withRejecter:)
  func register(
    organisationId: String,
    userId: String,
    deviceId: String,
    name: String,
    email: String,
    resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock
  ) -> Void {
    guard fullview == nil else {
      reject("REGISTER_ERROR", "Register already called.", nil)
      return
    }
    do {
      let config = try FullviewConfig(
          organisationId: organisationId,
          userId: userId,
          deviceId: deviceId, // must be a uuid string
          name: name,
          email: email
      )
      fullview = FullviewCore()
      fullview?.onError = { error in
          print("Runtime error: \(error)")
      }
      fullview?.register(config: config)
      resolve(nil)
    } catch {
      let errorMessage = (error as? FullviewError)?.debugMessage ?? error.localizedDescription
      reject("REGISTER_ERROR", errorMessage, nil)
      return
    }
  }

  @objc(logout:withRejecter:)
  func logout(resolve: RCTPromiseResolveBlock,reject: RCTPromiseRejectBlock) -> Void {
    guard let fullview else {
      reject("LOGOUT_ERROR", "Register not called or already called logout.", nil)
      return
    }
    self.fullview = nil
    fullview.logout()
    resolve(nil)
  }

  @objc(requestCoBrowse:withRejecter:)
  func requestCoBrowse(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    guard let fullview else {
      reject("REQUEST_COBROWSE_ERROR", "Register not called.", nil)
      return
    }
    fullview.requestCoBrowse() { error in
      if let error {
        reject("REQUEST_COBROWSE_ERROR", error.localizedDescription, nil)
      } else {
        resolve(nil)
      }
    }
  }

  @objc(cancelCoBrowseRequest:withRejecter:)
  func cancelCoBrowseRequest(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    guard let fullview else {
      reject("CANCEL_COBROWSE_REQUEST_ERROR", "Register not called.", nil)
      return
    }
    fullview.cancelCoBrowseRequest() { error in
      if let error {
        reject("CANCEL_COBROWSE_REQUEST_ERROR", error.localizedDescription, nil)
      } else {
        resolve(nil)
      }
    }
  }

  @objc(getPositionInCoBrowseQueue:withRejecter:)
  func getPositionInCoBrowseQueue(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    guard let fullview else {
      reject("GET_POSITION_IN_COBROWSE_QUEUE_ERROR", "Register not called.", nil)
      return
    }
    switch fullview.coBrowseStatus {
    case .requested(let position):
      resolve(position)
    default:
      resolve(0)
    }
  }
  
  @objc(getState:withRejecter:)
  func getState(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    guard let fullview else {
      reject("GET_STATE_ERROR", "Register not called.", nil)
      return
    }
    switch fullview.coBrowseStatus {
    case .requested(_):
      resolve("CO_BROWSE_REQUESTED")
    case .connected:
      resolve("CO_BROWSE_ACTIVE")
    case .invitation(_):
      resolve("CO_BROWSE_INVITATION")
    default:
      resolve("IDLE")
    }
  }
}
