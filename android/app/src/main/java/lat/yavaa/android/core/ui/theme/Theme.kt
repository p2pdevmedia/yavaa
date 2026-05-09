package lat.yavaa.android.core.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = YavaaTeal,
    secondary = YavaaGreen,
    tertiary = YavaaWarning,
    background = YavaaMist,
    surface = YavaaMist,
    onPrimary = androidx.compose.ui.graphics.Color.White,
    onSecondary = androidx.compose.ui.graphics.Color.White,
    onBackground = YavaaInk,
    onSurface = YavaaInk
)

@Composable
fun YavaaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        content = content
    )
}

