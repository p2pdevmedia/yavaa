package lat.yavaa.android.navigation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import io.github.jan.supabase.auth.status.SessionStatus
import lat.yavaa.android.YavaaContainer
import lat.yavaa.android.feature.auth.AuthScreen
import lat.yavaa.android.feature.auth.AuthViewModel
import lat.yavaa.android.feature.auth.AuthViewModelFactory
import lat.yavaa.android.feature.discovery.DiscoveryScreen
import lat.yavaa.android.feature.discovery.DiscoveryViewModel
import lat.yavaa.android.feature.discovery.DiscoveryViewModelFactory
import lat.yavaa.android.feature.discovery.ProviderProfileScreen
import lat.yavaa.android.feature.discovery.ProviderProfileViewModel
import lat.yavaa.android.feature.discovery.ProviderProfileViewModelFactory
import lat.yavaa.android.feature.home.HomeScreen
import lat.yavaa.android.feature.home.HomeViewModel
import lat.yavaa.android.feature.home.HomeViewModelFactory

private sealed interface YavaaRoute {
    data object Discovery : YavaaRoute
    data object Account : YavaaRoute
    data class ProviderProfile(val contractorProfileId: String) : YavaaRoute
}

@Composable
fun YavaaApp(container: YavaaContainer) {
    when (container) {
        is YavaaContainer.Misconfigured -> MisconfiguredScreen(message = container.message)
        is YavaaContainer.Ready -> ReadyYavaaApp(container = container)
    }
}

@Composable
private fun ReadyYavaaApp(container: YavaaContainer.Ready) {
    var route by remember {
        mutableStateOf<YavaaRoute>(YavaaRoute.Discovery)
    }
    var authenticated by remember {
        mutableStateOf(container.authRepository.currentAccessToken() != null)
    }

    LaunchedEffect(container.authRepository) {
        container.authRepository.sessionStatus.collect { status ->
            authenticated = status is SessionStatus.Authenticated
        }
    }

    when (val currentRoute = route) {
        YavaaRoute.Discovery -> {
            val discoveryViewModel: DiscoveryViewModel = viewModel(
                factory = DiscoveryViewModelFactory(container.apiClient)
            )
            DiscoveryScreen(
                viewModel = discoveryViewModel,
                onProviderClick = { contractorProfileId ->
                    route = YavaaRoute.ProviderProfile(contractorProfileId)
                },
                onAccountClick = {
                    route = YavaaRoute.Account
                }
            )
        }

        YavaaRoute.Account -> {
            if (authenticated) {
                val homeViewModel: HomeViewModel = viewModel(
                    factory = HomeViewModelFactory(
                        authRepository = container.authRepository,
                        apiClient = container.apiClient
                    )
                )
                HomeScreen(viewModel = homeViewModel)
            } else {
                val authViewModel: AuthViewModel = viewModel(
                    factory = AuthViewModelFactory(authRepository = container.authRepository)
                )
                AuthScreen(viewModel = authViewModel)
            }
        }

        is YavaaRoute.ProviderProfile -> {
            val providerProfileViewModel: ProviderProfileViewModel = viewModel(
                key = "provider-profile-${currentRoute.contractorProfileId}",
                factory = ProviderProfileViewModelFactory(
                    discoveryApi = container.apiClient,
                    contractorProfileId = currentRoute.contractorProfileId
                )
            )
            ProviderProfileScreen(
                viewModel = providerProfileViewModel,
                onBack = {
                    route = YavaaRoute.Discovery
                }
            )
        }
    }
}

@Composable
private fun MisconfiguredScreen(message: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.Start
    ) {
        Text(
            text = "Yavaa Android",
            style = MaterialTheme.typography.headlineMedium
        )
        Text(
            text = message,
            modifier = Modifier.padding(top = 12.dp),
            style = MaterialTheme.typography.bodyLarge
        )
    }
}
