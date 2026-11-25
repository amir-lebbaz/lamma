package com.lamma.app.ui.components

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PhoneCallback
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.lamma.app.data.model.Member
import com.lamma.app.data.presence.PresenceManager
import com.lamma.app.ui.theme.LocalLammaColors

@Composable
fun MembersPresenceDialog(
    members: List<Member>,
    currentMember: Member,
    onClose: () -> Unit
) {
    val colors = LocalLammaColors.current
    val context = LocalContext.current
    var selectedCarrierPreset by remember { mutableStateOf(PresenceManager.CarrierUssdPreset.GENERAL) }

    Dialog(onDismissRequest = onClose) {
        Surface(
            color = colors.bgSurface,
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, colors.borderSubtle),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp, horizontal = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "أفراد العائلة والحضور 👨‍👩‍👧‍👦",
                        color = colors.textPrimary,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    IconButton(onClick = onClose, modifier = Modifier.size(28.dp)) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "إغلاق",
                            tint = colors.textMuted
                        )
                    }
                }

                HorizontalDivider(color = colors.borderSubtle)

                // Carrier USSD Info & Selector
                Surface(
                    color = colors.bgCanvas,
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, colors.borderSubtle),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(
                            text = "خدمة الاتصال المجاني عند انقطاع الإنترنت (USSD):",
                            color = colors.textPrimary,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "تفتح لوحة الاتصال برمز المشغّل لطلب إعادة الاتصال دون رصيد (0% SMS - بدون أي تكلفة).",
                            color = colors.textMuted,
                            fontSize = 10.sp,
                            lineHeight = 13.sp
                        )
                    }
                }

                // Members List
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 380.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(members) { member ->
                        val isSelf = member.id == currentMember.id
                        val presenceText = if (isSelf) "أنت (متصل الآن 🟢)" else PresenceManager.formatPresence(member.lastSeen)
                        val isOffline = !isSelf && PresenceManager.isOffline(member.lastSeen)

                        Surface(
                            color = colors.bgCanvas,
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, colors.borderSubtle),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        // Avatar initials
                                        Box(
                                            modifier = Modifier
                                                .size(36.dp)
                                                .clip(CircleShape)
                                                .background(
                                                    try {
                                                        Color(android.graphics.Color.parseColor(member.avatarColor))
                                                    } catch (e: Exception) {
                                                        colors.accentPrimary
                                                    }
                                                )
                                                .border(1.dp, colors.borderSubtle, CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = member.displayName.take(1),
                                                color = Color.Black,
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }

                                        Column {
                                            Text(
                                                text = member.displayName + if (member.nickname != null) " (${member.nickname})" else "",
                                                color = colors.textPrimary,
                                                fontSize = 13.5.sp,
                                                fontWeight = FontWeight.SemiBold
                                            )
                                            Text(
                                                text = presenceText,
                                                color = if (presenceText.contains("🟢")) Color(0xFF81C784) else colors.textMuted,
                                                fontSize = 11.sp
                                            )
                                        }
                                    }
                                }

                                // If member is offline, offer native USSD Dial Call-Me-Back button
                                if (isOffline) {
                                    OutlinedButton(
                                        onClick = {
                                            try {
                                                val intent = PresenceManager.createUssdDialIntent(selectedCarrierPreset.dialCode)
                                                context.startActivity(intent)
                                            } catch (e: Exception) {
                                                Toast.makeText(context, "تعذر فتح لوحة الاتصال", Toast.LENGTH_SHORT).show()
                                            }
                                        },
                                        shape = RoundedCornerShape(10.dp),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.textPrimary),
                                        border = BorderStroke(1.dp, colors.borderSubtle),
                                        modifier = Modifier.fillMaxWidth(),
                                        contentPadding = PaddingValues(vertical = 4.dp, horizontal = 8.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.PhoneCallback,
                                            contentDescription = null,
                                            modifier = Modifier.size(15.dp),
                                            tint = colors.textPrimary
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "طلب اتصال مجاني (USSD: ${selectedCarrierPreset.dialCode}) 📞",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
