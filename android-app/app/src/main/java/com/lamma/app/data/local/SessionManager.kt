package com.lamma.app.data.local

import android.app.ActivityManager
import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.lamma.app.data.model.Member
import com.lamma.app.data.model.ThemeMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "lamma_session_prefs")

class SessionManager(private val context: Context) {
    private val json = Json { ignoreUnknownKeys = true }

    companion object {
        val KEY_CURRENT_MEMBER = stringPreferencesKey("current_member")
        val KEY_THEME_MODE = stringPreferencesKey("theme_mode")
        val KEY_LARGE_TEXT = booleanPreferencesKey("large_text_mode")
        val KEY_SOUND_ENABLED = booleanPreferencesKey("sound_enabled")
        val KEY_ULTRA_LITE = booleanPreferencesKey("ultra_lite_mode")
    }

    /**
     * Checks if the device has low RAM (<= 2GB) to suggest or auto-enable Ultra-Lite Mode.
     */
    fun isLowRamDevice(): Boolean {
        return try {
            val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            am?.isLowRamDevice ?: false
        } catch (e: Exception) {
            false
        }
    }

    val currentMemberFlow: Flow<Member?> = context.dataStore.data.map { prefs ->
        val memberJson = prefs[KEY_CURRENT_MEMBER]
        if (memberJson != null) {
            try {
                json.decodeFromString<Member>(memberJson)
            } catch (e: Exception) {
                null
            }
        } else null
    }

    val themeModeFlow: Flow<ThemeMode> = context.dataStore.data.map { prefs ->
        when (prefs[KEY_THEME_MODE]) {
            ThemeMode.VELVET_INK.name -> ThemeMode.VELVET_INK
            else -> ThemeMode.SAKURA_DUSK
        }
    }

    val largeTextFlow: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[KEY_LARGE_TEXT] ?: false
    }

    val soundEnabledFlow: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[KEY_SOUND_ENABLED] ?: true
    }

    val ultraLiteFlow: Flow<Boolean> = context.dataStore.data.map { prefs ->
        // Default to true if low RAM device detected, otherwise false
        prefs[KEY_ULTRA_LITE] ?: isLowRamDevice()
    }

    suspend fun saveCurrentMember(member: Member) {
        context.dataStore.edit { prefs ->
            prefs[KEY_CURRENT_MEMBER] = json.encodeToString(Member.serializer(), member)
        }
    }

    suspend fun updateMemberClearedAt(clearedAt: String) {
        context.dataStore.edit { prefs ->
            val memberJson = prefs[KEY_CURRENT_MEMBER]
            if (memberJson != null) {
                try {
                    val current = json.decodeFromString<Member>(memberJson)
                    val updated = current.copy(clearedAt = clearedAt)
                    prefs[KEY_CURRENT_MEMBER] = json.encodeToString(Member.serializer(), updated)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    suspend fun clearCurrentMember() {
        context.dataStore.edit { prefs ->
            prefs.remove(KEY_CURRENT_MEMBER)
        }
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        context.dataStore.edit { prefs ->
            prefs[KEY_THEME_MODE] = mode.name
        }
    }

    suspend fun setLargeText(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[KEY_LARGE_TEXT] = enabled
        }
    }

    suspend fun setSoundEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[KEY_SOUND_ENABLED] = enabled
        }
    }

    suspend fun setUltraLiteMode(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[KEY_ULTRA_LITE] = enabled
        }
    }
}
