# Android Cliente Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build public client discovery in the native Android app so users can browse categories, markets, providers, and provider profiles without signing in.

**Architecture:** Keep the current single-module Android app. Extend `YavaaApiClient` with public discovery calls behind a small `PublicDiscoveryApi` interface, add a focused `feature/discovery` vertical with testable ViewModels, and make public discovery the initial route while preserving the existing auth/account flow.

**Tech Stack:** Kotlin, Jetpack Compose Material 3, Kotlin coroutines, Ktor client, kotlinx.serialization, JUnit, kotlinx-coroutines-test.

---

## File Structure

- Modify `android/app/src/main/java/lat/yavaa/android/core/network/YavaaApiClient.kt` to add public discovery DTOs and methods.
- Modify `android/app/src/test/java/lat/yavaa/android/core/network/YavaaApiClientTest.kt` to cover public discovery request construction and parsing.
- Create `android/app/src/main/java/lat/yavaa/android/feature/discovery/DiscoveryViewModel.kt` for home/list filter state.
- Create `android/app/src/main/java/lat/yavaa/android/feature/discovery/ProviderProfileViewModel.kt` for provider profile state.
- Create `android/app/src/test/java/lat/yavaa/android/feature/discovery/DiscoveryViewModelTest.kt`.
- Create `android/app/src/test/java/lat/yavaa/android/feature/discovery/ProviderProfileViewModelTest.kt`.
- Create `android/app/src/main/java/lat/yavaa/android/feature/discovery/DiscoveryScreen.kt` for the public marketplace home and provider list.
- Create `android/app/src/main/java/lat/yavaa/android/feature/discovery/ProviderProfileScreen.kt` for public provider detail.
- Create `android/app/src/main/java/lat/yavaa/android/feature/discovery/DiscoveryComponents.kt` for reusable cards, chips, pills, and state surfaces.
- Modify `android/app/src/main/java/lat/yavaa/android/navigation/YavaaApp.kt` so discovery is the initial route and account/auth remains reachable.
- Modify `android/app/src/main/java/lat/yavaa/android/core/ui/theme/Color.kt` and `android/app/src/main/java/lat/yavaa/android/core/ui/theme/Theme.kt` to apply the terracotta design baseline.
- Modify `android/README.md` to document the Android discovery slice and verification commands.

## Tasks

### Task 1: Public Discovery API Client

**Files:**
- Modify: `android/app/src/main/java/lat/yavaa/android/core/network/YavaaApiClient.kt`
- Modify: `android/app/src/test/java/lat/yavaa/android/core/network/YavaaApiClientTest.kt`

- [ ] **Step 1: Add failing API client tests**

Append these tests inside `YavaaApiClientTest`:

```kotlin
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
```

Add these helpers at the bottom of the test class:

```kotlin
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
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
cd android
gradle testDebugUnitTest --tests 'lat.yavaa.android.core.network.YavaaApiClientTest'
```

Expected: FAIL because `listPublicCatalogCategories`, `listPublicProviders`, and `getPublicProviderProfile` do not exist.

- [ ] **Step 3: Implement public discovery models and methods**

Update `YavaaApiClient.kt` with this structure, keeping the existing `/api/me` models:

```kotlin
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
```

Add these DTOs below the existing `/api/me` DTOs:

```kotlin
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
```

- [ ] **Step 4: Run the API client tests**

Run:

```bash
cd android
gradle testDebugUnitTest --tests 'lat.yavaa.android.core.network.YavaaApiClientTest'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add android/app/src/main/java/lat/yavaa/android/core/network/YavaaApiClient.kt android/app/src/test/java/lat/yavaa/android/core/network/YavaaApiClientTest.kt
git commit -m "feat(android): add public discovery api client"
```

### Task 2: Discovery ViewModels

