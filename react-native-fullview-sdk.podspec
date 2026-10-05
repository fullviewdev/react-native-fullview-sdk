require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-fullview-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/fullviewdev/react-native-fullview-sdk.git", :tag => "v#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  # Keep the C++ codegen headers out of the Swift umbrella.
  s.private_header_files = "ios/**/*.h"
  s.swift_version = "5.9"

  # The native Fullview SDK ships inside this package (copied in by
  # scripts/bundle-natives.sh). Daily is linked dynamically by that framework.
  s.vendored_frameworks = "ios/Frameworks/FullviewSDK.xcframework"
  s.dependency "Daily", "~> 0.40"
  s.dependency "DailySystemBroadcast", "~> 0.40"

  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }

  install_modules_dependencies(s)
end
