package com.rcoach.app.wear

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import org.json.JSONObject

object WearSessionBridge {
    private val _snapshots = MutableSharedFlow<JSONObject>(extraBufferCapacity = 1)

    val snapshots: SharedFlow<JSONObject> = _snapshots.asSharedFlow()

    fun emitSnapshot(snapshotJson: JSONObject) {
        _snapshots.tryEmit(snapshotJson)
    }
}