**Files:**
- Create: `android/app/src/main/java/lat/yavaa/android/feature/discovery/DiscoveryViewModel.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/feature/discovery/ProviderProfileViewModel.kt`
- Create: `android/app/src/test/java/lat/yavaa/android/feature/discovery/DiscoveryViewModelTest.kt`
- Create: `android/app/src/test/java/lat/yavaa/android/feature/discovery/ProviderProfileViewModelTest.kt`

- [ ] **Step 1: Write failing ViewModel tests**

Create `DiscoveryViewModelTest.kt`:

```kotlin
package lat.yavaa.android.feature.discovery

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import lat.yavaa.android.core.network.PublicCatalogCategoriesResponse
import lat.yavaa.android.core.network.PublicCatalogCategory
import lat.yavaa.android.core.network.PublicCatalogMarket
import lat.yavaa.android.core.network.PublicCatalogMarketsResponse
import lat.yavaa.android.core.network.PublicDiscoveryApi
import lat.yavaa.android.core.network.PublicProviderCard
import lat.yavaa.android.core.network.PublicProviderProfileResponse
import lat.yavaa.android.core.network.PublicProvidersResponse
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class DiscoveryViewModelTest {
    private val dispatcher = StandardTestDispatcher()

    @Before
    fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `load selects primary market and fetches providers`() = runTest {
        val api = FakeDiscoveryApi()
        val viewModel = DiscoveryViewModel(api)

        viewModel.load()
        advanceUntilIdle()

        val state = viewModel.state.value
        assertEquals(false, state.loading)
        assertEquals("san-martin-de-los-andes", state.selectedMarket)
        assertEquals("Carlos Perez", state.providers.single().displayName)
        assertEquals(listOf("categories", "markets", "providers:null:san-martin-de-los-andes"), api.calls)
    }

    @Test
    fun `selectCategory reloads providers with selected filter`() = runTest {
        val api = FakeDiscoveryApi()
        val viewModel = DiscoveryViewModel(api)

        viewModel.load()
        advanceUntilIdle()
        viewModel.selectCategory("home-services")
        advanceUntilIdle()

        assertEquals("home-services", viewModel.state.value.selectedCategory)
        assertTrue(api.calls.contains("providers:home-services:san-martin-de-los-andes"))
    }

    @Test
    fun `load exposes empty state when no providers match`() = runTest {
        val api = FakeDiscoveryApi(providers = emptyList())
        val viewModel = DiscoveryViewModel(api)

        viewModel.load()
        advanceUntilIdle()

        assertEquals(false, viewModel.state.value.loading)
        assertEquals(true, viewModel.state.value.empty)
    }

    @Test
    fun `load exposes error state when api fails`() = runTest {
        val api = FakeDiscoveryApi(error = IllegalStateException("network down"))
        val viewModel = DiscoveryViewModel(api)

        viewModel.load()
        advanceUntilIdle()

        assertEquals(false, viewModel.state.value.loading)
        assertEquals("No se pudo cargar discovery", viewModel.state.value.errorMessage)
    }
}
```

Create `ProviderProfileViewModelTest.kt`:

```kotlin
package lat.yavaa.android.feature.discovery

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import lat.yavaa.android.core.network.PublicProviderProfile
import lat.yavaa.android.core.network.PublicProviderProfileResponse
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ProviderProfileViewModelTest {
    private val dispatcher = StandardTestDispatcher()

    @Before
    fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `load exposes profile when provider exists`() = runTest {
        val api = FakeDiscoveryApi(
            profile = PublicProviderProfile(
                contractorProfileId = "cp_1",
                displayName = "Carlos Perez",
                acceptsEmergencies = true
            )
        )
        val viewModel = ProviderProfileViewModel(api, "cp_1")

        viewModel.load()
        advanceUntilIdle()

        assertEquals(false, viewModel.state.value.loading)
        assertEquals("Carlos Perez", viewModel.state.value.provider?.displayName)
        assertEquals(false, viewModel.state.value.notFound)
    }

    @Test
    fun `load exposes not found when provider is null`() = runTest {
        val api = FakeDiscoveryApi(profile = null)
        val viewModel = ProviderProfileViewModel(api, "missing")

        viewModel.load()
        advanceUntilIdle()

        assertEquals(false, viewModel.state.value.loading)
        assertEquals(true, viewModel.state.value.notFound)
    }
}
```

