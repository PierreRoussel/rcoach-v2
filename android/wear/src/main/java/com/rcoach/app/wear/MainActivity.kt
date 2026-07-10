package com.rcoach.app.wear

import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.wearable.DataMapItem
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
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        registerWearCapability()
        refreshLatestWorkoutSnapshot()
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

    private fun refreshLatestWorkoutSnapshot() {
        lifecycleScope.launch {
            try {
                val items = Wearable.getDataClient(this@MainActivity)
                    .getDataItems(Uri.parse("wear://*/rcoach/workout_snapshot"))
                    .await()

                val latest = items.maxByOrNull { item ->
                    DataMapItem.fromDataItem(item).dataMap.getLong("updatedAt", 0L)
                } ?: return@launch

                val snapshotJson = DataMapItem.fromDataItem(latest).dataMap
                    .getString("snapshotJson")
                    ?: return@launch

                WearSessionBridge.emitSnapshot(JSONObject(snapshotJson))
            } catch (_: Exception) {
                // Pas de snapshot en cache — normal hors séance.
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

    if (!state.sessionActive) {
        Column(
            modifier = Modifier.fillMaxSize().padding(8.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                stringResource(R.string.wear_idle_message),
                textAlign = TextAlign.Center,
            )
        }
        return
    }

    if (state.isResting) {
        WearRestScreen(
            restSecondsLeft = state.restSecondsLeft,
            nextStepLabel = state.nextStepLabel,
            onAdjustRest = viewModel::adjustRest,
            onSkipRest = viewModel::skipRest,
        )
        return
    }

    WearActiveWorkoutScreen(
        state = state,
        onWeightChange = viewModel::setWeight,
        onRepsChange = viewModel::setReps,
        onLogSet = viewModel::logSet,
        onPrevStep = viewModel::goToPreviousStep,
        onNextStep = viewModel::goToNextStep,
    )
}
