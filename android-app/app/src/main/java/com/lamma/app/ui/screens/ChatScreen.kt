package com.lamma.app.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import com.lamma.app.data.local.MediaManager
import com.lamma.app.data.local.SoundManager
import com.lamma.app.data.model.Member
import com.lamma.app.data.model.Message
import com.lamma.app.data.supabase.ChatRepository
import com.lamma.app.ui.components.*
import com.lamma.app.ui.theme.LammaTheme
import com.lamma.app.ui.theme.LocalLammaColors
import kotlinx.coroutines.launch
import java.io.File

@Composable
fun ChatScreen(
    currentMember: Member,
    repository: ChatRepository,
    mediaManager: MediaManager,
    soundManager: SoundManager,
    currentTheme: LammaTheme,
    isLargeText: Boolean,
    isSoundEnabled: Boolean,
    isUltraLite: Boolean,
    onSelectTheme: (LammaTheme) -> Unit,
    onToggleLargeText: (Boolean) -> Unit,
    onToggleSound: (Boolean) -> Unit,
    onToggleUltraLite: (Boolean) -> Unit,
    onLogout: () -> Unit,
    onClearChat: () -> Unit
) {
    val colors = LocalLammaColors.current
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val messages by repository.messages.collectAsState()
    val room by repository.room.collectAsState()
    val members by repository.members.collectAsState()
    val checklist by repository.checklist.collectAsState()

    var replyingTo by remember { mutableStateOf<Message?>(null) }
    var isNoticeOpen by remember { mutableStateOf(false) }
    var isChecklistOpen by remember { mutableStateOf(false) }
    var isSettingsOpen by remember { mutableStateOf(false) }
    var isMembersOpen by remember { mutableStateOf(false) }
    var isClearChatDialogOpen by remember { mutableStateOf(false) }
    var viewerImageUrl by remember { mutableStateOf<String?>(null) }

    val listState = rememberLazyListState()

    // Sound chime trigger on new incoming messages
    var previousMessageCount by remember { mutableIntStateOf(messages.size) }
    LaunchedEffect(messages.size) {
        if (messages.size > previousMessageCount) {
            val latest = messages.firstOrNull()
            if (latest != null && latest.senderId != currentMember.id) {
                if (latest.isUrgent || latest.messageType == "urgent") {
                    soundManager.playUrgentFamilyBuzz(isSoundEnabled)
                } else {
                    soundManager.playIncomingMessageChime(isSoundEnabled)
                }
            }
        }
        previousMessageCount = messages.size
    }

    val typingMember by repository.typingMember.collectAsState()
    var cameraTempUri by remember { mutableStateOf<Uri?>(null) }

    // Camera Capture Launcher (ActivityResultContracts.TakePicture)
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success: Boolean ->
        if (success && cameraTempUri != null) {
            scope.launch {
                try {
                    val localCompressedPath = mediaManager.compressAndSaveLocalImage(cameraTempUri!!)
                    repository.sendImageStub(
                        sender = currentMember,
                        localImageUri = localCompressedPath,
                        replyTo = replyingTo
                    )
                    replyingTo = null
                } catch (e: Exception) {
                    e.printStackTrace()
                    Toast.makeText(context, "تعذر تجهيز الصورة الملتقطة", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    fun launchCamera() {
        try {
            val tempFile = File(context.cacheDir, "camera_capture_${System.currentTimeMillis()}.jpg")
            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                tempFile
            )
            cameraTempUri = uri
            cameraLauncher.launch(uri)
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(context, "تعذر فتح الكاميرا", Toast.LENGTH_SHORT).show()
        }
    }

    // Photo Gallery Picker (ActivityResultContracts.PickVisualMedia)
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            scope.launch {
                try {
                    val localCompressedPath = mediaManager.compressAndSaveLocalImage(uri)
                    repository.sendImageStub(
                        sender = currentMember,
                        localImageUri = localCompressedPath,
                        replyTo = replyingTo
                    )
                    replyingTo = null
                } catch (e: Exception) {
                    e.printStackTrace()
                    Toast.makeText(context, "تعذر تجهيز الصورة", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    Surface(
        color = colors.bgMain,
        modifier = Modifier.fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .imePadding()
        ) {
            // Header
            LammaHeader(
                onlineCount = members.size.coerceAtLeast(1),
                isNoticeActive = !room.pinnedNotice.isNullOrBlank(),
                onToggleNotice = { isNoticeOpen = !isNoticeOpen },
                onOpenChecklist = { isChecklistOpen = true },
                onOpenSettings = { isSettingsOpen = true },
                onOpenMembers = { isMembersOpen = true },
                onClearChat = { isClearChatDialogOpen = true }
            )

            // Pinned Notice Card
            PinnedNoticeCard(
                notice = room.pinnedNotice,
                pinnedBy = room.pinnedBy,
                isOpen = isNoticeOpen,
                onToggle = { isNoticeOpen = !isNoticeOpen },
                onUpdateNotice = { newNotice ->
                    scope.launch {
                        repository.updatePinnedNotice(newNotice, currentMember.displayName)
                    }
                }
            )

            // Special Passive Member: Siamese Cat «زينو» (Zino)
            Surface(
                color = colors.bgSurface,
                shape = RoundedCornerShape(10.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, colors.borderSubtle),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ZinoAvatar(modifier = Modifier.size(32.dp))
                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = "زينو",
                                    color = colors.textPrimary,
                                    fontSize = 12.sp,
                                    fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold
                                )
                                Text(
                                    text = "قط العائلة 🐾",
                                    color = colors.textMuted,
                                    fontSize = 10.sp
                                )
                            }
                            Text(
                                text = "يراقب المحادثة بهدوء 👀",
                                color = colors.textMuted,
                                fontSize = 10.sp
                            )
                        }
                    }

                    Text(
                        text = "عضو شرفي 🐈",
                        color = colors.textMuted,
                        fontSize = 10.5.sp
                    )
                }
            }

            // Message Feed
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                if (messages.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "لا توجد رسائل بعد... ابدأ المحادثة بكلمة طيبة ✨",
                            color = colors.border,
                            fontSize = 13.sp
                        )
                    }
                } else {
                    LazyColumn(
                        state = listState,
                        reverseLayout = true,
                        contentPadding = PaddingValues(vertical = 8.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(messages, key = { it.id }) { message ->
                            MessageItem(
                                message = message,
                                currentUserId = currentMember.id,
                                onReply = { replyingTo = it },
                                onToggleReaction = { msgId, emoji ->
                                    scope.launch {
                                        repository.toggleReaction(msgId, currentMember, emoji)
                                    }
                                },
                                onDelete = { msgId ->
                                    scope.launch {
                                        repository.deleteMessage(msgId)
                                    }
                                },
                                onImageClick = { url ->
                                    viewerImageUrl = url
                                }
                            )
                        }
                    }
                }
            }

            // Live Typing Indicator
            if (typingMember != null && typingMember != currentMember.displayName) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 2.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "✍️ $typingMember يكتب الآن...",
                        color = colors.accent.copy(alpha = 0.85f),
                        fontSize = 11.5.sp,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Medium
                    )
                }
            }

            // Composer Bar
            ComposerBar(
                replyingTo = replyingTo,
                onCancelReply = { replyingTo = null },
                onSendMessage = { text, isUrgent ->
                    scope.launch {
                        repository.sendMessage(
                            sender = currentMember,
                            content = text,
                            replyTo = replyingTo,
                            isUrgent = isUrgent
                        )
                        replyingTo = null
                    }
                },
                onAttachPhoto = {
                    photoPickerLauncher.launch(
                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                    )
                },
                onCapturePhoto = {
                    launchCamera()
                },
                onTyping = { isTyping ->
                    repository.setTyping(currentMember.displayName, isTyping)
                }
            )
        }
    }

    // Household Checklist Bottom Sheet
    if (isChecklistOpen) {
        ChecklistBottomSheet(
            checklist = checklist,
            onToggleItem = { repository.toggleChecklistItem(it) },
            onAddItem = { repository.addChecklistItem(it, currentMember.displayName) },
            onDeleteItem = { repository.removeChecklistItem(it) },
            onDismiss = { isChecklistOpen = false }
        )
    }

    // Image Fullscreen Viewer Dialog
    ImageViewerDialog(
        imageUrl = viewerImageUrl,
        mediaManager = mediaManager,
        onClose = { viewerImageUrl = null }
    )

    // Members Presence & Free USSD Dial Dialog
    if (isMembersOpen) {
        MembersPresenceDialog(
            members = members,
            currentMember = currentMember,
            onClose = { isMembersOpen = false }
        )
    }

    // Settings & Appearance Dialog
    if (isSettingsOpen) {
        SettingsDialog(
            currentMember = currentMember,
            currentTheme = currentTheme,
            isLargeText = isLargeText,
            isSoundEnabled = isSoundEnabled,
            isUltraLite = isUltraLite,
            mediaManager = mediaManager,
            onSelectTheme = onSelectTheme,
            onToggleLargeText = onToggleLargeText,
            onToggleSound = onToggleSound,
            onToggleUltraLite = onToggleUltraLite,
            onLogout = onLogout,
            onClearChat = {
                isSettingsOpen = false
                isClearChatDialogOpen = true
            },
            onClose = { isSettingsOpen = false }
        )
    }

    // Clear Chat Confirmation Dialog (Delete for Me Only)
    if (isClearChatDialogOpen) {
        androidx.compose.ui.window.Dialog(onDismissRequest = { isClearChatDialogOpen = false }) {
            Surface(
                color = colors.bgSurface,
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, colors.borderSubtle),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            color = Color(0xFFC85A65).copy(alpha = 0.2f),
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFC85A65).copy(alpha = 0.4f)),
                            modifier = Modifier.size(36.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text("🗑️", fontSize = 16.sp)
                            }
                        }
                        Text(
                            text = "محو المحادثة لديك",
                            color = colors.textPrimary,
                            fontSize = 16.sp,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold
                        )
                    }

                    Text(
                        text = "سيتم إخفاء الرسائل السابقة من هاتفك فقط دون حذفها عند أفراد العائلة، وستصلك أي رسائل جديدة ترسل بعد ذلك بشكل طبيعي.",
                        color = colors.textMuted,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)
                    ) {
                        OutlinedButton(
                            onClick = { isClearChatDialogOpen = false },
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, colors.borderSubtle)
                        ) {
                            Text("إلغاء", color = colors.textMuted, fontSize = 13.sp)
                        }

                        Button(
                            onClick = {
                                isClearChatDialogOpen = false
                                onClearChat()
                                Toast.makeText(context, "تم محو المحادثة من هاتفك بنجاح", Toast.LENGTH_SHORT).show()
                            },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC85A65))
                        ) {
                            Text("محو من هاتفي", color = Color(0xFFFADCD5), fontSize = 13.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    }
}
