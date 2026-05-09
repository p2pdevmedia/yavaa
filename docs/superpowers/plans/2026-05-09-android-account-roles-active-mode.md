# Android Account Roles Active Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Android account foundation for authenticated client/contractor mode selection using `/api/me` and a local active mode.

**Architecture:** Keep backend permissions unchanged and use `/api/me` as the role source of truth. Add a focused `feature/account` vertical for active mode rules, local mode storage, session state mapping, and account UI; keep client and contractor mode shells separate and small. Store active mode locally through Android `SharedPreferences`, but always correct it after each `/api/me` refresh.

**Tech Stack:** Kotlin, Jetpack Compose, Android ViewModel, Kotlin coroutines, Ktor client, kotlinx.serialization, Supabase Auth, JUnit 4, kotlinx-coroutines-test.

---

## File Structure

- Modify: `android/app/src/main/java/lat/yavaa/android/core/network/YavaaApiClient.kt`
  - Add an `AccountApi` interface.
  - Expand `/api/me` DTOs for profile, addresses, market, contractor profile, categories, and work zones.
  - Make `YavaaApiClient` implement `AccountApi`.
- Modify: `android/app/src/test/java/lat/yavaa/android/core/network/YavaaApiClientTest.kt`
  - Add parsing coverage for the expanded `/api/me` shape.
- Modify: `android/app/src/main/java/lat/yavaa/android/core/auth/YavaaAuthRepository.kt`
  - Add a small auth-session interface for account ViewModel testing.
- Create: `android/app/src/main/java/lat/yavaa/android/feature/account/AccountMode.kt`
  - Own pure mode extraction and fallback rules.
- Create: `android/app/src/test/java/lat/yavaa/android/feature/account/AccountModeTest.kt`
  - Cover mode extraction, fallback, blocked status, and rejected switches.
- Create: `android/app/src/main/java/lat/yavaa/android/feature/account/AccountModeStore.kt`
  - Store active mode locally.
- Create: `android/app/src/main/java/lat/yavaa/android/feature/account/AccountSessionViewModel.kt`
  - Own `/api/me` loading, sign out, local mode correction, and switch actions.
- Create: `android/app/src/test/java/lat/yavaa/android/feature/account/MainDispatcherRule.kt`
  - Provide deterministic ViewModel coroutine tests.
- Create: `android/app/src/test/java/lat/yavaa/android/feature/account/AccountSessionViewModelTest.kt`
  - Cover loading, ready states, mode switch, blocked state, missing token, unsupported roles, and stale stored mode correction.
- Create: `android/app/src/main/java/lat/yavaa/android/feature/account/AccountScreen.kt`
  - Render account state, mode switch, retry, sign out, and active shell.
- Create: `android/app/src/main/java/lat/yavaa/android/feature/client/ClientModeScreen.kt`
  - Render the client mode shell.
- Create: `android/app/src/main/java/lat/yavaa/android/feature/contractor/ContractorModeScreen.kt`
  - Render the contractor mode shell.
- Modify: `android/app/src/main/java/lat/yavaa/android/YavaaApplication.kt`
  - Add the shared local mode store to the app container.
- Modify: `android/app/src/main/java/lat/yavaa/android/navigation/YavaaApp.kt`
  - Replace the technical home route with the account shell.
- Modify: `android/app/src/test/java/lat/yavaa/android/navigation/YavaaAppNavigationTest.kt`
  - Keep navigation label tests and add supported route-label coverage if helper functions are added.
- Delete after replacement: `android/app/src/main/java/lat/yavaa/android/feature/home/HomeScreen.kt`
- Delete after replacement: `android/app/src/main/java/lat/yavaa/android/feature/home/HomeViewModel.kt`

---

### Task 1: Expand `/api/me` Android Contract

**Files:**
- Modify: `android/app/src/main/java/lat/yavaa/android/core/network/YavaaApiClient.kt`
- Modify: `android/app/src/test/java/lat/yavaa/android/core/network/YavaaApiClientTest.kt`

- [ ] **Step 1: Write the failing `/api/me` parsing test**

Add this test to `YavaaApiClientTest`:

