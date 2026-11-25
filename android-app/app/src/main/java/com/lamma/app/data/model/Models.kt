package com.lamma.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Member(
    val id: String,
    @SerialName("room_id")
    val roomId: String = "bayt-al-aela",
    val username: String = "",
    @SerialName("display_name")
    val displayName: String,
    val nickname: String? = null,
    @SerialName("avatar_color")
    val avatarColor: String = "#FADCD5",
    @SerialName("avatar_url")
    val avatarUrl: String? = null,
    @SerialName("password_hash")
    val passwordHash: String? = null,
    @SerialName("last_seen_at")
    val lastSeenAt: String? = null,
    @SerialName("created_at")
    val createdAt: String? = null,
    @SerialName("cleared_at")
    val clearedAt: String? = null
) {
    val lastSeen: String? get() = lastSeenAt
}

@Serializable
data class Message(
    val id: String,
    @SerialName("room_id")
    val roomId: String = "bayt-al-aela",
    @SerialName("sender_id")
    val senderId: String,
    @SerialName("sender_name")
    val senderName: String,
    @SerialName("sender_nickname")
    val senderNickname: String? = null,
    @SerialName("sender_color")
    val senderColor: String = "#FADCD5",
    @SerialName("sender_avatar_url")
    val senderAvatarUrl: String? = null,
    val content: String? = null,
    @SerialName("message_type")
    val messageType: String = "text",
    @SerialName("is_urgent")
    val isUrgent: Boolean = false,
    @SerialName("image_url")
    val imageUrl: String? = null,
    @SerialName("image_id")
    val imageId: String? = null,
    @SerialName("audio_url")
    val audioUrl: String? = null,
    @SerialName("reply_to_id")
    val replyToId: String? = null,
    @SerialName("reply_to_sender")
    val replyToSender: String? = null,
    @SerialName("reply_to_text")
    val replyToText: String? = null,
    @SerialName("created_at")
    val createdAt: String,
    @kotlinx.serialization.Transient
    val reactions: List<Reaction> = emptyList(),
    // Client-side local state
    @kotlinx.serialization.Transient
    val isPending: Boolean = false,
    @kotlinx.serialization.Transient
    val localImageUri: String? = null
)

@Serializable
data class Reaction(
    val id: String? = null,
    @SerialName("room_id")
    val roomId: String = "bayt-al-aela",
    @SerialName("message_id")
    val messageId: String,
    @SerialName("sender_id")
    val senderId: String = "",
    @SerialName("sender_name")
    val senderName: String = "",
    @SerialName("user_id")
    val rawUserId: String? = null,
    @SerialName("user_name")
    val rawUserName: String? = null,
    val emoji: String,
    @SerialName("created_at")
    val createdAt: String? = null
) {
    val userId: String get() = if (senderId.isNotBlank()) senderId else (rawUserId ?: "")
    val userName: String get() = if (senderName.isNotBlank()) senderName else (rawUserName ?: "")
}

@Serializable
data class Room(
    val id: String = "bayt-al-aela",
    val name: String = "بيت العائلة",
    @SerialName("pinned_notice")
    val pinnedNotice: String? = null,
    @SerialName("pinned_by")
    val pinnedBy: String? = null,
    @SerialName("pinned_at")
    val pinnedAt: String? = null
)

@Serializable
data class ChecklistItem(
    val id: String,
    @SerialName("room_id")
    val roomId: String = "bayt-al-aela",
    val text: String,
    @SerialName("is_completed")
    val isCompleted: Boolean = false,
    @SerialName("added_by")
    val addedBy: String,
    @SerialName("completed_by")
    val completedBy: String? = null,
    @SerialName("created_at")
    val createdAt: String
)

enum class ThemeMode {
    SAKURA_DUSK, // Default: سكون الغسق (#1B0C1A, #6D3C52, #FADCD5)
    VELVET_INK   // Velvet: ليل المخمل (#0B1421, #34394A, #B5B9BC)
}
