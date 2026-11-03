package com.visionforgex.rn

import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.visionforgex.ads.VfxEvent
import com.visionforgex.ads.VfxFormat
import com.visionforgex.ads.VfxFullScreen
import com.visionforgex.ads.VfxInitListener
import com.visionforgex.ads.VfxLogLevel
import com.visionforgex.ads.VfxOptions
import com.visionforgex.ads.VfxShowListener
import com.visionforgex.ads.VisionForgeX

/** React Native's side of the VisionForgeX Android SDK: calls in, ad events out ("vfx"). No decision is made here. */
class VisionForgeXModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
    private val main = Handler(Looper.getMainLooper())

    override fun getName(): String = "VisionForgeXModule"

    // NativeEventEmitter needs these two
    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}

    private fun emit(m: WritableMap) {
        main.post { try { ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("vfx", m) } catch (_: Throwable) {} }
    }

    private fun fullScreen(placement: String, format: String): VfxFullScreen? = when (VfxFormat.fromWire(format)) {
        VfxFormat.INTERSTITIAL -> VisionForgeX.interstitial(placement)
        VfxFormat.REWARDED -> VisionForgeX.rewarded(placement)
        VfxFormat.REWARDED_INTERSTITIAL -> VisionForgeX.rewardedInterstitial(placement)
        VfxFormat.APP_OPEN -> VisionForgeX.appOpen(placement)
        else -> null
    }

    @ReactMethod
    fun initialize(appKey: String, o: ReadableMap, promise: Promise) {
        val b = VfxOptions.Builder()
        if (o.hasKey("testDeviceIds")) o.getArray("testDeviceIds")?.let { a -> b.testDeviceIds((0 until a.size()).mapNotNull { a.getString(it) }) }
        if (o.hasKey("logLevel")) when (o.getString("logLevel")) {
            "none" -> b.logLevel(VfxLogLevel.NONE); "error" -> b.logLevel(VfxLogLevel.ERROR); "warn" -> b.logLevel(VfxLogLevel.WARN)
            "info" -> b.logLevel(VfxLogLevel.INFO); "debug" -> b.logLevel(VfxLogLevel.DEBUG)
        }
        if (o.hasKey("consentDebugEea") && o.getBoolean("consentDebugEea")) {
            val ids = o.getArray("consentTestDeviceHashedIds")?.let { a -> (0 until a.size()).mapNotNull { a.getString(it) } } ?: emptyList()
            b.consentDebugEea(true, ids)
        }
        if (o.hasKey("baseUrl")) o.getString("baseUrl")?.takeIf { it.isNotBlank() }?.let { b.baseUrl(it) }
        if (o.hasKey("autoPreload")) b.autoPreload(o.getBoolean("autoPreload"))
        if (o.hasKey("googleDemoAds") && o.getBoolean("googleDemoAds")) b.googleDemoAds()
        if (o.hasKey("settingsForTesting")) o.getString("settingsForTesting")?.takeIf { it.isNotBlank() }?.let { b.settingsForTesting(it) }

        VisionForgeX.setEventListener { e: VfxEvent ->
            val m = Arguments.createMap()
            m.putString("kind", "event"); m.putString("type", e.type); m.putString("placement", e.placement); m.putString("format", e.format.wire); m.putDouble("time", e.time.toDouble())
            val d = Arguments.createMap()
            for ((k, v) in e.details) when (v) { null -> d.putNull(k); is Boolean -> d.putBoolean(k, v); is Number -> d.putDouble(k, v.toDouble()); else -> d.putString(k, v.toString()) }
            m.putMap("details", d)
            emit(m)
        }
        VisionForgeX.setRevenueListener { placement, format, micros, currency, precision, source ->
            val m = Arguments.createMap()
            m.putString("kind", "revenue"); m.putString("placement", placement); m.putString("format", format.wire)
            m.putDouble("valueMicros", micros.toDouble()); m.putString("currency", currency); m.putString("precision", precision)
            if (source != null) m.putString("source", source)
            emit(m)
        }
        val activity = currentActivity
        var answered = false
        main.post {
            VisionForgeX.initialize(activity ?: ctx.applicationContext, appKey, b.build(), VfxInitListener { st ->
                if (!answered) {
                    answered = true
                    val m = Arguments.createMap()
                    m.putBoolean("ready", st.ready); m.putString("reason", st.reason); m.putBoolean("fromCache", st.fromCache)
                    promise.resolve(m)
                }
            })
        }
    }

    @ReactMethod fun isReady(promise: Promise) { promise.resolve(VisionForgeX.isReady()) }
    @ReactMethod fun fullScreenReady(placement: String, format: String, promise: Promise) { main.post { promise.resolve(fullScreen(placement, format)?.isReady() == true) } }
    @ReactMethod fun load(placement: String, format: String, promise: Promise) { main.post { fullScreen(placement, format)?.load(); promise.resolve(null) } }
    @ReactMethod fun preloadAll(promise: Promise) { main.post { VisionForgeX.preloadAll(); promise.resolve(null) } }
    @ReactMethod fun setKeyValue(key: String, value: String?, promise: Promise) { VisionForgeX.setKeyValue(key, value); promise.resolve(null) }
    @ReactMethod fun isPrivacyOptionsRequired(promise: Promise) { promise.resolve(VisionForgeX.isPrivacyOptionsRequired()) }
    @ReactMethod fun setMuted(muted: Boolean, promise: Promise) { VisionForgeX.setMuted(muted); promise.resolve(null) }
    @ReactMethod fun settingsSource(promise: Promise) { promise.resolve(VisionForgeX.settingsSource()) }
    @ReactMethod fun flush(promise: Promise) { VisionForgeX.flush(); promise.resolve(null) }

    @ReactMethod
    fun showPrivacyOptions(promise: Promise) {
        val a = currentActivity
        if (a == null) { promise.resolve("no activity"); return }
        main.post { VisionForgeX.showPrivacyOptions(a) { err -> promise.resolve(err) } }
    }

    @ReactMethod
    fun openAdInspector(promise: Promise) {
        main.post { VisionForgeX.openAdInspector(currentActivity ?: ctx.applicationContext); promise.resolve(null) }
    }

    @ReactMethod
    fun show(placement: String, format: String, id: Int, promise: Promise) {
        val fs = fullScreen(placement, format)
        val a = currentActivity
        fun answer(shown: Boolean, reason: String?) { val m = Arguments.createMap(); m.putBoolean("shown", shown); if (reason != null) m.putString("reason", reason) else m.putNull("reason"); promise.resolve(m) }
        if (fs == null) { answer(false, "unknown_placement"); return }
        if (a == null) { answer(false, "no_activity"); return }
        var shown = false
        var done = false
        fun finish(reason: String?) { if (!done) { done = true; answer(shown, reason) } }
        fun ev(event: String, extra: (WritableMap) -> Unit = {}) { val m = Arguments.createMap(); m.putString("kind", "show"); m.putInt("id", id); m.putString("event", event); extra(m); emit(m) }
        main.post {
            fs.show(a, object : VfxShowListener {
                override fun onShown() { shown = true; ev("shown") }
                override fun onClicked() { ev("clicked") }
                override fun onDismissed() { finish(null) }
                override fun onNotShown(reason: String) { finish(reason) }
                override fun onReward(type: String, amount: Int) { ev("reward") { it.putString("type", type); it.putInt("amount", amount) } }
            })
        }
    }
}
