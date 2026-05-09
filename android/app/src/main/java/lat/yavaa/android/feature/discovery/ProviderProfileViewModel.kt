package lat.yavaa.android.feature.discovery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lat.yavaa.android.core.network.PublicDiscoveryApi
import lat.yavaa.android.core.network.PublicProviderProfile

data class ProviderProfileUiState(
    val loading: Boolean = false,
    val provider: PublicProviderProfile? = null,
    val notFound: Boolean = false,
    val errorMessage: String? = null
)

class ProviderProfileViewModel(
    private val discoveryApi: PublicDiscoveryApi,
    private val contractorProfileId: String
) : ViewModel() {
    private val _state = MutableStateFlow(ProviderProfileUiState())
    val state: StateFlow<ProviderProfileUiState> = _state.asStateFlow()
    private var profileRequestVersion = 0

    fun load() {
        val requestVersion = nextProfileRequestVersion()
        viewModelScope.launch {
            if (!isCurrentProfileRequest(requestVersion)) {
                return@launch
            }
            _state.update {
                it.copy(
                    loading = true,
                    notFound = false,
                    errorMessage = null
                )
            }

            try {
                val provider = discoveryApi.getPublicProviderProfile(contractorProfileId).provider
                if (isCurrentProfileRequest(requestVersion)) {
                    _state.update {
                        it.copy(
                            loading = false,
                            provider = provider,
                            notFound = provider == null,
                            errorMessage = null
                        )
                    }
                }
            } catch (error: CancellationException) {
                throw error
            } catch (_: Throwable) {
                if (isCurrentProfileRequest(requestVersion)) {
                    _state.update {
                        it.copy(
                            loading = false,
                            provider = null,
                            notFound = false,
                            errorMessage = PROFILE_ERROR_MESSAGE
                        )
                    }
                }
            }
        }
    }

    fun retry() {
        load()
    }

    private fun nextProfileRequestVersion(): Int {
        profileRequestVersion += 1
        return profileRequestVersion
    }

    private fun isCurrentProfileRequest(requestVersion: Int): Boolean {
        return requestVersion == profileRequestVersion
    }

    private companion object {
        const val PROFILE_ERROR_MESSAGE = "No se pudo cargar el perfil"
    }
}

class ProviderProfileViewModelFactory(
    private val discoveryApi: PublicDiscoveryApi,
    private val contractorProfileId: String
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return ProviderProfileViewModel(discoveryApi, contractorProfileId) as T
    }
}
