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
    fun `empty provider response sets empty true`() = runTest(dispatcher) {
        val api = FakeDiscoveryApi(providers = emptyList())
        val viewModel = DiscoveryViewModel(api)

        viewModel.load()
        advanceUntilIdle()

        assertTrue(viewModel.state.value.empty)
        assertEquals(emptyList<PublicProviderCard>(), viewModel.state.value.providers)
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
            isPrimary = true
        )
    ),
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
    private val failCategories: Boolean = false
) : PublicDiscoveryApi {
    val calls = mutableListOf<String>()

    override suspend fun listPublicCatalogCategories(): PublicCatalogCategoriesResponse {
        calls += "categories"
        if (failCategories) {
            error("boom")
        }
        return PublicCatalogCategoriesResponse(categories)
    }

    override suspend fun listPublicCatalogMarkets(): PublicCatalogMarketsResponse {
        calls += "markets"
        return PublicCatalogMarketsResponse(markets)
    }

    override suspend fun listPublicProviders(
        category: String?,
        market: String?
    ): PublicProvidersResponse {
        calls += "providers:${category ?: "null"}:${market ?: "null"}"
        return PublicProvidersResponse(providers)
    }

    override suspend fun getPublicProviderProfile(
        contractorProfileId: String
    ): PublicProviderProfileResponse {
        calls += "profile:$contractorProfileId"
        return PublicProviderProfileResponse(provider = null)
    }
}
