package com.lamma.app.ui.components

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.lamma.app.data.local.MediaManager
import com.lamma.app.ui.theme.LocalLammaColors
import kotlinx.coroutines.launch

@Composable
fun ImageViewerDialog(
    imageUrl: String?,
    mediaManager: MediaManager,
    onClose: () -> Unit
) {
    if (imageUrl == null) return

    val colors = LocalLammaColors.current
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isSaving by remember { mutableStateOf(false) }

    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.95f))
        ) {
            // Close Button
            IconButton(
                onClick = onClose,
                modifier = Modifier
                    .statusBarsPadding()
                    .padding(16.dp)
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.2f))
                    .align(Alignment.TopEnd)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "إغلاق",
                    tint = Color.White
                )
            }

            // Image
            AsyncImage(
                model = imageUrl,
                contentDescription = "عرض الصورة",
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(vertical = 60.dp)
            )

            // Save to Studio / Gallery Button
            Button(
                onClick = {
                    scope.launch {
                        isSaving = true
                        val success = mediaManager.saveImageToGallery(imageUrl)
                        isSaving = false
                        if (success) {
                            Toast.makeText(context, "تم حفظ الصورة في الاستوديو بنجاح 🖼️", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(context, "تعذر حفظ الصورة في الاستوديو", Toast.LENGTH_SHORT).show()
                        }
                    }
                },
                enabled = !isSaving,
                colors = ButtonDefaults.buttonColors(containerColor = colors.bubbleOutgoing),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier
                    .navigationBarsPadding()
                    .padding(bottom = 24.dp)
                    .align(Alignment.BottomCenter)
            ) {
                Icon(
                    imageVector = Icons.Default.Download,
                    contentDescription = null,
                    tint = colors.accent,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isSaving) "جاري الحفظ..." else "حفظ في الاستوديو",
                    color = colors.accent,
                    fontSize = 13.sp
                )
            }
        }
    }
}