```kotlin
@Test
fun `getMe parses account profile addresses and contractor profile`() = runTest {
    val engine = MockEngine {
        respond(
            content = """
                {
                  "authenticated": true,
                  "configured": true,
                  "reason": null,
                  "identity": {"id": "auth_1", "email": "ana@yavaa.lat"},
                  "appUser": {
                    "id": "user_1",
                    "email": "ana@yavaa.lat",
                    "displayName": "Ana",
                    "status": "ACTIVE",
                    "roles": ["client", "contractor", "admin"],
                    "profile": {
                      "firstName": "Ana",
                      "lastName": "Garcia",
                      "avatarUrl": "https://cdn.yavaa.lat/avatar.jpg",
                      "phone": "+5491111111111",
                      "bio": "Cliente y contratista"
                    },
                    "addresses": [
                      {
                        "id": "address_1",
                        "label": "Casa",
                        "line1": "Roca 123",
                        "line2": null,
                        "city": "San Martin de los Andes",
                        "province": "Neuquen",
                        "postalCode": "8370",
                        "notes": "Timbre 2",
                        "type": "home",
                        "isDefault": true,
                        "market": {
                          "id": "market_1",
                          "slug": "san-martin-de-los-andes",
                          "city": "San Martin de los Andes",
                          "province": "Neuquen",
                          "country": "AR"
                        }
                      }
                    ],
                    "contractorProfile": {
                      "id": "contractor_1",
                      "approvalStatus": "APPROVED",
                      "acceptsEmergencies": true,
                      "dniNumber": "12345678",
                      "dniFrontUrl": null,
                      "dniBackUrl": null,
                      "profilePhotoUrl": "https://cdn.yavaa.lat/profile.jpg",
                      "reviewNotes": null,
                      "submittedAt": "2026-05-09T12:00:00.000Z",
                      "reviewedAt": "2026-05-09T13:00:00.000Z",
                      "reviewedByUserId": "admin_1",
                      "addressId": "address_1",
                      "categories": [
                        {
                          "category": {
                            "id": "cat_1",
                            "slug": "home-services",
                            "name": "Home Services",
                            "group": "home services"
                          },
                          "isPrimary": true
                        }
                      ],
                      "workZones": [
                        {
                          "workZone": {
                            "id": "zone_1",
                            "slug": "centro",
                            "name": "Centro",
                            "description": "Zona centro",
                            "market": {
                              "id": "market_1",
                              "slug": "san-martin-de-los-andes",
                              "city": "San Martin de los Andes",
                              "province": "Neuquen",
                              "country": "AR"
                            }
                          }
                        }
                      ]
                    }
                  },
                  "matchedBy": "email",
                  "permissionContext": {
                    "userId": "user_1",
                    "status": "ACTIVE",
                    "roles": ["client", "contractor", "admin"]
                  }
                }
            """.trimIndent(),
            headers = headersOf(HttpHeaders.ContentType, "application/json")
        )
    }

    val response = YavaaApiClient(testConfig(), testHttpClient(engine)).getMe("access-token")

    assertEquals("Ana", response.appUser?.displayName)
    assertEquals("Garcia", response.appUser?.profile?.lastName)
    assertEquals("Casa", response.appUser?.addresses?.single()?.label)
    assertEquals("san-martin-de-los-andes", response.appUser?.addresses?.single()?.market?.slug)
    assertEquals("APPROVED", response.appUser?.contractorProfile?.approvalStatus)
    assertEquals("home-services", response.appUser?.contractorProfile?.categories?.single()?.category?.slug)
    assertEquals("Centro", response.appUser?.contractorProfile?.workZones?.single()?.workZone?.name)
}
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
cd android
gradle testDebugUnitTest --tests lat.yavaa.android.core.network.YavaaApiClientTest
```

Expected: FAIL because `MeAppUser.profile`, `MeAppUser.addresses`, and `MeAppUser.contractorProfile` are not defined yet.

- [ ] **Step 3: Add the account API interface and expanded DTOs**

In `YavaaApiClient.kt`, change the class declaration and add DTOs below the existing `/api/me` models:

```kotlin
interface AccountApi {
    suspend fun getMe(accessToken: String): MeResponse
}

class YavaaApiClient(
    private val config: YavaaConfig,
    private val httpClient: HttpClient = defaultHttpClient()
) : PublicDiscoveryApi, AccountApi {
```

Replace the existing `MeAppUser` definition with:

```kotlin
@Serializable
data class MeAppUser(
    val id: String,
    val email: String,
    @SerialName("displayName")
    val displayName: String? = null,
    val status: String,
    val roles: List<String> = emptyList(),
    val profile: MeUserProfile? = null,
    val addresses: List<MeUserAddress> = emptyList(),
    val contractorProfile: MeContractorProfile? = null
)
```

Add these data classes:

```kotlin
@Serializable
data class MeUserProfile(
    val firstName: String? = null,
    val lastName: String? = null,
    val avatarUrl: String? = null,
    val phone: String? = null,
    val bio: String? = null
)

@Serializable
data class MeUserAddress(
    val id: String,
    val label: String,
    val line1: String,
    val line2: String? = null,
    val city: String,
    val province: String,
    val postalCode: String? = null,
    val notes: String? = null,
    val type: String,
    val isDefault: Boolean,
    val market: MeMarket? = null
)

@Serializable
data class MeMarket(
    val id: String,
    val slug: String,
    val city: String,
    val province: String,
    val country: String
)

@Serializable
data class MeContractorProfile(
    val id: String,
    val approvalStatus: String,
    val acceptsEmergencies: Boolean,
    val dniNumber: String? = null,
    val dniFrontUrl: String? = null,
    val dniBackUrl: String? = null,
    val profilePhotoUrl: String? = null,
    val reviewNotes: String? = null,
    val submittedAt: String? = null,
    val reviewedAt: String? = null,
    val reviewedByUserId: String? = null,
    val addressId: String? = null,
    val categories: List<MeContractorCategory> = emptyList(),
    val workZones: List<MeContractorWorkZone> = emptyList()
)

@Serializable
data class MeContractorCategory(
    val category: MeCategory,
    val isPrimary: Boolean
)

@Serializable
data class MeCategory(
    val id: String,
    val slug: String,
    val name: String,
    val group: String? = null
)

@Serializable
data class MeContractorWorkZone(
    val workZone: MeWorkZone
)

@Serializable
data class MeWorkZone(
    val id: String,
    val slug: String,
    val name: String,
    val description: String? = null,
    val market: MeMarket
)
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
cd android
gradle testDebugUnitTest --tests lat.yavaa.android.core.network.YavaaApiClientTest
```

