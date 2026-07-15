package com.rcoach.app.wear

import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService

class WearListenerService : WearableListenerService() {
    override fun onMessageReceived(messageEvent: MessageEvent) {
        if (messageEvent.path != OPEN_SESSION_PATH) {
            return
        }

        WearSessionLauncher.openMainActivity(applicationContext)
    }

    companion object {
        const val OPEN_SESSION_PATH = "/rcoach/open_session"
    }
}
