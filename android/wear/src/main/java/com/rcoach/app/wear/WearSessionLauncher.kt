package com.rcoach.app.wear

import android.content.Context
import android.content.Intent
import org.json.JSONObject

object WearSessionLauncher {
    private var lastLaunchedSessionId: String? = null

    fun handleSnapshot(context: Context, snapshotJson: String) {
        val sessionId = runCatching {
            JSONObject(snapshotJson).optString("sessionId", "")
        }.getOrElse { "" }

        if (sessionId.isBlank()) {
            lastLaunchedSessionId = null
            return
        }

        if (sessionId == lastLaunchedSessionId) {
            return
        }

        lastLaunchedSessionId = sessionId
        openMainActivity(context)
    }

    fun openMainActivity(context: Context) {
        val intent = Intent(context, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        context.startActivity(intent)
    }
}
