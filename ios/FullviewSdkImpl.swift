import Foundation
import FullviewSDK

/// Swift side of the TurboModule. Deliberately React-free so the generated
/// `-Swift.h` header stays plain Objective-C and can be imported from the
/// ObjC++ shim in FullviewSdk.mm.
@objc(FullviewSdkImpl)
public final class FullviewSdkImpl: NSObject {
  public typealias Resolve = (Any?) -> Void
  public typealias Reject = (String, String) -> Void

  private var fullview: FullviewCore?

  @objc public func register(
    region: String,
    organisationId: String,
    userId: String,
    deviceId: String,
    name: String,
    email: String,
    resolve: @escaping Resolve,
    reject: @escaping Reject
  ) {
    guard fullview == nil else {
      reject("REGISTER_ERROR", "Register already called.")
      return
    }
    do {
      let selectedRegion = FullviewRegion(rawValue: region) ?? .EU1
      let config = try FullviewConfig(
        region: selectedRegion,
        organisationId: organisationId,
        userId: userId,
        deviceId: deviceId, // must be a UUID string
        name: name,
        email: email
      )
      let core = FullviewCore()
      core.onError = { error in
        print("[Fullview] runtime error: \(error)")
      }
      core.register(config: config)
      fullview = core
      resolve(nil)
    } catch {
      let message = (error as? FullviewError)?.debugMessage ?? error.localizedDescription
      reject("REGISTER_ERROR", message)
    }
  }

  @objc public func logout(resolve: @escaping Resolve, reject: @escaping Reject) {
    guard let fullview else {
      reject("LOGOUT_ERROR", "Register not called or already logged out.")
      return
    }
    self.fullview = nil
    fullview.logout()
    resolve(nil)
  }

  @objc public func requestCoBrowse(resolve: @escaping Resolve, reject: @escaping Reject) {
    guard let fullview else {
      reject("REQUEST_COBROWSE_ERROR", "Register not called.")
      return
    }
    fullview.requestCoBrowse { error in
      if let error {
        reject("REQUEST_COBROWSE_ERROR", error.localizedDescription)
      } else {
        resolve(nil)
      }
    }
  }

  @objc public func cancelCoBrowseRequest(resolve: @escaping Resolve, reject: @escaping Reject) {
    guard let fullview else {
      reject("CANCEL_COBROWSE_REQUEST_ERROR", "Register not called.")
      return
    }
    fullview.cancelCoBrowseRequest { error in
      if let error {
        reject("CANCEL_COBROWSE_REQUEST_ERROR", error.localizedDescription)
      } else {
        resolve(nil)
      }
    }
  }

  @objc public func getPositionInCoBrowseQueue(resolve: @escaping Resolve, reject: @escaping Reject) {
    guard let fullview else {
      reject("GET_POSITION_IN_COBROWSE_QUEUE_ERROR", "Register not called.")
      return
    }
    switch fullview.coBrowseStatus {
    case .requested(let position):
      resolve(position)
    default:
      resolve(0)
    }
  }

  @objc public func getState(resolve: @escaping Resolve, reject: @escaping Reject) {
    guard let fullview else {
      reject("GET_STATE_ERROR", "Register not called.")
      return
    }
    switch fullview.coBrowseStatus {
    case .requested:
      resolve("CO_BROWSE_REQUESTED")
    case .connected:
      resolve("CO_BROWSE_ACTIVE")
    case .invitation:
      resolve("CO_BROWSE_INVITATION")
    default:
      resolve("IDLE")
    }
  }
}