Add this fake API to the bottom of `DiscoveryViewModelTest.kt`, below the test class, so both test files can use it from the same package:

```kotlin
internal class FakeDiscoveryApi(
    private val providers: List<PublicProviderCard> = listOf(
        PublicProviderCard(
            contractorProfileId = "cp_1",
            displayName = "Carlos Perez",
            bio = "Plomero",
            acceptsEmergencies = true,
            marketSlug = "san-martin-de-los-andes",
            marketCity = "San Martin de los Andes",
            marketProvince = "Neuquen"
        )
    ),
    private val profile: PublicProviderProfile? = PublicProviderProfile(
        contractorProfileId = "cp_1",
        displayName = "Carlos Perez",
        acceptsEmergencies = true
    ),
    private val error: Throwable? = null
) : PublicDiscoveryApi {
    val calls = mutableListOf<String>()

    override suspend fun listPublicCatalogCategories(): PublicCatalogCategoriesResponse {
        error?.let { throw it }
        calls += "categories"
        return PublicCatalogCategoriesResponse(
            categories = listOf(
                PublicCatalogCategory(
                    id = "cat_1",
                    slug = "home-services",
                    name = "Home Services",
                    group = "home services",
                    isInitial = true
                )
            )
        )
    }

    override suspend fun listPublicCatalogMarkets(): PublicCatalogMarketsResponse {
        error?.let { throw it }
        calls += "markets"
        return PublicCatalogMarketsResponse(
            markets = listOf(
                PublicCatalogMarket(
                    id = "market_1",
                    slug = "san-martin-de-los-andes",
                    country = "Argentina",
                    city = "San Martin de los Andes",
                    province = "Neuquen",
                    isPrimary = true
                )
            )
        )
    }

    override suspend fun listPublicProviders(
        category: String?,
        market: String?
    ): PublicProvidersResponse {
        error?.let { throw it }
        calls += "providers:${category}:${market}"
        return PublicProvidersResponse(items = providers)
    }

    override suspend fun getPublicProviderProfile(contractorProfileId: String): PublicProviderProfileResponse {
        error?.let { throw it }
        return PublicProviderProfileResponse(provider = profile)
    }
}
```

- [ ] **Step 2: Run the focused failing ViewModel tests**

Run:

```bash
cd android
gradle testDebugUnitTest --tests 'lat.yavaa.android.feature.discovery.*'
```

Expected: FAIL because the discovery ViewModels do not exist.

- [ ] **Step 3: Implement `DiscoveryViewModel`**

Create `DiscoveryViewModel.kt`:

