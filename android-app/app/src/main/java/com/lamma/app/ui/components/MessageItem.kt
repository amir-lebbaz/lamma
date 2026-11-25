package com.lamma.app.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Reply
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.lamma.app.data.model.Message
import com.lamma.app.ui.theme.LocalLammaColors
import com.lamma.app.ui.theme.LocalLargeTextMode
import kotlin.math.roundToInt

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MessageItem(
    message: Message,
    currentUserId: String,
    onReply: (Message) -> Unit,
    onToggleReaction: (String, String) -> Unit,
    onDelete: (String) -> Unit,
    onImageClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalLammaColors.current
    val isLargeText = LocalLargeTextMode.current
    val isMe = message.senderId == currentUserId

    var offsetX by remember { mutableFloatStateOf(0f) }
    val animatedOffset by animateFloatAsState(targetValue = offsetX, label = "swipe_reply")
    var showReactionMenu by remember { mutableStateOf(false) }

    val baseFontSize = if (isLargeText) 17.sp else 14.sp
    val timestampFontSize = if (isLargeText) 12.sp else 10.sp

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .pointerInput(Unit) {
                detectHorizontalDragGestures(
                    onDragEnd = {
                        if (offsetX > 80f || offsetX < -80f) {
                            onReply(message)
                        }
                        offsetX = 0f
                    },
                    onHorizontalDrag = { _, dragAmount ->
                        offsetX = (offsetX + dragAmount).coerceIn(-120f, 120f)
                    }
                )
            }
    ) {
        // Swipe to reply indicator behind bubble
        if (animatedOffset != 0f) {
            Icon(
                imageVector = Icons.Default.Reply,
                contentDescription = "رد",
                tint = colors.accent,
                modifier = Modifier
                    .align(if (isMe) Alignment.CenterStart else Alignment.CenterEnd)
                    .padding(horizontal = 16.dp)
                    .size(24.dp)
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .offset { IntOffset(animatedOffset.roundToInt(), 0) },
            horizontalArrangement = if (isMe) Arrangement.Start else Arrangement.End,
            verticalAlignment = Alignment.Bottom
        ) {
            // If others' message: display sender avatar on the side
            if (!isMe) {
                val avatarColor = remember(message.senderColor) {
                    try {
                        Color(android.graphics.Color.parseColor(message.senderColor))
                    } catch (e: Exception) {
                        colors.accent
                    }
                }

                Box(
                    modifier = Modifier
                        .padding(start = 6.dp, bottom = 4.dp)
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(avatarColor.copy(alpha = 0.25f))
                        .border(1.dp, avatarColor, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = message.senderName.take(1),
                        color = avatarColor,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Message Bubble
            Column(
                modifier = Modifier
                    .widthIn(min = 90.dp, max = 290.dp)
                    .clip(
                        RoundedCornerShape(
                            topStart = 16.dp,
                            topEnd = 16.dp,
                            bottomStart = if (isMe) 4.dp else 16.dp,
                            bottomEnd = if (isMe) 16.dp else 4.dp
                        )
                    )
                    .background(if (isMe) colors.bubbleOutgoing else colors.bubbleIncoming)
                    .border(
                        width = 1.dp,
                        color = if (isMe) colors.bubbleOutgoing.copy(alpha = 0.5f) else colors.border.copy(alpha = 0.35f),
                        shape = RoundedCornerShape(16.dp)
                    )
                    .combinedClickable(
                        onClick = {},
                        onLongClick = { showReactionMenu = true }
                    )
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                // Sender info for other members
                if (!isMe) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = message.senderName,
                            color = colors.accent,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        if (!message.senderNickname.isNullOrBlank()) {
                            Text(
                                text = "(${message.senderNickname})",
                                color = colors.border,
                                fontSize = 10.sp
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(3.dp))
                }

                // Reply Quote Preview
                if (message.replyToText != null) {
                    Surface(
                        color = colors.bgMain.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 6.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .width(3.dp)
                                    .height(24.dp)
                                    .background(colors.accent, RoundedCornerShape(2.dp))
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Column {
                                if (message.replyToSender != null) {
                                    Text(
                                        text = message.replyToSender,
                                        color = colors.accent,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Text(
                                    text = message.replyToText,
                                    color = colors.border,
                                    fontSize = 11.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }

                // Image content
                if (message.imageUrl != null || message.localImageUri != null) {
                    val isStub = message.imageUrl?.startsWith("media-stub:") == true && message.localImageUri == null

                    if (isStub) {
                        // Clean Zero-Quota fallback card
                        Surface(
                            color = colors.bgMain.copy(alpha = 0.6f),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Image,
                                    contentDescription = null,
                                    tint = colors.accent,
                                    modifier = Modifier.size(22.dp)
                                )
                                Column {
                                    Text(
                                        text = "صورة محفوظة على أجهزة العائلة",
                                        color = colors.accent,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "مساحة سحابية 0% • محفوظة محلياً",
                                        color = colors.border,
                                        fontSize = 9.sp
                                    )
                                }
                            }
                        }
                    } else {
                        val imagePath = message.localImageUri ?: message.imageUrl
                        if (imagePath != null) {
                            AsyncImage(
                                model = imagePath,
                                contentDescription = "صورة عائلية",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(max = 220.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .combinedClickable(onClick = { onImageClick(imagePath) })
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                        }
                    }
                }

                // Text Content
                if (!message.content.isNullOrBlank()) {
                    Text(
                        text = message.content,
                        color = if (isMe) colors.bubbleOutgoingText else colors.bubbleIncomingText,
                        fontSize = baseFontSize,
                        lineHeight = (baseFontSize.value * 1.35).sp
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Footer: Timestamp + Status Ticks + You Tag
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (isMe) {
                        Text(
                            text = "أنت",
                            color = colors.accent.copy(alpha = 0.8f),
                            fontSize = 9.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                    } else {
                        Spacer(modifier = Modifier.width(1.dp))
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                        Text(
                            text = formatMessageTime(message.createdAt),
                            color = colors.border,
                            fontSize = timestampFontSize
                        )
                        if (isMe) {
                            Icon(
                                imageVector = Icons.Default.DoneAll,
                                contentDescription = "تم التسليم",
                                tint = colors.accent,
                                modifier = Modifier.size(13.dp)
                            )
                        }
                    }
                }

                // Reactions Row
                if (message.reactions.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.padding(top = 2.dp)
                    ) {
                        val grouped = message.reactions.groupBy { it.emoji }
                        grouped.forEach { (emoji, list) ->
                            val hasMyReaction = list.any { it.userId == currentUserId }
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (hasMyReaction) colors.accent.copy(alpha = 0.25f) else colors.bgMain.copy(alpha = 0.5f),
                                border = if (hasMyReaction) BorderStroke(1.dp, colors.accent) else null,
                                modifier = Modifier.combinedClickable(
                                    onClick = { onToggleReaction(message.id, emoji) }
                                )
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(3.dp)
                                ) {
                                    Text(text = emoji, fontSize = 11.sp)
                                    if (list.size > 1) {
                                        Text(text = "${list.size}", fontSize = 10.sp, color = colors.accent)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Quick Emoji Reaction Dropdown
        DropdownMenu(
            expanded = showReactionMenu,
            onDismissRequest = { showReactionMenu = false },
            modifier = Modifier.background(colors.bgSurface)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("❤️", "😂", "👍", "🤲").forEach { emoji ->
                    IconButton(
                        onClick = {
                            onToggleReaction(message.id, emoji)
                            showReactionMenu = false
                        },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Text(text = emoji, fontSize = 20.sp)
                    }
                }
                if (isMe) {
                    IconButton(
                        onClick = {
                            onDelete(message.id)
                            showReactionMenu = false
                        },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "حذف الرسالة",
                            tint = Color(0xFFF28482),
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

private fun formatMessageTime(isoString: String): String {
    return try {
        val instant = java.time.Instant.parse(isoString)
        val zone = java.time.ZoneId.systemDefault()
        val local = instant.atZone(zone)
        val formatter = java.time.format.DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale("ar"))
        local.format(formatter)
    } catch (e: Exception) {
        isoString.takeLast(8).take(5)
    }
}
