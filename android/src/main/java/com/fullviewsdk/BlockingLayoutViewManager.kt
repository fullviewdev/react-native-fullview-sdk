package com.fullviewsdk

import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager

class BlockingLayoutViewManager(
  private val callerContext: ReactApplicationContext
) : ViewGroupManager<BlockingLayoutView>() {

  override fun getName() = REACT_CLASS
  override fun createViewInstance(context: ThemedReactContext) = BlockingLayoutView(context)

  override fun addView(parent: BlockingLayoutView, child: View, index: Int) {
    parent.addView(child, ViewGroup.LayoutParams(MATCH_PARENT, MATCH_PARENT))
    parent.invalidate()
  }

  override fun addViews(parent: BlockingLayoutView, views: MutableList<View>) {
    views.forEach {
      parent.addView(it, ViewGroup.LayoutParams(MATCH_PARENT, MATCH_PARENT))
    }
    parent.invalidate()
  }

  override fun needsCustomLayoutForChildren(): Boolean {
    return true
  }

  companion object {
    const val REACT_CLASS = "BlockingLayoutView"
  }
}
