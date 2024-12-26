package com.fullviewsdk

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager

class BlockingLayoutViewManager(
  private val callerContext: ReactApplicationContext
) : ViewGroupManager<BlockingLayoutView>() {

  override fun getName() = REACT_CLASS
  override fun createViewInstance(context: ThemedReactContext) =
    BlockingLayoutView(context)

  companion object {
    const val REACT_CLASS = "BlockingLayoutView"
  }
}