```kotlin
package lat.yavaa.android.feature.discovery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lat.yavaa.android.core.network.PublicCatalogCategory
import lat.yavaa.android.core.network.PublicCatalogMarket
import lat.yavaa.android.core.network.PublicDiscoveryApi
import lat.yavaa.android.core.network.PublicProviderCard

data class DiscoveryUiState(
    val loading: Boolean = false,
    val categories: List<PublicCatalogCategory> = emptyList(),
    val markets: List<PublicCatalogMarket> = emptyList(),
    val providers: List<PublicProviderCard> = emptyList(),
    val selectedCategory: String? = null,
    val selectedMarket: String? = null,
    val errorMessage: String? = null
) {
    val empty: Boolean
        get() = !loading && errorMessage == null && providers.isEmpty()
}

class DiscoveryViewModel(
    private val api: PublicDiscoveryApi
) : ViewModel() {
    private val _state = MutableStateFlow(DiscoveryUiState(loading = true))
    val state: StateFlow<DiscoveryUiState> = _state.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, errorMessage = null) }
            runCatching {
                val categories = api.listPublicCatalogCategories().categories
                val markets = api.listPublicCatalogMarkets().markets
                val selectedMarket = _state.value.selectedMarket
                    ?: markets.firstOrNull { it.isPrimary }?.slug
                    ?: markets.firstOrNull()?.slug
                val providers = api.listPublicProviders(
                    category = _state.value.selectedCategory,
                    market = selectedMarket
                ).items
                _state.update {
                    it.copy(
                        loading = false,
                        categories = categories,
                        markets = markets,
                        providers = providers,
                        selectedMarket = selectedMarket,
                        errorMessage = null
                    )
                }
            }.onFailure {
                _state.update {
                    it.copy(
                        loading = false,
                        providers = emptyList(),
                        errorMessage = "No se pudo cargar discovery"
                    )
                }
            }
        }
    }

    fun selectCategory(slug: String?) {
        _state.update { it.copy(selectedCategory = slug) }
        reloadProviders()
    }

    fun selectMarket(slug: String?) {
        _state.update { it.copy(selectedMarket = slug) }
        reloadProviders()
    }

    fun retry() {
        load()
    }

    private fun reloadProviders() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, errorMessage = null) }
            runCatching {
                api.listPublicProviders(
                    category = _state.value.selectedCategory,
                    market = _state.value.selectedMarket
                ).items
            }.onSuccess { providers ->
                _state.update {
                    it.copy(loading = false, providers = providers, errorMessage = null)
                }
            }.onFailure {
                _state.update {
                    it.copy(
                        loading = false,
                        providers = emptyList(),
                        errorMessage = "No se pudo actualizar la busqueda"
                    )
                }
            }
        }
    }
}

class DiscoveryViewModelFactory(
    private val api: PublicDiscoveryApi
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return DiscoveryViewModel(api) as T
    }
}
```

- [ ] **Step 4: Implement `ProviderProfileViewModel`**

Create `ProviderProfileViewModel.kt`:

```kotlin
package lat.yavaa.android.feature.discovery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lat.yavaa.android.core.network.PublicDiscoveryApi
import lat.yavaa.android.core.network.PublicProviderProfile

data class ProviderProfileUiState(
    val loading: Boolean = false,
    val provider: PublicProviderProfile? = null,
    val notFound: Boolean = false,
    val errorMessage: String? = null
)

class ProviderProfileViewModel(
    private val api: PublicDiscoveryApi,
    private val contractorProfileId: String
) : ViewModel() {
    private val _state = MutableStateFlow(ProviderProfileUiState(loading = true))
    val state: StateFlow<ProviderProfileUiState> = _state.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, notFound = false, errorMessage = null) }
            runCatching {
                api.getPublicProviderProfile(contractorProfileId).provider
            }.onSuccess { provider ->
                _state.update {
                    it.copy(
                        loading = false,
                        provider = provider,
                        notFound = provider == null,
                        errorMessage = null
                    )
                }
            }.onFailure {
                _state.update {
                    it.copy(
                        loading = false,
                        provider = null,
                        notFound = false,
                        errorMessage = "No se pudo cargar el perfil"
                    )
                }
            }
        }
    }

    fun retry() {
        load()
    }
}

class ProviderProfileViewModelFactory(
    private val api: PublicDiscoveryApi,
    private val contractorProfileId: String
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return ProviderProfileViewModel(api, contractorProfileId) as T
    }
}
```

- [ ] **Step 5: Run the ViewModel tests**

Run:

```bash
cd android
gradle testDebugUnitTest --tests 'lat.yavaa.android.feature.discovery.*'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add android/app/src/main/java/lat/yavaa/android/feature/discovery android/app/src/test/java/lat/yavaa/android/feature/discovery
git commit -m "feat(android): add discovery view models"
```

### Task 3: Terracotta Theme Baseline

