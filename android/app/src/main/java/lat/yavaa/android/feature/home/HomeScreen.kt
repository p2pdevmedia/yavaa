package lat.yavaa.android.feature.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun HomeScreen(viewModel: HomeViewModel) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.refreshMe()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.Start
    ) {
        Text(
            text = "Yavaa",
            style = MaterialTheme.typography.headlineLarge
        )
        Text(
            text = "Sesion autenticada",
            modifier = Modifier.padding(top = 8.dp),
            style = MaterialTheme.typography.bodyLarge
        )

        Spacer(modifier = Modifier.height(24.dp))

        when {
            state.loading -> CircularProgressIndicator()
            state.errorMessage != null -> Text(
                text = state.errorMessage.orEmpty(),
                color = MaterialTheme.colorScheme.error
            )
            state.me != null -> {
                val me = state.me
                Text("Backend: /api/me")
                Text("Autenticado: ${me?.authenticated == true}")
                Text("Email: ${me?.identity?.email ?: me?.appUser?.email ?: "sin email"}")
                Text("Roles: ${me?.permissionContext?.roles?.joinToString().orEmpty()}")
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = viewModel::refreshMe,
                modifier = Modifier.weight(1f)
            ) {
                Text("Actualizar")
            }
            Button(
                onClick = viewModel::signOut,
                modifier = Modifier.weight(1f)
            ) {
                Text("Salir")
            }
        }
    }
}

