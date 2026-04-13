package expo.modules.kioskmode

import android.app.Activity
import android.app.ActivityManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KioskModeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KioskMode")

    Function("startLockTask") {
      val activity = appContext.currentActivity ?: return@Function
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        activity.startLockTask()
      }
    }

    Function("stopLockTask") {
      val activity = appContext.currentActivity ?: return@Function
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        activity.stopLockTask()
      }
    }

    Function("isLockTaskActive") {
      isLockTaskActive(appContext.currentActivity)
    }
  }

  private fun isLockTaskActive(activity: Activity?): Boolean {
    if (activity == null) return false

    val manager = activity.getSystemService(Activity.ACTIVITY_SERVICE) as ActivityManager
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      manager.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
    } else {
      @Suppress("DEPRECATION")
      manager.isInLockTaskMode
    }
  }
}
