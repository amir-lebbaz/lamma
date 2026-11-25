package com.lamma.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Checklist
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
    modifier: Modifier = Modifier
) {
    val colors = LocalLammaColors.current

    Surface(
        color = colors.bgSurface.copy(alpha = 0.92f),
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
                        .background(colors.bubbleOutgoing),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "لَمّة",
                        color = colors.accent,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black
                    )
                }

                Column {
                    Text(
                        text = "بيت العائلة",
                        color = colors.accent,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(colors.accent)
                        )
                        Text(
                            text = "$onlineCount متصل الآن",
                            color = colors.border,
                            fontSize = 11.sp
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
                        tint = if (isNoticeActive) colors.accent else colors.border,
                        modifier = Modifier.size(20.dp)
                    )
                }

                IconButton(onClick = onOpenChecklist) {
                    Icon(
                        imageVector = Icons.Default.Checklist,
                        contentDescription = "نواقص البيت",
                        tint = colors.accent,
                        modifier = Modifier.size(22.dp)
                    )
                }

                IconButton(onClick = onOpenSettings) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "الإعدادات والمظهر",
                        tint = colors.border,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}
