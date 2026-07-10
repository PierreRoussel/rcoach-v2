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

data class WearUiState(
    val sessionActive: Boolean = false,
    val title: String = "",
    val exerciseName: String = "",
    val setNumber: Int = 1,
    val weightKg: Double? = null,
    val reps: Int? = null,
    val isResting: Boolean = false,
    val restSecondsLeft: Int = 0,
    val restTargetSeconds: Int = 0,
    val nextStepLabel: String? = null,
    val activeExerciseIndex: Int = 0,
    val activeSetIndex: Int = 0,
)

class WearWorkoutViewModel(
    private val repository: WearSyncRepository,
    private val defaultSessionTitle: String,
) : ViewModel() {
    private val _uiState = MutableStateFlow(WearUiState())
    val uiState: StateFlow<WearUiState> = _uiState.asStateFlow()

    private var restJob: Job? = null

    init {
        repository.onSnapshot = { json -> applySnapshot(json) }
        repository.start()
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
            _uiState.value = WearUiState()
            return
        }

        val currentStep = json.optJSONObject("currentStep")
        val isResting = json.optBoolean("isResting", false)
        val restSecondsLeft = json.optInt("restSecondsLeft", 0)
        val restTargetSeconds = json.optInt("restTargetSeconds", restSecondsLeft)
        val nextStepLabel = json.optString("nextStepLabel", "").ifBlank { null }

        val exerciseName = currentStep?.optString("exerciseName", "Exercice") ?: "Exercice"
        val setNumber = currentStep?.optInt("setNumber", 1) ?: 1
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

        _uiState.value = WearUiState(
            sessionActive = true,
            title = json.optString("title", defaultSessionTitle),
            exerciseName = exerciseName,
            setNumber = setNumber,
            weightKg = weightKg,
            reps = reps,
            isResting = isResting,
            restSecondsLeft = restSecondsLeft,
            restTargetSeconds = restTargetSeconds,
            nextStepLabel = nextStepLabel,
            activeExerciseIndex = exerciseIndex,
            activeSetIndex = setIndex,
        )

        if (isResting) {
            startLocalRestTimer(restSecondsLeft)
        } else {
            restJob?.cancel()
        }
    }

    fun adjustWeight(delta: Double) {
        val current = _uiState.value
        val next = ((current.weightKg ?: 0.0) + delta).coerceAtLeast(0.0)
        _uiState.value = current.copy(weightKg = kotlin.math.round(next * 2) / 2.0)
    }

    fun adjustReps(delta: Int) {
        val current = _uiState.value
        _uiState.value = current.copy(reps = ((current.reps ?: 0) + delta).coerceAtLeast(0))
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
