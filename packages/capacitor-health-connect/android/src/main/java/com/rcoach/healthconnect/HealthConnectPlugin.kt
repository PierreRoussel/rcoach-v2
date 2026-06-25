package com.rcoach.healthconnect

import android.content.Intent
import android.os.Build
import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.time.Instant
import java.time.ZoneOffset
import java.util.UUID
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@CapacitorPlugin(name = "HealthConnect")
class HealthConnectPlugin : Plugin() {

    private var permissionCall: PluginCall? = null
    private var permissionLauncher: ActivityResultLauncher<Set<String>>? = null

    private val healthPermissions: Set<String> by lazy {
        setOf(
            HealthPermission.getWritePermission(ExerciseSessionRecord::class),
            HealthPermission.getReadPermission(ExerciseSessionRecord::class),
            HealthPermission.getReadPermission(HeartRateRecord::class),
        )
    }

    private val heartRateReadPermission: String by lazy {
        HealthPermission.getReadPermission(HeartRateRecord::class)
    }

    override fun load() {
        super.load()
        val activity = activity ?: return
        permissionLauncher = activity.registerForActivityResult(
            PermissionController.createRequestPermissionResultContract(),
        ) { granted ->
            val call = permissionCall
            permissionCall = null
            if (call == null) {
                return@registerForActivityResult
            }

            val result = JSObject()
            result.put("granted", granted.containsAll(healthPermissions))
            call.resolve(result)
        }
    }

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val result = JSObject()
        result.put("status", resolveAvailabilityStatus())
        call.resolve(result)
    }

    @PluginMethod
    fun getPermissionStatus(call: PluginCall) {
        if (!isHealthConnectReady()) {
            val result = JSObject()
            result.put("granted", false)
            call.resolve(result)
            return
        }

        CoroutineScope(Dispatchers.Main).launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val granted = client.permissionController.getGrantedPermissions()
                val result = JSObject()
                result.put("granted", granted.containsAll(healthPermissions))
                call.resolve(result)
            } catch (error: Exception) {
                call.reject(error.message ?: "Unable to read Health Connect permissions")
            }
        }
    }

    @PluginMethod
    fun requestHealthPermissions(call: PluginCall) {
        if (!isHealthConnectReady()) {
            call.reject("Health Connect is not available on this device")
            return
        }

        val launcher = permissionLauncher
        if (launcher == null) {
            call.reject("Unable to request permissions")
            return
        }

        permissionCall = call
        launcher.launch(healthPermissions)
    }

    @PluginMethod
    fun writeExerciseSession(call: PluginCall) {
        val clientRecordId = call.getString("clientRecordId")
        val title = call.getString("title")
        val startTime = call.getString("startTime")
        val endTime = call.getString("endTime")
        val exerciseType = call.getString("exerciseType") ?: "STRENGTH_TRAINING"

        if (clientRecordId.isNullOrBlank() || title.isNullOrBlank() || startTime.isNullOrBlank() || endTime.isNullOrBlank()) {
            call.reject("clientRecordId, title, startTime and endTime are required")
            return
        }

        if (!isHealthConnectReady()) {
            call.reject("Health Connect is not available on this device")
            return
        }

        CoroutineScope(Dispatchers.Main).launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val granted = client.permissionController.getGrantedPermissions()
                if (!granted.containsAll(healthPermissions)) {
                    call.reject("Health Connect exercise permissions are not granted")
                    return@launch
                }

                val startInstant = Instant.parse(startTime)
                val endInstant = Instant.parse(endTime)
                if (!endInstant.isAfter(startInstant)) {
                    call.reject("endTime must be after startTime")
                    return@launch
                }

                val record = ExerciseSessionRecord(
                    startTime = startInstant,
                    startZoneOffset = ZoneOffset.UTC,
                    endTime = endInstant,
                    endZoneOffset = ZoneOffset.UTC,
                    exerciseType = mapExerciseType(exerciseType),
                    title = title,
                    metadata = Metadata(
                        clientRecordId = parseClientRecordId(clientRecordId),
                        recordingMethod = Metadata.RECORDING_METHOD_ACTIVELY_RECORDED,
                    ),
                )

                withContext(Dispatchers.IO) {
                    client.insertRecords(listOf(record))
                }

                call.resolve()
            } catch (error: Exception) {
                call.reject(error.message ?: "Unable to write exercise session")
            }
        }
    }

    @PluginMethod
    fun readHeartRateSummary(call: PluginCall) {
        val startTime = call.getString("startTime")
        val endTime = call.getString("endTime")

        if (startTime.isNullOrBlank() || endTime.isNullOrBlank()) {
            call.reject("startTime and endTime are required")
            return
        }

        if (!isHealthConnectReady()) {
            val result = JSObject()
            result.put("sampleCount", 0)
            call.resolve(result)
            return
        }

        CoroutineScope(Dispatchers.Main).launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val granted = client.permissionController.getGrantedPermissions()

                if (!granted.contains(heartRateReadPermission)) {
                    val result = JSObject()
                    result.put("sampleCount", 0)
                    call.resolve(result)
                    return@launch
                }

                val startInstant = Instant.parse(startTime)
                val endInstant = Instant.parse(endTime)
                if (!endInstant.isAfter(startInstant)) {
                    val result = JSObject()
                    result.put("sampleCount", 0)
                    call.resolve(result)
                    return@launch
                }

                val response = withContext(Dispatchers.IO) {
                    client.readRecords(
                        ReadRecordsRequest(
                            recordType = HeartRateRecord::class,
                            timeRangeFilter = TimeRangeFilter.between(startInstant, endInstant),
                        ),
                    )
                }

                var weightedSum = 0.0
                var totalWeightSeconds = 0.0
                var maxBpm = 0L
                var sampleCount = 0

                for (record in response.records) {
                    val heartRateRecord = record as HeartRateRecord
                    val samples = heartRateRecord.samples

                    for (index in samples.indices) {
                        val sample = samples[index]
                        val bpm = sample.beatsPerMinute.toLong()
                        maxBpm = maxOf(maxBpm, bpm)
                        sampleCount += 1

                        val sampleStart = sample.time
                        val sampleEnd = if (index < samples.lastIndex) {
                            samples[index + 1].time
                        } else {
                            heartRateRecord.endTime
                        }

                        val durationSeconds = java.time.Duration
                            .between(sampleStart, sampleEnd)
                            .seconds
                            .coerceAtLeast(1)

                        weightedSum += bpm * durationSeconds
                        totalWeightSeconds += durationSeconds.toDouble()
                    }
                }

                val result = JSObject()
                result.put("sampleCount", sampleCount)

                if (sampleCount > 0 && totalWeightSeconds > 0) {
                    result.put("avgBpm", kotlin.math.round(weightedSum / totalWeightSeconds).toInt())
                    result.put("maxBpm", maxBpm.toInt())
                }

                call.resolve(result)
            } catch (_: Exception) {
                val result = JSObject()
                result.put("sampleCount", 0)
                call.resolve(result)
            }
        }
    }

    @PluginMethod
    fun openHealthConnectSettings(call: PluginCall) {
        if (!isHealthConnectReady()) {
            call.reject("Health Connect is not available on this device")
            return
        }

        try {
            val intent = Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            call.resolve()
        } catch (error: Exception) {
            call.reject(error.message ?: "Unable to open Health Connect settings")
        }
    }

    private fun resolveAvailabilityStatus(): String {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return "NotSupported"
        }

        return when (HealthConnectClient.getSdkStatus(context)) {
            HealthConnectClient.SDK_AVAILABLE -> "Available"
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "NotInstalled"
            else -> "NotSupported"
        }
    }

    private fun isHealthConnectReady(): Boolean {
        return resolveAvailabilityStatus() == "Available"
    }

    private fun mapExerciseType(value: String): Int {
        return when (value) {
            "STRENGTH_TRAINING" -> ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING
            else -> ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING
        }
    }

    private fun parseClientRecordId(value: String): String {
        return try {
            UUID.fromString(value)
            value
        } catch (_: IllegalArgumentException) {
            UUID.nameUUIDFromBytes(value.toByteArray(Charsets.UTF_8)).toString()
        }
    }
}