**Files:**
- Modify: `android/app/src/main/java/lat/yavaa/android/core/ui/theme/Color.kt`
- Modify: `android/app/src/main/java/lat/yavaa/android/core/ui/theme/Theme.kt`

- [ ] **Step 1: Update color tokens**

Replace `Color.kt` with:

```kotlin
package lat.yavaa.android.core.ui.theme

import androidx.compose.ui.graphics.Color

val YavaaBackground = Color(0xFFF6EFE3)
val YavaaSurface = Color(0xFFFFFBF3)
val YavaaInk = Color(0xFF1F1A14)
val YavaaMuted = Color(0xFF6B6258)
val YavaaLine = Color(0xFFE5DBC8)
val YavaaPrimary = Color(0xFFC0492A)
val YavaaPrimaryInk = Color(0xFFFFF5EC)
val YavaaVerified = Color(0xFF2F6B3A)
val YavaaWarning = Color(0xFFB45309)
```

- [ ] **Step 2: Update Material color scheme**

Replace the `LightColors` definition in `Theme.kt` with:

```kotlin
private val LightColors = lightColorScheme(
    primary = YavaaPrimary,
    secondary = YavaaVerified,
    tertiary = YavaaWarning,
    background = YavaaBackground,
    surface = YavaaSurface,
    surfaceVariant = YavaaBackground,
    outline = YavaaLine,
    onPrimary = YavaaPrimaryInk,
    onSecondary = androidx.compose.ui.graphics.Color.White,
    onBackground = YavaaInk,
    onSurface = YavaaInk,
    onSurfaceVariant = YavaaMuted
)
```

- [ ] **Step 3: Run compile-oriented unit test task**

Run:

```bash
cd android
gradle testDebugUnitTest
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add android/app/src/main/java/lat/yavaa/android/core/ui/theme/Color.kt android/app/src/main/java/lat/yavaa/android/core/ui/theme/Theme.kt
git commit -m "feat(android): apply discovery design theme"
```

### Task 4: Discovery Compose UI

**Files:**
- Create: `android/app/src/main/java/lat/yavaa/android/feature/discovery/DiscoveryComponents.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/feature/discovery/DiscoveryScreen.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/feature/discovery/ProviderProfileScreen.kt`

- [ ] **Step 1: Create reusable discovery components**

Create `DiscoveryComponents.kt` with these composables:

```kotlin
package lat.yavaa.android.feature.discovery

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import lat.yavaa.android.core.network.PublicCatalogCategory
import lat.yavaa.android.core.network.PublicCatalogMarket
import lat.yavaa.android.core.network.PublicProviderCard

@Composable
fun DiscoveryStateMessage(
    title: String,
    body: String,
    actionLabel: String,
    onAction: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        Text(body, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        OutlinedButton(onClick = onAction) {
            Text(actionLabel)
        }
    }
}

@Composable
fun CategoryChip(
    category: PublicCatalogCategory,
    selected: Boolean,
    onClick: () -> Unit
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(category.name) }
    )
}

@Composable
fun MarketChip(
    market: PublicCatalogMarket,
    selected: Boolean,
    onClick: () -> Unit
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text("${market.city}, ${market.province}") }
    )
}

@Composable
fun ProviderCard(
    provider: PublicProviderCard,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            ProviderInitials(provider.displayName)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(provider.displayName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(
                    providerLocation(provider),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                provider.bio?.let {
                    Text(
                        it,
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(
                        onClick = {},
                        label = { Text(if (provider.acceptsEmergencies) "Acepta urgencias" else "Sin urgencias") }
                    )
                    provider.categories.firstOrNull()?.let { category ->
                        AssistChip(onClick = {}, label = { Text(category.name) })
                    }
                }
            }
        }
    }
}

@Composable
fun ProviderInitials(displayName: String, modifier: Modifier = Modifier) {
    val initials = displayName
        .split(" ")
        .filter { it.isNotBlank() }
        .take(2)
        .joinToString("") { it.first().uppercase() }
        .ifBlank { "Y" }

    Text(
        text = initials,
        modifier = modifier
            .size(52.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(15.dp),
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        fontWeight = FontWeight.Bold
    )
}

@Composable
fun DisabledFutureAction(label: String) {
    Button(onClick = {}, enabled = false, modifier = Modifier.fillMaxWidth()) {
        Text(label)
    }
    Spacer(modifier = Modifier.height(4.dp))
    Text(
        "Disponible cuando implementemos reservas.",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

fun providerLocation(provider: PublicProviderCard): String {
    return providerLocation(provider.marketCity, provider.marketProvince)
}

fun providerLocation(marketCity: String?, marketProvince: String?): String {
    return if (marketCity != null && marketProvince != null) {
        "${marketCity}, ${marketProvince}"
    } else {
        "Zona no publicada"
    }
}

@Composable
fun DiscoveryBottomBar(
    onHomeClick: () -> Unit,
    onAccountClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        TextButton(onClick = onHomeClick) { Text("Inicio") }
        TextButton(onClick = {}) { Text("Buscar") }
        TextButton(onClick = {}) { Text("Reservas") }
        TextButton(onClick = {}) { Text("Mensajes") }
        TextButton(onClick = onAccountClick) { Text("Tú") }
    }
}
```

