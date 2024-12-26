package com.fullviewsdk

import android.content.Context
import android.view.SurfaceView
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT


class BlockingView(context: Context) : SurfaceView(context) {
  init {
    id = View.generateViewId()
    setSecure(true)
    setZOrderOnTop(true)
    isDrawingCacheEnabled = true
    drawingCacheBackgroundColor = resources.getColor(android.R.color.black)
    val params = ViewGroup.LayoutParams(MATCH_PARENT, MATCH_PARENT)
    layoutParams = params
  }
}
