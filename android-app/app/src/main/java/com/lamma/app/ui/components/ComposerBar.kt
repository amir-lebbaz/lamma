package com.lamma.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lamma.app.data.model.Message
import com.lamma.app.ui.theme.LocalLammaColors
import com.lamma.app.ui.theme.LocalLargeTextMode
import com.lamma.app.ui.theme.LocalUltraLiteMode

@Composable
fun ComposerBar(
    replyingTo: Message?,
    onCancelReply: () -> Unit,
    onSendMessage: (text: String, isUrgent: Boolean) -> Unit,
    onAttachPhoto: () -> Unit,
    onCapturePhoto: () -> Unit = {},
    onTyping: (Boolean) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val colors = LocalLammaColors.current
    val isLargeText = LocalLargeTextMode.current
    val isUltraLite = LocalUltraLiteMode.current
    var text by remember { mutableStateOf("") }
    var isUrgentBuzzActive by remember { mutableStateOf(false) }

    val fontScale = if (isUltraLite) 1.3f else if (isLargeText) 1.25f else 1.0f
    val baseFontSize = 14.sp
    val fontSize = (baseFontSize.value * fontScale).sp
    val buttonSize = if (isUltraLite) 44.dp else 38.dp
    val iconSize = if (isUltraLite) 22.dp else 19.dp

    Surface(
        color = colors.bgSurface.copy(alpha = if (isUltraLite) 1f else 0.94f),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 6.dp)
        ) {
            // Attached Reply Preview Banner
            if (replyingTo != null) {
                Surface(
                    color = colors.bgMain.copy(alpha = 0.7f),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 6.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .width(3.dp)
                                    .height(28.dp)
                                    .background(colors.accent, RoundedCornerShape(2.dp))
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = "الرد على ${replyingTo.senderName}",
                                    color = colors.accent,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = replyingTo.content ?: "صورة مرفقة",
                                    color = colors.border,
                                    fontSize = 11.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        IconButton(
                            onClick = onCancelReply,
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "إلغاء الرد",
                                tint = colors.border,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            // Urgent Buzz Active Warning Banner
            if (isUrgentBuzzActive) {
                Surface(
                    color = Color(0xFF6D3C52),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 6.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "🔔 وضع النداء العاجل مفعّل: سيرن هاتف العائلة بصوت إنذار قوي!",
                            color = Color(0xFFFADCD5),
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                        IconButton(
                            onClick = { isUrgentBuzzActive = false },
                            modifier = Modifier.size(20.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = null,
                                tint = Color(0xFFFADCD5),
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                }
            }

            // Input Bar Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Urgent Family Buzz Toggle Button ("نداء عائلي عاجل")
                IconButton(
                    onClick = { isUrgentBuzzActive = !isUrgentBuzzActive },
                    modifier = Modifier
                        .size(buttonSize)
                        .clip(CircleShape)
                        .background(
                            if (isUrgentBuzzActive) Color(0xFFE63946) else colors.bgMain.copy(alpha = 0.6f)
                        )
                ) {
                    Icon(
                        imageVector = Icons.Default.NotificationsActive,
                        contentDescription = "نداء عاجل",
                        tint = if (isUrgentBuzzActive) Color.White else colors.accent,
                        modifier = Modifier.size(iconSize)
                    )
                }

                // Attach Photo from Gallery Button
                IconButton(
                    onClick = onAttachPhoto,
                    modifier = Modifier
                        .size(buttonSize)
                        .clip(CircleShape)
                        .background(colors.bgMain.copy(alpha = 0.6f))
                ) {
                    Icon(
                        imageVector = Icons.Default.Image,
                        contentDescription = "معرض الصور",
                        tint = colors.accent,
                        modifier = Modifier.size(iconSize)
                    )
                }

                // Capture Photo from Camera Button
                IconButton(
                    onClick = onCapturePhoto,
                    modifier = Modifier
                        .size(buttonSize)
                        .clip(CircleShape)
                        .background(colors.bgMain.copy(alpha = 0.6f))
                ) {
                    Icon(
                        imageVector = Icons.Default.CameraAlt,
                        contentDescription = "التقاط بالكاميرا",
                        tint = colors.accent,
                        modifier = Modifier.size(iconSize)
                    )
                }

                // Auto-growing Text Input Field
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(22.dp))
                        .background(colors.bgMain)
                        .border(
                            1.dp,
                            if (isUrgentBuzzActive) Color(0xFFE63946) else colors.border.copy(alpha = 0.4f),
                            RoundedCornerShape(22.dp)
                        )
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    if (text.isEmpty()) {
                        Text(
                            text = if (isUrgentBuzzActive) "اكتب نداءك العاجل للعائلة..." else "اكتب رسالتك العائلية...",
                            color = colors.border.copy(alpha = 0.7f),
                            fontSize = fontSize
                        )
                    }

                    BasicTextField(
                        value = text,
                        onValueChange = {
                            text = it
                            onTyping(it.isNotBlank())
                        },
                        textStyle = TextStyle(
                            color = colors.accent,
                            fontSize = fontSize,
                            lineHeight = (fontSize.value * 1.35).sp
                        ),
                        cursorBrush = SolidColor(colors.accent),
                        maxLines = 5,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Send Button
                IconButton(
                    onClick = {
                        val trimmed = text.trim()
                        if (trimmed.isNotEmpty()) {
                            onSendMessage(trimmed, isUrgentBuzzActive)
                            text = ""
                            isUrgentBuzzActive = false
                            onTyping(false)
                        }
                    },
                    enabled = text.isNotBlank(),
                    modifier = Modifier
                        .size(buttonSize)
                        .clip(CircleShape)
                        .background(
                            if (text.isNotBlank()) colors.bubbleOutgoing else colors.bgMain.copy(alpha = 0.4f)
                        )
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = "إرسال",
                        tint = if (text.isNotBlank()) colors.accent else colors.border.copy(alpha = 0.5f),
                        modifier = Modifier.size(iconSize)
                    )
                }
            }
        }
    }
}
