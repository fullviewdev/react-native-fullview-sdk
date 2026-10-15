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
    // The secure flag only blanks compositor captures. A replay frame is a software draw of the
    // view tree, where a SurfaceView paints nothing and z-order-on-top stops it punching a hole,
    // so the SDK paints this area out by tag instead. Spelled out rather than referenced from the
    // SDK because this module cannot reach its constants across the minified AAR; pinned by
    // BlockingViewTest.
    tag = REDACTION_TAG
    layoutParams = ViewGroup.LayoutParams(MATCH_PARENT, MATCH_PARENT)
  }

  companion object {
    /** Must equal `io.fullview.fullview_sdk.helpers.RedactionMask.TAG`. */
    const val REDACTION_TAG = "io.fullview.sdk.redacted"
  }
}
