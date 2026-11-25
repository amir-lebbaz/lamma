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
    val bgCanvas: Color,
    val bgSurface: Color,
    val bgElevated: Color,
    val accentPrimary: Color,
    val textPrimary: Color,
    val textMuted: Color,
    val borderSubtle: Color,
    // Backwards-compatible properties
    val bgMain: Color = bgCanvas,
    val bubbleOutgoing: Color = accentPrimary,
    val bubbleOutgoingText: Color = textPrimary,
    val bubbleIncoming: Color = bgElevated,
    val bubbleIncomingText: Color = textPrimary,
    val accent: Color = textPrimary,
    val border: Color = borderSubtle,
    val isDark: Boolean = true
)

val SakuraDuskColorPalette = LammaColors(
    bgCanvas = SakuraDuskCanvas,
    bgSurface = SakuraDuskSurface,
    bgElevated = SakuraDuskElevated,
    accentPrimary = SakuraDuskAccentPrimary,
    textPrimary = SakuraDuskTextPrimary,
    textMuted = SakuraDuskTextMuted,
    borderSubtle = SakuraDuskBorderSubtle
)

val VelvetInkColorPalette = LammaColors(
    bgCanvas = VelvetInkCanvas,
    bgSurface = VelvetInkSurface,
    bgElevated = VelvetInkElevated,
    accentPrimary = VelvetInkAccentPrimary,
    textPrimary = VelvetInkTextPrimary,
    textMuted = VelvetInkTextMuted,
    borderSubtle = VelvetInkBorderSubtle
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
        primary = colors.accentPrimary,
        background = colors.bgCanvas,
        surface = colors.bgSurface,
        onPrimary = colors.textPrimary,
        onBackground = colors.textPrimary,
        onSurface = colors.textPrimary
    )

    CompositionLocalProvider(
        LocalLammaColors provides colors,
        LocalLargeTextMode provides isLargeText,
        LocalUltraLiteMode provides isUltraLite,
        androidx.compose.ui.platform.LocalLayoutDirection provides androidx.compose.ui.unit.LayoutDirection.Rtl
    ) {
        MaterialTheme(
            colorScheme = materialColorScheme,
            content = content
        )
    }
}
