package lat.yavaa.android

import android.app.Application
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.FlowType
import lat.yavaa.android.core.auth.YavaaAuthRepository
import lat.yavaa.android.core.config.YavaaConfig
import lat.yavaa.android.core.network.YavaaApiClient

class YavaaApplication : Application() {
    lateinit var container: YavaaContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = YavaaContainer.create()
    }
}

sealed interface YavaaContainer {
    data class Ready(
        val config: YavaaConfig,
        val authRepository: YavaaAuthRepository,
        val apiClient: YavaaApiClient
    ) : YavaaContainer

    data class Misconfigured(
        val message: String
    ) : YavaaContainer

    companion object {
        fun create(): YavaaContainer {
            val config = runCatching {
                YavaaConfig.from(
                    supabaseUrl = BuildConfig.YAVAA_SUPABASE_URL,
                    supabasePublishableKey = BuildConfig.YAVAA_SUPABASE_PUBLISHABLE_KEY,
                    backendBaseUrl = BuildConfig.YAVAA_BACKEND_BASE_URL
                )
            }.getOrElse { error ->
                return Misconfigured(error.message ?: "Android runtime configuration is invalid")
            }

            val supabaseClient = createSupabaseClient(
                supabaseUrl = config.supabaseUrl,
                supabaseKey = config.supabasePublishableKey
            ) {
                install(Auth) {
                    flowType = FlowType.PKCE
                }
            }

            return Ready(
                config = config,
                authRepository = YavaaAuthRepository(supabaseClient),
                apiClient = YavaaApiClient(config)
            )
        }
    }
}

