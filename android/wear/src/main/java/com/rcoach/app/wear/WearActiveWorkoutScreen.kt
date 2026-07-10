package com.rcoach.app.wear

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.foundation.background
import androidx.compose.foundation.basicMarquee
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.layout.widthIn
import androidx.compose.ui.platform.LocalConfiguration
import androidx.wear.compose.material.Scaffold
import androidx.wear.compose.material.Vignette
import androidx.wear.compose.material.VignettePosition
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.Text
import kotlinx.coroutines.delay
import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.util.Locale
import kotlin.math.roundToInt

private val WearBackground = Color.Black
private val WearBlue = Color(0xFF3B82F6)
private val WearBoxBackground = Color(0xFF1C1C1E)
private val WearMuted = Color(0xFF8E8E93)

private enum class PickerMode {
    None,
    Weight,
    Reps,
}

private val WearRoundHorizontalPadding = 18.dp
private val WearRoundTopPadding = 20.dp
private val WearRoundBottomPadding = 18.dp

@Composable
private fun Modifier.wearRoundSafePadding(): Modifier {
    val screenWidth = LocalConfiguration.current.screenWidthDp.dp
    val horizontal = maxOf(WearRoundHorizontalPadding, screenWidth * 0.14f)
    return this.padding(
        start = horizontal,
        end = horizontal,
        top = WearRoundTopPadding,
        bottom = WearRoundBottomPadding,
    )
}

@Composable
fun WearActiveWorkoutScreen(
    state: WearUiState,
    onWeightChange: (Double) -> Unit,
    onRepsChange: (Int) -> Unit,
    onLogSet: () -> Unit,
    onPrevStep: () -> Unit,
    onNextStep: () -> Unit,
) {
    var pickerMode by remember { mutableStateOf(PickerMode.None) }

    Scaffold(
        vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) },
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(WearBackground)
                .wearRoundSafePadding(),
        ) {
            when (pickerMode) {
                PickerMode.Weight -> WeightPickerOverlay(
                    currentWeight = state.weightKg,
                    onConfirm = { weight ->
                        onWeightChange(weight)
                        pickerMode = PickerMode.None
                    },
                    onDismiss = { pickerMode = PickerMode.None },
                )

                PickerMode.Reps -> RepsPickerOverlay(
                    currentReps = state.reps,
                    onConfirm = { reps ->
                        onRepsChange(reps)
                        pickerMode = PickerMode.None
                    },
                    onDismiss = { pickerMode = PickerMode.None },
                )

                PickerMode.None -> ActiveWorkoutContent(
                    state = state,
                    onWeightTap = { pickerMode = PickerMode.Weight },
                    onRepsTap = { pickerMode = PickerMode.Reps },
                    onLogSet = onLogSet,
                    onPrevStep = onPrevStep,
                    onNextStep = onNextStep,
                )
            }
        }
    }
}

@Composable
private fun ActiveWorkoutContent(
    state: WearUiState,
    onWeightTap: () -> Unit,
    onRepsTap: () -> Unit,
    onLogSet: () -> Unit,
    onPrevStep: () -> Unit,
    onNextStep: () -> Unit,
) {
    val stepKey = "${state.activeExerciseIndex}-${state.activeSetIndex}-${state.setNumber}"
    var navDirection by remember { mutableIntStateOf(0) }
    var lastStepIndex by remember { mutableIntStateOf(state.activeStepIndex) }

    LaunchedEffect(state.activeStepIndex) {
        if (state.activeStepIndex != lastStepIndex && navDirection == 0) {
            navDirection = if (state.activeStepIndex > lastStepIndex) 1 else -1
        }
        lastStepIndex = state.activeStepIndex
    }

    LaunchedEffect(stepKey) {
        delay(320)
        navDirection = 0
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 50.dp),
            contentAlignment = Alignment.Center,
        ) {
            AnimatedContent(
                targetState = stepKey,
                modifier = Modifier.fillMaxWidth(),
                transitionSpec = {
                val towardsNext = navDirection >= 0
                val enterOffset: (Int) -> Int = { width -> if (towardsNext) width else -width }
                val exitOffset: (Int) -> Int = { width -> if (towardsNext) -width else width }
                (slideInHorizontally(animationSpec = tween(280), initialOffsetX = enterOffset) +
                    fadeIn(animationSpec = tween(220))) togetherWith
                    (slideOutHorizontally(animationSpec = tween(280), targetOffsetX = exitOffset) +
                        fadeOut(animationSpec = tween(220)))
            },
            label = "wearStepCarousel",
        ) {
            WorkoutStepPanel(
                state = state,
                onWeightTap = onWeightTap,
                onRepsTap = onRepsTap,
            )
        }
        }

        BottomActionBar(
            modifier = Modifier.align(Alignment.BottomCenter),
            canGoPrev = state.canGoPrev,
            canGoNext = state.canGoNext,
            onLogSet = onLogSet,
            onPrevStep = {
                navDirection = -1
                onPrevStep()
            },
            onNextStep = {
                navDirection = 1
                onNextStep()
            },
        )
    }
}

