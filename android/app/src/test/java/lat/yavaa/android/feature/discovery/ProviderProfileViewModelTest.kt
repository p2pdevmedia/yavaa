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
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
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
    fun `existing provider loads into state`() = runTest(dispatcher) {
        val provider = PublicProviderProfile(
            contractorProfileId = "cp_1",
            displayName = "Carlos Perez",
            bio = "Plomero",
            acceptsEmergencies = true,
            marketSlug = "san-martin-de-los-andes",
            marketCity = "San Martin de los Andes",
            marketProvince = "Neuquen"
        )
        val api = ProfileDiscoveryApi(PublicProviderProfileResponse(provider = provider))
        val viewModel = ProviderProfileViewModel(api, contractorProfileId = "cp_1")

        viewModel.load()
        advanceUntilIdle()

        assertEquals(listOf("profile:cp_1"), api.calls)
        assertEquals(provider, viewModel.state.value.provider)
        assertFalse(viewModel.state.value.notFound)
        assertFalse(viewModel.state.value.loading)
        assertNull(viewModel.state.value.errorMessage)
    }

    @Test
    fun `null provider sets notFound true`() = runTest(dispatcher) {
        val api = ProfileDiscoveryApi(PublicProviderProfileResponse(provider = null))
        val viewModel = ProviderProfileViewModel(api, contractorProfileId = "cp_missing")

        viewModel.load()
        advanceUntilIdle()

        assertTrue(viewModel.state.value.notFound)
        assertNull(viewModel.state.value.provider)
        assertFalse(viewModel.state.value.loading)
    }
}

private class ProfileDiscoveryApi(
    private val response: PublicProviderProfileResponse
) : FakeDiscoveryApi() {
    override suspend fun getPublicProviderProfile(
        contractorProfileId: String
    ): PublicProviderProfileResponse {
        calls += "profile:$contractorProfileId"
        return response
    }
}