Expected: PASS for all `YavaaApiClientTest` tests.

- [ ] **Step 5: Commit the DTO change**

Run:

```bash
git add android/app/src/main/java/lat/yavaa/android/core/network/YavaaApiClient.kt android/app/src/test/java/lat/yavaa/android/core/network/YavaaApiClientTest.kt
git commit -m "feat(android): expand account api models"
```

---

### Task 2: Add Pure Account Mode Rules And Local Store

**Files:**
- Create: `android/app/src/main/java/lat/yavaa/android/feature/account/AccountMode.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/feature/account/AccountModeStore.kt`
- Create: `android/app/src/test/java/lat/yavaa/android/feature/account/AccountModeTest.kt`

- [ ] **Step 1: Write failing pure mode tests**

Create `AccountModeTest.kt`:

```kotlin
package lat.yavaa.android.feature.account

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AccountModeTest {
    @Test
    fun `supported modes include only client and contractor in stable order`() {
        assertEquals(
            listOf(AccountMode.Client, AccountMode.Contractor),
            supportedAccountModes(listOf("admin", "contractor", "client", "support"))
        )
    }

    @Test
    fun `initial mode keeps available preferred mode`() {
        assertEquals(
            AccountMode.Contractor,
            selectAccountMode(
                roles = listOf("client", "contractor"),
                preferredMode = AccountMode.Contractor,
                accountStatus = "ACTIVE"
            )
        )
    }

    @Test
    fun `initial mode falls back to client before contractor`() {
        assertEquals(
            AccountMode.Client,
            selectAccountMode(
                roles = listOf("contractor", "client"),
                preferredMode = null,
                accountStatus = "ACTIVE"
            )
        )
    }

    @Test
    fun `initial mode falls back to contractor when client is unavailable`() {
        assertEquals(
            AccountMode.Contractor,
            selectAccountMode(
                roles = listOf("contractor"),
                preferredMode = null,
                accountStatus = "ACTIVE"
            )
        )
    }

    @Test
    fun `blocked and suspended accounts do not get an operational mode`() {
        assertNull(selectAccountMode(listOf("client"), AccountMode.Client, "BLOCKED"))
        assertNull(selectAccountMode(listOf("contractor"), AccountMode.Contractor, "SUSPENDED"))
    }

    @Test
    fun `switch is allowed only for available roles on active account`() {
        assertTrue(canUseAccountMode(listOf("client", "contractor"), AccountMode.Client, "ACTIVE"))
        assertTrue(canUseAccountMode(listOf("client", "contractor"), AccountMode.Contractor, "ACTIVE"))
        assertFalse(canUseAccountMode(listOf("client"), AccountMode.Contractor, "ACTIVE"))
        assertFalse(canUseAccountMode(listOf("client", "contractor"), AccountMode.Client, "BLOCKED"))
    }
}
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
cd android
gradle testDebugUnitTest --tests lat.yavaa.android.feature.account.AccountModeTest
```

Expected: FAIL because `AccountMode` and the rule functions do not exist.

- [ ] **Step 3: Implement mode rules**

Create `AccountMode.kt`:

```kotlin
package lat.yavaa.android.feature.account

enum class AccountMode(
    val roleSlug: String,
    val label: String
) {
    Client(roleSlug = "client", label = "Cliente"),
    Contractor(roleSlug = "contractor", label = "Contratista")
}

fun supportedAccountModes(roles: List<String>): List<AccountMode> {
    val roleSet = roles.toSet()
    return listOf(AccountMode.Client, AccountMode.Contractor)
        .filter { mode -> mode.roleSlug in roleSet }
}

fun isRestrictedAccountStatus(status: String?): Boolean {
    return status == "SUSPENDED" || status == "BLOCKED"
}

fun canUseAccountMode(
    roles: List<String>,
    mode: AccountMode,
    accountStatus: String?
): Boolean {
    if (isRestrictedAccountStatus(accountStatus)) {
        return false
    }

    return mode in supportedAccountModes(roles)
}

fun selectAccountMode(
    roles: List<String>,
    preferredMode: AccountMode?,
    accountStatus: String?
): AccountMode? {
    if (isRestrictedAccountStatus(accountStatus)) {
        return null
    }

    val supportedModes = supportedAccountModes(roles)
    if (preferredMode != null && preferredMode in supportedModes) {
        return preferredMode
    }

    return supportedModes.firstOrNull()
}
```

- [ ] **Step 4: Add local active mode store**

Create `AccountModeStore.kt`:

```kotlin
package lat.yavaa.android.feature.account

import android.content.Context

interface AccountModeStore {
    fun read(): AccountMode?
    fun write(mode: AccountMode)
    fun clear()
}

class SharedPreferencesAccountModeStore(
    context: Context
) : AccountModeStore {
    private val preferences = context.getSharedPreferences("yavaa_account_mode", Context.MODE_PRIVATE)

    override fun read(): AccountMode? {
        val rawValue = preferences.getString(KEY_ACTIVE_MODE, null) ?: return null
        return AccountMode.entries.firstOrNull { mode -> mode.name == rawValue }
    }

    override fun write(mode: AccountMode) {
        preferences.edit().putString(KEY_ACTIVE_MODE, mode.name).apply()
    }

    override fun clear() {
        preferences.edit().remove(KEY_ACTIVE_MODE).apply()
    }

    private companion object {
        const val KEY_ACTIVE_MODE = "active_mode"
    }
}
```

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

