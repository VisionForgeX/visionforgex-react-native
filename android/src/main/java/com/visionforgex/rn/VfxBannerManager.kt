package com.visionforgex.rn

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.visionforgex.ads.VfxBannerView

/** React Native does not lay out native children after the first pass; the container does it when the banner changes size. */
class BannerContainer(context: Context) : FrameLayout(context) {
    private val banner = VfxBannerView(context)
    init { addView(banner, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)) }
    fun setPlacement(p: String) { if (banner.placement != p) banner.placement = p }
    override fun requestLayout() {
        super.requestLayout()
        post {
            measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY))
            layout(left, top, right, bottom)
        }
    }
}

class VfxBannerManager : SimpleViewManager<BannerContainer>() {
    override fun getName(): String = "VfxBannerView"
    override fun createViewInstance(context: ThemedReactContext): BannerContainer = BannerContainer(context)
    @ReactProp(name = "placement") fun setPlacement(view: BannerContainer, placement: String?) { view.setPlacement(placement ?: "") }
}
