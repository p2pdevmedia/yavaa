package lat.yavaa.android.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lat.yavaa.android.core.auth.YavaaAuthRepository
import lat.yavaa.android.core.network.MeResponse
import lat.yavaa.android.core.network.YavaaApiClient

data class HomeUiState(
    val loading: Boolean = false,
    val me: MeResponse? = null,
    val errorMessage: String? = null
)

class HomeViewModel(
    private val authRepository: YavaaAuthRepository,
    private val apiClient: YavaaApiClient
) : ViewModel() {
    private val _state = MutableStateFlow(HomeUiState(loading = true))
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    fun refreshMe() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, errorMessage = null) }
            val token = authRepository.currentAccessToken()
            if (token == null) {
                _state.update {
                    it.copy(loading = false, errorMessage = "Sesion no disponible")
                }
                return@launch
            }

            runCatching {
                apiClient.getMe(token)
            }.onSuccess { me ->
                _state.update { it.copy(loading = false, me = me) }
            }.onFailure { error ->
                _state.update {
                    it.copy(
                        loading = false,
                        errorMessage = error.message ?: "No se pudo leer /api/me"
                    )
                }
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            authRepository.signOut()
        }
    }
}

class HomeViewModelFactory(
    private val authRepository: YavaaAuthRepository,
    private val apiClient: YavaaApiClient
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return HomeViewModel(authRepository, apiClient) as T
    }
}

