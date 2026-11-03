require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "visionforgex-react-native"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/VisionForgeX/visionforgex-react-native"
  s.license      = { :type => "MIT", :file => "LICENSE" }
  s.authors      = { "VisionForgeX" => "support@visionforgex.com" }
  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/VisionForgeX/visionforgex-react-native.git", :tag => s.version.to_s }
  s.source_files = "ios/**/*.{h,m,swift}"
  s.swift_version = "5.9"
  s.dependency "React-Core"
  s.dependency "VisionForgeX", ">= 1.0.0"   # the iOS SDK, which brings Google Mobile Ads
end