```bash
cd android
gradle testDebugUnitTest --tests lat.yavaa.android.feature.account.AccountModeTest
```

Expected: PASS.

- [ ] **Step 6: Commit the account mode rules**

Run:

```bash
git add android/app/src/main/java/lat/yavaa/android/feature/account/AccountMode.kt android/app/src/main/java/lat/yavaa/android/feature/account/AccountModeStore.kt android/app/src/test/java/lat/yavaa/android/feature/account/AccountModeTest.kt
git commit -m "feat(android): add local account mode rules"
```

---

### Task 3: Add Account Session ViewModel

**Files:**
- Modify: `android/app/src/main/java/lat/yavaa/android/core/auth/YavaaAuthRepository.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/feature/account/AccountSessionViewModel.kt`
- Create: `android/app/src/test/java/lat/yavaa/android/feature/account/MainDispatcherRule.kt`
- Create: `android/app/src/test/java/lat/yavaa/android/feature/account/AccountSessionViewModelTest.kt`

- [ ] **Step 1: Add auth interface for testability**

Modify `YavaaAuthRepository.kt`:

```kotlin
interface AccountAuthSession {
    fun currentAccessToken(): String?
    suspend fun signOut()
}

class YavaaAuthRepository(
    private val supabaseClient: SupabaseClient
) : AccountAuthSession {
```

Keep the existing `sessionStatus`, `currentAccessToken`, `signInWithEmail`, and `signOut` implementations unchanged.

- [ ] **Step 2: Write the failing ViewModel tests**

Create `MainDispatcherRule.kt`:

```kotlin
package lat.yavaa.android.feature.account

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestDispatcher
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.rules.TestWatcher
import org.junit.runner.Description

@OptIn(ExperimentalCoroutinesApi::class)
class MainDispatcherRule(
    private val dispatcher: TestDispatcher = UnconfinedTestDispatcher()
) : TestWatcher() {
    override fun starting(description: Description) {
        Dispatchers.setMain(dispatcher)
    }

    override fun finished(description: Description) {
        Dispatchers.resetMain()
    }
}
```

Create `AccountSessionViewModelTest.kt`:

