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
)

class WearWorkoutViewModel(
    private val repository: WearSyncRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(WearUiState())
    val uiState: StateFlow<WearUiState> = _uiState.asStateFlow()

    private var restJob: Job? = null
    private var activeExerciseIndex = 0

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
        val exercises = json.optJSONArray("exercises")
        activeExerciseIndex = json.optInt("activeExerciseIndex", 0)

        if (!sessionActive || exercises == null || exercises.length() == 0) {
            restJob?.cancel()
            _uiState.value = WearUiState()
            return
        }

        val exercise = exercises.getJSONObject(activeExerciseIndex.coerceAtMost(exercises.length() - 1))
        val setsCount = exercise.optInt("setsCount", 0)
        val suggested = exercise.optJSONObject("suggestedSet")
        val isResting = json.optBoolean("isResting", false)
        val restSecondsLeft = json.optInt("restSecondsLeft", 0)

        _uiState.value = WearUiState(
            sessionActive = true,
            title = json.optString("title", "Seance"),
            exerciseName = exercise.optString("exerciseName", "Exercice"),
            setNumber = setsCount + 1,
            weightKg = if (suggested != null && suggested.has("weightKg") && !suggested.isNull("weightKg")) suggested.optDouble("weightKg") else null,
            reps = if (suggested != null && suggested.has("reps") && !suggested.isNull("reps")) suggested.optInt("reps") else null,
            isResting = isResting,
            restSecondsLeft = restSecondsLeft,
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

    fun logSet() {
        val current = _uiState.value
        val command = JSONObject()
            .put("type", "logSet")
            .put("exerciseIndex", activeExerciseIndex)
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
