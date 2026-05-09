package lat.yavaa.android.feature.discovery

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CancellationException
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
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
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
    fun `load selects primary market and fetches providers`() = runTest(dispatcher) {
        val api = FakeDiscoveryApi()
        val viewModel = DiscoveryViewModel(api)

        viewModel.load()
        advanceUntilIdle()

        assertEquals(
            listOf(
                "categories",
                "markets",
                "providers:null:san-martin-de-los-andes"
            ),
            api.calls
        )
        assertEquals("san-martin-de-los-andes", viewModel.state.value.selectedMarket)
        assertEquals(listOf("cp_1"), viewModel.state.value.providers.map { it.contractorProfileId })
        assertFalse(viewModel.state.value.empty)
        assertFalse(viewModel.state.value.loading)
        assertNull(viewModel.state.value.errorMessage)
    }

    @Test
    fun `selectCategory reloads providers with selected filter`() = runTest(dispatcher) {
        val api = FakeDiscoveryApi()
        val viewModel = DiscoveryViewModel(api)

        viewModel.load()
        advanceUntilIdle()
        viewModel.selectCategory("home-services")
        advanceUntilIdle()

        assertEquals("home-services", viewModel.state.value.selectedCategory)
        assertEquals(
            listOf(
                "categories",
                "markets",
                "providers:null:san-martin-de-los-andes",
                "providers:home-services:san-martin-de-los-andes"
            ),
            api.calls
        )
    }

    @Test
    fun `reloadProviders can be called directly`() = runTest(dispatcher) {
        val api = FakeDiscoveryApi()
        val viewModel = DiscoveryViewModel(api)

        viewModel.reloadProviders()
        advanceUntilIdle()

        assertEquals(listOf("providers:null:null"), api.calls)
        assertEquals(listOf("cp_1"), viewModel.state.value.providers.map { it.contractorProfileId })
        assertFalse(viewModel.state.value.loading)
    }

    @Test
    fun `empty provider response sets empty true`() = runTest(dispatcher) {
        val api = FakeDiscoveryApi(providers = emptyList())
        val viewModel = DiscoveryViewModel(api)

        viewModel.load()
        advanceUntilIdle()

        assertTrue(viewModel.state.value.empty)
        assertEquals(emptyList<PublicProviderCard>(), viewModel.state.value.providers)
    }

    @Test
    fun `out-of-order provider reloads do not overwrite newer providers`() = runTest(dispatcher) {
        val firstResponse = CompletableDeferred<PublicProvidersResponse>()
        val secondResponse = CompletableDeferred<PublicProvidersResponse>()
        val api = DeferredProvidersDiscoveryApi(listOf(firstResponse, secondResponse))
        val viewModel = DiscoveryViewModel(api)

        viewModel.reloadProviders()
        advanceUntilIdle()
        viewModel.selectCategory("home-services")
        advanceUntilIdle()
        secondResponse.complete(PublicProvidersResponse(listOf(providerCard("cp_new"))))
        advanceUntilIdle()
        firstResponse.complete(PublicProvidersResponse(listOf(providerCard("cp_old"))))
        advanceUntilIdle()

        assertEquals(
            listOf("providers:null:null", "providers:home-services:null"),
            api.calls
        )
        assertEquals(listOf("cp_new"), viewModel.state.value.providers.map { it.contractorProfileId })
        assertNull(viewModel.state.value.errorMessage)
    }

    @Test
    fun `pending load cannot overwrite newer market reload`() = runTest(dispatcher) {
        val categoriesResponse = CompletableDeferred<PublicCatalogCategoriesResponse>()
        val marketsResponse = CompletableDeferred<PublicCatalogMarketsResponse>()
        val marketResponse = CompletableDeferred<PublicProvidersResponse>()
        val staleLoadResponse = CompletableDeferred<PublicProvidersResponse>()
        val api = DeferredLoadDiscoveryApi(
            categoriesResponse = categoriesResponse,
            marketsResponse = marketsResponse,
            providerResponses = listOf(marketResponse, staleLoadResponse)
        )
        val viewModel = DiscoveryViewModel(api)

        viewModel.load()
        advanceUntilIdle()
        viewModel.selectMarket("bariloche")
        advanceUntilIdle()
        marketResponse.complete(PublicProvidersResponse(listOf(providerCard("cp_new"))))
        advanceUntilIdle()
        categoriesResponse.complete(PublicCatalogCategoriesResponse(categories = emptyList()))
        marketsResponse.complete(
            PublicCatalogMarketsResponse(
                markets = listOf(
                    PublicCatalogMarket(
                        id = "market_1",
                        slug = "san-martin-de-los-andes",
                        country = "AR",
                        city = "San Martin de los Andes",
                        province = "Neuquen",
                        isPrimary = true,
                        workZones = emptyList()
                    )
                )
            )
        )
        advanceUntilIdle()
        staleLoadResponse.complete(PublicProvidersResponse(listOf(providerCard("cp_old"))))
        advanceUntilIdle()

        assertEquals("bariloche", viewModel.state.value.selectedMarket)
        assertEquals(listOf("cp_new"), viewModel.state.value.providers.map { it.contractorProfileId })
        assertFalse(api.calls.contains("providers:null:san-martin-de-los-andes"))
    }

    @Test
    fun `provider fetch failure sets discovery error message`() = runTest(dispatcher) {
        val api = FakeDiscoveryApi(failProviders = true)
        val viewModel = DiscoveryViewModel(api)

        viewModel.reloadProviders()
        advanceUntilIdle()

        assertEquals("No se pudo cargar discovery", viewModel.state.value.errorMessage)
        assertEquals(emptyList<PublicProviderCard>(), viewModel.state.value.providers)
        assertFalse(viewModel.state.value.loading)
    }

    @Test
    fun `provider fetch cancellation is not converted to discovery error message`() = runTest(dispatcher) {
        val api = CancellationProvidersDiscoveryApi()
        val viewModel = DiscoveryViewModel(api)

        viewModel.reloadProviders()
        advanceUntilIdle()

        assertNull(viewModel.state.value.errorMessage)
        assertTrue(viewModel.state.value.loading)
    }

    @Test
    fun `API failure sets discovery error message`() = runTest(dispatcher) {
        val api = FakeDiscoveryApi(failCategories = true)
        val viewModel = DiscoveryViewModel(api)

        viewModel.load()
        advanceUntilIdle()

        assertEquals("No se pudo cargar discovery", viewModel.state.value.errorMessage)
        assertFalse(viewModel.state.value.loading)
    }
}