```kotlin
package lat.yavaa.android.feature.account

import kotlinx.coroutines.test.runTest
import lat.yavaa.android.core.auth.AccountAuthSession
import lat.yavaa.android.core.network.AccountApi
import lat.yavaa.android.core.network.MeAppUser
import lat.yavaa.android.core.network.MeIdentity
import lat.yavaa.android.core.network.MeResponse
import lat.yavaa.android.core.network.PermissionContext
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class AccountSessionViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun `refresh loads account and selects stored contractor mode when available`() = runTest {
        val modeStore = FakeAccountModeStore(AccountMode.Contractor)
        val viewModel = AccountSessionViewModel(
            authSession = FakeAuthSession(token = "token"),
            accountApi = FakeAccountApi(me = meResponse(roles = listOf("client", "contractor"))),
            modeStore = modeStore
        )

        viewModel.refreshAccount()

        val state = viewModel.state.value
        assertEquals(AccountSessionStatus.Ready, state.status)
        assertEquals(AccountMode.Contractor, state.activeMode)
        assertEquals(listOf(AccountMode.Client, AccountMode.Contractor), state.availableModes)
        assertEquals("Ana", state.displayName)
        assertEquals(AccountMode.Contractor, modeStore.mode)
    }

    @Test
    fun `refresh corrects stale stored mode to client fallback`() = runTest {
        val modeStore = FakeAccountModeStore(AccountMode.Contractor)
        val viewModel = AccountSessionViewModel(
            authSession = FakeAuthSession(token = "token"),
            accountApi = FakeAccountApi(me = meResponse(roles = listOf("client"))),
            modeStore = modeStore
        )

        viewModel.refreshAccount()

        assertEquals(AccountMode.Client, viewModel.state.value.activeMode)
        assertEquals(AccountMode.Client, modeStore.mode)
    }

    @Test
    fun `switch mode changes local state only when mode is available`() = runTest {
        val modeStore = FakeAccountModeStore(AccountMode.Client)
        val accountApi = FakeAccountApi(me = meResponse(roles = listOf("client", "contractor")))
        val viewModel = AccountSessionViewModel(
            authSession = FakeAuthSession(token = "token"),
            accountApi = accountApi,
            modeStore = modeStore
        )
        viewModel.refreshAccount()

        viewModel.switchMode(AccountMode.Contractor)

        assertEquals(AccountMode.Contractor, viewModel.state.value.activeMode)
        assertEquals(AccountMode.Contractor, modeStore.mode)
        assertEquals(1, accountApi.calls)
    }

    @Test
    fun `switch mode ignores unavailable mode`() = runTest {
        val modeStore = FakeAccountModeStore(AccountMode.Client)
        val viewModel = AccountSessionViewModel(
            authSession = FakeAuthSession(token = "token"),
            accountApi = FakeAccountApi(me = meResponse(roles = listOf("client"))),
            modeStore = modeStore
        )
        viewModel.refreshAccount()

        viewModel.switchMode(AccountMode.Contractor)

        assertEquals(AccountMode.Client, viewModel.state.value.activeMode)
        assertEquals(AccountMode.Client, modeStore.mode)
    }

    @Test
    fun `blocked account has no operational mode`() = runTest {
        val viewModel = AccountSessionViewModel(
            authSession = FakeAuthSession(token = "token"),
            accountApi = FakeAccountApi(me = meResponse(roles = listOf("client"), status = "BLOCKED")),
            modeStore = FakeAccountModeStore(AccountMode.Client)
        )

        viewModel.refreshAccount()

        assertEquals(AccountSessionStatus.Restricted, viewModel.state.value.status)
        assertNull(viewModel.state.value.activeMode)
    }

    @Test
    fun `account without client or contractor role is limited`() = runTest {
        val viewModel = AccountSessionViewModel(
            authSession = FakeAuthSession(token = "token"),
            accountApi = FakeAccountApi(me = meResponse(roles = listOf("admin"))),
            modeStore = FakeAccountModeStore()
        )

        viewModel.refreshAccount()

        assertEquals(AccountSessionStatus.UnsupportedRole, viewModel.state.value.status)
        assertTrue(viewModel.state.value.availableModes.isEmpty())
    }

    @Test
    fun `missing token exposes missing session state`() = runTest {
        val viewModel = AccountSessionViewModel(
            authSession = FakeAuthSession(token = null),
            accountApi = FakeAccountApi(me = meResponse(roles = listOf("client"))),
            modeStore = FakeAccountModeStore()
        )

        viewModel.refreshAccount()

        assertEquals(AccountSessionStatus.MissingSession, viewModel.state.value.status)
    }

    @Test
    fun `sign out delegates to auth session and clears active mode`() = runTest {
        val modeStore = FakeAccountModeStore(AccountMode.Client)
        val authSession = FakeAuthSession(token = "token")
        val viewModel = AccountSessionViewModel(
            authSession = authSession,
            accountApi = FakeAccountApi(me = meResponse(roles = listOf("client"))),
            modeStore = modeStore
        )

        viewModel.signOut()

        assertTrue(authSession.signedOut)
        assertNull(modeStore.mode)
    }

    private fun meResponse(
        roles: List<String>,
        status: String = "ACTIVE"
    ): MeResponse {
        return MeResponse(
            authenticated = true,
            configured = true,
            identity = MeIdentity(id = "auth_1", email = "ana@yavaa.lat"),
            appUser = MeAppUser(
                id = "user_1",
                email = "ana@yavaa.lat",
                displayName = "Ana",
                status = status,
                roles = roles
            ),
            matchedBy = "email",
            permissionContext = PermissionContext(
                userId = "user_1",
                status = status,
                roles = roles
            )
        )
    }
}

private class FakeAccountApi(
    private val me: MeResponse,
    private val error: Throwable? = null
) : AccountApi {
    var calls = 0

    override suspend fun getMe(accessToken: String): MeResponse {
        calls += 1
        error?.let { throw it }
        return me
    }
}

private class FakeAuthSession(
    private val token: String?
) : AccountAuthSession {
    var signedOut = false

    override fun currentAccessToken(): String? = token

    override suspend fun signOut() {
        signedOut = true
    }
}

private class FakeAccountModeStore(
    var mode: AccountMode? = null
) : AccountModeStore {
    override fun read(): AccountMode? = mode

    override fun write(mode: AccountMode) {
        this.mode = mode
    }

    override fun clear() {
        mode = null
    }
}
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```bash
cd android
gradle testDebugUnitTest --tests lat.yavaa.android.feature.account.AccountSessionViewModelTest
```

Expected: FAIL because `AccountSessionViewModel`, `AccountSessionStatus`, and `AccountSessionUiState` do not exist.

- [ ] **Step 4: Implement AccountSessionViewModel**

Create `AccountSessionViewModel.kt`:

```kotlin
package lat.yavaa.android.feature.account

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lat.yavaa.android.core.auth.AccountAuthSession
import lat.yavaa.android.core.network.AccountApi
import lat.yavaa.android.core.network.MeResponse

enum class AccountSessionStatus {
    Loading,
    Ready,
    Error,
    MissingSession,
    Restricted,
    UnsupportedRole
}

data class AccountSessionUiState(
    val status: AccountSessionStatus = AccountSessionStatus.Loading,
    val displayName: String? = null,
    val email: String? = null,
    val accountStatus: String? = null,
    val roles: List<String> = emptyList(),
    val availableModes: List<AccountMode> = emptyList(),
    val activeMode: AccountMode? = null,
    val addressCount: Int = 0,
    val contractorApprovalStatus: String? = null,
    val errorMessage: String? = null
)

