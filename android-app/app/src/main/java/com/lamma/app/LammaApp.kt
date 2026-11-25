package com.lamma.app

import android.app.Application
import com.lamma.app.data.local.MediaManager
import com.lamma.app.data.local.SessionManager
import com.lamma.app.data.local.SoundManager
import com.lamma.app.data.notifications.LammaNotificationManager
import com.lamma.app.data.supabase.ChatRepository

class LammaApp : Application() {

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
}