open class FakeDiscoveryApi(
    private val categories: List<PublicCatalogCategory> = listOf(
        PublicCatalogCategory(
            id = "cat_1",
            slug = "home-services",
            name = "Home Services",
            group = "home services",
            isInitial = true
        )
    ),
    private val markets: List<PublicCatalogMarket> = listOf(
        PublicCatalogMarket(
            id = "market_1",
            slug = "san-martin-de-los-andes",
            country = "AR",
            city = "San Martin de los Andes",
            province = "Neuquen",
            isPrimary = true,
            workZones = emptyList()
        )
    ),
    private val providers: List<PublicProviderCard> = listOf(
        providerCard("cp_1")
    ),
    private val failCategories: Boolean = false,
    private val failProviders: Boolean = false
) : PublicDiscoveryApi {
    val calls = mutableListOf<String>()

    open override suspend fun listPublicCatalogCategories(): PublicCatalogCategoriesResponse {
        calls += "categories"
        if (failCategories) {
            error("boom")
        }
        return PublicCatalogCategoriesResponse(categories)
    }

    open override suspend fun listPublicCatalogMarkets(): PublicCatalogMarketsResponse {
        calls += "markets"
        return PublicCatalogMarketsResponse(markets)
    }

    open override suspend fun listPublicProviders(
        category: String?,
        market: String?
    ): PublicProvidersResponse {
        calls += "providers:${category ?: "null"}:${market ?: "null"}"
        if (failProviders) {
            error("providers failed")
        }
        return PublicProvidersResponse(providers)
    }

    open override suspend fun getPublicProviderProfile(
        contractorProfileId: String
    ): PublicProviderProfileResponse {
        calls += "profile:$contractorProfileId"
        return PublicProviderProfileResponse(provider = null)
    }
}

private class CancellationProvidersDiscoveryApi : FakeDiscoveryApi() {
    override suspend fun listPublicProviders(
        category: String?,
        market: String?
    ): PublicProvidersResponse {
        calls += "providers:${category ?: "null"}:${market ?: "null"}"
        throw CancellationException("providers cancelled")
    }
}

private class DeferredLoadDiscoveryApi(
    private val categoriesResponse: CompletableDeferred<PublicCatalogCategoriesResponse>,
    private val marketsResponse: CompletableDeferred<PublicCatalogMarketsResponse>,
    private val providerResponses: List<CompletableDeferred<PublicProvidersResponse>>
) : FakeDiscoveryApi() {
    private var providerIndex = 0

    override suspend fun listPublicCatalogCategories(): PublicCatalogCategoriesResponse {
        calls += "categories"
        return categoriesResponse.await()
    }

    override suspend fun listPublicCatalogMarkets(): PublicCatalogMarketsResponse {
        calls += "markets"
        return marketsResponse.await()
    }

    override suspend fun listPublicProviders(
        category: String?,
        market: String?
    ): PublicProvidersResponse {
        calls += "providers:${category ?: "null"}:${market ?: "null"}"
        return providerResponses[providerIndex++].await()
    }
}

private class DeferredProvidersDiscoveryApi(
    private val providerResponses: List<CompletableDeferred<PublicProvidersResponse>>
) : FakeDiscoveryApi() {
    private var providerIndex = 0

    override suspend fun listPublicProviders(
        category: String?,
        market: String?
    ): PublicProvidersResponse {
        calls += "providers:${category ?: "null"}:${market ?: "null"}"
        return providerResponses[providerIndex++].await()
    }
}

fun providerCard(contractorProfileId: String): PublicProviderCard {
    return PublicProviderCard(
        contractorProfileId = contractorProfileId,
        displayName = "Carlos Perez",
        bio = "Plomero",
        profilePhotoUrl = null,
        acceptsEmergencies = true,
        marketSlug = "san-martin-de-los-andes",
        marketCity = "San Martin de los Andes",
        marketProvince = "Neuquen",
        categories = emptyList()
    )
}
