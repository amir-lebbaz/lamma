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
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
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

    @Volatile
    private var currentClearedAt: String? = null

    fun setClearedAtCutoff(clearedAt: String?) {
        currentClearedAt = clearedAt
        if (clearedAt != null) {
            _messages.value = _messages.value.filter { it.createdAt > clearedAt }
        }
    }

    fun setTyping(memberName: String, isTyping: Boolean) {
        _typingMember.value = if (isTyping) memberName else null
    }

    init {
        scope.launch {
            loadInitialData()
            setupRealtimeSubscriptions()
        }
    }

    suspend fun loadInitialData(clearedAt: String? = currentClearedAt) = withContext(Dispatchers.IO) {
        try {
            if (clearedAt != null) {
                currentClearedAt = clearedAt
            }

            // 1. Load Room
            try {
                val roomData = LammaSupabase.postgrest.from("family_rooms")
                    .select {
                        filter { eq("id", "bayt-al-aela") }
                    }.decodeSingleOrNull<Room>()
                if (roomData != null) {
                    _room.value = roomData
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // 2. Load Members
            try {
                val membersList = LammaSupabase.postgrest.from("family_members")
                    .select {
                        order("created_at", Order.ASCENDING)
                    }.decodeList<Member>()
                _members.value = membersList
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // 3. Load Shared Checklist («نواقص البيت») from Supabase
            try {
                val checklistRow = LammaSupabase.postgrest.from("family_messages")
                    .select {
                        filter { eq("id", "checklist-bayt-al-aela") }
                    }.decodeSingleOrNull<JsonObject>()
                val content = checklistRow?.get("content")?.jsonPrimitive?.contentOrNull
                if (content != null && content.startsWith("__CHECKLIST__")) {
                    val rawJson = content.removePrefix("__CHECKLIST__")
                    val items = json.decodeFromString<List<ChecklistItem>>(rawJson)
                    _checklist.value = items
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // 4. Load Messages & Reactions
            try {
                val rawMsgs = LammaSupabase.postgrest.from("family_messages")
                    .select {
                        filter { eq("room_id", "bayt-al-aela") }
                        order("created_at", Order.DESCENDING)
                        limit(60)
                    }.decodeList<Message>()

                // Filter out checklist records from chat feed
                val cleanMsgs = rawMsgs.filterNot {
                    it.id.startsWith("checklist-") ||
                    it.id.startsWith("demo-") ||
                    (it.content != null && it.content.startsWith("__CHECKLIST__"))
                }

                // Fetch Reactions
                val reactionsList = try {
                    LammaSupabase.postgrest.from("family_reactions")
                        .select()
                        .decodeList<Reaction>()
                } catch (e: Exception) {
                    emptyList()
                }

                val reactionsByMsg = reactionsList.groupBy { it.messageId }
                val messagesWithReactions = cleanMsgs.map { msg ->
                    msg.copy(reactions = reactionsByMsg[msg.id] ?: emptyList())
                }

                val cutoff = currentClearedAt
                _messages.value = if (cutoff != null) {
                    messagesWithReactions.filter { it.createdAt > cutoff }
                } else {
                    messagesWithReactions
                }.distinctBy { it.id }.sortedByDescending { it.createdAt }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private suspend fun setupRealtimeSubscriptions() {
        try {
            val channel = LammaSupabase.realtime.channel("lamma-room-channel")
            
            val messageFlow = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
                table = "family_messages"
                filter = "room_id=eq.bayt-al-aela"
            }

            val reactionFlow = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
                table = "family_reactions"
            }

            val roomFlow = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
                table = "family_rooms"
                filter = "id=eq.bayt-al-aela"
            }

            channel.subscribe()

            // 1. Message Flow & Checklist updates
            scope.launch {
                messageFlow.collect { action ->
                    when (action) {
                        is PostgresAction.Insert -> {
                            val record = action.record
                            try {
                                val id = record["id"]?.jsonPrimitive?.contentOrNull ?: ""
                                val content = record["content"]?.jsonPrimitive?.contentOrNull ?: ""

                                if (id.startsWith("checklist-") || content.startsWith("__CHECKLIST__")) {
                                    val rawJson = content.removePrefix("__CHECKLIST__")
                                    val items = json.decodeFromString<List<ChecklistItem>>(rawJson)
                                    _checklist.value = items
                                    return@collect
                                }

                                val newMsg = json.decodeFromString<Message>(record.toString())
                                val cutoff = currentClearedAt
                                if (cutoff == null || newMsg.createdAt > cutoff) {
                                    _messages.value = (listOf(newMsg) + _messages.value.filter { it.id != newMsg.id })
                                        .distinctBy { it.id }
                                        .sortedByDescending { it.createdAt }
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                        is PostgresAction.Delete -> {
                            val oldRecord = action.oldRecord
                            val id = oldRecord["id"]?.jsonPrimitive?.contentOrNull
                            if (id != null) {
                                _messages.value = _messages.value.filter { it.id != id }
                            }
                        }
                        is PostgresAction.Update -> {
                            val record = action.record
                            try {
                                val id = record["id"]?.jsonPrimitive?.contentOrNull ?: ""
                                val content = record["content"]?.jsonPrimitive?.contentOrNull ?: ""

                                if (id.startsWith("checklist-") || content.startsWith("__CHECKLIST__")) {
                                    val rawJson = content.removePrefix("__CHECKLIST__")
                                    val items = json.decodeFromString<List<ChecklistItem>>(rawJson)
                                    _checklist.value = items
                                    return@collect
                                }

                                val updatedMsg = json.decodeFromString<Message>(record.toString())
                                _messages.value = _messages.value.map {
                                    if (it.id == updatedMsg.id) updatedMsg.copy(reactions = it.reactions) else it
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                        else -> Unit
                    }
                }
            }

            // 2. Realtime Reactions Flow
            scope.launch {
                reactionFlow.collect { action ->
                    when (action) {
                        is PostgresAction.Insert -> {
                            try {
                                val reaction = json.decodeFromString<Reaction>(action.record.toString())
                                _messages.value = _messages.value.map { msg ->
                                    if (msg.id == reaction.messageId) {
                                        val existing = msg.reactions.filterNot { it.userId == reaction.userId && it.emoji == reaction.emoji }
                                        msg.copy(reactions = existing + reaction)
                                    } else msg
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                        is PostgresAction.Delete -> {
                            try {
                                val oldRecord = action.oldRecord
                                val reactionId = oldRecord["id"]?.jsonPrimitive?.contentOrNull
                                val messageId = oldRecord["message_id"]?.jsonPrimitive?.contentOrNull
                                val userId = oldRecord["sender_id"]?.jsonPrimitive?.contentOrNull
                                    ?: oldRecord["user_id"]?.jsonPrimitive?.contentOrNull
                                val emoji = oldRecord["emoji"]?.jsonPrimitive?.contentOrNull

                                if (messageId != null) {
                                    _messages.value = _messages.value.map { msg ->
                                        if (msg.id == messageId) {
                                            val filtered = msg.reactions.filterNot {
                                                (reactionId != null && it.id == reactionId) ||
                                                (it.userId == userId && it.emoji == emoji)
                                            }
                                            msg.copy(reactions = filtered)
                                        } else msg
                                    }
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                        else -> Unit
                    }
                }
            }

            // 3. Realtime Room Flow (Pinned Notice updates)
            scope.launch {
                roomFlow.collect { action ->
                    if (action is PostgresAction.Update) {
                        try {
                            val updatedRoom = json.decodeFromString<Room>(action.record.toString())
                            _room.value = updatedRoom
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
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

        val newMsg = Message(
            id = msgId,
            roomId = "bayt-al-aela",
            senderId = sender.id,
            senderName = sender.displayName,
            senderNickname = sender.nickname,
            senderColor = sender.avatarColor,
            senderAvatarUrl = sender.avatarUrl,
            content = content,
            messageType = if (isUrgent) "urgent" else "text",
            isUrgent = isUrgent,
            replyToId = replyTo?.id,
            replyToSender = replyTo?.senderName,
            replyToText = replyTo?.content?.take(60),
            createdAt = timestamp
        )

        // Optimistic UI update with deduplication & sorted ordering
        _messages.value = (listOf(newMsg) + _messages.value.filter { it.id != newMsg.id })
            .distinctBy { it.id }
            .sortedByDescending { it.createdAt }

        try {
            LammaSupabase.postgrest.from("family_messages").insert(newMsg)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

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
            senderAvatarUrl = sender.avatarUrl,
            content = null,
            messageType = "image",
            isUrgent = false,
            imageUrl = "media-stub:$imageId",
            imageId = imageId,
            localImageUri = localImageUri,
            replyToId = replyTo?.id,
            replyToSender = replyTo?.senderName,
            replyToText = replyTo?.content?.take(60),
            createdAt = timestamp
        )

        _messages.value = (listOf(stubMessage) + _messages.value.filter { it.id != stubMessage.id })
            .distinctBy { it.id }
            .sortedByDescending { it.createdAt }

        try {
            LammaSupabase.postgrest.from("family_messages").insert(stubMessage)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun clearChatForUser(member: Member): String = withContext(Dispatchers.IO) {
        val clearedAt = java.time.Instant.now().toString()
        currentClearedAt = clearedAt
        _messages.value = _messages.value.filter { it.createdAt > clearedAt }

        try {
            LammaSupabase.postgrest.from("family_members").update(
                buildJsonObject {
                    put("cleared_at", clearedAt)
                }
            ) {
                filter { eq("id", member.id) }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        clearedAt
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
                roomId = "bayt-al-aela",
                messageId = messageId,
                senderId = user.id,
                senderName = user.displayName,
                rawUserId = user.id,
                rawUserName = user.displayName,
                emoji = emoji,
                createdAt = java.time.Instant.now().toString()
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
                        or {
                            eq("sender_id", user.id)
                            eq("user_id", user.id)
                        }
                        eq("emoji", emoji)
                    }
                }
            } else {
                LammaSupabase.postgrest.from("family_reactions").insert(
                    buildJsonObject {
                        put("id", "react-${System.currentTimeMillis()}-${(1000..9999).random()}")
                        put("room_id", "bayt-al-aela")
                        put("message_id", messageId)
                        put("sender_id", user.id)
                        put("sender_name", user.displayName)
                        put("user_id", user.id)
                        put("user_name", user.displayName)
                        put("emoji", emoji)
                        put("created_at", java.time.Instant.now().toString())
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

    // Household Checklist («نواقص البيت») with persistent Supabase synchronization
    fun addChecklistItem(text: String, addedBy: String) {
        val item = ChecklistItem(
            id = "chk-${System.currentTimeMillis()}-${(1000..9999).random()}",
            roomId = "bayt-al-aela",
            text = text.trim(),
            isCompleted = false,
            addedBy = addedBy,
            createdAt = java.time.Instant.now().toString()
        )
        val updated = listOf(item) + _checklist.value.filter { it.id != item.id }
        _checklist.value = updated
        scope.launch {
            saveChecklistToSupabase(updated)
        }
    }

    fun toggleChecklistItem(id: String, completedBy: String = "") {
        val updated = _checklist.value.map {
            if (it.id == id) {
                val next = !it.isCompleted
                it.copy(isCompleted = next, completedBy = if (next) completedBy.ifBlank { null } else null)
            } else it
        }
        _checklist.value = updated
        scope.launch {
            saveChecklistToSupabase(updated)
        }
    }

    fun removeChecklistItem(id: String) {
        val updated = _checklist.value.filter { it.id != id }
        _checklist.value = updated
        scope.launch {
            saveChecklistToSupabase(updated)
        }
    }

    private suspend fun saveChecklistToSupabase(items: List<ChecklistItem>) = withContext(Dispatchers.IO) {
        try {
            val jsonPayload = "__CHECKLIST__" + json.encodeToString(items)
            LammaSupabase.postgrest.from("family_messages").upsert(
                buildJsonObject {
                    put("id", "checklist-bayt-al-aela")
                    put("room_id", "bayt-al-aela")
                    put("sender_id", "system")
                    put("sender_name", "نواقص البيت")
                    put("sender_color", "#415F45")
                    put("content", jsonPayload)
                    put("created_at", java.time.Instant.now().toString())
                }
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