class AccountSessionViewModel(
    private val authSession: AccountAuthSession,
    private val accountApi: AccountApi,
    private val modeStore: AccountModeStore
) : ViewModel() {
    private val _state = MutableStateFlow(AccountSessionUiState())
    val state: StateFlow<AccountSessionUiState> = _state.asStateFlow()

    fun refreshAccount() {
        viewModelScope.launch {
            _state.update { it.copy(status = AccountSessionStatus.Loading, errorMessage = null) }

            val token = authSession.currentAccessToken()
            if (token == null) {
                _state.value = AccountSessionUiState(
                    status = AccountSessionStatus.MissingSession,
                    errorMessage = "Sesion no disponible"
                )
                return@launch
            }

            runCatching {
                accountApi.getMe(token)
            }.onSuccess { response ->
                _state.value = response.toUiState(modeStore)
            }.onFailure { error ->
                _state.value = AccountSessionUiState(
                    status = AccountSessionStatus.Error,
                    errorMessage = error.message ?: "No se pudo cargar la cuenta"
                )
            }
        }
    }

    fun switchMode(mode: AccountMode) {
        val current = _state.value
        if (current.status != AccountSessionStatus.Ready) {
            return
        }
        if (!canUseAccountMode(current.roles, mode, current.accountStatus)) {
            return
        }

        modeStore.write(mode)
        _state.update { it.copy(activeMode = mode) }
    }

    fun signOut() {
        viewModelScope.launch {
            modeStore.clear()
            authSession.signOut()
        }
    }

    private fun MeResponse.toUiState(modeStore: AccountModeStore): AccountSessionUiState {
        val user = appUser
        val status = permissionContext?.status ?: user?.status
        val roles = permissionContext?.roles ?: user?.roles.orEmpty()
        val displayName = user?.displayName ?: identity?.email
        val availableModes = supportedAccountModes(roles)
        val selectedMode = selectAccountMode(
            roles = roles,
            preferredMode = modeStore.read(),
            accountStatus = status
        )

        if (isRestrictedAccountStatus(status)) {
            return AccountSessionUiState(
                status = AccountSessionStatus.Restricted,
                displayName = displayName,
                email = identity?.email ?: user?.email,
                accountStatus = status,
                roles = roles,
                availableModes = availableModes,
                activeMode = null,
                addressCount = user?.addresses.orEmpty().size,
                contractorApprovalStatus = user?.contractorProfile?.approvalStatus
            )
        }

        if (selectedMode == null) {
            return AccountSessionUiState(
                status = AccountSessionStatus.UnsupportedRole,
                displayName = displayName,
                email = identity?.email ?: user?.email,
                accountStatus = status,
                roles = roles,
                availableModes = availableModes,
                activeMode = null,
                addressCount = user?.addresses.orEmpty().size,
                contractorApprovalStatus = user?.contractorProfile?.approvalStatus
            )
        }

        modeStore.write(selectedMode)
        return AccountSessionUiState(
            status = AccountSessionStatus.Ready,
            displayName = displayName,
            email = identity?.email ?: user?.email,
            accountStatus = status,
            roles = roles,
            availableModes = availableModes,
            activeMode = selectedMode,
            addressCount = user?.addresses.orEmpty().size,
            contractorApprovalStatus = user?.contractorProfile?.approvalStatus
        )
    }
}

class AccountSessionViewModelFactory(
    private val authSession: AccountAuthSession,
    private val accountApi: AccountApi,
    private val modeStore: AccountModeStore
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return AccountSessionViewModel(authSession, accountApi, modeStore) as T
    }
}
```

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

```bash
cd android
gradle testDebugUnitTest --tests lat.yavaa.android.feature.account.AccountSessionViewModelTest
```

Expected: PASS.

- [ ] **Step 6: Commit the ViewModel**

Run:

```bash
git add android/app/src/main/java/lat/yavaa/android/core/auth/YavaaAuthRepository.kt android/app/src/main/java/lat/yavaa/android/feature/account/AccountSessionViewModel.kt android/app/src/test/java/lat/yavaa/android/feature/account/MainDispatcherRule.kt android/app/src/test/java/lat/yavaa/android/feature/account/AccountSessionViewModelTest.kt
git commit -m "feat(android): add account session state"
```

---

### Task 4: Add Account, Client, And Contractor Shell UI

**Files:**
- Create: `android/app/src/main/java/lat/yavaa/android/feature/account/AccountScreen.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/feature/client/ClientModeScreen.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/feature/contractor/ContractorModeScreen.kt`
- Delete after replacement: `android/app/src/main/java/lat/yavaa/android/feature/home/HomeScreen.kt`
- Delete after replacement: `android/app/src/main/java/lat/yavaa/android/feature/home/HomeViewModel.kt`

- [ ] **Step 1: Write failing presentation helper tests**

Add this test file as `android/app/src/test/java/lat/yavaa/android/feature/account/AccountPresentationTest.kt`:

```kotlin
package lat.yavaa.android.feature.account

import org.junit.Assert.assertEquals
import org.junit.Test

class AccountPresentationTest {
    @Test
    fun `account title prefers display name over email`() {
        assertEquals("Ana", accountTitle(displayName = "Ana", email = "ana@yavaa.lat"))
    }

    @Test
    fun `account title falls back to email`() {
        assertEquals("ana@yavaa.lat", accountTitle(displayName = null, email = "ana@yavaa.lat"))
    }

    @Test
    fun `account title has deterministic fallback`() {
        assertEquals("Tu cuenta", accountTitle(displayName = null, email = null))
    }

