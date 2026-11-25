package com.lamma.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Checklist
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lamma.app.ui.theme.LocalLammaColors

@Composable
fun LammaHeader(
    onlineCount: Int,
    isNoticeActive: Boolean,
    onToggleNotice: () -> Unit,
    onOpenChecklist: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenMembers: () -> Unit,
    onClearChat: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val colors = LocalLammaColors.current

    Surface(
        color = colors.bgSurface.copy(alpha = 0.95f),
        border = BorderStroke(1.dp, colors.borderSubtle),
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Right: Branding & Room Info (Clickable for Presence & Offline USSD)
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.clickable { onOpenMembers() }
            ) {
                // App Logo Badge
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(colors.accentPrimary)
                        .border(1.dp, colors.borderSubtle, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "لَمّة",
                        color = colors.textPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Column {
                    Text(
                        text = "بيت العائلة",
                        color = colors.textPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(androidx.compose.ui.graphics.Color(0xFF22C55E))
                        )
                        Text(
                            text = "$onlineCount متصل الآن",
                            color = androidx.compose.ui.graphics.Color(0xFF22C55E),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            // Left: Actions
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                IconButton(onClick = onToggleNotice) {
                    Icon(
                        imageVector = Icons.Default.PushPin,
                        contentDescription = "الملاحظة المثبتة",
                        tint = if (isNoticeActive) colors.textPrimary else colors.textMuted,
                        modifier = Modifier.size(20.dp)
                    )
                }

                IconButton(onClick = onOpenChecklist) {
                    Icon(
                        imageVector = Icons.Default.Checklist,
                        contentDescription = "نواقص البيت",
                        tint = colors.textPrimary,
                        modifier = Modifier.size(22.dp)
                    )
                }

                if (onClearChat != null) {
                    IconButton(onClick = onClearChat) {
                        Icon(
                            imageVector = Icons.Default.DeleteOutline,
                            contentDescription = "محو المحادثة لدي",
                            tint = colors.textMuted,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                IconButton(onClick = onOpenSettings) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "الإعدادات والمظهر",
                        tint = colors.textMuted,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}
