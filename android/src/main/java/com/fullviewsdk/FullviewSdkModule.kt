package com.fullviewsdk

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import io.fullview.fullview_sdk.Fullview
import io.fullview.fullview_sdk.Region
import io.fullview.fullview_sdk.HostType
import io.fullview.fullview_sdk.HubLayout


class FullviewSdkModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  private lateinit var sdk: Fullview
  private var isAttached = false

  override fun getName(): String {
    return NAME
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  fun multiply(a: Double, b: Double, promise: Promise) {
    promise.resolve(a * b)
  }

  @ReactMethod
  fun attach(promise: Promise) {
    if (isAttached.not()) {
      currentActivity?.apply {
        sdk = Fullview()
        runOnUiThread {
          sdk.attach(this, HostType.REACT_NATIVE)
          isAttached = true
          promise.resolve(null)
        }
      }
    }
  }

  @ReactMethod
  fun register(
    region: String,
    organisationId: String,
    userId: String,
    deviceId: String,
    name: String,
    email: String,
    promise: Promise
  ) {
    sdk.register(organisationId, userId, deviceId, name, email, Region.valueOf(region.toUpperCase()), HubLayout.DEFAULT)
    promise.resolve(null)
  }

  @ReactMethod
  fun logout(promise: Promise) {
    sdk.logout()
    promise.resolve(null)
  }

  @ReactMethod
  fun requestCoBrowse(promise: Promise) {
    sdk.requestCoBrowse()
    promise.resolve(null)
  }

  @ReactMethod
  fun cancelCoBrowseRequest(promise: Promise) {
    sdk.cancelCoBrowseRequest()
    promise.resolve(null)
  }

  @ReactMethod
  fun getPositionInCoBrowseQueue(promise: Promise) {
    promise.resolve(sdk.positionInCoBrowseQueue.replayCache.lastOrNull() ?: -1)
  }

  @ReactMethod
  fun getState(promise: Promise) {
    promise.resolve(sdk.sessionState.replayCache.lastOrNull()?.javaClass?.simpleName ?: "")
  }

  companion object {
    const val NAME = "FullviewSdk"
  }
}
