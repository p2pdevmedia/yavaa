package lat.yavaa.android.core.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.android.Android
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.url
import io.ktor.http.HttpHeaders
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import lat.yavaa.android.core.config.YavaaConfig

interface PublicDiscoveryApi {
    suspend fun listPublicCatalogCategories(): PublicCatalogCategoriesResponse
    suspend fun listPublicCatalogMarkets(): PublicCatalogMarketsResponse
    suspend fun listPublicProviders(category: String? = null, market: String? = null): PublicProvidersResponse
    suspend fun getPublicProviderProfile(contractorProfileId: String): PublicProviderProfileResponse
}

class YavaaApiClient(
    private val config: YavaaConfig,
    private val httpClient: HttpClient = defaultHttpClient()
) : PublicDiscoveryApi {
    suspend fun getMe(accessToken: String): MeResponse {
        require(accessToken.isNotBlank()) { "Access token is required" }

        return httpClient.get("${config.backendBaseUrl}/api/me") {
            header(HttpHeaders.Authorization, "Bearer ${accessToken.trim()}")
        }.body()
    }

    override suspend fun listPublicCatalogCategories(): PublicCatalogCategoriesResponse {
        return httpClient.get("${config.backendBaseUrl}/api/catalog/categories").body()
    }

    override suspend fun listPublicCatalogMarkets(): PublicCatalogMarketsResponse {
        return httpClient.get("${config.backendBaseUrl}/api/catalog/markets").body()
    }

    override suspend fun listPublicProviders(
        category: String?,
        market: String?
    ): PublicProvidersResponse {
        return httpClient.get("${config.backendBaseUrl}/api/providers") {
            url {
                category?.trim()?.takeIf { it.isNotEmpty() }?.let { parameters.append("category", it) }
                market?.trim()?.takeIf { it.isNotEmpty() }?.let { parameters.append("market", it) }
            }
        }.body()
    }

    override suspend fun getPublicProviderProfile(
        contractorProfileId: String
    ): PublicProviderProfileResponse {
        require(contractorProfileId.isNotBlank()) { "Contractor profile id is required" }
        return httpClient.get("${config.backendBaseUrl}/api/providers/${contractorProfileId.trim()}").body()
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

@Serializable
data class PublicCatalogCategoriesResponse(
    val categories: List<PublicCatalogCategory> = emptyList()
)

@Serializable
data class PublicCatalogCategory(
    val id: String,
    val slug: String,
    val name: String,
    val group: String? = null,
    val isInitial: Boolean = false
)

@Serializable
data class PublicCatalogMarketsResponse(
    val markets: List<PublicCatalogMarket> = emptyList()
)

@Serializable
data class PublicCatalogMarket(
    val id: String,
    val slug: String,
    val country: String,
    val city: String,
    val province: String,
    val isPrimary: Boolean = false,
    val workZones: List<PublicWorkZone> = emptyList()
)

@Serializable
data class PublicWorkZone(
    val id: String? = null,
    val slug: String,
    val name: String,
    val description: String? = null
)

@Serializable
data class PublicProvidersResponse(
    val items: List<PublicProviderCard> = emptyList()
)

@Serializable
data class PublicProviderCard(
    val contractorProfileId: String,
    val displayName: String,
    val bio: String? = null,
    val profilePhotoUrl: String? = null,
    val acceptsEmergencies: Boolean = false,
    val marketSlug: String? = null,
    val marketCity: String? = null,
    val marketProvince: String? = null,
    val categories: List<PublicProviderCategory> = emptyList()
)

@Serializable
data class PublicProviderCategory(
    val slug: String,
    val name: String,
    val group: String? = null,
    val isPrimary: Boolean = false
)

@Serializable
data class PublicProviderProfileResponse(
    val provider: PublicProviderProfile? = null
)

@Serializable
data class PublicProviderProfile(
    val contractorProfileId: String,
    val displayName: String,
    val bio: String? = null,
    val profilePhotoUrl: String? = null,
    val acceptsEmergencies: Boolean = false,
    val marketSlug: String? = null,
    val marketCity: String? = null,
    val marketProvince: String? = null,
    val categories: List<PublicProviderCategory> = emptyList(),
    val workZones: List<PublicWorkZone> = emptyList()
)
