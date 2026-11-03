import Foundation
import UIKit
import React
import VisionForgeX

/// React Native's side of the VisionForgeX iOS SDK: calls in, ad events out ("vfx"). No decision is made here.
@objc(VisionForgeXModule)
class VisionForgeXModule: RCTEventEmitter {
    private var hasListeners = false

    override static func requiresMainQueueSetup() -> Bool { true }
    override func supportedEvents() -> [String]! { ["vfx"] }
    override func startObserving() { hasListeners = true }
    override func stopObserving() { hasListeners = false }

    private func emit(_ m: [String: Any]) {
        DispatchQueue.main.async { if self.hasListeners { self.sendEvent(withName: "vfx", body: m) } }
    }

    private func plain(_ v: Any) -> Any {
        switch v {
        case is String, is Bool, is Int, is Int64, is Double: return v
        case let n as NSNumber: return n.doubleValue
        default: return "\(v)"
        }
    }

    private func fullScreen(_ placement: String, _ format: String) -> VfxFullScreen? {
        switch VfxFormat.fromWire(format) {
        case .interstitial: return VisionForgeX.interstitial(placement)
        case .rewarded: return VisionForgeX.rewarded(placement)
        case .rewardedInterstitial: return VisionForgeX.rewardedInterstitial(placement)
        case .appOpen: return VisionForgeX.appOpen(placement)
        default: return nil
        }
    }

    private func topViewController() -> UIViewController? {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let window = scenes.flatMap { $0.windows }.first { $0.isKeyWindow }
        var vc = window?.rootViewController
        while let p = vc?.presentedViewController { vc = p }
        return vc
    }

    @objc(initialize:options:resolve:reject:)
    func initialize(_ appKey: String, options o: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            var opts = VfxOptions()
            if o["googleDemoAds"] as? Bool == true { opts = VfxOptions.googleDemoAds() }
            if let ids = o["testDeviceIds"] as? [String] { opts.testDeviceIds = ids }
            switch o["logLevel"] as? String {
            case "none": opts.logLevel = VfxLogLevel.none
            case "error": opts.logLevel = .error
            case "warn": opts.logLevel = .warn
            case "info": opts.logLevel = .info
            case "debug": opts.logLevel = .debug
            default: break
            }
            if o["consentDebugEea"] as? Bool == true { opts.consentDebugEea = true; opts.consentTestDeviceHashedIds = (o["consentTestDeviceHashedIds"] as? [String]) ?? [] }
            if let u = o["baseUrl"] as? String, !u.isEmpty { opts.baseUrl = u }
            opts.autoPreload = (o["autoPreload"] as? Bool) != false
            if let t = o["settingsForTesting"] as? String, !t.isEmpty { opts.settingsForTesting = t }

            VisionForgeX.eventListener = { [weak self] e in
                var d: [String: Any] = [:]
                for (k, v) in e.details { d[k] = self?.plain(v) ?? "\(v)" }
                self?.emit(["kind": "event", "type": e.type, "placement": e.placement, "format": e.format.wire, "time": e.time, "details": d])
            }
            VisionForgeX.revenueListener = { [weak self] r in
                self?.emit(["kind": "revenue", "placement": r.placement, "format": r.format.wire, "valueMicros": r.valueMicros, "currency": r.currency, "precision": r.precision, "source": r.source as Any])
            }
            var answered = false
            VisionForgeX.initialize(appKey: appKey, options: opts) { st in
                if answered { return }
                answered = true
                resolve(["ready": st.ready, "reason": st.reason, "fromCache": st.fromCache])
            }
        }
    }

    @objc(isReady:reject:)
    func isReady(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) { resolve(VisionForgeX.isReady) }

    @objc(fullScreenReady:format:resolve:reject:)
    func fullScreenReady(_ placement: String, format: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { resolve(self.fullScreen(placement, format)?.isReady() == true) }
    }

    @objc(load:format:resolve:reject:)
    func load(_ placement: String, format: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { self.fullScreen(placement, format)?.load(); resolve(nil) }
    }

    @objc(show:format:id:resolve:reject:)
    func show(_ placement: String, format: String, id: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            guard let fs = self.fullScreen(placement, format) else { resolve(["shown": false, "reason": "unknown_placement"]); return }
            var shown = false
            var done = false
            func finish(_ reason: String?) {
                if done { return }
                done = true
                resolve(["shown": shown, "reason": reason as Any])
            }
            fs.show(from: self.topViewController(), callbacks: VfxShowCallbacks(
                onShown: { shown = true; self.emit(["kind": "show", "id": id, "event": "shown"]) },
                onClicked: { self.emit(["kind": "show", "id": id, "event": "clicked"]) },
                onDismissed: { finish(nil) },
                onNotShown: { finish($0) },
                onReward: { type, amount in self.emit(["kind": "show", "id": id, "event": "reward", "type": type, "amount": amount]) }))
        }
    }

    @objc(preloadAll:reject:)
    func preloadAll(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { VisionForgeX.preloadAll(); resolve(nil) }
    }

    @objc(setKeyValue:value:resolve:reject:)
    func setKeyValue(_ key: String, value: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        VisionForgeX.setKeyValue(key, value); resolve(nil)
    }

    @objc(isPrivacyOptionsRequired:reject:)
    func isPrivacyOptionsRequired(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) { resolve(VisionForgeX.isPrivacyOptionsRequired) }

    @objc(showPrivacyOptions:reject:)
    func showPrivacyOptions(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            if let vc = self.topViewController() { VisionForgeX.showPrivacyOptions(from: vc) { err in resolve(err) } } else { resolve("no screen") }
        }
    }

    @objc(setMuted:resolve:reject:)
    func setMuted(_ muted: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) { VisionForgeX.setMuted(muted); resolve(nil) }

    @objc(openAdInspector:reject:)
    func openAdInspector(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { if let vc = self.topViewController() { VisionForgeX.openAdInspector(from: vc) }; resolve(nil) }
    }

    @objc(settingsSource:reject:)
    func settingsSource(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) { resolve(VisionForgeX.settingsSource()) }

    @objc(flush:reject:)
    func flush(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) { VisionForgeX.flush(); resolve(nil) }
}