- [ ] **Step 2: Create discovery home screen**

Create `DiscoveryScreen.kt`:

```kotlin
package lat.yavaa.android.feature.discovery

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun DiscoveryScreen(
    viewModel: DiscoveryViewModel,
    onProviderClick: (String) -> Unit
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.load()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Text("Yavaa", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text(
            "Trabajadores de confianza, cerca de ti",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Text("Ubicacion", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            state.markets.forEach { market ->
                MarketChip(
                    market = market,
                    selected = state.selectedMarket == market.slug,
                    onClick = { viewModel.selectMarket(market.slug) }
                )
            }
        }

        Text("Categorias", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            CategoryChip(
                category = state.categories.firstOrNull()?.copy(id = "all", slug = "", name = "Todas")
                    ?: lat.yavaa.android.core.network.PublicCatalogCategory(id = "all", slug = "", name = "Todas"),
                selected = state.selectedCategory == null,
                onClick = { viewModel.selectCategory(null) }
            )
            state.categories.forEach { category ->
                CategoryChip(
                    category = category,
                    selected = state.selectedCategory == category.slug,
                    onClick = { viewModel.selectCategory(category.slug) }
                )
            }
        }

        Text("Proveedores", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)

        when {
            state.loading -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator()
                }
            }
            state.errorMessage != null -> DiscoveryStateMessage(
                title = "No pudimos cargar proveedores",
                body = state.errorMessage.orEmpty(),
                actionLabel = "Reintentar",
                onAction = viewModel::retry
            )
            state.empty -> DiscoveryStateMessage(
                title = "No hay proveedores para estos filtros",
                body = "Proba con otra categoria o ubicacion.",
                actionLabel = "Actualizar",
                onAction = viewModel::retry
            )
            else -> {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    state.providers.forEach { provider ->
                        ProviderCard(
                            provider = provider,
                            onClick = { onProviderClick(provider.contractorProfileId) }
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(80.dp))
    }
}
```

- [ ] **Step 3: Create provider profile screen**

Create `ProviderProfileScreen.kt`:

