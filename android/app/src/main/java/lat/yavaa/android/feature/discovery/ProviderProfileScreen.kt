package lat.yavaa.android.feature.discovery

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun ProviderProfileScreen(
    viewModel: ProviderProfileViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.load()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        OutlinedButton(onClick = onBack) {
            Text("Volver")
        }

        when {
            state.loading -> CircularProgressIndicator()

            state.errorMessage != null -> DiscoveryStateMessage(
                title = "No pudimos cargar el perfil",
                body = state.errorMessage.orEmpty(),
                actionLabel = "Reintentar",
                onAction = viewModel::retry
            )

            state.notFound -> DiscoveryStateMessage(
                title = "Perfil no disponible",
                body = "Este proveedor no esta publicado o ya no esta activo.",
                actionLabel = "Volver",
                onAction = onBack
            )

            state.provider != null -> {
                val provider = requireNotNull(state.provider)
                ProviderInitials(provider.displayName)
                Text(
                    text = provider.displayName,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = providerLocation(provider.marketCity, provider.marketProvince),
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                provider.bio?.let { bio ->
                    Text(text = bio, style = MaterialTheme.typography.bodyLarge)
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    InfoPill(
                        label = if (provider.acceptsEmergencies) {
                            "Acepta urgencias"
                        } else {
                            "Sin urgencias"
                        }
                    )
                }

                Text(
                    text = "Categorias",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    provider.categories.forEach { category ->
                        InfoPill(label = category.name)
                    }
                }

                Text(
                    text = "Zonas de trabajo",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                if (provider.workZones.isEmpty()) {
                    Text(
                        text = "Zona no publicada",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    provider.workZones.forEach { zone ->
                        Column {
                            Text(text = zone.name, fontWeight = FontWeight.SemiBold)
                            zone.description?.let { description ->
                                Text(
                                    text = description,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                DisabledFutureAction("Reservar")
            }
        }

        Spacer(modifier = Modifier.height(80.dp))
    }
}
