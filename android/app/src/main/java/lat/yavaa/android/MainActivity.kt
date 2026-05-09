package lat.yavaa.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import lat.yavaa.android.core.ui.theme.YavaaTheme
import lat.yavaa.android.navigation.YavaaApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val container = (application as YavaaApplication).container

        setContent {
            YavaaTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    YavaaApp(container = container)
                }
            }
        }
    }
}

