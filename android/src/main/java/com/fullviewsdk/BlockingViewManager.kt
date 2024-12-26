package com.fullviewsdk

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager

class BlockingViewManager(
  private val callerContext: ReactApplicationContext
) : SimpleViewManager<BlockingView>() {

  override fun getName() = REACT_CLASS
  override fun createViewInstance(context: ThemedReactContext) =
    BlockingView(context)

  companion object {
    const val REACT_CLASS = "BlockingView"
  }
}
