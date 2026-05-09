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
        val httpClient = HttpClient(engine) {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true })
            }
        }
        val config = YavaaConfig.from(
            supabaseUrl = "https://project.supabase.co",
            supabasePublishableKey = "sb_publishable_test",
            backendBaseUrl = "https://api.yavaa.lat"
        )

        val response = YavaaApiClient(config, httpClient).getMe("access-token")

        assertEquals("Bearer access-token", authorizationHeader)
        assertEquals("https://api.yavaa.lat/api/me", requestedUrl)
        assertEquals(true, response.authenticated)
        assertEquals("ana@yavaa.lat", response.identity?.email)
        assertEquals(listOf("client"), response.permissionContext?.roles)
    }
}
