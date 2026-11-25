package com.lamma.app.data.presence

import android.content.Context
import android.content.Intent
import android.net.Uri
import java.time.Duration
import java.time.Instant

/**
 * Real-time member presence calculation & Offline zero-balance USSD bridge.
 *
 * Strictly adheres to:
 * - Accurate Arabic presence strings («متصل الآن 🟢» vs «غير متصل منذ X دقيقة ⚪»)
 * - Zero SMS sending (NO SEND_SMS permission, NO background SMS charges)
 * - Safe carrier Call-Me-Back USSD dialer via Intent.ACTION_DIAL
 */
object PresenceManager {

    /**
     * Formats real-time presence status in Arabic based on last_seen timestamp.
     */
    fun formatPresence(lastSeenIso: String?): String {
        if (lastSeenIso.isNullOrBlank()) {
            return "غير متصل 🔴"
        }

        return try {
            val lastSeen = Instant.parse(lastSeenIso)
            val now = Instant.now()
            val diffMinutes = Duration.between(lastSeen, now).toMinutes()

            when {
                diffMinutes < 2 -> "متصل الآن 🟢"
                diffMinutes < 60 -> "غير متصل منذ $diffMinutes دقيقة 🔴"
                diffMinutes < 1440 -> {
                    val hours = diffMinutes / 60
                    "غير متصل منذ $hours ساعة 🔴"
                }
                else -> {
                    val days = diffMinutes / 1440
                    "غير متصل منذ $days يوم 🔴"
                }
            }
        } catch (e: Exception) {
            "غير متصل 🔴"
        }
    }

    /**
     * Checks if a member is currently considered offline (inactive > 2 minutes).
     */
    fun isOffline(lastSeenIso: String?): Boolean {
        if (lastSeenIso.isNullOrBlank()) return true
        return try {
            val lastSeen = Instant.parse(lastSeenIso)
            val now = Instant.now()
            Duration.between(lastSeen, now).toMinutes() >= 2
        } catch (e: Exception) {
            true
        }
    }

    /**
     * Carrier Call-Me-Back USSD Presets (North Africa & Middle East zero-balance services).
     */
    enum class CarrierUssdPreset(val title: String, val dialCode: String) {
        GENERAL("عام / رصيد صفر", "*100#"),
        DJEZZY_MOBILIS("اتصل بي (Djezzy / Mobilis)", "*606#"),
        OOREDOO("عاودلي (Ooredoo)", "*444#"),
        VODAFONE_ORANGE("كلمني شكراً (Vodafone / Orange)", "*505#"),
        STC_ZAIN("اتصل بي (STC / Zain)", "*177#")
    }

    /**
     * Generates an Intent to open the phone's native dialer with the USSD code.
     * Uses Intent.ACTION_DIAL to present the code safely to the user.
     *
     * STRICT CONSTRAINT: Uses ACTION_DIAL, NOT ACTION_CALL or SEND_SMS.
     * Never performs unauthorized dialing or paid SMS transmissions.
     */
    fun createUssdDialIntent(ussdCode: String = "*100#"): Intent {
        val encodedCode = Uri.encode(ussdCode)
        return Intent(Intent.ACTION_DIAL).apply {
            data = Uri.parse("tel:$encodedCode")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
    }
}