@Composable
private fun WorkoutStepPanel(
    state: WearUiState,
    onWeightTap: () -> Unit,
    onRepsTap: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = state.exerciseName,
            modifier = Modifier
                .fillMaxWidth()
                .basicMarquee(iterations = Int.MAX_VALUE),
            color = Color.White,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center,
            maxLines = 1,
            overflow = TextOverflow.Visible,
            lineHeight = 16.sp,
        )

        Spacer(modifier = Modifier.height(4.dp))

        StatsRow(
            setNumber = state.setNumber,
            totalSets = state.totalSets,
            heartRateBpm = state.heartRateBpm,
            estimatedKcal = state.estimatedKcal,
        )

        Spacer(modifier = Modifier.height(6.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 160.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
        ) {
            ValueBox(
                label = stringResource(R.string.wear_label_kg),
                value = formatWeight(state.weightKg),
                valueColor = WearBlue,
                onClick = onWeightTap,
                modifier = Modifier.weight(1f),
            )
            ValueBox(
                label = stringResource(R.string.wear_label_reps),
                value = state.reps?.toString() ?: "-",
                valueColor = Color.White,
                onClick = onRepsTap,
                modifier = Modifier.weight(1f),
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        PreviousSetLine(previousSet = state.previousSet)
    }
}

@Composable
private fun StatsRow(
    setNumber: Int,
    totalSets: Int,
    heartRateBpm: Int?,
    estimatedKcal: Int?,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = if (totalSets > 0) "$setNumber/$totalSets" else setNumber.toString(),
            color = Color.White,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
        )
        Text(
            text = "♥ ${heartRateBpm ?: "-"}",
            color = Color.White,
            fontSize = 13.sp,
        )
        Text(
            text = "🔥 ${estimatedKcal ?: "-"}",
            color = Color.White,
            fontSize = 13.sp,
        )
    }
}

