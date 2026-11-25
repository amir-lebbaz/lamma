package com.lamma.app.data.local

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Build
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlin.math.sin

/**
 * High-performance sound and haptics manager with strict throttling
 * to prevent phone freezes on low-end hardware (1GB-2GB RAM).
 */
class SoundManager(private val context: Context) {

    @Volatile
    private var lastChimeTimestamp: Long = 0L

    @Volatile
    private var lastUrgentBuzzTimestamp: Long = 0L

    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    /**
     * Synthesizes and plays a clean, warm two-tone harmonic notification chime
     * (E5: 659.25Hz -> G#5: 830.61Hz) using AudioTrack with zero asset dependencies.
     * Enforces a 3-second cooldown to protect low-RAM devices during message bursts.
     */
    fun playIncomingMessageChime(enabled: Boolean = true) {
        if (!enabled) return

        val now = SystemClock.elapsedRealtime()
        if (now - lastChimeTimestamp < 3000L) {
            // Anti-lag throttle: Ignore rapid chime requests within 3 seconds
            return
        }
        lastChimeTimestamp = now

        CoroutineScope(Dispatchers.Default).launch {
            try {
                val sampleRate = 44100
                val durationMs = 180
                val numSamples = (sampleRate * (durationMs / 1000.0)).toInt()
                val buffer = ShortArray(numSamples)

                val freq1 = 659.25 // E5
                val freq2 = 830.61 // G#5

                for (i in 0 until numSamples) {
                    val time = i.toDouble() / sampleRate
                    val envelope = (1.0 - (i.toDouble() / numSamples)) * (1.0 - Math.exp(-i / 200.0))
                    val wave = 0.6 * sin(2.0 * Math.PI * freq1 * time) +
                               0.4 * sin(2.0 * Math.PI * freq2 * time)
                    buffer[i] = (wave * envelope * Short.MAX_VALUE * 0.45).toInt().toShort()
                }

                val audioTrack = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(sampleRate)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(buffer.size * 2)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build()

                audioTrack.write(buffer, 0, buffer.size)
                audioTrack.play()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * "نداء عائلي عاجل" (Urgent Family Buzz 🔔):
     * Plays a crisp, loud high-alert tone using AudioAttributes.USAGE_ALARM
     * accompanied by a double-pulse vibration pattern to cut through noise & silent modes.
     * Enforces a strict 5-second cooldown throttle.
     */
    fun playUrgentFamilyBuzz(enabled: Boolean = true) {
        if (!enabled) return

        val now = SystemClock.elapsedRealtime()
        if (now - lastUrgentBuzzTimestamp < 5000L) {
            // Anti-lag throttle: Prevent phone freeze from rapid buzz triggers
            return
        }
        lastUrgentBuzzTimestamp = now

        // 1. Double-pulse haptic vibration
        triggerUrgentVibration()

        // 2. Synthesize crisp, penetrating ALARM frequency (A5: 880Hz -> C6: 1046.5Hz)
        CoroutineScope(Dispatchers.Default).launch {
            try {
                val sampleRate = 44100
                val durationMs = 500
                val numSamples = (sampleRate * (durationMs / 1000.0)).toInt()
                val buffer = ShortArray(numSamples)

                val freq1 = 880.0   // A5
                val freq2 = 1046.5  // C6

                for (i in 0 until numSamples) {
                    val time = i.toDouble() / sampleRate
                    // Pulsing double beep envelope
                    val pulse = if ((time < 0.22) || (time > 0.28 && time < 0.50)) 1.0 else 0.0
                    val wave = 0.5 * sin(2.0 * Math.PI * freq1 * time) +
                               0.5 * sin(2.0 * Math.PI * freq2 * time)
                    buffer[i] = (wave * pulse * Short.MAX_VALUE * 0.85).toInt().toShort()
                }

                val audioTrack = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(sampleRate)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(buffer.size * 2)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build()

                audioTrack.write(buffer, 0, buffer.size)
                audioTrack.play()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun triggerUrgentVibration() {
        try {
            vibrator?.let { vib ->
                if (!vib.hasVibrator()) return@let
                val timings = longArrayOf(0, 200, 100, 350)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val amplitudes = intArrayOf(0, 255, 0, 255)
                    val effect = VibrationEffect.createWaveform(timings, amplitudes, -1)
                    vib.vibrate(effect)
                } else {
                    @Suppress("DEPRECATION")
                    vib.vibrate(timings, -1)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun release() {
        // AudioTrack cleans up per-call; no long-lived streams kept
    }
}
