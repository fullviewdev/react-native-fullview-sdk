package com.fullviewsdk

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.BlockingViewManagerDelegate
import com.facebook.react.viewmanagers.BlockingViewManagerInterface

@ReactModule(name = BlockingViewManager.NAME)
class BlockingViewManager : SimpleViewManager<BlockingView>(), BlockingViewManagerInterface<BlockingView> {

  private val delegate = BlockingViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<BlockingView> = delegate
  override fun getName() = NAME
  override fun createViewInstance(context: ThemedReactContext) = BlockingView(context)

  companion object {
    const val NAME = "BlockingView"
  }
}
