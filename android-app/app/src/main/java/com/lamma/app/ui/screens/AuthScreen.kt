package com.lamma.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lamma.app.data.model.Member
import com.lamma.app.data.supabase.ChatRepository
import com.lamma.app.data.supabase.LammaSupabase
import com.lamma.app.ui.theme.AvatarColors
import com.lamma.app.ui.theme.LocalLammaColors
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.launch
import java.util.UUID

@Composable
fun AuthScreen(
    repository: ChatRepository,
    onLoginSuccess: (Member) -> Unit
) {
    val colors = LocalLammaColors.current
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val members by repository.members.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) } // 0: Login, 1: Register
    var selectedMember by remember { mutableStateOf<Member?>(null) }
    var password by remember { mutableStateOf("") }
    var isPasswordVisible by remember { mutableStateOf(false) }

    // Register fields
    var newDisplayName by remember { mutableStateOf("") }
    var newNickname by remember { mutableStateOf("") }
    var selectedColorIndex by remember { mutableIntStateOf(0) }
    var isSubmitting by remember { mutableStateOf(false) }

    Surface(
        color = colors.bgCanvas,
        modifier = Modifier.fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
                .statusBarsPadding()
                .navigationBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // App Logo Squircle
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(colors.accentPrimary)
                    .border(1.dp, colors.borderSubtle, RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "لَمّة",
                    color = colors.textPrimary,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "مرحباً بك في لَمّة العائلة",
                color = colors.textPrimary,
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold
            )

            Text(
                text = "مساحة محادثة خاصة ودافئة تجمعنا كل يوم",
                color = colors.textMuted,
                fontSize = 12.sp,
                modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
            )

            // Auth Card
            Surface(
                color = colors.bgSurface,
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, colors.borderSubtle),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    // Tab Selector
                    TabRow(
                        selectedTabIndex = selectedTab,
                        containerColor = colors.bgCanvas,
                        contentColor = colors.textPrimary,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .border(1.dp, colors.borderSubtle, RoundedCornerShape(10.dp))
                    ) {
                        Tab(
                            selected = selectedTab == 0,
                            onClick = { selectedTab = 0 },
                            text = { Text("تسجيل الدخول", fontWeight = FontWeight.Medium, fontSize = 13.sp) }
                        )
                        Tab(
                            selected = selectedTab == 1,
                            onClick = { selectedTab = 1 },
                            text = { Text("فرد جديد", fontWeight = FontWeight.Medium, fontSize = 13.sp) }
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    if (selectedTab == 0) {
                        // LOGIN TAB
                        Text(
                            text = "اختر اسمك من أفراد العائلة:",
                            color = colors.textPrimary,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )

                        // Member Selection Chips
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp)
                        ) {
                            items(members) { member ->
                                val isSelected = selectedMember?.id == member.id
                                val memColor = remember(member.avatarColor) {
                                    try {
                                        Color(android.graphics.Color.parseColor(member.avatarColor))
                                    } catch (e: Exception) {
                                        colors.textPrimary
                                    }
                                }

                                Surface(
                                    color = if (isSelected) colors.accentPrimary else colors.bgCanvas,
                                    border = BorderStroke(1.dp, if (isSelected) colors.textPrimary.copy(alpha = 0.5f) else colors.borderSubtle),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.clickable { selectedMember = member }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(10.dp)
                                                .clip(CircleShape)
                                                .background(memColor)
                                        )
                                        Text(
                                            text = member.displayName,
                                            color = colors.textPrimary,
                                            fontSize = 12.sp,
                                            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
                                        )
                                    }
                                }
                            }
                        }

                        // Password Field
                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            label = { Text("كلمة المرور العائلية") },
                            leadingIcon = {
                                Icon(imageVector = Icons.Default.Lock, contentDescription = null, tint = colors.textMuted)
                            },
                            trailingIcon = {
                                IconButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                                    Icon(
                                        imageVector = if (isPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                        contentDescription = null,
                                        tint = colors.textMuted
                                    )
                                }
                            },
                            visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = colors.textPrimary,
                                unfocusedTextColor = colors.textPrimary,
                                focusedBorderColor = colors.accentPrimary,
                                unfocusedBorderColor = colors.borderSubtle,
                                focusedContainerColor = colors.bgCanvas,
                                unfocusedContainerColor = colors.bgCanvas
                            ),
                            shape = RoundedCornerShape(10.dp),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(18.dp))

                        Button(
                            onClick = {
                                if (selectedMember == null) {
                                    Toast.makeText(context, "الرجاء اختيار اسمك من القائمة", Toast.LENGTH_SHORT).show()
                                    return@Button
                                }
                                onLoginSuccess(selectedMember!!)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = colors.accentPrimary),
                            border = BorderStroke(1.dp, colors.borderSubtle),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                        ) {
                            Text("دخول إلى المحادثة", color = colors.textPrimary, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                        }

                    } else {
                        // REGISTER TAB
                        OutlinedTextField(
                            value = newDisplayName,
                            onValueChange = { newDisplayName = it },
                            label = { Text("الاسم الكريم (مثال: أمين، سارة)") },
                            leadingIcon = {
                                Icon(imageVector = Icons.Default.Person, contentDescription = null, tint = colors.textMuted)
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = colors.textPrimary,
                                unfocusedTextColor = colors.textPrimary,
                                focusedBorderColor = colors.accentPrimary,
                                unfocusedBorderColor = colors.borderSubtle,
                                focusedContainerColor = colors.bgCanvas,
                                unfocusedContainerColor = colors.bgCanvas
                            ),
                            shape = RoundedCornerShape(10.dp),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        OutlinedTextField(
                            value = newNickname,
                            onValueChange = { newNickname = it },
                            label = { Text("اللقب أو الصفة (مثال: أم العيال، أبو علي)") },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = colors.textPrimary,
                                unfocusedTextColor = colors.textPrimary,
                                focusedBorderColor = colors.accentPrimary,
                                unfocusedBorderColor = colors.borderSubtle,
                                focusedContainerColor = colors.bgCanvas,
                                unfocusedContainerColor = colors.bgCanvas
                            ),
                            shape = RoundedCornerShape(10.dp),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "اختر لونك الخاص:",
                            color = colors.textPrimary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )

                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp)
                        ) {
                            items(AvatarColors.indices.toList()) { index ->
                                val color = AvatarColors[index]
                                val isSelected = selectedColorIndex == index

                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(CircleShape)
                                        .background(color)
                                        .border(
                                            width = if (isSelected) 3.dp else 0.dp,
                                            color = if (isSelected) colors.textPrimary else Color.Transparent,
                                            shape = CircleShape
                                        )
                                        .clickable { selectedColorIndex = index }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = {
                                val name = newDisplayName.trim()
                                if (name.isEmpty()) {
                                    Toast.makeText(context, "الرجاء كتابة اسمك", Toast.LENGTH_SHORT).show()
                                    return@Button
                                }
                                scope.launch {
                                    isSubmitting = true
                                    val hexColor = "#" + Integer.toHexString(AvatarColors[selectedColorIndex].hashCode()).takeLast(6).uppercase()
                                    val newMember = Member(
                                        id = UUID.randomUUID().toString(),
                                        username = name.lowercase().replace(" ", "_"),
                                        displayName = name,
                                        nickname = newNickname.trim().ifEmpty { null },
                                        avatarColor = hexColor,
                                        createdAt = java.time.Instant.now().toString()
                                    )

                                    try {
                                        LammaSupabase.postgrest.from("family_members").insert(newMember)
                                        repository.loadInitialData()
                                        onLoginSuccess(newMember)
                                    } catch (e: Exception) {
                                        e.printStackTrace()
                                        Toast.makeText(context, "تم التسجيل بنجاح", Toast.LENGTH_SHORT).show()
                                        onLoginSuccess(newMember)
                                    } finally {
                                        isSubmitting = false
                                    }
                                }
                            },
                            enabled = !isSubmitting,
                            colors = ButtonDefaults.buttonColors(containerColor = colors.accentPrimary),
                            border = BorderStroke(1.dp, colors.borderSubtle),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                        ) {
                            Text(
                                text = if (isSubmitting) "جاري الانضمام..." else "انضمام للعائلة",
                                color = colors.textPrimary,
                                fontWeight = FontWeight.Medium,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
