package com.fullviewsdk

import android.content.Context
import android.widget.FrameLayout

class BlockingLayoutView(context: Context) : FrameLayout(context) {
  private val measureAndLayout = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  override fun requestLayout() {
    super.requestLayout()
    post(measureAndLayout)
  }

}
