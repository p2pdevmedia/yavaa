package lat.yavaa.android.feature.discovery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lat.yavaa.android.core.network.PublicCatalogCategory
import lat.yavaa.android.core.network.PublicCatalogMarket
import lat.yavaa.android.core.network.PublicDiscoveryApi
import lat.yavaa.android.core.network.PublicProviderCard

data class DiscoveryUiState(
    val loading: Boolean = false,
    val categories: List<PublicCatalogCategory> = emptyList(),
    val markets: List<PublicCatalogMarket> = emptyList(),
    val providers: List<PublicProviderCard> = emptyList(),
    val selectedCategory: String? = null,
    val selectedMarket: String? = null,
    val errorMessage: String? = null
) {
    val empty: Boolean
        get() = !loading && errorMessage == null && providers.isEmpty()
}

class DiscoveryViewModel(
    private val discoveryApi: PublicDiscoveryApi
) : ViewModel() {
    private val _state = MutableStateFlow(DiscoveryUiState())
    val state: StateFlow<DiscoveryUiState> = _state.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, errorMessage = null) }

            runCatching {
                val categories = discoveryApi.listPublicCatalogCategories().categories
                val markets = discoveryApi.listPublicCatalogMarkets().markets
                val selectedMarket = markets.firstOrNull { it.isPrimary }?.slug
                    ?: markets.firstOrNull()?.slug

                _state.update {
                    it.copy(
                        categories = categories,
                        markets = markets,
                        selectedMarket = selectedMarket
                    )
                }
                reloadProviders()
            }.onFailure {
                _state.update {
                    it.copy(
                        loading = false,
                        providers = emptyList(),
                        errorMessage = DISCOVERY_ERROR_MESSAGE
                    )
                }
            }
        }
    }

    fun selectCategory(slug: String?) {
        viewModelScope.launch {
            _state.update {
                it.copy(
                    selectedCategory = slug?.trim()?.takeIf(String::isNotEmpty),
                    errorMessage = null
                )
            }
            reloadProviders()
        }
    }

    fun selectMarket(slug: String?) {
        viewModelScope.launch {
            _state.update {
                it.copy(
                    selectedMarket = slug?.trim()?.takeIf(String::isNotEmpty),
                    errorMessage = null
                )
            }
            reloadProviders()
        }
    }

    fun retry() {
        load()
    }

    private suspend fun reloadProviders() {
        _state.update { it.copy(loading = true, errorMessage = null) }
        val current = _state.value

        runCatching {
            discoveryApi.listPublicProviders(
                category = current.selectedCategory,
                market = current.selectedMarket
            ).items
        }.onSuccess { providers ->
            _state.update {
                it.copy(
                    loading = false,
                    providers = providers,
                    errorMessage = null
                )
            }
        }.onFailure {
            _state.update {
                it.copy(
                    loading = false,
                    providers = emptyList(),
                    errorMessage = DISCOVERY_ERROR_MESSAGE
                )
            }
        }
    }

    private companion object {
        const val DISCOVERY_ERROR_MESSAGE = "No se pudo cargar discovery"
    }
}

class DiscoveryViewModelFactory(
    private val discoveryApi: PublicDiscoveryApi
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return DiscoveryViewModel(discoveryApi) as T
    }
}
