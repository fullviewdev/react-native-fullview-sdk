import Foundation
import FullviewSDK

/// Exposes the native SDK's redaction tag to the ObjC++ Fabric component.
/// Single source of truth stays in FullviewSDK (DataRedactionEditor.swift).
@objc(FullviewDataRedaction)
public final class FullviewDataRedaction: NSObject {
  @objc public static var tag: Int { DataRedactionTag }
}
