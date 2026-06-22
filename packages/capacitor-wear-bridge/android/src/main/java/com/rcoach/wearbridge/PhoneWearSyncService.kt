package com.rcoach.wearbridge

import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService

class PhoneWearSyncService : WearableListenerService() {
    override fun onMessageReceived(messageEvent: MessageEvent) {
        if (messageEvent.path != "/rcoach/watch_command") {
            return
        }

        val commandJson = String(messageEvent.data, Charsets.UTF_8)
        WearBridgePluginHolder.plugin?.emitWatchCommand(commandJson)
    }
}
