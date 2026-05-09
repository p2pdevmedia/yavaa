package lat.yavaa.android.core.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.android.Android
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.http.HttpHeaders
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import lat.yavaa.android.core.config.YavaaConfig

class YavaaApiClient(
    private val config: YavaaConfig,
    private val httpClient: HttpClient = defaultHttpClient()
) {
    suspend fun getMe(accessToken: String): MeResponse {
        require(accessToken.isNotBlank()) { "Access token is required" }

        return httpClient.get("${config.backendBaseUrl}/api/me") {
            header(HttpHeaders.Authorization, "Bearer ${accessToken.trim()}")
        }.body()
    }

    companion object {
        fun defaultHttpClient(): HttpClient {
            return HttpClient(Android) {
                install(ContentNegotiation) {
                    json(Json {
                        ignoreUnknownKeys = true
                    })
                }
            }
        }
    }
}

@Serializable
data class MeResponse(
    val authenticated: Boolean,
    val configured: Boolean = true,
    val reason: String? = null,
    val identity: MeIdentity? = null,
    val appUser: MeAppUser? = null,
    val matchedBy: String? = null,
    val permissionContext: PermissionContext? = null
)

@Serializable
data class MeIdentity(
    val id: String,
    val email: String? = null
)

@Serializable
data class MeAppUser(
    val id: String,
    val email: String? = null,
    @SerialName("displayName")
    val displayName: String? = null,
    val status: String? = null,
    val roles: List<String> = emptyList()
)

@Serializable
data class PermissionContext(
    val userId: String,
    val status: String,
    val roles: List<String> = emptyList()
)
