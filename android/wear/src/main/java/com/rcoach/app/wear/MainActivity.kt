package com.rcoach.app.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.wearable.Wearable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        registerWearCapability()
        setContent {
            MaterialTheme {
                ProvideWearSyncRepository {
                    WearApp()
                }
            }
        }
    }

    private fun registerWearCapability() {
        lifecycleScope.launch {
            try {
                Wearable.getCapabilityClient(this@MainActivity)
                    .addLocalCapability(WEAR_CAPABILITY)
                    .await()
            } catch (_: Exception) {
                // Déjà enregistrée ou indisponible hors Google Play Services.
            }
        }
    }

    companion object {
        private const val WEAR_CAPABILITY = "rcoach_wear"
    }
}

@Composable
fun WearApp() {
    val context = LocalContext.current
    val viewModel: WearWorkoutViewModel = viewModel(
        factory = WearWorkoutViewModelFactory(
            LocalWearSyncRepository.current,
            context.getString(R.string.wear_default_session_title),
        ),
    )
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().padding(8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (!state.sessionActive) {
            Text(
                stringResource(R.string.wear_idle_message),
                textAlign = TextAlign.Center,
            )
            return@Column
        }

        Text(state.title, textAlign = TextAlign.Center)
        Text(state.exerciseName, textAlign = TextAlign.Center)

        if (state.isResting) {
            Text(stringResource(R.string.wear_rest_label, state.restSecondsLeft))
            state.nextStepLabel?.let { label ->
                Text(label, textAlign = TextAlign.Center)
            }
            Button(onClick = { viewModel.adjustRest(-15) }) { Text("-15s") }
            Button(onClick = { viewModel.adjustRest(15) }) { Text("+15s") }
            Button(onClick = { viewModel.skipRest() }) {
                Text(stringResource(R.string.wear_skip_rest))
            }
            return@Column
        }

        Text(stringResource(R.string.wear_set_label, state.setNumber))
        Text(
            if (state.weightKg != null) {
                stringResource(R.string.wear_weight_label, state.weightKg.toString())
            } else {
                stringResource(R.string.wear_weight_missing)
            },
        )
        Text(
            if (state.reps != null) {
                stringResource(R.string.wear_reps_label, state.reps.toString())
            } else {
                stringResource(R.string.wear_reps_missing)
            },
        )
        Button(onClick = { viewModel.adjustWeight(-2.5) }) {
            Text(stringResource(R.string.wear_adjust_weight_minus))
        }
        Button(onClick = { viewModel.adjustWeight(2.5) }) {
            Text(stringResource(R.string.wear_adjust_weight_plus))
        }
        Button(onClick = { viewModel.adjustReps(-1) }) {
            Text(stringResource(R.string.wear_adjust_reps_minus))
        }
        Button(onClick = { viewModel.adjustReps(1) }) {
            Text(stringResource(R.string.wear_adjust_reps_plus))
        }
        Button(onClick = { viewModel.logSet() }) {
            Text(stringResource(R.string.wear_log_set))
        }
    }
}
