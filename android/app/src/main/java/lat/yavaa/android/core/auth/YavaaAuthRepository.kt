package lat.yavaa.android.core.auth

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.flow.Flow

class YavaaAuthRepository(
    private val supabaseClient: SupabaseClient
) {
    val sessionStatus: Flow<SessionStatus> = supabaseClient.auth.sessionStatus

    fun currentAccessToken(): String? {
        return supabaseClient.auth.currentSessionOrNull()?.accessToken
    }

    suspend fun signInWithEmail(email: String, password: String) {
        require(email.isNotBlank()) { "Email is required" }
        require(password.isNotBlank()) { "Password is required" }

        supabaseClient.auth.signInWith(Email) {
            this.email = email.trim()
            this.password = password
        }
    }

    suspend fun signOut() {
        supabaseClient.auth.signOut()
    }
}

