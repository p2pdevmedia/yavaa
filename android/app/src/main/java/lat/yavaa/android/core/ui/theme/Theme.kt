package lat.yavaa.android.core.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = YavaaPrimary,
    secondary = YavaaVerified,
    tertiary = YavaaWarning,
    background = YavaaBackground,
    surface = YavaaSurface,
    surfaceVariant = YavaaBackground,
    outline = YavaaLine,
    onPrimary = YavaaPrimaryInk,
    onSecondary = Color.White,
    onBackground = YavaaInk,
    onSurface = YavaaInk,
    onSurfaceVariant = YavaaMuted
)

@Composable
fun YavaaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        content = content
    )
}
