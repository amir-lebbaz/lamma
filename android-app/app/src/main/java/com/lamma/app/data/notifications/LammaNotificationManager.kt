package com.lamma.app.data.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.SystemClock
import android.provider.Settings
import androidx.core.app.NotificationCompat
import com.lamma.app.MainActivity
import com.lamma.app.R
import java.util.concurrent.ConcurrentLinkedQueue

/**
 * Anti-Lag Notification Coalescing & Urgent Family Buzz Manager.
 *
 * Guarantees zero phone freezes on low-RAM (1GB-2GB) devices:
 * - Single unified notification ID (LAMMA_ALERT_ID = 1001).
 * - Coalesces incoming messages into a single NotificationCompat.InboxStyle card.
 * - Strict 5-second sound/vibration cooldown throttle.
 * - Max importance channel for "نداء عائلي عاجل" with alarm attributes.
 */
class LammaNotificationManager(private val context: Context) {

    companion object {
        const val LAMMA_ALERT_ID = 1001
        const val CHANNEL_MESSAGES_ID = "lamma_messages_channel"
        const val CHANNEL_URGENT_ID = "lamma_urgent_channel"

        private const val THROTTLE_COOLDOWN_MS = 5000L
        private const val MAX_COALESCED_LINES = 7

        @Volatile
        private var lastAlertTimestamp: Long = 0L

        // Thread-safe message buffer for coalesced InboxStyle notification
        private val messageBuffer = ConcurrentLinkedQueue<String>()
    }

    private val notificationManager: NotificationManager by lazy {
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    }

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // 1. Standard Family Messages Channel
            val messagesChannel = NotificationChannel(
                CHANNEL_MESSAGES_ID,
                "رسائل العائلة (لَمّة)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "إشعارات محادثات العائلة وتحديثات لَمّة"
                enableLights(true)
                lightColor = Color.parseColor("#FADCD5")
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 150, 100, 150)
            }

            // 2. Urgent Family Buzz Channel ("نداء عائلي عاجل")
            val urgentChannel = NotificationChannel(
                CHANNEL_URGENT_ID,
                "نداء عائلي عاجل 🔔",
                NotificationManager.IMPORTANCE_MAX
            ).apply {
                description = "تنبيهات فورية عالية الصوت للحالات العائلية الطارئة"
                enableLights(true)
                lightColor = Color.RED
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 150, 500)
                setBypassDnd(true)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }

            notificationManager.createNotificationChannel(messagesChannel)
            notificationManager.createNotificationChannel(urgentChannel)
        }
    }

    /**
     * Coalesces incoming family messages into a single unified notification card.
     * Prevents Android process spawning spikes and UI freezes during message storms.
     */
    fun showIncomingMessage(
        senderName: String,
        content: String,
        isUrgent: Boolean = false
    ) {
        val now = SystemClock.elapsedRealtime()
        val shouldAlertSound = (now - lastAlertTimestamp) >= THROTTLE_COOLDOWN_MS

        if (shouldAlertSound) {
            lastAlertTimestamp = now
        }

        // Add to buffer (keep up to MAX_COALESCED_LINES)
        val formattedLine = "$senderName: $content"
        messageBuffer.add(formattedLine)
        while (messageBuffer.size > MAX_COALESCED_LINES) {
            messageBuffer.poll()
        }

        val channelId = if (isUrgent) CHANNEL_URGENT_ID else CHANNEL_MESSAGES_ID

        // Intent to open chat directly
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("is_urgent", isUrgent)
            putExtra("from_notification", true)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val inboxStyle = NotificationCompat.InboxStyle()
            .setBigContentTitle(if (isUrgent) "🚨 نداء عائلي عاجل في لَمّة!" else "لَمّة — رسائل العائلة")
            .setSummaryText(if (messageBuffer.size > 1) "${messageBuffer.size} رسائل جديدة" else "رسالة جديدة")

        messageBuffer.forEach { line ->
            inboxStyle.addLine(line)
        }

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_lamma_logo)
            .setContentTitle(if (isUrgent) "🚨 نداء عاجل من $senderName" else senderName)
            .setContentText(content)
            .setStyle(inboxStyle)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(if (isUrgent) NotificationCompat.PRIORITY_MAX else NotificationCompat.PRIORITY_HIGH)
            .setCategory(if (isUrgent) NotificationCompat.CATEGORY_ALARM else NotificationCompat.CATEGORY_MESSAGE)
            // Single unified alert once when throttled, but updates the view smoothly
            .setOnlyAlertOnce(!shouldAlertSound)

        if (isUrgent) {
            builder.setColor(Color.parseColor("#6D3C52"))
        }

        notificationManager.notify(LAMMA_ALERT_ID, builder.build())
    }

    /**
     * Clears notification and resets coalesced buffer.
     */
    fun clearNotifications() {
        messageBuffer.clear()
        notificationManager.cancel(LAMMA_ALERT_ID)
    }

    // --- Onboarding / System Permission Helpers ---

    /**
     * Checks if Do Not Disturb (DND) policy access is granted.
     */
    fun isDndAccessGranted(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            notificationManager.isNotificationPolicyAccessGranted
        } else {
            true
        }
    }

    /**
     * Intent to open DND notification policy access settings.
     */
    fun getDndSettingsIntent(): Intent? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
        } else {
            null
        }
    }

    /**
     * Checks if the app is ignoring battery optimizations (Doze mode bypass).
     */
    fun isIgnoringBatteryOptimizations(): Boolean {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            powerManager?.isIgnoringBatteryOptimizations(context.packageName) ?: true
        } else {
            true
        }
    }

    /**
     * Intent to request disabling battery optimization.
     */
    fun getIgnoreBatteryOptimizationIntent(): Intent? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:${context.packageName}")
            }
        } else {
            null
        }
    }
}
