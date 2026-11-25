package com.lamma.app.ui.components

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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lamma.app.data.model.ChecklistItem
import com.lamma.app.ui.theme.LocalLammaColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChecklistBottomSheet(
    checklist: List<ChecklistItem>,
    onToggleItem: (String) -> Unit,
    onAddItem: (String) -> Unit,
    onDeleteItem: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val colors = LocalLammaColors.current
    var newItemText by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = colors.bgSurface,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 10.dp)
                    .width(36.dp)
                    .height(4.dp)
                    .clip(CircleShape)
                    .background(colors.border)
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 10.dp)
                .navigationBarsPadding()
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "نواقص البيت 🛒",
                        color = colors.accent,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "قائمة مشتركة متزامنة لحظياً بين أفراد العائلة",
                        color = colors.border,
                        fontSize = 11.sp
                    )
                }

                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "إغلاق",
                        tint = colors.border
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Add Item Input
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = newItemText,
                    onValueChange = { newItemText = it },
                    placeholder = { Text("أضف غرضاً ناقصاً (خبز، حليب...)", fontSize = 13.sp, color = colors.border) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = colors.accent,
                        unfocusedTextColor = colors.accent,
                        focusedBorderColor = colors.accent,
                        unfocusedBorderColor = colors.border.copy(alpha = 0.5f),
                        focusedContainerColor = colors.bgMain,
                        unfocusedContainerColor = colors.bgMain
                    ),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.weight(1f)
                )

                IconButton(
                    onClick = {
                        val trimmed = newItemText.trim()
                        if (trimmed.isNotEmpty()) {
                            onAddItem(trimmed)
                            newItemText = ""
                        }
                    },
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(colors.bubbleOutgoing)
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "إضافة غرض",
                        tint = colors.accent
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Items List
            if (checklist.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "كل النواقص متوفرة والحمد لله ✨",
                        color = colors.border,
                        fontSize = 13.sp
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 350.dp)
                ) {
                    items(checklist, key = { it.id }) { item ->
                        Surface(
                            color = colors.bgMain.copy(alpha = 0.7f),
                            shape = RoundedCornerShape(14.dp),
                            border = BorderStroke(1.dp, colors.border.copy(alpha = 0.3f)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onToggleItem(item.id) }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    // Custom checkbox circle
                                    Box(
                                        modifier = Modifier
                                            .size(22.dp)
                                            .clip(CircleShape)
                                            .background(if (item.isCompleted) colors.accent else Color.Transparent)
                                            .border(1.5.dp, colors.accent, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (item.isCompleted) {
                                            Icon(
                                                imageVector = Icons.Default.Check,
                                                contentDescription = null,
                                                tint = colors.bgMain,
                                                modifier = Modifier.size(14.dp)
                                            )
                                        }
                                    }

                                    Column {
                                        Text(
                                            text = item.text,
                                            color = if (item.isCompleted) colors.border else colors.accent,
                                            fontSize = 13.5.sp,
                                            fontWeight = if (item.isCompleted) FontWeight.Normal else FontWeight.SemiBold,
                                            textDecoration = if (item.isCompleted) TextDecoration.LineThrough else null
                                        )
                                        Text(
                                            text = "أضافه: ${item.addedBy}",
                                            color = colors.border.copy(alpha = 0.7f),
                                            fontSize = 10.sp
                                        )
                                    }
                                }

                                IconButton(
                                    onClick = { onDeleteItem(item.id) },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Delete,
                                        contentDescription = "حذف",
                                        tint = Color(0xFFF28482).copy(alpha = 0.8f),
                                        modifier = Modifier.size(16.dp)
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