```kotlin
package lat.yavaa.android.feature.discovery

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AssistChip
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun ProviderProfileScreen(
    viewModel: ProviderProfileViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.load()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        OutlinedButton(onClick = onBack) {
            Text("Volver")
        }

        when {
            state.loading -> CircularProgressIndicator()
            state.errorMessage != null -> DiscoveryStateMessage(
                title = "No pudimos cargar el perfil",
                body = state.errorMessage.orEmpty(),
                actionLabel = "Reintentar",
                onAction = viewModel::retry
            )
            state.notFound -> DiscoveryStateMessage(
                title = "Perfil no disponible",
                body = "Este proveedor no esta publicado o ya no esta activo.",
                actionLabel = "Volver",
                onAction = onBack
            )
            state.provider != null -> {
                val provider = state.provider
                ProviderInitials(provider.displayName)
                Text(provider.displayName, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                Text(
                    providerLocation(provider.marketCity, provider.marketProvince),
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                provider.bio?.let {
                    Text(it, style = MaterialTheme.typography.bodyLarge)
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(
                        onClick = {},
                        label = { Text(if (provider.acceptsEmergencies) "Acepta urgencias" else "Sin urgencias") }
                    )
                }

                Text("Categorias", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    provider.categories.forEach { category ->
                        AssistChip(onClick = {}, label = { Text(category.name) })
                    }
                }

                Text("Zonas de trabajo", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                if (provider.workZones.isEmpty()) {
                    Text("Zona no publicada", color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    provider.workZones.forEach { zone ->
                        Column {
                            Text(zone.name, fontWeight = FontWeight.SemiBold)
                            zone.description?.let {
                                Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                DisabledFutureAction("Reservar")
            }
        }

        Spacer(modifier = Modifier.height(80.dp))
    }
}
```

- [ ] **Step 4: Run compile-oriented tests**

Run:

```bash
cd android
gradle testDebugUnitTest
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add android/app/src/main/java/lat/yavaa/android/feature/discovery
git commit -m "feat(android): add public discovery screens"
```

### Task 5: Navigation And Account Access

**Files:**
- Modify: `android/app/src/main/java/lat/yavaa/android/navigation/YavaaApp.kt`

- [ ] **Step 1: Replace auth-first navigation with discovery-first navigation**

Update `ReadyYavaaApp` in `YavaaApp.kt` to use an explicit route:

```kotlin
private sealed interface YavaaRoute {
    data object Discovery : YavaaRoute
    data object Account : YavaaRoute
    data class ProviderProfile(val contractorProfileId: String) : YavaaRoute
}
```

Replace the body of `ReadyYavaaApp` with route-based rendering:

```kotlin
@Composable
private fun ReadyYavaaApp(container: YavaaContainer.Ready) {
    var route by remember { mutableStateOf<YavaaRoute>(YavaaRoute.Discovery) }
    var authenticated by remember {
        mutableStateOf(container.authRepository.currentAccessToken() != null)
    }

    LaunchedEffect(container.authRepository) {
        container.authRepository.sessionStatus.collect { status ->
            authenticated = status is SessionStatus.Authenticated
        }
    }

    when (val currentRoute = route) {
        YavaaRoute.Discovery -> {
            val discoveryViewModel: DiscoveryViewModel = viewModel(
                factory = DiscoveryViewModelFactory(container.apiClient)
            )
            DiscoveryScreen(
                viewModel = discoveryViewModel,
                onProviderClick = { contractorProfileId ->
                    route = YavaaRoute.ProviderProfile(contractorProfileId)
                }
            )
        }
        is YavaaRoute.ProviderProfile -> {
            val providerProfileViewModel: ProviderProfileViewModel = viewModel(
                key = currentRoute.contractorProfileId,
                factory = ProviderProfileViewModelFactory(
                    api = container.apiClient,
                    contractorProfileId = currentRoute.contractorProfileId
                )
            )
            ProviderProfileScreen(
                viewModel = providerProfileViewModel,
                onBack = { route = YavaaRoute.Discovery }
            )
        }
        YavaaRoute.Account -> {
            if (authenticated) {
                val homeViewModel: HomeViewModel = viewModel(
                    factory = HomeViewModelFactory(
                        authRepository = container.authRepository,
                        apiClient = container.apiClient
                    )
                )
                HomeScreen(viewModel = homeViewModel)
            } else {
                val authViewModel: AuthViewModel = viewModel(
                    factory = AuthViewModelFactory(authRepository = container.authRepository)
                )
                AuthScreen(viewModel = authViewModel)
            }
        }
    }
}
```

