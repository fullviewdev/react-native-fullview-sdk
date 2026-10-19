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
  /// Set by configure(), which is what init() calls: the workspace is named once - as the web SDK's script tag
  /// names it - rather than repeated with every customer.
  private var workspace: (region: FullviewRegion, organisationId: String)?

  @objc public func configure(
    region: String,
    organisationId: String,
    resolve: @escaping Resolve,
    reject: @escaping Reject
  ) {
    workspace = (FullviewRegion(rawValue: region) ?? .EU1, organisationId)
    resolve(nil)
  }

  @objc public func register(
    userId: String,
    name: String,
    email: String,
    isAnonymous: Bool,
    env: String?,
    roles: [String],
    recordWifiOnly: Bool,
    disableReplaysForUser: Bool,
    resolve: @escaping Resolve,
    reject: @escaping Reject
  ) {
    guard fullview == nil else {
      reject("REGISTER_ERROR", "Register already called.")
      return
    }
    guard let workspace else {
      reject("REGISTER_ERROR", "init() must be called before registerCustomer().")
      return
    }
    do {
      let config = try FullviewConfig(
        region: workspace.region,
        organisationId: workspace.organisationId,
        userId: userId,
        // No device id: the backend owns it, so there is nothing for an app to pass.
        name: name,
        email: email,
        env: env,
        roles: roles.isEmpty ? nil : roles,
        isAnonymous: isAnonymous,
        additionalConfig: [
          "recordWifiOnly": recordWifiOnly,
          "disableReplaysForUser": disableReplaysForUser,
        ]
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

  @objc public func recordNetworkRequest(_ payload: String, resolve: @escaping Resolve, reject: @escaping Reject) {
    // Resolved rather than rejected when nobody is registered: the observer is patched into the
    // app's networking for the whole process, so requests happen before register and after logout,
    // and a rejection there would surface as an unhandled promise on every one of them.
    fullview?.recordNetworkRequest(payload)
    resolve(nil)
  }

  @objc public func setScreen(_ name: String, resolve: @escaping Resolve, reject: @escaping Reject) {
    // Resolved rather than rejected when nobody is registered, for the same reason as
    // recordNetworkRequest: an app reports its screens from its navigation listener, which runs
    // before register and after logout, and rejecting there would surface as an unhandled
    // promise on every screen change.
    fullview?.recordScreen(name)
    resolve(nil)
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