@Composable
private fun ValueBox(
    label: String,
    value: String,
    valueColor: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = label,
            color = WearBlue,
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium,
        )
        Spacer(modifier = Modifier.height(2.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(WearBoxBackground)
                .clickable(onClick = onClick)
                .padding(vertical = 6.dp, horizontal = 4.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = value,
                color = valueColor,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun PreviousSetLine(previousSet: WearPreviousSet?) {
    val text = when {
        previousSet == null -> null
        previousSet.weightKg != null && previousSet.reps != null ->
            stringResource(
                R.string.wear_previous_set,
                formatWeightCompact(previousSet.weightKg),
                previousSet.reps.toString(),
            )
        previousSet.weightKg != null ->
            stringResource(R.string.wear_previous_set_weight_only, formatWeightCompact(previousSet.weightKg))
        previousSet.reps != null ->
            stringResource(R.string.wear_previous_set_reps_only, previousSet.reps.toString())
        else -> null
    }

    if (text != null) {
        Text(
            text = text,
            color = WearMuted,
            fontSize = 10.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun BottomActionBar(
    modifier: Modifier = Modifier,
    canGoPrev: Boolean,
    canGoNext: Boolean,
    onLogSet: () -> Unit,
    onPrevStep: () -> Unit,
    onNextStep: () -> Unit,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = 2.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        NavArrow(
            symbol = "<",
            enabled = canGoPrev,
            onClick = onPrevStep,
        )

        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(WearBlue)
                .clickable(onClick = onLogSet),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "✓",
                color = Color.White,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
            )
        }

        NavArrow(
            symbol = ">",
            enabled = canGoNext,
            onClick = onNextStep,
        )
    }
}

@Composable
private fun NavArrow(
    symbol: String,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .size(32.dp)
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = symbol,
            color = if (enabled) Color.White else WearMuted,
            fontSize = 20.sp,
            fontWeight = FontWeight.Medium,
        )
    }
}

@Composable
private fun WeightPickerOverlay(
    currentWeight: Double?,
    onConfirm: (Double) -> Unit,
    onDismiss: () -> Unit,
) {
    val weights = remember {
        (0..400).map { index -> index * 0.5 }
    }
    val initialIndex = remember(currentWeight) {
        val target = currentWeight ?: 0.0
        weights.indices.minByOrNull { index ->
            kotlin.math.abs(weights[index] - target)
        } ?: 0
    }
    val listState = rememberScalingLazyListState(initialCenterItemIndex = initialIndex)

    PickerOverlay(
        title = stringResource(R.string.wear_label_kg),
        listState = listState,
        itemCount = weights.size,
        itemLabel = { index -> formatWeight(weights[index]) },
        onConfirm = {
            val index = listState.centerItemIndex.coerceIn(0, weights.lastIndex)
            onConfirm(weights[index])
        },
        onDismiss = onDismiss,
    )
}

@Composable
private fun RepsPickerOverlay(
    currentReps: Int?,
    onConfirm: (Int) -> Unit,
    onDismiss: () -> Unit,
) {
    val repsValues = remember { (0..100).toList() }
    val initialIndex = (currentReps ?: 0).coerceIn(0, repsValues.lastIndex)
    val listState = rememberScalingLazyListState(initialCenterItemIndex = initialIndex)

    PickerOverlay(
        title = stringResource(R.string.wear_label_reps),
        listState = listState,
        itemCount = repsValues.size,
        itemLabel = { index -> repsValues[index].toString() },
        onConfirm = {
            val index = listState.centerItemIndex.coerceIn(0, repsValues.lastIndex)
            onConfirm(repsValues[index])
        },
        onDismiss = onDismiss,
    )
}

@Composable
private fun PickerOverlay(
    title: String,
    listState: androidx.wear.compose.foundation.lazy.ScalingLazyListState,
    itemCount: Int,
    itemLabel: (Int) -> String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = title,
            color = WearBlue,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
        )

        Spacer(modifier = Modifier.height(4.dp))

        ScalingLazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            state = listState,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            items(itemCount) { index ->
                val isSelected = index == listState.centerItemIndex
                Text(
                    text = itemLabel(index),
                    color = if (isSelected) Color.White else WearMuted,
                    fontSize = if (isSelected) 24.sp else 16.sp,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                    modifier = Modifier.padding(vertical = 6.dp),
                )
            }
        }

        Button(
            onClick = onConfirm,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 2.dp),
        ) {
            Text(stringResource(R.string.wear_picker_confirm))
        }

        Button(onClick = onDismiss) {
            Text(stringResource(R.string.wear_picker_cancel))
        }
    }
}

@Composable
fun WearRestScreen(
    restSecondsLeft: Int,
    nextStepLabel: String?,
    onAdjustRest: (Int) -> Unit,
    onSkipRest: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(WearBackground)
            .padding(8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            stringResource(R.string.wear_rest_label, restSecondsLeft),
            textAlign = TextAlign.Center,
            color = Color.White,
        )
        nextStepLabel?.let { label ->
            Text(label, textAlign = TextAlign.Center, color = WearMuted)
        }
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Button(onClick = { onAdjustRest(-15) }) { Text("-15s") }
            Button(onClick = { onAdjustRest(15) }) { Text("+15s") }
        }
        Button(onClick = onSkipRest) {
            Text(stringResource(R.string.wear_skip_rest))
        }
    }
}

private fun formatWeight(weightKg: Double?): String {
    if (weightKg == null) return "-"
    val symbols = DecimalFormatSymbols(Locale.FRANCE)
    val formatter = DecimalFormat("#0.0", symbols)
    return formatter.format(weightKg)
}

private fun formatWeightCompact(weightKg: Double): String {
    val rounded = (weightKg * 2).roundToInt() / 2.0
    return if (rounded == rounded.roundToInt().toDouble()) {
        "${rounded.roundToInt()}kg"
    } else {
        "${formatWeight(rounded)}kg"
    }
}
