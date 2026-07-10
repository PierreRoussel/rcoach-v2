package com.rcoach.app.wear

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider

val LocalWearSyncRepository = staticCompositionLocalOf<WearSyncRepository> {
    error("WearSyncRepository not provided")
}

class WearWorkoutViewModelFactory(
    private val repository: WearSyncRepository,
    private val defaultSessionTitle: String,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return WearWorkoutViewModel(repository, defaultSessionTitle) as T
    }
}

@Composable
fun ProvideWearSyncRepository(content: @Composable () -> Unit) {
    val context = LocalContext.current
    CompositionLocalProvider(LocalWearSyncRepository provides WearSyncRepository(context)) {
        content()
    }
}
