package com.lamma.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lamma.app.ui.theme.LocalLammaColors

@Composable
fun PinnedNoticeCard(
    notice: String?,
    pinnedBy: String?,
    isOpen: Boolean,
    onToggle: () -> Unit,
    onUpdateNotice: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    if (notice.isNullOrBlank()) return

    val colors = LocalLammaColors.current
    var isEditDialogOpen by remember { mutableStateOf(false) }
    var editNoticeText by remember { mutableStateOf(notice) }

    Surface(
        color = colors.bgSurface.copy(alpha = 0.95f),
        border = BorderStroke(1.dp, colors.border.copy(alpha = 0.4f)),
        shape = RoundedCornerShape(bottomStart = 14.dp, bottomEnd = 14.dp),
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clickable { onToggle() }
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.PushPin,
                        contentDescription = null,
                        tint = colors.accent,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "ملاحظة العائلة المثبتة",
                        color = colors.accent,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = {
                            editNoticeText = notice
                            isEditDialogOpen = true
                        },
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "تعديل الملاحظة",
                            tint = colors.border,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }

            AnimatedVisibility(visible = isOpen) {
                Column(modifier = Modifier.padding(top = 6.dp)) {
                    Text(
                        text = notice,
                        color = colors.accent,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )
                    if (!pinnedBy.isNullOrBlank()) {
                        Text(
                            text = "ثبتها: $pinnedBy",
                            color = colors.border,
                            fontSize = 10.sp,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            }
        }
    }

    if (isEditDialogOpen) {
        AlertDialog(
            onDismissRequest = { isEditDialogOpen = false },
            title = {
                Text(
                    text = "تعديل الملاحظة المثبتة",
                    color = colors.accent,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                OutlinedTextField(
                    value = editNoticeText,
                    onValueChange = { editNoticeText = it },
                    label = { Text("نص الملاحظة العائلية") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = colors.accent,
                        unfocusedTextColor = colors.accent,
                        focusedBorderColor = colors.accent,
                        unfocusedBorderColor = colors.border
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        onUpdateNotice(editNoticeText)
                        isEditDialogOpen = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = colors.bubbleOutgoing)
                ) {
                    Text("حفظ", color = colors.accent)
                }
            },
            dismissButton = {
                TextButton(onClick = { isEditDialogOpen = false }) {
                    Text("إلغاء", color = colors.border)
                }
            },
            containerColor = colors.bgSurface
        )
    }
}
