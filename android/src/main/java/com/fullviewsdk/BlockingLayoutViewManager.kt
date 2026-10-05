package com.fullviewsdk

import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.BlockingLayoutViewManagerDelegate
import com.facebook.react.viewmanagers.BlockingLayoutViewManagerInterface

@ReactModule(name = BlockingLayoutViewManager.NAME)
class BlockingLayoutViewManager : ViewGroupManager<BlockingLayoutView>(),
  BlockingLayoutViewManagerInterface<BlockingLayoutView> {

  private val delegate = BlockingLayoutViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<BlockingLayoutView> = delegate
  override fun getName() = NAME
  override fun createViewInstance(context: ThemedReactContext) = BlockingLayoutView(context)

  override fun addView(parent: BlockingLayoutView, child: View, index: Int) {
    parent.addView(child, ViewGroup.LayoutParams(MATCH_PARENT, MATCH_PARENT))
    parent.invalidate()
  }

  override fun needsCustomLayoutForChildren(): Boolean = true

  companion object {
    const val NAME = "BlockingLayoutView"
  }
}
