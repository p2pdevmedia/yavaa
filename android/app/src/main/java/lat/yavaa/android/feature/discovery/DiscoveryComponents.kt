package lat.yavaa.android.feature.discovery

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import lat.yavaa.android.core.network.PublicCatalogCategory
import lat.yavaa.android.core.network.PublicCatalogMarket
import lat.yavaa.android.core.network.PublicProviderCard

@Composable
fun DiscoveryStateMessage(
    title: String,
    body: String,
    actionLabel: String,
    onAction: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
        Text(
            text = body,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        OutlinedButton(onClick = onAction) {
            Text(actionLabel)
        }
    }
}

@Composable
fun CategoryChip(
    category: PublicCatalogCategory,
    selected: Boolean,
    onClick: () -> Unit
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(category.name) }
    )
}

@Composable
fun MarketChip(
    market: PublicCatalogMarket,
    selected: Boolean,
    onClick: () -> Unit
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text("${market.city}, ${market.province}") }
    )
}

@Composable
fun ProviderCard(
    provider: PublicProviderCard,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            ProviderInitials(provider.displayName)
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = provider.displayName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = providerLocation(provider),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                provider.bio?.let { bio ->
                    Text(
                        text = bio,
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(
                        onClick = {},
                        label = {
                            Text(if (provider.acceptsEmergencies) "Acepta urgencias" else "Sin urgencias")
                        }
                    )
                    provider.categories.firstOrNull()?.let { category ->
                        AssistChip(onClick = {}, label = { Text(category.name) })
                    }
                }
            }
        }
    }
}

@Composable
fun ProviderInitials(displayName: String, modifier: Modifier = Modifier) {
    val initials = displayName
        .split(" ")
        .filter { it.isNotBlank() }
        .take(2)
        .joinToString("") { it.first().uppercase() }
        .ifBlank { "Y" }

    Text(
        text = initials,
        modifier = modifier
            .size(52.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(15.dp),
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        fontWeight = FontWeight.Bold
    )
}

@Composable
fun DisabledFutureAction(label: String) {
    Button(onClick = {}, enabled = false, modifier = Modifier.fillMaxWidth()) {
        Text(label)
    }
    Spacer(modifier = Modifier.height(4.dp))
    Text(
        text = "Disponible cuando implementemos reservas.",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

fun providerLocation(provider: PublicProviderCard): String {
    return providerLocation(provider.marketCity, provider.marketProvince)
}

fun providerLocation(marketCity: String?, marketProvince: String?): String {
    return if (marketCity != null && marketProvince != null) {
        "${marketCity}, ${marketProvince}"
    } else {
        "Zona no publicada"
    }
}

@Composable
fun DiscoveryBottomBar(
    onHomeClick: () -> Unit,
    onAccountClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        TextButton(onClick = onHomeClick) { Text("Inicio") }
        TextButton(onClick = {}) { Text("Buscar") }
        TextButton(onClick = {}) { Text("Reservas") }
        TextButton(onClick = {}) { Text("Mensajes") }
        TextButton(onClick = onAccountClick) { Text("Tu") }
    }
}