Add the imports:

```kotlin
import lat.yavaa.android.feature.discovery.DiscoveryScreen
import lat.yavaa.android.feature.discovery.DiscoveryViewModel
import lat.yavaa.android.feature.discovery.DiscoveryViewModelFactory
import lat.yavaa.android.feature.discovery.ProviderProfileScreen
import lat.yavaa.android.feature.discovery.ProviderProfileViewModel
import lat.yavaa.android.feature.discovery.ProviderProfileViewModelFactory
```

- [ ] **Step 2: Keep account reachable from discovery through bottom navigation**

Add a bottom navigation callback to `DiscoveryScreen` parameters:

```kotlin
fun DiscoveryScreen(
    viewModel: DiscoveryViewModel,
    onProviderClick: (String) -> Unit,
    onAccountClick: () -> Unit
)
```

Add this bottom navigation call near the end of `DiscoveryScreen`, before the final spacer:

```kotlin
DiscoveryBottomBar(
    onHomeClick = viewModel::retry,
    onAccountClick = onAccountClick
)
```

Update the navigation call:

```kotlin
DiscoveryScreen(
    viewModel = discoveryViewModel,
    onProviderClick = { contractorProfileId ->
        route = YavaaRoute.ProviderProfile(contractorProfileId)
    },
    onAccountClick = {
        route = YavaaRoute.Account
    }
)
```

- [ ] **Step 3: Run compile-oriented tests**

Run:

```bash
cd android
gradle testDebugUnitTest
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add android/app/src/main/java/lat/yavaa/android/navigation/YavaaApp.kt android/app/src/main/java/lat/yavaa/android/feature/discovery/DiscoveryScreen.kt android/app/src/main/java/lat/yavaa/android/feature/discovery/DiscoveryComponents.kt
git commit -m "feat(android): make discovery the initial route"
```

### Task 6: Documentation And Verification

**Files:**
- Modify: `android/README.md`

- [ ] **Step 1: Update Android README**

Add this section to `android/README.md` after "Contrato API":

```markdown
## Discovery publico

La primera experiencia de producto Android abre en discovery publico, sin exigir inicio de sesion.

Endpoints consumidos:

- `GET /api/catalog/categories`
- `GET /api/catalog/markets`
- `GET /api/providers?category=&market=`
- `GET /api/providers/{contractorProfileId}`

La app no muestra ratings, precios, distancia, reviews ni fotos de trabajos hasta que esos campos existan en el contrato publico.

El login de Supabase sigue disponible desde la seccion de cuenta para flujos protegidos futuros.
```

- [ ] **Step 2: Run full available Android unit tests**

Run:

```bash
cd android
gradle testDebugUnitTest
```

Expected: PASS. If the machine lacks Java or Android SDK, record the exact blocker in the final implementation notes.

- [ ] **Step 3: Run Android debug build when SDK is available**

Run:

```bash
cd android
gradle assembleDebug
```

Expected: PASS. If the machine lacks Java or Android SDK, record the exact blocker in the final implementation notes.

- [ ] **Step 4: Inspect changed files**

Run:

```bash
git status --short
git diff --stat
```

Expected: only Android discovery, theme, navigation, tests, and README files changed.

- [ ] **Step 5: Commit**

```bash
git add android/README.md
git commit -m "docs(android): document public discovery"
```

## Final Verification Checklist

- [ ] `gradle testDebugUnitTest` passes, or the Java/SDK blocker is documented.
- [ ] `gradle assembleDebug` passes, or the Java/SDK blocker is documented.
- [ ] Public discovery calls do not send `Authorization`.
- [ ] Android starts on discovery, not mandatory login.
- [ ] Account/auth flow remains reachable.
- [ ] No API fields are invented for rating, price, distance, reviews, or photos.
- [ ] No backend permission logic is moved into Android.
