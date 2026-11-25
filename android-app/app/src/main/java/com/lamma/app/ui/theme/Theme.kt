package com.lamma.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

enum class LammaTheme(val titleArabic: String, val description: String) {
    SAKURA_DUSK("سكون الغسق", "درجات الغسق الدافئة وأرجواني الليل الحالم"),
    VELVET_INK("ليل المخمل", "كحلي ناعم ورمادي مخملي فخم وهادئ")
}

@Immutable
data class LammaColors(
    val bgMain: Color,
    val bgSurface: Color,
    val bubbleOutgoing: Color,
    val bubbleOutgoingText: Color,
    val bubbleIncoming: Color,
    val bubbleIncomingText: Color,
    val accent: Color,
    val border: Color,
    val isDark: Boolean = true
)

val SakuraDuskColorPalette = LammaColors(
    bgMain = SakuraDuskMain,
    bgSurface = SakuraDuskSurface,
    bubbleOutgoing = SakuraDuskBubbleOutgoing,
    bubbleOutgoingText = SakuraDuskBubbleOutgoingText,
    bubbleIncoming = SakuraDuskBubbleIncoming,
    bubbleIncomingText = SakuraDuskBubbleIncomingText,
    accent = SakuraDuskAccent,
    border = SakuraDuskBorder
)

val VelvetInkColorPalette = LammaColors(
    bgMain = VelvetInkMain,
    bgSurface = VelvetInkSurface,
    bubbleOutgoing = VelvetInkBubbleOutgoing,
    bubbleOutgoingText = VelvetInkBubbleOutgoingText,
    bubbleIncoming = VelvetInkBubbleIncoming,
    bubbleIncomingText = VelvetInkBubbleIncomingText,
    accent = VelvetInkAccent,
    border = VelvetInkBorder
)

val LocalLammaColors = staticCompositionLocalOf { SakuraDuskColorPalette }
val LocalLargeTextMode = staticCompositionLocalOf { false }
val LocalUltraLiteMode = staticCompositionLocalOf { false }

@Composable
fun LammaAppTheme(
    theme: LammaTheme = LammaTheme.SAKURA_DUSK,
    isLargeText: Boolean = false,
    isUltraLite: Boolean = false,
    content: @Composable () -> Unit
) {
    val colors = when (theme) {
        LammaTheme.SAKURA_DUSK -> SakuraDuskColorPalette
        LammaTheme.VELVET_INK -> VelvetInkColorPalette
    }

    val materialColorScheme = darkColorScheme(
        primary = colors.accent,
        background = colors.bgMain,
        surface = colors.bgSurface,
        onPrimary = colors.bgMain,
        onBackground = colors.accent,
        onSurface = colors.accent
    )

    CompositionLocalProvider(
        LocalLammaColors provides colors,
        LocalLargeTextMode provides isLargeText,
        LocalUltraLiteMode provides isUltraLite
    ) {
        MaterialTheme(
            colorScheme = materialColorScheme,
            content = content
        )
    }
}
