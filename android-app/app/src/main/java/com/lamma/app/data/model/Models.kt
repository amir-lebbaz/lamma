package com.lamma.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Member(
    val id: String,
    val username: String,
    @SerialName("display_name")
    val displayName: String,
    val nickname: String? = null,
    @SerialName("avatar_color")
    val avatarColor: String = "#FADCD5",
    @SerialName("avatar_url")
    val avatarUrl: String? = null,
    @SerialName("last_seen")
    val lastSeen: String? = null,
    @SerialName("created_at")
    val createdAt: String? = null
)

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
    val content: String? = null,
    @SerialName("image_url")
    val imageUrl: String? = null,
    @SerialName("reply_to_id")
    val replyToId: String? = null,
    @SerialName("reply_to_sender")
    val replyToSender: String? = null,
    @SerialName("reply_to_text")
    val replyToText: String? = null,
    @SerialName("created_at")
    val createdAt: String,
    val reactions: List<Reaction> = emptyList(),
    // Client-side local state
    val isPending: Boolean = false,
    val localImageUri: String? = null
)

@Serializable
data class Reaction(
    val id: String? = null,
    @SerialName("message_id")
    val messageId: String,
    @SerialName("user_id")
    val userId: String,
    @SerialName("user_name")
    val userName: String,
    val emoji: String,
    @SerialName("created_at")
    val createdAt: String? = null
)

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
    val text: String,
    @SerialName("is_completed")
    val isCompleted: Boolean = false,
    @SerialName("added_by")
    val addedBy: String,
    @SerialName("created_at")
    val createdAt: String
)

enum class ThemeMode {
    SAKURA_DUSK, // Default: سكون الغسق (#1B0C1A, #6D3C52, #FADCD5)
    VELVET_INK   // Velvet: ليل المخمل (#0B1421, #34394A, #B5B9BC)
}
