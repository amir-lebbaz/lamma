package com.lamma.app

import android.app.ActivityManager
import android.app.Application
import android.content.Context
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.disk.DiskCache
import coil.memory.MemoryCache
import com.lamma.app.data.local.MediaManager
import com.lamma.app.data.local.SessionManager
import com.lamma.app.data.local.SoundManager
import com.lamma.app.data.notifications.LammaNotificationManager
import com.lamma.app.data.supabase.ChatRepository

class LammaApp : Application(), ImageLoaderFactory {

    lateinit var sessionManager: SessionManager
        private set

    lateinit var mediaManager: MediaManager
        private set

    lateinit var soundManager: SoundManager
        private set

    lateinit var repository: ChatRepository
        private set

    lateinit var notificationManager: LammaNotificationManager
        private set

    override fun onCreate() {
        super.onCreate()
        sessionManager = SessionManager(this)
        mediaManager = MediaManager(this)
        soundManager = SoundManager(this)
        repository = ChatRepository()
        notificationManager = LammaNotificationManager(this)
    }

    override fun newImageLoader(): ImageLoader {
        val am = getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val isLowRam = am?.isLowRamDevice ?: false

        return ImageLoader.Builder(this)
            .memoryCache {
                MemoryCache.Builder(this)
                    .maxSizePercent(if (isLowRam) 0.10 else 0.20)
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(cacheDir.resolve("coil_cache"))
                    .maxSizeBytes(15L * 1024 * 1024)
                    .build()
            }
            .crossfade(!isLowRam)
            .build()
    }
}
