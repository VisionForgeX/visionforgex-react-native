import UIKit
import React
import VisionForgeX

/// Holds the SDK's own banner, which loads and refreshes itself; React Native sets the placement and the size.
class VfxBannerContainer: UIView {
    private var banner: VfxBannerView?
    @objc var placement: String = "" {
        didSet {
            if placement == oldValue && banner != nil { return }
            banner?.removeFromSuperview()
            let b = VfxBannerView(placement: placement)
            b.frame = bounds
            b.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            addSubview(b)
            banner = b
        }
    }
}

@objc(VfxBannerViewManager)
class VfxBannerViewManager: RCTViewManager {
    override static func requiresMainQueueSetup() -> Bool { true }
    override func view() -> UIView! { VfxBannerContainer() }
}
