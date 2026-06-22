package com.rcoach.app.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                ProvideWearSyncRepository {
                    WearApp()
                }
            }
        }
    }
}

@Composable
fun WearApp() {
    val viewModel: WearWorkoutViewModel = viewModel(
        factory = WearWorkoutViewModelFactory(LocalWearSyncRepository.current)
    )
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().padding(8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (!state.sessionActive) {
            Text("Ouvrez une seance sur RCoach", textAlign = TextAlign.Center)
            return@Column
        }

        Text(state.title, textAlign = TextAlign.Center)
        Text(state.exerciseName, textAlign = TextAlign.Center)

        if (state.isResting) {
            Text("Repos ${state.restSecondsLeft}s")
            Button(onClick = { viewModel.skipRest() }) { Text("Passer") }
            return@Column
        }

        Text("Serie ${state.setNumber}")
        Text("Poids: ${state.weightKg ?: "-"} kg")
        Text("Reps: ${state.reps ?: "-"}")
        Button(onClick = { viewModel.adjustWeight(-2.5) }) { Text("-2.5") }
        Button(onClick = { viewModel.adjustWeight(2.5) }) { Text("+2.5") }
        Button(onClick = { viewModel.adjustReps(-1) }) { Text("-1 rep") }
        Button(onClick = { viewModel.adjustReps(1) }) { Text("+1 rep") }
        Button(onClick = { viewModel.logSet() }) { Text("Valider") }
    }
}
