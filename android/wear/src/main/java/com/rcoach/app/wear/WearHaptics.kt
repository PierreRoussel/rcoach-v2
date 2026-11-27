package com.rcoach.app.wear

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/** Rest complete — align phone/EMOM `[50, 40, 50]`. */
private val REST_COMPLETE_PATTERN = longArrayOf(0, 50, 40, 50)

object WearHaptics {
    fun pulseRestComplete(context: Context) {
        try {
            val vibrator = resolveVibrator(context) ?: return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(
                    VibrationEffect.createWaveform(REST_COMPLETE_PATTERN, -1),
                )
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(REST_COMPLETE_PATTERN, -1)
            }
        } catch (_: Exception) {
            // DND / power-save / missing vibrator — silent
        }
    }

    private fun resolveVibrator(context: Context): Vibrator? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager =
                context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }
}
