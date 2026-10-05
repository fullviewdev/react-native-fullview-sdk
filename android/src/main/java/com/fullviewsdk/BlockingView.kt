package com.fullviewsdk

import android.content.Context
import android.view.SurfaceView
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT

/** Secure surface laid over redacted content; the SDK's screenshots see black here. */
class BlockingView(context: Context) : SurfaceView(context) {
  init {
    id = View.generateViewId()
    setSecure(true)
    setZOrderOnTop(true)
    layoutParams = ViewGroup.LayoutParams(MATCH_PARENT, MATCH_PARENT)
  }
}
