package com.lamma.app.data.notifications

import android.content.Context
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.lamma.app.data.local.SoundManager

/**
 * FCM High-Priority Data Payload Handler for «لَمّة».
 *
 * Designed specifically for low-end devices and Android Doze Mode:
 * - Wakes the phone cleanly using high-priority FCM data payloads without background polling.
 * - Passes incoming data directly to LammaNotificationManager for coalescing (single LAMMA_ALERT_ID).
 * - Distinguishes between standard chat messages and "نداء عائلي عاجل" (Urgent Buzz).
 */
class LammaFCMService : FirebaseMessagingService() {

    private val notificationManager by lazy { LammaNotificationManager(applicationContext) }
    private val soundManager by lazy { SoundManager(applicationContext) }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.i(TAG, "FCM registration token refreshed: $token")
        // Store or broadcast token to Supabase `family_members` for webhook push routing
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "FCM message received from: ${remoteMessage.from}")

        // 1. Process High-Priority Data Payloads
        val data = remoteMessage.data
        if (data.isNotEmpty()) {
            val type = data["type"] ?: "message"
            val senderName = data["sender_name"] ?: "أحد أفراد العائلة"
            val content = data["content"] ?: "رسالة جديدة في لَمّة"
            val isUrgent = (type == "urgent_buzz") || (data["is_urgent"] == "true")

            if (isUrgent) {
                // Play penetrating alarm tone and double-pulse vibration
                soundManager.playUrgentFamilyBuzz(enabled = true)
            }

            // Coalesce into unified notification card with 5s cooldown
            notificationManager.showIncomingMessage(
                senderName = senderName,
                content = content,
                isUrgent = isUrgent
            )
            return
        }

        // 2. Fallback for standard notification payload
        remoteMessage.notification?.let { notif ->
            val title = notif.title ?: "لَمّة"
            val body = notif.body ?: ""
            notificationManager.showIncomingMessage(
                senderName = title,
                content = body,
                isUrgent = false
            )
        }
    }

    companion object {
        private const val TAG = "LammaFCMService"
    }
}
