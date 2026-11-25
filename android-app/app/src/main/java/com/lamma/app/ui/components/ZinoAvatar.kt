package com.lamma.app.ui.components

import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.lamma.app.ui.theme.*

val ZinoStatuses = listOf(
    "نائم حالياً 💤",
    "يراقب المحادثة 👀",
    "ينتظر الطعام 🐟",
    "يلعب بالكرة الصوفية 🧶"
)

const val ZINO_TOAST_MESSAGE = "🐾 مياو! زينو يسلّم عليكم جميعاً 🐱"

@Composable
fun ZinoAvatar(
    size: Dp = 36.dp,
    modifier: Modifier = Modifier,
    enableToastOnClick: Boolean = true
) {
    val context = LocalContext.current

    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .then(
                if (enableToastOnClick) {
                    Modifier.clickable {
                        Toast.makeText(context, ZINO_TOAST_MESSAGE, Toast.LENGTH_SHORT).show()
                    }
                } else Modifier
            ),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = this.size.width
            val height = this.size.height

            // 1. Background Circle
            drawCircle(
                color = ZinoFaceCream,
                radius = width * 0.48f,
                center = Offset(width * 0.5f, height * 0.5f)
            )
            drawCircle(
                color = Color(0xFFE2D0BD),
                radius = width * 0.48f,
                center = Offset(width * 0.5f, height * 0.5f),
                style = Stroke(width = 1.5f)
            )

            // 2. Siamese Cat Ears (Dark Seal Chocolate #3B2820)
            // Left Ear
            val leftEarPath = Path().apply {
                moveTo(width * 0.24f, height * 0.38f)
                lineTo(width * 0.16f, height * 0.10f)
                cubicTo(
                    width * 0.22f, height * 0.12f,
                    width * 0.38f, height * 0.18f,
                    width * 0.42f, height * 0.26f
                )
                close()
            }
            drawPath(leftEarPath, color = ZinoSealChocolate)

            // Right Ear
            val rightEarPath = Path().apply {
                moveTo(width * 0.76f, height * 0.38f)
                lineTo(width * 0.84f, height * 0.10f)
                cubicTo(
                    width * 0.78f, height * 0.12f,
                    width * 0.62f, height * 0.18f,
                    width * 0.58f, height * 0.26f
                )
                close()
            }
            drawPath(rightEarPath, color = ZinoSealChocolate)

            // 3. Cream Face Base
            drawOval(
                color = ZinoFaceCream,
                topLeft = Offset(width * 0.15f, height * 0.25f),
                size = Size(width * 0.70f, height * 0.60f)
            )

            // 4. Siamese Dark Seal Chocolate Mask (#3B2820)
            val maskPath = Path().apply {
                moveTo(width * 0.32f, height * 0.44f)
                cubicTo(
                    width * 0.32f, height * 0.36f,
                    width * 0.42f, height * 0.34f,
                    width * 0.50f, height * 0.34f
                )
                cubicTo(
                    width * 0.58f, height * 0.34f,
                    width * 0.68f, height * 0.36f,
                    width * 0.68f, height * 0.44f
                )
                cubicTo(
                    width * 0.68f, height * 0.56f,
                    width * 0.62f, height * 0.70f,
                    width * 0.50f, height * 0.70f
                )
                cubicTo(
                    width * 0.38f, height * 0.70f,
                    width * 0.32f, height * 0.56f,
                    width * 0.32f, height * 0.44f
                )
                close()
            }
            drawPath(maskPath, color = ZinoSealChocolate)

            // 5. Sapphire Blue Eyes (#5BC0EB)
            // Left eye
            drawOval(
                color = ZinoSapphireEye,
                topLeft = Offset(width * 0.335f, height * 0.405f),
                size = Size(width * 0.13f, height * 0.15f)
            )
            drawOval(
                color = ZinoEyeDark,
                topLeft = Offset(width * 0.37f, height * 0.425f),
                size = Size(width * 0.06f, height * 0.11f)
            )
            drawCircle(
                color = Color.White,
                radius = width * 0.02f,
                center = Offset(width * 0.38f, height * 0.45f)
            )

            // Right eye
            drawOval(
                color = ZinoSapphireEye,
                topLeft = Offset(width * 0.535f, height * 0.405f),
                size = Size(width * 0.13f, height * 0.15f)
            )
            drawOval(
                color = ZinoEyeDark,
                topLeft = Offset(width * 0.57f, height * 0.425f),
                size = Size(width * 0.06f, height * 0.11f)
            )
            drawCircle(
                color = Color.White,
                radius = width * 0.02f,
                center = Offset(width * 0.58f, height * 0.45f)
            )

            // 6. Cat Nose Tip
            val nosePath = Path().apply {
                moveTo(width * 0.47f, height * 0.59f)
                lineTo(width * 0.53f, height * 0.59f)
                lineTo(width * 0.50f, height * 0.63f)
                close()
            }
            drawPath(nosePath, color = Color(0xFF241813))

            // 7. Whiskers
            val whiskerColor = ZinoSealChocolate.copy(alpha = 0.6f)
            drawLine(
                color = whiskerColor,
                start = Offset(width * 0.22f, height * 0.58f),
                end = Offset(width * 0.33f, height * 0.60f),
                strokeWidth = 1.2f
            )
            drawLine(
                color = whiskerColor,
                start = Offset(width * 0.20f, height * 0.64f),
                end = Offset(width * 0.32f, height * 0.63f),
                strokeWidth = 1.2f
            )
            drawLine(
                color = whiskerColor,
                start = Offset(width * 0.78f, height * 0.58f),
                end = Offset(width * 0.67f, height * 0.60f),
                strokeWidth = 1.2f
            )
            drawLine(
                color = whiskerColor,
                start = Offset(width * 0.80f, height * 0.64f),
                end = Offset(width * 0.68f, height * 0.63f),
                strokeWidth = 1.2f
            )
        }
    }
}
