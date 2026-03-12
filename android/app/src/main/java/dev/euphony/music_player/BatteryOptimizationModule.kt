package com.startune.music

import android.content.Intent
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BatteryOptimizationModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "BatteryOptimization"

  private fun resolveTargetPackage(packageName: String?): String {
    val context = reactApplicationContext
    return if (packageName.isNullOrBlank()) {
      context.packageName
    } else {
      packageName
    }
  }

  @ReactMethod
  fun isIgnoringBatteryOptimizations(packageName: String?, promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        promise.resolve(true)
        return
      }

      val context = reactApplicationContext
      val powerManager = context.getSystemService(PowerManager::class.java)
      if (powerManager == null) {
        promise.resolve(false)
        return
      }

      val targetPackage = resolveTargetPackage(packageName)

      promise.resolve(powerManager.isIgnoringBatteryOptimizations(targetPackage))
    } catch (error: Exception) {
      promise.reject("BATTERY_OPTIMIZATION_CHECK_FAILED", error)
    }
  }

  @ReactMethod
  fun openBatteryOptimizationSettings(promise: Promise) {
    try {
      val settingsIntent =
        Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

      reactApplicationContext.startActivity(settingsIntent)
      promise.resolve("settings_opened")
    } catch (error: Exception) {
      promise.reject("BATTERY_OPTIMIZATION_SETTINGS_OPEN_FAILED", error)
    }
  }

  @ReactMethod
  fun requestIgnoreBatteryOptimizations(packageName: String?, promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        promise.resolve("unsupported")
        return
      }

      val context = reactApplicationContext
      val targetPackage = resolveTargetPackage(packageName)

      val powerManager = context.getSystemService(PowerManager::class.java)
      if (powerManager?.isIgnoringBatteryOptimizations(targetPackage) == true) {
        promise.resolve("already_ignored")
        return
      }

      val requestIntent =
        Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
          data = Uri.parse("package:$targetPackage")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

      try {
        context.startActivity(requestIntent)
        promise.resolve("dialog_opened")
        return
      } catch (_: Exception) {
        // Fall through to battery optimization settings list.
      }

      val settingsIntent =
        Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

      try {
        context.startActivity(settingsIntent)
        promise.resolve("settings_opened")
        return
      } catch (_: Exception) {
        // Continue to unsupported if settings page is unavailable.
      }

      promise.resolve("unsupported")
    } catch (error: Exception) {
      promise.reject("BATTERY_OPTIMIZATION_REQUEST_FAILED", error)
    }
  }
}
