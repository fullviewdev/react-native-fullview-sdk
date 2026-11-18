import FullviewSDK
import UIKit

/// Hands the native SDK the React Native tap relay; see FullviewFabricTaps.mm.
@objc(FullviewAgentTaps)
public final class FullviewAgentTaps: NSObject {
  @objc @MainActor public static func install(_ handler: @escaping (UIView, CGPoint) -> Bool) {
    AgentTapRelay.handler = handler
  }
}
