package com.lamma.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.lifecycleScope
import com.lamma.app.data.model.Member
import com.lamma.app.data.model.ThemeMode
import com.lamma.app.ui.screens.AuthScreen
import com.lamma.app.ui.screens.ChatScreen
import com.lamma.app.ui.theme.LammaAppTheme
import com.lamma.app.ui.theme.LammaTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as LammaApp
        val sessionManager = app.sessionManager
        val repository = app.repository
        val mediaManager = app.mediaManager
        val soundManager = app.soundManager

        setContent {
            val currentMember by sessionManager.currentMemberFlow.collectAsState(initial = null)
            val savedThemeMode by sessionManager.themeModeFlow.collectAsState(initial = ThemeMode.SAKURA_DUSK)
            val isLargeText by sessionManager.largeTextFlow.collectAsState(initial = false)
            val isSoundEnabled by sessionManager.soundEnabledFlow.collectAsState(initial = true)
            val isUltraLite by sessionManager.ultraLiteFlow.collectAsState(initial = sessionManager.isLowRamDevice())

            LaunchedEffect(currentMember?.id, currentMember?.clearedAt) {
                if (currentMember != null) {
                    repository.setClearedAtCutoff(currentMember?.clearedAt)
                    repository.loadInitialData(currentMember?.clearedAt)
                }
            }

            val currentTheme = when (savedThemeMode) {
                ThemeMode.VELVET_INK -> LammaTheme.VELVET_INK
                else -> LammaTheme.SAKURA_DUSK
            }

            LammaAppTheme(
                theme = currentTheme,
                isLargeText = isLargeText,
                isUltraLite = isUltraLite
            ) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    if (currentMember == null) {
                        AuthScreen(
                            repository = repository,
                            onLoginSuccess = { member ->
                                lifecycleScope.launch {
                                    sessionManager.saveCurrentMember(member)
                                }
                            }
                        )
                    } else {
                        ChatScreen(
                            currentMember = currentMember!!,
                            repository = repository,
                            mediaManager = mediaManager,
                            soundManager = soundManager,
                            currentTheme = currentTheme,
                            isLargeText = isLargeText,
                            isSoundEnabled = isSoundEnabled,
                            isUltraLite = isUltraLite,
                            onSelectTheme = { selected ->
                                lifecycleScope.launch {
                                    sessionManager.setThemeMode(
                                        if (selected == LammaTheme.VELVET_INK) ThemeMode.VELVET_INK else ThemeMode.SAKURA_DUSK
                                    )
                                }
                            },
                            onToggleLargeText = { enabled ->
                                lifecycleScope.launch {
                                    sessionManager.setLargeText(enabled)
                                }
                            },
                            onToggleSound = { enabled ->
                                lifecycleScope.launch {
                                    sessionManager.setSoundEnabled(enabled)
                                }
                            },
                            onToggleUltraLite = { enabled ->
                                lifecycleScope.launch {
                                    sessionManager.setUltraLiteMode(enabled)
                                }
                            },
                            onLogout = {
                                lifecycleScope.launch {
                                    sessionManager.clearCurrentMember()
                                }
                            },
                            onClearChat = {
                                lifecycleScope.launch {
                                    currentMember?.let { member ->
                                        val clearedAt = repository.clearChatForUser(member)
                                        sessionManager.updateMemberClearedAt(clearedAt)
                                    }
                                }
                            }
                        )
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        (application as LammaApp).soundManager.release()
    }
}
