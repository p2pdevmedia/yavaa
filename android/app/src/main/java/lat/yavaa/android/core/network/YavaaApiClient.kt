package lat.yavaa.android.core.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.android.Android
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.url
import io.ktor.http.HttpHeaders
import io.ktor.http.appendPathSegments
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
        return httpClient.get(config.backendBaseUrl) {
            url {
                appendPathSegments("api", "providers", contractorProfileId.trim(), encodeSlash = true)
            }
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

@Serializable
data class PublicCatalogCategoriesResponse(
    val categories: List<PublicCatalogCategory>
)

@Serializable
data class PublicCatalogCategory(
    val id: String,
    val slug: String,
    val name: String,
    val group: String?,
    val isInitial: Boolean
)

@Serializable
data class PublicCatalogMarketsResponse(
    val markets: List<PublicCatalogMarket>
)

@Serializable
data class PublicCatalogMarket(
    val id: String,
    val slug: String,
    val country: String,
    val city: String,
    val province: String,
    val isPrimary: Boolean,
    val workZones: List<PublicCatalogWorkZone>
)

@Serializable
data class PublicCatalogWorkZone(
    val id: String,
    val slug: String,
    val name: String,
    val description: String?
)

@Serializable
data class PublicProvidersResponse(
    val items: List<PublicProviderCard>
)

@Serializable
data class PublicProviderCard(
    val contractorProfileId: String,
    val displayName: String,
    val bio: String?,
    val profilePhotoUrl: String?,
    val acceptsEmergencies: Boolean,
    val marketSlug: String?,
    val marketCity: String?,
    val marketProvince: String?,
    val categories: List<PublicProviderCategory>
)

@Serializable
data class PublicProviderCategory(
    val slug: String,
    val name: String,
    val group: String?,
    val isPrimary: Boolean
)

@Serializable
data class PublicProviderProfileResponse(
    val provider: PublicProviderProfile?
)

@Serializable
data class PublicProviderProfile(
    val contractorProfileId: String,
    val displayName: String,
    val bio: String?,
    val profilePhotoUrl: String?,
    val acceptsEmergencies: Boolean,
    val marketSlug: String?,
    val marketCity: String?,
    val marketProvince: String?,
    val categories: List<PublicProviderCategory>,
    val workZones: List<PublicProviderWorkZone>
)

@Serializable
data class PublicProviderWorkZone(
    val slug: String,
    val name: String,
    val description: String?
)