    @Test
    fun `restricted status copy is Spanish and stable`() {
        assertEquals("Cuenta bloqueada", restrictedStatusTitle("BLOCKED"))
        assertEquals("Cuenta suspendida", restrictedStatusTitle("SUSPENDED"))
    }
}
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
cd android
gradle testDebugUnitTest --tests lat.yavaa.android.feature.account.AccountPresentationTest
```

Expected: FAIL because `accountTitle` and `restrictedStatusTitle` do not exist.

- [ ] **Step 3: Implement account presentation helpers and screen**

Create `AccountScreen.kt`:

```kotlin
package lat.yavaa.android.feature.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import lat.yavaa.android.feature.client.ClientModeScreen
import lat.yavaa.android.feature.contractor.ContractorModeScreen

fun accountTitle(displayName: String?, email: String?): String {
    return displayName?.takeIf { it.isNotBlank() }
        ?: email?.takeIf { it.isNotBlank() }
        ?: "Tu cuenta"
}

fun restrictedStatusTitle(status: String?): String {
    return when (status) {
        "BLOCKED" -> "Cuenta bloqueada"
        "SUSPENDED" -> "Cuenta suspendida"
        else -> "Cuenta restringida"
    }
}

@Composable
fun AccountScreen(
    viewModel: AccountSessionViewModel,
    onOpenDiscovery: () -> Unit
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.refreshAccount()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = accountTitle(state.displayName, state.email),
            style = MaterialTheme.typography.headlineMedium
        )

        AccountModeSwitch(
            state = state,
            onModeSelected = viewModel::switchMode
        )

        when (state.status) {
            AccountSessionStatus.Loading -> Text("Cargando cuenta")
            AccountSessionStatus.Error -> AccountMessage(
                title = "No se pudo cargar la cuenta",
                body = state.errorMessage.orEmpty(),
                primaryAction = "Reintentar",
                onPrimaryAction = viewModel::refreshAccount
            )
            AccountSessionStatus.MissingSession -> AccountMessage(
                title = "Sesion no disponible",
                body = "Volvé a ingresar para continuar.",
                primaryAction = "Salir",
                onPrimaryAction = viewModel::signOut
            )
            AccountSessionStatus.Restricted -> AccountMessage(
                title = restrictedStatusTitle(state.accountStatus),
                body = "No hay acciones operativas disponibles para esta cuenta.",
                primaryAction = "Salir",
                onPrimaryAction = viewModel::signOut
            )
            AccountSessionStatus.UnsupportedRole -> AccountMessage(
                title = "Cuenta sin modo disponible",
                body = "Esta cuenta no tiene rol cliente ni contratista para Android.",
                primaryAction = "Salir",
                onPrimaryAction = viewModel::signOut
            )
            AccountSessionStatus.Ready -> when (state.activeMode) {
                AccountMode.Client -> ClientModeScreen(
                    addressCount = state.addressCount,
                    onOpenDiscovery = onOpenDiscovery
                )
                AccountMode.Contractor -> ContractorModeScreen(
                    approvalStatus = state.contractorApprovalStatus
                )
                null -> Text("No hay modo activo disponible")
            }
        }

        Spacer(modifier = Modifier.weight(1f))
        OutlinedButton(
            onClick = viewModel::signOut,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Salir")
        }
    }
}

@Composable
private fun AccountModeSwitch(
    state: AccountSessionUiState,
    onModeSelected: (AccountMode) -> Unit
) {
    if (state.availableModes.size <= 1 || state.status == AccountSessionStatus.Restricted) {
        return
    }

    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        state.availableModes.forEach { mode ->
            FilterChip(
                selected = state.activeMode == mode,
                onClick = { onModeSelected(mode) },
                label = { Text(mode.label) }
            )
        }
    }
}

@Composable
private fun AccountMessage(
    title: String,
    body: String,
    primaryAction: String,
    onPrimaryAction: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(title, style = MaterialTheme.typography.titleLarge)
        if (body.isNotBlank()) {
            Text(body, style = MaterialTheme.typography.bodyMedium)
        }
        Button(onClick = onPrimaryAction) {
            Text(primaryAction)
        }
    }
}
```

- [ ] **Step 4: Implement client shell**

Create `ClientModeScreen.kt`:

```kotlin
package lat.yavaa.android.feature.client

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ClientModeScreen(
    addressCount: Int,
    onOpenDiscovery: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Modo cliente", style = MaterialTheme.typography.titleLarge)
        Button(
            onClick = onOpenDiscovery,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Buscar servicios")
        }
        Text("Pedidos: proximamente")
        Text("Direcciones: $addressCount")
        Text("Perfil: disponible desde cuenta")
    }
}
```

- [ ] **Step 5: Implement contractor shell**

Create `ContractorModeScreen.kt`:

```kotlin
package lat.yavaa.android.feature.contractor

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp

