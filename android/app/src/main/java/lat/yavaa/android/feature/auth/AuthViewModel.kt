package lat.yavaa.android.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lat.yavaa.android.core.auth.YavaaAuthRepository

data class AuthUiState(
    val email: String = "",
    val password: String = "",
    val loading: Boolean = false,
    val errorMessage: String? = null
)

class AuthViewModel(
    private val authRepository: YavaaAuthRepository
) : ViewModel() {
    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    fun onEmailChange(value: String) {
        _state.update { it.copy(email = value, errorMessage = null) }
    }

    fun onPasswordChange(value: String) {
        _state.update { it.copy(password = value, errorMessage = null) }
    }

    fun signIn() {
        val current = _state.value
        if (current.email.isBlank() || current.password.isBlank()) {
            _state.update { it.copy(errorMessage = "Email y password son obligatorios") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(loading = true, errorMessage = null) }
            runCatching {
                authRepository.signInWithEmail(current.email, current.password)
            }.onFailure { error ->
                _state.update {
                    it.copy(
                        loading = false,
                        errorMessage = error.message ?: "No se pudo iniciar sesion"
                    )
                }
            }.onSuccess {
                _state.update { it.copy(loading = false, password = "") }
            }
        }
    }
}

class AuthViewModelFactory(
    private val authRepository: YavaaAuthRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return AuthViewModel(authRepository) as T
    }
}

