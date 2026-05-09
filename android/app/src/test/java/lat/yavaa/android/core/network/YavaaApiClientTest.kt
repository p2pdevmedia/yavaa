package lat.yavaa.android.core.network

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import lat.yavaa.android.core.config.YavaaConfig
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.fail
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
    fun `listPublicCatalogMarkets reads markets without authorization header`() = runTest {
        var authorizationHeader: String? = "unset"
        var requestedUrl: String? = null
        val engine = MockEngine { request ->
            authorizationHeader = request.headers[HttpHeaders.Authorization]
            requestedUrl = request.url.toString()
            respond(
                content = """{"markets":[{"id":"market_1","slug":"san-martin-de-los-andes","country":"AR","city":"San Martin de los Andes","province":"Neuquen","isPrimary":true,"workZones":[{"id":"zone_1","slug":"central","name":"Centro","description":"Zona central"}]}]}""",
                headers = headersOf(HttpHeaders.ContentType, "application/json")
            )
        }
        val client = YavaaApiClient(testConfig(), testHttpClient(engine))

        val response = client.listPublicCatalogMarkets()

        assertEquals(null, authorizationHeader)
        assertEquals("https://api.yavaa.lat/api/catalog/markets", requestedUrl)
        assertEquals("Centro", response.markets.single().workZones.single().name)
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
        var authorizationHeader: String? = "unset"
        var requestedUrl: String? = null
        val engine = MockEngine { request ->
            authorizationHeader = request.headers[HttpHeaders.Authorization]
            requestedUrl = request.url.toString()
            respond(
                content = """{"provider":{"contractorProfileId":"cp_1","displayName":"Carlos Perez","bio":"Plomero","profilePhotoUrl":null,"acceptsEmergencies":true,"marketSlug":"san-martin-de-los-andes","marketCity":"San Martin de los Andes","marketProvince":"Neuquen","categories":[{"slug":"home-services","name":"Home Services","group":"home services","isPrimary":true}],"workZones":[{"slug":"central","name":"Centro","description":"Zona central"}]}}""",
                headers = headersOf(HttpHeaders.ContentType, "application/json")
            )
        }
        val client = YavaaApiClient(testConfig(), testHttpClient(engine))

        val response = client.getPublicProviderProfile("cp_1")

        assertEquals(null, authorizationHeader)
        assertEquals("https://api.yavaa.lat/api/providers/cp_1", requestedUrl)
        assertEquals("Centro", response.provider?.workZones?.single()?.name)
    }

    @Test
    fun `getPublicProviderProfile parses null provider body as not found`() = runTest {
        val engine = MockEngine {
            respond(
                content = """{"provider":null}""",
                status = HttpStatusCode.NotFound,
                headers = headersOf(HttpHeaders.ContentType, "application/json")
            )
        }
        val client = YavaaApiClient(testConfig(), testHttpClient(engine))

        val response = client.getPublicProviderProfile("cp_missing")

        assertNull(response.provider)
    }

    @Test
    fun `getPublicProviderProfile encodes contractor profile id as one path segment`() = runTest {
        var requestedUrl: String? = null
        val engine = MockEngine { request ->
            requestedUrl = request.url.toString()
            respond(
                content = """{"provider":null}""",
                headers = headersOf(HttpHeaders.ContentType, "application/json")
            )
        }
        val client = YavaaApiClient(testConfig(), testHttpClient(engine))

        client.getPublicProviderProfile("cp/1?#")

        assertEquals("https://api.yavaa.lat/api/providers/cp%2F1%3F%23", requestedUrl)
    }

    @Test
    fun `missing items in public providers response fails JSON parsing`() {
        assertFailsSerialization {
            strictJson.decodeFromString(
                PublicProvidersResponse.serializer(),
                """{}"""
            )
        }
    }

    @Test
    fun `missing contractorProfileId in provider card fails JSON parsing`() {
        assertFailsSerialization {
            strictJson.decodeFromString(
                PublicProvidersResponse.serializer(),
                """{"items":[{"displayName":"Carlos Perez","bio":null,"profilePhotoUrl":null,"acceptsEmergencies":true,"marketSlug":"san-martin-de-los-andes","marketCity":"San Martin de los Andes","marketProvince":"Neuquen","categories":[]}]}"""
            )
        }
    }

    @Test
    fun `missing provider in public provider profile response fails JSON parsing`() {
        assertFailsSerialization {
            strictJson.decodeFromString(
                PublicProviderProfileResponse.serializer(),
                """{}"""
            )
        }
    }

    @Test
    fun `missing id in catalog market work zone fails JSON parsing`() {
        assertFailsSerialization {
            strictJson.decodeFromString(
                PublicCatalogMarketsResponse.serializer(),
                """{"markets":[{"id":"market_1","slug":"san-martin-de-los-andes","country":"AR","city":"San Martin de los Andes","province":"Neuquen","isPrimary":true,"workZones":[{"slug":"central","name":"Centro","description":"Zona central"}]}]}"""
            )
        }
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

    private fun assertFailsSerialization(block: () -> Unit) {
        try {
            block()
            fail("Expected SerializationException")
        } catch (_: SerializationException) {
        }
    }

    private companion object {
        val strictJson = Json { ignoreUnknownKeys = true }
    }
}
