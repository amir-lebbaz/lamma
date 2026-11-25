package com.lamma.app.ui.screens

import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BatteryAlert
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.FormatSize
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.VolumeUp
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
import com.lamma.app.data.local.MediaManager
import com.lamma.app.data.model.Member
import com.lamma.app.data.notifications.LammaNotificationManager
import com.lamma.app.ui.theme.LammaTheme
import com.lamma.app.ui.theme.LocalLammaColors
import kotlinx.coroutines.launch

@Composable
fun SettingsDialog(
    currentMember: Member?,
    currentTheme: LammaTheme,
    isLargeText: Boolean,
    isSoundEnabled: Boolean,
    isUltraLite: Boolean,
    mediaManager: MediaManager,
    onSelectTheme: (LammaTheme) -> Unit,
    onToggleLargeText: (Boolean) -> Unit,
    onToggleSound: (Boolean) -> Unit,
    onToggleUltraLite: (Boolean) -> Unit,
    onLogout: () -> Unit,
    onClearChat: (() -> Unit)? = null,
    onClose: () -> Unit
) {
    val colors = LocalLammaColors.current
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var cachedCount by remember { mutableIntStateOf(mediaManager.getCachedMediaCount()) }

    val notificationManager = remember { LammaNotificationManager(context) }
    var isDndGranted by remember { mutableStateOf(notificationManager.isDndAccessGranted()) }
    var isBatteryOptIgnored by remember { mutableStateOf(notificationManager.isIgnoringBatteryOptimizations()) }

    val scrollState = rememberScrollState()

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
                    .verticalScroll(scrollState)
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "الإعدادات والمظهر ⚙️",
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

                // Ultra-Lite Low-End Performance Mode ("وضع الهاتف الخفيف / وضع الوالد")
                Surface(
                    color = if (isUltraLite) colors.accentPrimary.copy(alpha = 0.4f) else colors.bgCanvas,
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, if (isUltraLite) colors.textPrimary.copy(alpha = 0.5f) else colors.borderSubtle),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Speed,
                                contentDescription = null,
                                tint = colors.textPrimary,
                                modifier = Modifier.size(22.dp)
                            )
                            Column {
                                Text(
                                    text = "وضع الهاتف الخفيف / وضع الوالد ⚡",
                                    color = colors.textPrimary,
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "إيقاف الحركات والظلال، تكبير الأزرار 1.3x لتسريع هواتف 1GB-2GB RAM",
                                    color = colors.textMuted,
                                    fontSize = 10.sp,
                                    lineHeight = 14.sp
                                )
                            }
                        }
                        Switch(
                            checked = isUltraLite,
                            onCheckedChange = onToggleUltraLite,
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = colors.textPrimary,
                                checkedTrackColor = colors.accentPrimary,
                                uncheckedThumbColor = colors.textMuted,
                                uncheckedTrackColor = colors.bgCanvas
                            )
                        )
                    }
                }

                // Theme Selection: Exclusive 2 Themes
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Palette, contentDescription = null, tint = colors.textPrimary, modifier = Modifier.size(16.dp))
                        Text(text = "مظهر التطبيق", color = colors.textPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Sakura Dusk
                        Surface(
                            color = if (currentTheme == LammaTheme.SAKURA_DUSK) colors.accentPrimary.copy(alpha = 0.4f) else colors.bgCanvas,
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, if (currentTheme == LammaTheme.SAKURA_DUSK) colors.textPrimary.copy(alpha = 0.5f) else colors.borderSubtle),
                            modifier = Modifier
                                .weight(1f)
                                .clickable { onSelectTheme(LammaTheme.SAKURA_DUSK) }
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "🌸 سكون الغسق",
                                    color = colors.textPrimary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "الافتراضي الدافئ",
                                    color = colors.textMuted,
                                    fontSize = 10.sp
                                )
                            }
                        }

                        // Velvet Ink
                        Surface(
                            color = if (currentTheme == LammaTheme.VELVET_INK) colors.accentPrimary.copy(alpha = 0.4f) else colors.bgCanvas,
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, if (currentTheme == LammaTheme.VELVET_INK) colors.textPrimary.copy(alpha = 0.5f) else colors.borderSubtle),
                            modifier = Modifier
                                .weight(1f)
                                .clickable { onSelectTheme(LammaTheme.VELVET_INK) }
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "🌙 ليل المخمل",
                                    color = colors.textPrimary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "كحلي هادئ فخم",
                                    color = colors.textMuted,
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                }

                // Large Text Mode Toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(imageVector = Icons.Default.FormatSize, contentDescription = null, tint = colors.textPrimary, modifier = Modifier.size(18.dp))
                        Column {
                            Text(text = "وضع الخط الكبير", color = colors.textPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            Text(text = "تكبير حجم خط الرسائل بنسبة 1.25x", color = colors.textMuted, fontSize = 10.sp)
                        }
                    }
                    Switch(
                        checked = isLargeText,
                        onCheckedChange = onToggleLargeText,
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = colors.textPrimary,
                            checkedTrackColor = colors.accentPrimary,
                            uncheckedThumbColor = colors.textMuted,
                            uncheckedTrackColor = colors.bgCanvas
                        )
                    )
                }

                // Notification Sound Chime Toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(imageVector = Icons.Default.VolumeUp, contentDescription = null, tint = colors.textPrimary, modifier = Modifier.size(18.dp))
                        Column {
                            Text(text = "نغمة الرسائل الواردة", color = colors.textPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            Text(text = "رنين هارموني ناعم وخفيف", color = colors.textMuted, fontSize = 10.sp)
                        }
                    }
                    Switch(
                        checked = isSoundEnabled,
                        onCheckedChange = onToggleSound,
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = colors.textPrimary,
                            checkedTrackColor = colors.accentPrimary,
                            uncheckedThumbColor = colors.textMuted,
                            uncheckedTrackColor = colors.bgCanvas
                        )
                    )
                }

                // Urgent Buzz & DND Onboarding Section
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
                        Text(
                            text = "صلاحيات النداء العائلي العاجل 🔔",
                            color = colors.textPrimary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )

                        // DND Access
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(imageVector = Icons.Default.NotificationsActive, contentDescription = null, tint = colors.textPrimary, modifier = Modifier.size(16.dp))
                                Text(
                                    text = if (isDndGranted) "الرنين أثناء الصامت مفعّل ✅" else "تجاوز وضع الصامت (DND)",
                                    color = if (isDndGranted) Color(0xFF81C784) else colors.textPrimary,
                                    fontSize = 11.sp
                                )
                            }
                            if (!isDndGranted) {
                                OutlinedButton(
                                    onClick = {
                                        notificationManager.getDndSettingsIntent()?.let { intent ->
                                            context.startActivity(intent)
                                        }
                                    },
                                    shape = RoundedCornerShape(10.dp),
                                    border = BorderStroke(1.dp, colors.borderSubtle),
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Text("تفعيل", fontSize = 10.sp, color = colors.textPrimary)
                                }
                            }
                        }

                        // Battery Optimization Exemption
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(imageVector = Icons.Default.BatteryAlert, contentDescription = null, tint = colors.textPrimary, modifier = Modifier.size(16.dp))
                                Text(
                                    text = if (isBatteryOptIgnored) "العمل في خلفية السكون مفعّل ✅" else "منع إيقاف التطبيق في السكون",
                                    color = if (isBatteryOptIgnored) Color(0xFF81C784) else colors.textPrimary,
                                    fontSize = 11.sp
                                )
                            }
                            if (!isBatteryOptIgnored) {
                                OutlinedButton(
                                    onClick = {
                                        notificationManager.getIgnoreBatteryOptimizationIntent()?.let { intent ->
                                            context.startActivity(intent)
                                        }
                                    },
                                    shape = RoundedCornerShape(10.dp),
                                    border = BorderStroke(1.dp, colors.borderSubtle),
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Text("استثناء", fontSize = 10.sp, color = colors.textPrimary)
                                }
                            }
                        }
                    }
                }

                // Clear Local Media Cache (Zero Database Quota Tool)
                Surface(
                    color = colors.bgCanvas,
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, colors.borderSubtle),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            scope.launch {
                                val cleared = mediaManager.clearMediaCache()
                                if (cleared) {
                                    cachedCount = 0
                                    Toast.makeText(context, "تم مسح كاش الصور بنجاح", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = null, tint = colors.textMuted, modifier = Modifier.size(18.dp))
                            Column {
                                Text(text = "مسح كاش الصور المحفوظة", color = colors.textPrimary, fontSize = 12.5.sp, fontWeight = FontWeight.Medium)
                                Text(text = "$cachedCount صورة مخزنة محلياً في هاتفك", color = colors.textMuted, fontSize = 10.sp)
                            }
                        }
                        Text(text = "مسح", color = Color(0xFFF28482), fontSize = 11.sp, fontWeight = FontWeight.Medium)
                    }
                }

                // Clear Chat History for Current Member (Delete for Me Only)
                if (onClearChat != null) {
                    Surface(
                        color = colors.bgCanvas,
                        shape = RoundedCornerShape(10.dp),
                        border = BorderStroke(1.dp, colors.borderSubtle),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                onClose()
                                onClearChat()
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(imageVector = Icons.Default.DeleteOutline, contentDescription = null, tint = Color(0xFFC85A65), modifier = Modifier.size(18.dp))
                                Column {
                                    Text(text = "محو المحادثة لديك (حذف محلي)", color = colors.textPrimary, fontSize = 12.5.sp, fontWeight = FontWeight.Medium)
                                    Text(text = "إخفاء الرسائل السابقة من هاتفك فقط", color = colors.textMuted, fontSize = 10.sp)
                                }
                            }
                            Text(text = "محو", color = Color(0xFFC85A65), fontSize = 11.sp, fontWeight = FontWeight.Medium)
                        }
                    }
                }

                // Logout / Switch User
                Button(
                    onClick = {
                        onLogout()
                        onClose()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = colors.bgCanvas),
                    border = BorderStroke(1.dp, Color(0xFFF28482).copy(alpha = 0.5f)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(imageVector = Icons.Default.ExitToApp, contentDescription = null, tint = Color(0xFFF28482), modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "تبديل الحساب / تسجيل الخروج", color = Color(0xFFF28482), fontSize = 12.5.sp)
                }
            }
        }
    }
}
