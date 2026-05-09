package lat.yavaa.android.core.network

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.http.HttpHeaders
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import lat.yavaa.android.core.config.YavaaConfig
import org.junit.Assert.assertEquals
import org.junit.Test

class YavaaApiClientTest {
    @Test
    fun `getMe sends bearer token to backend session endpoint`() = runTest {
        var authorizationHeader: String? = null
        var requestedUrl: String? = null
        val engine = MockEngine { request ->
            authorizationHeader = request.headers[HttpHeaders.Authorization]
            requestedUrl = request.url.toString()
            respond(
                content = """{"authenticated":true,"configured":true,"reason":null,"identity":{"id":"auth_1","email":"ana@yavaa.lat"},"appUser":{"id":"user_1","email":"ana@yavaa.lat","displayName":"Ana","status":"ACTIVE","roles":["client"],"profile":null,"addresses":[],"contractorProfile":null},"matchedBy":"email","permissionContext":{"userId":"user_1","status":"ACTIVE","roles":["client"]}}""",
                headers = headersOf(HttpHeaders.ContentType, "application/json")
            )
        }

        val response = YavaaApiClient(testConfig(), testHttpClient(engine)).getMe("access-token")

        assertEquals("Bearer access-token", authorizationHeader)
        assertEquals("https://api.yavaa.lat/api/me", requestedUrl)
        assertEquals(true, response.authenticated)
        assertEquals("ana@yavaa.lat", response.identity?.email)
        assertEquals(listOf("client"), response.permissionContext?.roles)
    }

    @Test
    fun `listPublicCatalogCategories reads categories without authorization header`() = runTest {
        var authorizationHeader: String? = "unset"
        var requestedUrl: String? = null
        val engine = MockEngine { request ->
            authorizationHeader = request.headers[HttpHeaders.Authorization]
            requestedUrl = request.url.toString()
            respond(
                content = """{"categories":[{"id":"cat_1","slug":"home-services","name":"Home Services","group":"home services","isInitial":true}]}""",
                headers = headersOf(HttpHeaders.ContentType, "application/json")
            )
        }
        val client = YavaaApiClient(testConfig(), testHttpClient(engine))

        val response = client.listPublicCatalogCategories()

        assertEquals(null, authorizationHeader)
        assertEquals("https://api.yavaa.lat/api/catalog/categories", requestedUrl)
        assertEquals("home-services", response.categories.single().slug)
    }

    @Test
    fun `listPublicProviders applies category and market query filters without authorization header`() = runTest {
        var authorizationHeader: String? = "unset"
        var requestedUrl: String? = null
        val engine = MockEngine { request ->
            authorizationHeader = request.headers[HttpHeaders.Authorization]
            requestedUrl = request.url.toString()
            respond(
                content = """{"items":[{"contractorProfileId":"cp_1","displayName":"Carlos Perez","bio":"Plomero","profilePhotoUrl":null,"acceptsEmergencies":true,"marketSlug":"san-martin-de-los-andes","marketCity":"San Martin de los Andes","marketProvince":"Neuquen","categories":[{"slug":"home-services","name":"Home Services","group":"home services","isPrimary":true}]}]}""",
                headers = headersOf(HttpHeaders.ContentType, "application/json")
            )
        }
        val client = YavaaApiClient(testConfig(), testHttpClient(engine))

        val response = client.listPublicProviders(category = "home-services", market = "san-martin-de-los-andes")

        assertEquals(null, authorizationHeader)
        assertEquals("https://api.yavaa.lat/api/providers?category=home-services&market=san-martin-de-los-andes", requestedUrl)
        assertEquals("Carlos Perez", response.items.single().displayName)
        assertEquals(true, response.items.single().acceptsEmergencies)
    }

    @Test
    fun `getPublicProviderProfile reads provider detail`() = runTest {
        var requestedUrl: String? = null
        val engine = MockEngine { request ->
            requestedUrl = request.url.toString()
            respond(
                content = """{"provider":{"contractorProfileId":"cp_1","displayName":"Carlos Perez","bio":"Plomero","profilePhotoUrl":null,"acceptsEmergencies":true,"marketSlug":"san-martin-de-los-andes","marketCity":"San Martin de los Andes","marketProvince":"Neuquen","categories":[{"slug":"home-services","name":"Home Services","group":"home services","isPrimary":true}],"workZones":[{"slug":"central","name":"Centro","description":"Zona central"}]}}""",
                headers = headersOf(HttpHeaders.ContentType, "application/json")
            )
        }
        val client = YavaaApiClient(testConfig(), testHttpClient(engine))

        val response = client.getPublicProviderProfile("cp_1")

        assertEquals("https://api.yavaa.lat/api/providers/cp_1", requestedUrl)
        assertEquals("Centro", response.provider?.workZones?.single()?.name)
    }

    private fun testConfig(): YavaaConfig {
        return YavaaConfig.from(
            supabaseUrl = "https://project.supabase.co",
            supabasePublishableKey = "sb_publishable_test",
            backendBaseUrl = "https://api.yavaa.lat"
        )
    }

    private fun testHttpClient(engine: MockEngine): HttpClient {
        return HttpClient(engine) {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true })
            }
        }
    }
}
