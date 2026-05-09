package lat.yavaa.android.feature.discovery

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import lat.yavaa.android.core.network.PublicCatalogCategory

@Composable
fun DiscoveryScreen(
    viewModel: DiscoveryViewModel,
    onProviderClick: (String) -> Unit,
    onAccountClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.load()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize(),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Yavaa",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Trabajadores de confianza, cerca de ti",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Ubicacion",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    state.markets.forEach { market ->
                        MarketChip(
                            market = market,
                            selected = state.selectedMarket == market.slug,
                            onClick = { viewModel.selectMarket(market.slug) }
                        )
                    }
                }
            }
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Categorias",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    CategoryChip(
                        category = PublicCatalogCategory(id = "all", slug = "", name = "Todas"),
                        selected = state.selectedCategory == null,
                        onClick = { viewModel.selectCategory(null) }
                    )
                    state.categories.forEach { category ->
                        CategoryChip(
                            category = category,
                            selected = state.selectedCategory == category.slug,
                            onClick = { viewModel.selectCategory(category.slug) }
                        )
                    }
                }
            }
        }

        item {
            Text(
                text = "Proveedores",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }

        when {
            state.loading -> item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator()
                }
            }

            state.errorMessage != null -> item {
                DiscoveryStateMessage(
                    title = "No pudimos cargar proveedores",
                    body = state.errorMessage.orEmpty(),
                    actionLabel = "Reintentar",
                    onAction = viewModel::retry
                )
            }

            state.empty -> item {
                DiscoveryStateMessage(
                    title = "No hay proveedores para estos filtros",
                    body = "Proba con otra categoria o ubicacion.",
                    actionLabel = "Actualizar",
                    onAction = viewModel::retry
                )
            }

            else -> items(
                items = state.providers,
                key = { provider -> provider.contractorProfileId }
            ) { provider ->
                ProviderCard(
                    provider = provider,
                    onClick = { onProviderClick(provider.contractorProfileId) }
                )
            }
        }

        item {
            DiscoveryBottomBar(
                onHomeClick = viewModel::retry,
                onAccountClick = onAccountClick
            )
        }

        item {
            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}