@Composable
fun ContractorModeScreen(
    approvalStatus: String?
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Modo contratista", style = MaterialTheme.typography.titleLarge)
        Text("Perfil contratista: ${approvalStatus ?: "sin perfil"}")
        Text("Solicitudes: proximamente")
        Text("Disponibilidad: proximamente")
        Text("Cuenta: disponible desde esta pantalla")
    }
}
```

- [ ] **Step 6: Run focused tests and verify they pass**

Run:

```bash
cd android
gradle testDebugUnitTest --tests lat.yavaa.android.feature.account.AccountPresentationTest
```

Expected: PASS.

- [ ] **Step 7: Delete the old technical home files**

Run:

```bash
rm android/app/src/main/java/lat/yavaa/android/feature/home/HomeScreen.kt
rm android/app/src/main/java/lat/yavaa/android/feature/home/HomeViewModel.kt
```

- [ ] **Step 8: Commit the UI shell**

Run:

```bash
git add android/app/src/main/java/lat/yavaa/android/feature/account/AccountScreen.kt android/app/src/main/java/lat/yavaa/android/feature/client/ClientModeScreen.kt android/app/src/main/java/lat/yavaa/android/feature/contractor/ContractorModeScreen.kt android/app/src/test/java/lat/yavaa/android/feature/account/AccountPresentationTest.kt android/app/src/main/java/lat/yavaa/android/feature/home/HomeScreen.kt android/app/src/main/java/lat/yavaa/android/feature/home/HomeViewModel.kt
git commit -m "feat(android): add account mode shells"
```

---

### Task 5: Wire Account Shell Into App Navigation

**Files:**
- Modify: `android/app/src/main/java/lat/yavaa/android/YavaaApplication.kt`
- Modify: `android/app/src/main/java/lat/yavaa/android/navigation/YavaaApp.kt`
- Modify: `android/app/src/test/java/lat/yavaa/android/navigation/YavaaAppNavigationTest.kt`

- [ ] **Step 1: Add container support for mode store**

Modify `YavaaApplication.kt` imports:

```kotlin
import lat.yavaa.android.feature.account.AccountModeStore
import lat.yavaa.android.feature.account.SharedPreferencesAccountModeStore
```

Modify `YavaaContainer.Ready`:

```kotlin
data class Ready(
    val config: YavaaConfig,
    val authRepository: YavaaAuthRepository,
    val apiClient: YavaaApiClient,
    val accountModeStore: AccountModeStore
) : YavaaContainer
```

Modify `create()` return:

```kotlin
return Ready(
    config = config,
    authRepository = YavaaAuthRepository(supabaseClient),
    apiClient = YavaaApiClient(config),
    accountModeStore = SharedPreferencesAccountModeStore(this)
)
```

- [ ] **Step 2: Write navigation label test for authenticated account**

Extend `YavaaAppNavigationTest.kt`:

```kotlin
@Test
fun `account route label remains stable for authenticated users`() {
    assertEquals("Tu cuenta", accountActionLabel(authenticated = true))
}
```

This may already be covered. Keep the test if the existing assertion is identical; do not duplicate it.

- [ ] **Step 3: Wire AccountScreen into YavaaApp**

Modify `YavaaApp.kt` imports by removing home imports and adding:

```kotlin
import lat.yavaa.android.feature.account.AccountScreen
import lat.yavaa.android.feature.account.AccountSessionViewModel
import lat.yavaa.android.feature.account.AccountSessionViewModelFactory
```

Replace the authenticated branch inside `YavaaRoute.Account`:

```kotlin
if (authenticated) {
    val accountSessionViewModel: AccountSessionViewModel = viewModel(
        factory = AccountSessionViewModelFactory(
            authSession = container.authRepository,
            accountApi = container.apiClient,
            modeStore = container.accountModeStore
        )
    )
    AccountScreen(
        viewModel = accountSessionViewModel,
        onOpenDiscovery = {
            route = YavaaRoute.Discovery
        }
    )
} else {
    val authViewModel: AuthViewModel = viewModel(
        factory = AuthViewModelFactory(authRepository = container.authRepository)
    )
    AuthScreen(viewModel = authViewModel)
}
```

Keep the existing back behavior from account to discovery.

- [ ] **Step 4: Run Android unit tests**

Run:

```bash
cd android
gradle testDebugUnitTest
```

Expected: PASS.

- [ ] **Step 5: Build debug APK**

Run:

```bash
cd android
gradle assembleDebug
```

Expected: BUILD SUCCESSFUL and APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

- [ ] **Step 6: Commit navigation wiring**

Run:

```bash
git add android/app/src/main/java/lat/yavaa/android/YavaaApplication.kt android/app/src/main/java/lat/yavaa/android/navigation/YavaaApp.kt android/app/src/test/java/lat/yavaa/android/navigation/YavaaAppNavigationTest.kt
git commit -m "feat(android): wire account mode navigation"
```

---

## Final Verification

- [ ] **Step 1: Run all Android unit tests**

```bash
cd android
gradle testDebugUnitTest
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 2: Build the debug APK**

```bash
cd android
gradle assembleDebug
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: Confirm worktree state**

```bash
git status --short
```

Expected: no uncommitted files unless the final executor intentionally leaves a summary-only change.

## Self-Review

- Spec coverage: The plan covers `/api/me`, local active mode, supported client/contractor roles, mode switching, separate client and contractor shells, restricted account states, missing role state, no admin/support navigation, and verification.
- Scope check: The plan does not add backend `activeMode`, migrations, booking creation, emergency creation, chat, payments, realtime, or admin mobile.
- Type consistency: `AccountMode`, `AccountModeStore`, `AccountSessionStatus`, `AccountSessionUiState`, `AccountSessionViewModel`, and `AccountSessionViewModelFactory` are introduced before use in navigation.
- Test strategy: Each behavior change starts with a focused failing JVM test before implementation, followed by full Android unit tests and debug APK build.
