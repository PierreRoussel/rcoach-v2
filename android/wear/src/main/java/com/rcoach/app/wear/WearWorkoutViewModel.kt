package com.rcoach.app.wear

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject

data class WearPreviousSet(
    val weightKg: Double?,
    val reps: Int?,
)

data class WearUiState(
    val sessionActive: Boolean = false,
    val title: String = "",
    val exerciseName: String = "",
    val setNumber: Int = 1,
    val totalSets: Int = 0,
    val weightKg: Double? = null,
    val reps: Int? = null,
    val previousSet: WearPreviousSet? = null,
    val heartRateBpm: Int? = null,
    val estimatedKcal: Int? = null,
    val isResting: Boolean = false,
    val restSecondsLeft: Int = 0,
    val restTargetSeconds: Int = 0,
    val nextStepLabel: String? = null,
    val activeExerciseIndex: Int = 0,
    val activeSetIndex: Int = 0,
    val activeStepIndex: Int = 0,
    val canGoPrev: Boolean = false,
    val canGoNext: Boolean = false,
)

class WearWorkoutViewModel(
    private val repository: WearSyncRepository,
    private val defaultSessionTitle: String,
) : ViewModel() {
    private val _uiState = MutableStateFlow(WearUiState())
    val uiState: StateFlow<WearUiState> = _uiState.asStateFlow()

    private var restJob: Job? = null
    private var totalSteps: Int = 0
    private var activeStepIndex: Int = 0

    init {
        repository.onSnapshot = { json -> applySnapshot(json) }
        repository.start()
        viewModelScope.launch {
            WearSessionBridge.snapshots.collect { json ->
                applySnapshot(json)
            }
        }
    }

    override fun onCleared() {
        repository.stop()
        super.onCleared()
    }

    private fun applySnapshot(json: JSONObject) {
        val sessionId = json.optString("sessionId", "")
        val sessionActive = sessionId.isNotBlank()

        if (!sessionActive) {
            restJob?.cancel()
            totalSteps = 0
            activeStepIndex = 0
            _uiState.value = WearUiState()
            return
        }

        totalSteps = json.optInt("totalSteps", 0)
        activeStepIndex = json.optInt("activeStepIndex", 0)

        val currentStep = json.optJSONObject("currentStep")
        val isResting = json.optBoolean("isResting", false)
        val restSecondsLeft = json.optInt("restSecondsLeft", 0)
        val restTargetSeconds = json.optInt("restTargetSeconds", restSecondsLeft)
        val nextStepLabel = json.optString("nextStepLabel", "").ifBlank { null }

        val exerciseName = currentStep?.optString("exerciseName", "Exercice") ?: "Exercice"
        val setNumber = currentStep?.optInt("setNumber", 1) ?: 1
        val totalSets = currentStep?.optInt("totalSets", 0) ?: 0
        val exerciseIndex = currentStep?.optInt("exerciseIndex", 0) ?: 0
        val setIndex = currentStep?.optInt("setIndex", 0) ?: 0
        val weightKg = if (currentStep != null && currentStep.has("weightKg") && !currentStep.isNull("weightKg")) {
            currentStep.optDouble("weightKg")
        } else {
            null
        }
        val reps = if (currentStep != null && currentStep.has("reps") && !currentStep.isNull("reps")) {
            currentStep.optInt("reps")
        } else {
            null
        }

        val previousSet = currentStep?.optJSONObject("previousSet")?.let { previous ->
            val previousWeight = if (previous.has("weightKg") && !previous.isNull("weightKg")) {
                previous.optDouble("weightKg")
            } else {
                null
            }
            val previousReps = if (previous.has("reps") && !previous.isNull("reps")) {
                previous.optInt("reps")
            } else {
                null
            }
            if (previousWeight == null && previousReps == null) {
                null
            } else {
                WearPreviousSet(weightKg = previousWeight, reps = previousReps)
            }
        }

        val heartRateBpm = if (json.has("heartRateBpm") && !json.isNull("heartRateBpm")) {
            json.optInt("heartRateBpm")
        } else {
            null
        }
        val estimatedKcal = if (json.has("estimatedKcal") && !json.isNull("estimatedKcal")) {
            json.optInt("estimatedKcal")
        } else {
            null
        }

        _uiState.value = WearUiState(
            sessionActive = true,
            title = json.optString("title", defaultSessionTitle),
            exerciseName = exerciseName,
            setNumber = setNumber,
            totalSets = totalSets,
            weightKg = weightKg,
            reps = reps,
            previousSet = previousSet,
            heartRateBpm = heartRateBpm,
            estimatedKcal = estimatedKcal,
            isResting = isResting,
            restSecondsLeft = restSecondsLeft,
            restTargetSeconds = restTargetSeconds,
            nextStepLabel = nextStepLabel,
            activeExerciseIndex = exerciseIndex,
            activeSetIndex = setIndex,
            activeStepIndex = activeStepIndex,
            canGoPrev = activeStepIndex > 0,
            canGoNext = totalSteps > 0 && activeStepIndex < totalSteps - 1,
        )

        if (isResting) {
            startLocalRestTimer(restSecondsLeft)
        } else {
            restJob?.cancel()
        }
    }

    fun setWeight(weightKg: Double) {
        _uiState.value = _uiState.value.copy(weightKg = weightKg.coerceAtLeast(0.0))
    }

    fun setReps(reps: Int) {
        _uiState.value = _uiState.value.copy(reps = reps.coerceAtLeast(0))
    }

    fun adjustRest(deltaSeconds: Int) {
        viewModelScope.launch {
            repository.sendCommand(
                JSONObject()
                    .put("type", "adjustRest")
                    .put("deltaSeconds", deltaSeconds)
                    .toString(),
            )
        }
    }

    fun logSet() {
        val current = _uiState.value
        val command = JSONObject()
            .put("type", "completeStep")
            .put("exerciseIndex", current.activeExerciseIndex)
            .put("setIndex", current.activeSetIndex)
            .put("weightKg", current.weightKg)
            .put("reps", current.reps)
            .put("setType", "normal")

        viewModelScope.launch {
            repository.sendCommand(command.toString())
        }
    }

    fun goToPreviousStep() {
        if (!_uiState.value.canGoPrev) return
        viewModelScope.launch {
            repository.sendCommand(JSONObject().put("type", "prevExercise").toString())
        }
    }

    fun goToNextStep() {
        if (!_uiState.value.canGoNext) return
        viewModelScope.launch {
            repository.sendCommand(JSONObject().put("type", "nextExercise").toString())
        }
    }

    fun skipRest() {
        restJob?.cancel()
        viewModelScope.launch {
            repository.sendCommand(JSONObject().put("type", "skipRest").toString())
        }
    }

    private fun startLocalRestTimer(seconds: Int) {
        restJob?.cancel()
        restJob = viewModelScope.launch {
            var remaining = seconds
            while (remaining >= 0) {
                _uiState.value = _uiState.value.copy(isResting = true, restSecondsLeft = remaining)
                if (remaining == 0) break
                delay(1000)
                remaining -= 1
            }
        }
    }
}
