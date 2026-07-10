package com.rcoach.wearbridge

import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.wearable.CapabilityClient
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable

@CapacitorPlugin(name = "WearBridge")
class WearBridgePlugin : Plugin() {

    companion object {
        private const val TAG = "WearBridge"
        private const val WATCH_CAPABILITY = "rcoach_wear"
        private const val PHONE_CAPABILITY = "rcoach_phone"
    }

    override fun load() {
        super.load()
        WearBridgePluginHolder.plugin = this
        registerPhoneCapability()
    }

    override fun handleOnDestroy() {
        WearBridgePluginHolder.plugin = null
        super.handleOnDestroy()
    }

    private fun registerPhoneCapability() {
        Wearable.getCapabilityClient(appContext)
            .addLocalCapability(PHONE_CAPABILITY)
            .addOnFailureListener { error ->
                Log.w(TAG, "Phone capability already registered or unavailable", error)
            }
    }

    private val appContext
        get() = context.applicationContext

    @PluginMethod
    fun isWatchAvailable(call: PluginCall) {
        detectWatchStatus { available, paired, hasRcoachWear ->
            val result = JSObject()
            result.put("available", available)
            result.put("paired", paired)
            result.put("hasRcoachWear", hasRcoachWear)
            call.resolve(result)
        }
    }

    private fun detectWatchStatus(
        callback: (available: Boolean, paired: Boolean, hasRcoachWear: Boolean) -> Unit,
    ) {
        val capabilityClient = Wearable.getCapabilityClient(appContext)
        val nodeClient = Wearable.getNodeClient(appContext)

        capabilityClient
            .getCapability(WATCH_CAPABILITY, CapabilityClient.FILTER_ALL)
            .addOnSuccessListener { capabilityInfo ->
                val capabilityNodes = capabilityInfo.nodes
                val hasRcoachWear = capabilityNodes.isNotEmpty()

                nodeClient.connectedNodes
                    .addOnSuccessListener { connectedNodes ->
                        val paired = connectedNodes.isNotEmpty() || hasRcoachWear
                        val available = hasRcoachWear || connectedNodes.isNotEmpty()
                        Log.d(
                            TAG,
                            "watch status connected=${connectedNodes.size} capability=${capabilityNodes.size}",
                        )
                        callback(available, paired, hasRcoachWear)
                    }
                    .addOnFailureListener {
                        callback(hasRcoachWear, hasRcoachWear, hasRcoachWear)
                    }
            }
            .addOnFailureListener {
                nodeClient.connectedNodes
                    .addOnSuccessListener { connectedNodes ->
                        val paired = connectedNodes.isNotEmpty()
                        callback(paired, paired, false)
                    }
                    .addOnFailureListener {
                        callback(false, false, false)
                    }
            }
    }

    @PluginMethod
    fun publishSnapshot(call: PluginCall) {
        val snapshotJson = call.getString("snapshotJson")
        if (snapshotJson.isNullOrBlank()) {
            call.reject("snapshotJson is required")
            return
        }

        val request = PutDataMapRequest.create("/rcoach/workout_snapshot")
        request.dataMap.putString("snapshotJson", snapshotJson)
        request.dataMap.putLong("updatedAt", System.currentTimeMillis())

        Wearable.getDataClient(appContext)
            .putDataItem(request.asPutDataRequest().setUrgent())
            .addOnSuccessListener {
                Log.d(TAG, "Published workout snapshot to wear data layer")
                call.resolve()
            }
            .addOnFailureListener { error ->
                Log.e(TAG, "Unable to publish workout snapshot", error)
                call.reject(error.message ?: "Unable to publish snapshot")
            }
    }

    fun emitWatchCommand(commandJson: String) {
        val payload = JSObject()
        payload.put("commandJson", commandJson)
        notifyListeners("watchCommand", payload)
    }
}
