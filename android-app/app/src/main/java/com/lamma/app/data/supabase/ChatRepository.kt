package com.lamma.app.data.supabase

import com.lamma.app.data.model.ChecklistItem
import com.lamma.app.data.model.Member
import com.lamma.app.data.model.Message
import com.lamma.app.data.model.Reaction
import com.lamma.app.data.model.Room
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.PostgresAction
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.util.UUID

class ChatRepository(
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) {
    private val json = Json { ignoreUnknownKeys = true }

    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()

    private val _members = MutableStateFlow<List<Member>>(emptyList())
    val members: StateFlow<List<Member>> = _members.asStateFlow()

    private val _room = MutableStateFlow(Room())
    val room: StateFlow<Room> = _room.asStateFlow()

    private val _checklist = MutableStateFlow<List<ChecklistItem>>(emptyList())
    val checklist: StateFlow<List<ChecklistItem>> = _checklist.asStateFlow()

    private val _typingMember = MutableStateFlow<String?>(null)
    val typingMember: StateFlow<String?> = _typingMember.asStateFlow()

    fun setTyping(memberName: String, isTyping: Boolean) {
        _typingMember.value = if (isTyping) memberName else null
    }

    init {
        scope.launch {
            loadInitialData()
            setupRealtimeSubscriptions()
        }
    }

    suspend fun loadInitialData() = withContext(Dispatchers.IO) {
        try {
            // Load Room
            val roomData = LammaSupabase.postgrest.from("family_rooms")
                .select {
                    filter { eq("id", "bayt-al-aela") }
                }.decodeSingleOrNull<Room>()
            if (roomData != null) {
                _room.value = roomData
            }

            // Load Members
            val membersList = LammaSupabase.postgrest.from("family_members")
                .select {
                    order("created_at", Order.ASCENDING)
                }.decodeList<Member>()
            _members.value = membersList

            // Load Messages
            val msgs = LammaSupabase.postgrest.from("family_messages")
                .select {
                    filter { eq("room_id", "bayt-al-aela") }
                    order("created_at", Order.DESCENDING)
                    limit(50)
                }.decodeList<Message>()
            _messages.value = msgs
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private suspend fun setupRealtimeSubscriptions() {
        try {
            val channel = LammaSupabase.realtime.channel("lamma-room-channel")
            
            val messageFlow = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
                table = "family_messages"
            }

            channel.subscribe()

            scope.launch {
                messageFlow.collect { action ->
                    when (action) {
                        is PostgresAction.Insert -> {
                            val record = action.record
                            try {
                                val newMsg = json.decodeFromString<Message>(record.toString())
                                _messages.value = listOf(newMsg) + _messages.value.filter { it.id != newMsg.id }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                        is PostgresAction.Delete -> {
                            val oldRecord = action.oldRecord
                            val id = oldRecord["id"]?.toString()?.replace("\"", "")
                            if (id != null) {
                                _messages.value = _messages.value.filter { it.id != id }
                            }
                        }
                        is PostgresAction.Update -> {
                            val record = action.record
                            try {
                                val updatedMsg = json.decodeFromString<Message>(record.toString())
                                _messages.value = _messages.value.map {
                                    if (it.id == updatedMsg.id) updatedMsg else it
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                        else -> Unit
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun sendMessage(
        sender: Member,
        content: String,
        replyTo: Message? = null,
        isUrgent: Boolean = false
    ) = withContext(Dispatchers.IO) {
        val msgId = UUID.randomUUID().toString()
        val timestamp = java.time.Instant.now().toString()
        val formattedContent = if (isUrgent && !content.startsWith("🚨")) "🚨 [نداء عاجل] $content" else content

        val newMsg = Message(
            id = msgId,
            roomId = "bayt-al-aela",
            senderId = sender.id,
            senderName = sender.displayName,
            senderNickname = sender.nickname,
            senderColor = sender.avatarColor,
            content = formattedContent,
            replyToId = replyTo?.id,
            replyToSender = replyTo?.senderName,
            replyToText = replyTo?.content?.take(60),
            createdAt = timestamp
        )

        // Optimistic UI update
        _messages.value = listOf(newMsg) + _messages.value

        try {
            LammaSupabase.postgrest.from("family_messages").insert(newMsg)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Zero-database-quota photo architecture:
     * Broadcasts photo payload temporarily or uploads stub with local ID.
     * Never stores massive Base64 in PostgreSQL permanently!
     */
    suspend fun sendImageStub(
        sender: Member,
        localImageUri: String,
        replyTo: Message? = null
    ) = withContext(Dispatchers.IO) {
        val imageId = UUID.randomUUID().toString()
        val msgId = UUID.randomUUID().toString()
        val timestamp = java.time.Instant.now().toString()

        val stubMessage = Message(
            id = msgId,
            roomId = "bayt-al-aela",
            senderId = sender.id,
            senderName = sender.displayName,
            senderNickname = sender.nickname,
            senderColor = sender.avatarColor,
            content = null,
            imageUrl = "media-stub:$imageId",
            localImageUri = localImageUri,
            replyToId = replyTo?.id,
            replyToSender = replyTo?.senderName,
            replyToText = replyTo?.content?.take(60),
            createdAt = timestamp
        )

        _messages.value = listOf(stubMessage) + _messages.value

        try {
            LammaSupabase.postgrest.from("family_messages").insert(stubMessage)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun toggleReaction(
        messageId: String,
        user: Member,
        emoji: String
    ) = withContext(Dispatchers.IO) {
        val targetMsg = _messages.value.find { it.id == messageId } ?: return@withContext
        val existing = targetMsg.reactions.find { it.userId == user.id && it.emoji == emoji }

        val updatedReactions = if (existing != null) {
            targetMsg.reactions.filterNot { it.userId == user.id && it.emoji == emoji }
        } else {
            targetMsg.reactions + Reaction(
                id = UUID.randomUUID().toString(),
                messageId = messageId,
                userId = user.id,
                userName = user.displayName,
                emoji = emoji
            )
        }

        _messages.value = _messages.value.map {
            if (it.id == messageId) it.copy(reactions = updatedReactions) else it
        }

        try {
            if (existing != null) {
                LammaSupabase.postgrest.from("family_reactions").delete {
                    filter {
                        eq("message_id", messageId)
                        eq("user_id", user.id)
                        eq("emoji", emoji)
                    }
                }
            } else {
                LammaSupabase.postgrest.from("family_reactions").insert(
                    buildJsonObject {
                        put("message_id", messageId)
                        put("user_id", user.id)
                        put("user_name", user.displayName)
                        put("emoji", emoji)
                    }
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun deleteMessage(messageId: String) = withContext(Dispatchers.IO) {
        _messages.value = _messages.value.filter { it.id != messageId }
        try {
            LammaSupabase.postgrest.from("family_messages").delete {
                filter { eq("id", messageId) }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun updatePinnedNotice(notice: String, memberName: String) = withContext(Dispatchers.IO) {
        val timestamp = java.time.Instant.now().toString()
        _room.value = _room.value.copy(
            pinnedNotice = notice,
            pinnedBy = memberName,
            pinnedAt = timestamp
        )
        try {
            LammaSupabase.postgrest.from("family_rooms").update(
                buildJsonObject {
                    put("pinned_notice", notice)
                    put("pinned_by", memberName)
                    put("pinned_at", timestamp)
                }
            ) {
                filter { eq("id", "bayt-al-aela") }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // Household Checklist («نواقص البيت»)
    fun addChecklistItem(text: String, addedBy: String) {
        val item = ChecklistItem(
            id = UUID.randomUUID().toString(),
            text = text,
            isCompleted = false,
            addedBy = addedBy,
            createdAt = java.time.Instant.now().toString()
        )
        _checklist.value = _checklist.value + item
    }

    fun toggleChecklistItem(id: String) {
        _checklist.value = _checklist.value.map {
            if (it.id == id) it.copy(isCompleted = !it.isCompleted) else it
        }
    }

    fun removeChecklistItem(id: String) {
        _checklist.value = _checklist.value.filter { it.id != id }
    }
}
