# iPhone Login And Role Switch Action Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-shaped iPhone slice from login to active client/contractor mode switching, backed by `/api/me` and a documented mobile action map.

**Architecture:** The iPhone app stays a native SwiftUI client of the existing Yavaa website API. Supabase Auth produces the bearer token, Keychain stores it, `YavaaAPI` decodes the OpenAPI-backed `/api/me` response, and `YavaaCore` derives the available app modes from server-owned roles. The active mode is only a navigation and UI preference; all sensitive actions remain permission-checked by the server.

**Tech Stack:** SwiftUI, Swift Concurrency, Swift Package Manager, Supabase Swift Auth, Keychain Services, existing Next.js `/api/*` endpoints, OpenAPI contract verification.

---

## Current Context

- Current phase docs show web foundations through Etapa 04 are closed and Etapa 05 MVP admin work is complete.
- `docs/product/user-action-map.md` says one account can have multiple roles and the app must show different modes depending on the active role.
- `GET /api/me` already returns `appUser.roles`, `appUser.status`, `permissionContext.roles`, profile, addresses, and contractor profile data.
- `iphone/` already has SwiftPM modules: `YavaaApp`, `YavaaAPI`, `YavaaAuth`, `YavaaCore`, and `YavaaDesign`.
- Admin remains web-only for this mobile slice.

## File Structure

- Create: `iphone/Docs/action-map-login-role-switch.md`
  - Human-readable iPhone action map from guest login through client and contractor mode shells.
- Modify: `iphone/Package.swift`
  - Add Supabase Swift dependency to `YavaaAuth`.
- Modify: `iphone/Sources/YavaaCore/YavaaCore.swift`
  - Add account status, auth reason, account summary, active mode validation, and mode derivation.
- Modify: `iphone/Sources/YavaaAPI/YavaaAPI.swift`
  - Replace the minimal session response with a typed `/api/me` response that matches the OpenAPI contract.
- Modify: `iphone/Sources/YavaaAuth/YavaaAuth.swift`
  - Add Keychain token storage, auth service protocol, Supabase-backed sign-in/sign-up/sign-out, and session refresh.
- Create: `iphone/Sources/YavaaApp/Auth/LoginView.swift`
  - Email/password login UI.
- Create: `iphone/Sources/YavaaApp/Auth/SignUpView.swift`
  - Email/password account creation UI.
- Create: `iphone/Sources/YavaaApp/Mode/ModePickerView.swift`
  - Client/contractor active-mode switcher.
- Create: `iphone/Sources/YavaaApp/Actions/MobileActionMap.swift`
  - Declarative list of actions visible in each active mode.
- Create: `iphone/Sources/YavaaApp/Actions/ActionListView.swift`
  - SwiftUI rendering for the current mode action list.
- Modify: `iphone/Sources/YavaaApp/YavaaApp.swift`
  - Wire app state, auth flow, session bootstrap, mode selection, and action list shell.
- Modify: `iphone/Tests/YavaaCoreTests/AppModeTests.swift`
  - Cover mode derivation and invalid mode switching.
- Modify: `iphone/Tests/YavaaAPITests/APIClientTests.swift`
  - Cover `/api/me` decoding and bearer request creation.
- Create: `iphone/Tests/YavaaAuthTests/SessionControllerTests.swift`
  - Cover session refresh, sign-out clearing, and mode preservation.
- Create: `iphone/Tests/YavaaAppTests/MobileActionMapTests.swift`
  - Cover visible actions by mode and account status.

---

### Task 1: Document The iPhone Action Map Slice

**Files:**
- Create: `iphone/Docs/action-map-login-role-switch.md`

- [ ] **Step 1: Create the mobile action map document**

Add this content:

```markdown
# iPhone Action Map: Login And Role Switching

## Scope

This document defines the first native iPhone action map slice.

The slice starts at app launch, covers authentication, resolves the linked Yavaa account through `GET /api/me`, and then lets the user choose between client and contractor mode when both roles exist.

Admin and support remain web-only in this slice.

## Source Of Truth

- Roles come from the server through `GET /api/me`.
- Account status comes from the server through `GET /api/me`.
- The selected mobile mode is a local navigation preference.
- Server APIs must still validate every sensitive action.

## Guest State

Visible actions:

- Sign in
- Create account
- Recover account
- View public discovery entry point when exposed by the public API

Blocked actions:

- Create booking
- Create emergency request
- Chat
- Upload files
- Switch to contractor mode

## Authenticated Client Mode

Visible action groups:

- Search services
- View providers
- Manage addresses
- Create scheduled booking
- Create emergency request
- View booking status
- View booking history
- Open booking chat
- Upload booking files
- Confirm completion
- Report a problem
- View account status
- Switch to contractor mode when the contractor role exists

## Authenticated Contractor Mode

Visible action groups:

- Edit contractor profile
- Manage services
- Manage availability
- View incoming booking requests
- Accept or reject bookings
- Respond to emergency requests
- Open booking chat
- Upload booking files
- Mark booking progress
- View account status
- Switch to client mode

## Blocked Or Suspended Account

Visible actions:

- View account status
- Sign out
- Upload payment proof when the matching API is available

Hidden actions:

- Create bookings
- Accept bookings
- Respond to emergencies
- Send chat messages

## Initial Navigation

1. Launch app.
2. Load stored token from Keychain.
3. Call `GET /api/me`.
4. If unauthenticated, show auth tabs.
5. If authenticated with one mobile role, enter that mode.
6. If authenticated with client and contractor roles, restore the previous mode when still allowed.
7. If the restored mode is no longer allowed, default to client when available.
8. If no mobile role exists, show account status and sign out.

## Test IDs

- IOS-GUEST-AUTH-001: guest can open sign-in screen.
- IOS-GUEST-AUTH-002: successful login stores the token and resolves `/api/me`.
- IOS-GUEST-AUTH-003: failed login shows an error and does not enter the app.
- IOS-CLIENT-MODE-001: client-only account enters client mode.
- IOS-CONTRACTOR-MODE-001: contractor-only account enters contractor mode.
- IOS-MODE-SWITCH-001: dual-role account can switch from client to contractor mode.
- IOS-MODE-SWITCH-002: client-only account cannot switch to contractor mode.
- IOS-STATUS-001: blocked or suspended account does not show booking or emergency actions.
```

- [ ] **Step 2: Commit**

```bash
git add iphone/Docs/action-map-login-role-switch.md
git commit -m "docs: define iphone login role switch action map"
```

---

### Task 2: Expand Core Session And Mode Types

**Files:**
- Modify: `iphone/Tests/YavaaCoreTests/AppModeTests.swift`
- Modify: `iphone/Sources/YavaaCore/YavaaCore.swift`

- [ ] **Step 1: Write failing core tests**

Replace `iphone/Tests/YavaaCoreTests/AppModeTests.swift` with:

```swift
import XCTest
@testable import YavaaCore

final class AppModeTests: XCTestCase {
    func testDefaultsToClientMode() {
        XCTAssertEqual(AppMode.default, .client)
    }

    func testDerivesClientModeForClientRole() {
        let account = AccountSummary(
            id: "user_001",
            email: "client@yavaa.test",
            status: .active,
            roles: [.client]
        )

        XCTAssertEqual(account.availableModes, [.client])
        XCTAssertEqual(SessionState.authenticated(account: account).mode, .client)
    }

    func testDerivesContractorModeForContractorRole() {
        let account = AccountSummary(
            id: "user_002",
            email: "contractor@yavaa.test",
            status: .active,
            roles: [.contractor]
        )

        XCTAssertEqual(account.availableModes, [.contractor])
        XCTAssertEqual(SessionState.authenticated(account: account).mode, .contractor)
    }

    func testDerivesBothMobileModesForDualRoleAccount() {
        let account = AccountSummary(
            id: "user_003",
            email: "dual@yavaa.test",
            status: .active,
            roles: [.client, .contractor, .admin]
        )

        XCTAssertEqual(account.availableModes, [.client, .contractor])
    }

    func testRejectsUnavailableModeSelection() {
        let account = AccountSummary(
            id: "user_004",
            email: "client-only@yavaa.test",
            status: .active,
            roles: [.client]
        )
        let session = SessionState.authenticated(account: account)

        XCTAssertThrowsError(try session.selectingMode(.contractor)) { error in
            XCTAssertEqual(error as? SessionState.ModeSelectionError, .modeUnavailable)
        }
    }

    func testBlockedAccountCannotUseWorkModes() {
        let account = AccountSummary(
            id: "user_005",
            email: "blocked@yavaa.test",
            status: .blocked,
            roles: [.client, .contractor]
        )

        XCTAssertEqual(account.availableModes, [])
        XCTAssertEqual(SessionState.authenticated(account: account).mode, nil)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd iphone && swift test --filter YavaaCoreTests.AppModeTests
```

Expected: FAIL because `AccountSummary`, `UserStatus`, optional `SessionState.mode`, and `selectingMode(_:)` are not defined yet.

- [ ] **Step 3: Implement core session types**

Update `iphone/Sources/YavaaCore/YavaaCore.swift` to:

```swift
public enum AppMode: String, Codable, CaseIterable, Equatable, Sendable {
    case client
    case contractor

    public static let `default`: AppMode = .client
}

public enum AppRole: String, Codable, CaseIterable, Equatable, Sendable {
    case client
    case contractor
    case admin
    case support
}

public enum UserStatus: String, Codable, Equatable, Sendable {
    case active = "ACTIVE"
    case suspended = "SUSPENDED"
    case blocked = "BLOCKED"
}

public enum AuthFailureReason: String, Codable, Equatable, Sendable {
    case missingToken = "missing-token"
    case supabaseNotConfigured = "supabase-not-configured"
    case invalidToken = "invalid-token"
}

public struct UserIdentity: Codable, Equatable, Sendable {
    public let id: String
    public let email: String?

    public init(id: String, email: String?) {
        self.id = id
        self.email = email
    }
}

public struct AccountSummary: Codable, Equatable, Sendable {
    public let id: String
    public let email: String
    public let status: UserStatus
    public let roles: [AppRole]

    public init(
        id: String,
        email: String,
        status: UserStatus,
        roles: [AppRole]
    ) {
        self.id = id
        self.email = email
        self.status = status
        self.roles = roles
    }

    public var availableModes: [AppMode] {
        guard status == .active else {
            return []
        }

        var modes: [AppMode] = []

        if roles.contains(.client) {
            modes.append(.client)
        }

        if roles.contains(.contractor) {
            modes.append(.contractor)
        }

        return modes
    }
}

public struct SessionState: Equatable, Sendable {
    public enum ModeSelectionError: Error, Equatable, Sendable {
        case unauthenticated
        case modeUnavailable
    }

    public let isAuthenticated: Bool
    public let identity: UserIdentity?
    public let account: AccountSummary?
    public let mode: AppMode?
    public let reason: AuthFailureReason?

    public init(
        isAuthenticated: Bool,
        identity: UserIdentity? = nil,
        account: AccountSummary? = nil,
        mode: AppMode? = nil,
        reason: AuthFailureReason? = nil
    ) {
        self.isAuthenticated = isAuthenticated
        self.identity = identity
        self.account = account
        self.mode = mode
        self.reason = reason
    }

    public static let signedOut = SessionState(isAuthenticated: false)

    public static func authenticated(
        identity: UserIdentity? = nil,
        account: AccountSummary,
        preferredMode: AppMode? = nil
    ) -> SessionState {
        let modes = account.availableModes
        let selectedMode = preferredMode.flatMap { modes.contains($0) ? $0 : nil } ?? modes.first

        return SessionState(
            isAuthenticated: true,
            identity: identity,
            account: account,
            mode: selectedMode,
            reason: nil
        )
    }

    public func selectingMode(_ nextMode: AppMode) throws -> SessionState {
        guard isAuthenticated, let account else {
            throw ModeSelectionError.unauthenticated
        }

        guard account.availableModes.contains(nextMode) else {
            throw ModeSelectionError.modeUnavailable
        }

        return SessionState(
            isAuthenticated: true,
            identity: identity,
            account: account,
            mode: nextMode,
            reason: nil
        )
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd iphone && swift test --filter YavaaCoreTests.AppModeTests
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add iphone/Sources/YavaaCore/YavaaCore.swift iphone/Tests/YavaaCoreTests/AppModeTests.swift
git commit -m "feat: model iphone session modes"
```

---

### Task 3: Decode The Full `/api/me` Contract

**Files:**
- Modify: `iphone/Tests/YavaaAPITests/APIClientTests.swift`
- Modify: `iphone/Sources/YavaaAPI/YavaaAPI.swift`

- [ ] **Step 1: Write failing API decoding test**

Append this test to `APIClientTests`:

```swift
func testDecodesAuthenticatedMeResponseWithRoles() throws {
    let json = """
    {
      "authenticated": true,
      "configured": true,
      "reason": null,
      "identity": {
        "id": "supabase_001",
        "email": "dual@yavaa.test"
      },
      "matchedBy": "supabase_auth_id",
      "permissionContext": {
        "userId": "user_001",
        "status": "ACTIVE",
        "roles": ["client", "contractor"]
      },
      "appUser": {
        "id": "user_001",
        "email": "dual@yavaa.test",
        "displayName": "Dual User",
        "status": "ACTIVE",
        "roles": ["client", "contractor"],
        "profile": null,
        "addresses": [],
        "contractorProfile": null
      }
    }
    """.data(using: .utf8)!

    let decoder = JSONDecoder()
    let response = try decoder.decode(WebsiteMeResponse.self, from: json)

    XCTAssertTrue(response.authenticated)
    XCTAssertEqual(response.identity?.id, "supabase_001")
    XCTAssertEqual(response.appUser?.roles, [.client, .contractor])
    XCTAssertEqual(response.toSessionState().mode, .client)
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd iphone && swift test --filter YavaaAPITests.APIClientTests/testDecodesAuthenticatedMeResponseWithRoles
```

Expected: FAIL because `WebsiteMeResponse`, role decoding, and `toSessionState()` are not defined.

- [ ] **Step 3: Add `/api/me` response models**

In `iphone/Sources/YavaaAPI/YavaaAPI.swift`, import `YavaaCore` and replace `WebsiteSessionResponse` with:

```swift
import Foundation
import YavaaCore

public struct WebsiteMeResponse: Decodable, Equatable, Sendable {
    public let authenticated: Bool
    public let configured: Bool
    public let reason: AuthFailureReason?
    public let identity: UserIdentity?
    public let appUser: WebsiteAppUser?
    public let matchedBy: String?
    public let permissionContext: WebsitePermissionContext?

    public func toSessionState(preferredMode: AppMode? = nil) -> SessionState {
        guard authenticated, let appUser else {
            return SessionState(
                isAuthenticated: false,
                identity: identity,
                reason: reason
            )
        }

        let account = AccountSummary(
            id: appUser.id,
            email: appUser.email,
            status: appUser.status,
            roles: appUser.roles
        )

        return SessionState.authenticated(
            identity: identity,
            account: account,
            preferredMode: preferredMode
        )
    }
}

public struct WebsitePermissionContext: Decodable, Equatable, Sendable {
    public let userId: String
    public let status: UserStatus
    public let roles: [AppRole]
}

public struct WebsiteAppUser: Decodable, Equatable, Sendable {
    public let id: String
    public let email: String
    public let displayName: String?
    public let status: UserStatus
    public let roles: [AppRole]
    public let profile: WebsiteProfile?
    public let addresses: [WebsiteAddress]
    public let contractorProfile: WebsiteContractorProfile?
}

public struct WebsiteProfile: Decodable, Equatable, Sendable {
    public let firstName: String?
    public let lastName: String?
    public let avatarUrl: String?
    public let phone: String?
    public let bio: String?
}

public struct WebsiteAddress: Decodable, Equatable, Sendable {
    public let id: String
    public let label: String
    public let line1: String
    public let line2: String?
    public let city: String
    public let province: String
    public let postalCode: String?
    public let notes: String?
    public let type: String
    public let isDefault: Bool
}

public struct WebsiteContractorProfile: Decodable, Equatable, Sendable {
    public let id: String
    public let approvalStatus: String
    public let acceptsEmergencies: Bool
    public let dniNumber: String?
    public let dniFrontUrl: String?
    public let dniBackUrl: String?
    public let profilePhotoUrl: String?
    public let reviewNotes: String?
    public let submittedAt: String?
    public let reviewedAt: String?
    public let reviewedByUserId: String?
    public let addressId: String?
}
```

Update the API client method:

```swift
public func fetchCurrentSession() async throws -> WebsiteMeResponse {
    try await send(APIRequest(path: "/api/me", method: .get))
}
```

- [ ] **Step 4: Run API tests**

Run:

```bash
cd iphone && swift test --filter YavaaAPITests.APIClientTests
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add iphone/Sources/YavaaAPI/YavaaAPI.swift iphone/Tests/YavaaAPITests/APIClientTests.swift
git commit -m "feat: decode iphone me contract"
```

---

### Task 4: Add Auth Service And Persistent Token Storage

**Files:**
- Modify: `iphone/Package.swift`
- Modify: `iphone/Sources/YavaaAuth/YavaaAuth.swift`
- Create: `iphone/Tests/YavaaAuthTests/SessionControllerTests.swift`

- [ ] **Step 1: Add test target and Supabase Auth dependency**

Update `iphone/Package.swift` so the package dependencies and targets include:

```swift
dependencies: [
    .package(url: "https://github.com/supabase/supabase-swift.git", from: "2.0.0")
],
```

Update `YavaaAuth` target:

```swift
.target(
    name: "YavaaAuth",
    dependencies: [
        "YavaaAPI",
        "YavaaCore",
        .product(name: "Supabase", package: "supabase-swift")
    ]
),
```

Add auth tests:

```swift
.testTarget(name: "YavaaAuthTests", dependencies: ["YavaaAuth", "YavaaAPI", "YavaaCore"]),
```

- [ ] **Step 2: Write failing session controller tests**

Create `iphone/Tests/YavaaAuthTests/SessionControllerTests.swift`:

```swift
import XCTest
import YavaaCore
@testable import YavaaAPI
@testable import YavaaAuth

private actor StubTokenStore: SessionTokenStore {
    var token: String?

    init(token: String? = nil) {
        self.token = token
    }

    func loadAccessToken() async throws -> String? {
        token
    }

    func saveAccessToken(_ token: String) async throws {
        self.token = token
    }

    func clearAccessToken() async throws {
        token = nil
    }
}

final class SessionControllerTests: XCTestCase {
    func testSignOutClearsStoredTokenAndSession() async throws {
        let store = StubTokenStore(token: "access-token")
        let controller = SessionController(
            apiClient: APIClient(),
            tokenStore: store,
            preferredModeStore: InMemoryPreferredModeStore()
        )

        let state = try await controller.signOut()

        XCTAssertFalse(state.isAuthenticated)
        XCTAssertNil(try await store.loadAccessToken())
    }

    func testPreferredModeStorePersistsValidMode() async throws {
        let store = InMemoryPreferredModeStore()

        try await store.savePreferredMode(.contractor)

        XCTAssertEqual(try await store.loadPreferredMode(), .contractor)
    }
}
```

- [ ] **Step 3: Run auth tests to verify they fail**

Run:

```bash
cd iphone && swift test --filter YavaaAuthTests.SessionControllerTests
```

Expected: FAIL because `SessionController` does not accept `tokenStore`, sign-out is not implemented, and preferred mode storage is not defined.

- [ ] **Step 4: Implement auth protocols and stores**

Add to `iphone/Sources/YavaaAuth/YavaaAuth.swift`:

```swift
import Foundation
import Security
import Supabase
import YavaaAPI
import YavaaCore

public protocol PreferredModeStore: Sendable {
    func loadPreferredMode() async throws -> AppMode?
    func savePreferredMode(_ mode: AppMode) async throws
    func clearPreferredMode() async throws
}

public actor InMemoryPreferredModeStore: PreferredModeStore {
    private var mode: AppMode?

    public init(mode: AppMode? = nil) {
        self.mode = mode
    }

    public func loadPreferredMode() async throws -> AppMode? {
        mode
    }

    public func savePreferredMode(_ mode: AppMode) async throws {
        self.mode = mode
    }

    public func clearPreferredMode() async throws {
        mode = nil
    }
}

public enum AuthServiceError: Error, Equatable, Sendable {
    case missingAccessToken
}

public protocol AuthenticationService: Sendable {
    func signIn(email: String, password: String) async throws -> String
    func signUp(email: String, password: String) async throws -> String
    func signOut() async throws
}

public final class SupabaseAuthenticationService: AuthenticationService, @unchecked Sendable {
    private let client: SupabaseClient

    public init(url: URL, publishableKey: String) {
        self.client = SupabaseClient(supabaseURL: url, supabaseKey: publishableKey)
    }

    public func signIn(email: String, password: String) async throws -> String {
        let session = try await client.auth.signIn(email: email, password: password)
        return session.accessToken
    }

    public func signUp(email: String, password: String) async throws -> String {
        let response = try await client.auth.signUp(email: email, password: password)

        guard let accessToken = response.session?.accessToken else {
            throw AuthServiceError.missingAccessToken
        }

        return accessToken
    }

    public func signOut() async throws {
        try await client.auth.signOut()
    }
}
```

Update `SessionController`:

```swift
public actor SessionController {
    private let apiClient: APIClient
    private let tokenStore: SessionTokenStore
    private let preferredModeStore: PreferredModeStore
    private let authService: AuthenticationService?

    public init(
        apiClient: APIClient,
        tokenStore: SessionTokenStore,
        preferredModeStore: PreferredModeStore,
        authService: AuthenticationService? = nil
    ) {
        self.apiClient = apiClient
        self.tokenStore = tokenStore
        self.preferredModeStore = preferredModeStore
        self.authService = authService
    }

    public func refreshSession() async -> SessionState {
        do {
            let preferredMode = try await preferredModeStore.loadPreferredMode()
            let response = try await apiClient.fetchCurrentSession()
            return response.toSessionState(preferredMode: preferredMode)
        } catch {
            return .signedOut
        }
    }

    public func signIn(email: String, password: String) async throws -> SessionState {
        guard let authService else {
            throw AuthServiceError.missingAccessToken
        }

        let accessToken = try await authService.signIn(email: email, password: password)
        try await tokenStore.saveAccessToken(accessToken)
        return await refreshSession()
    }

    public func signUp(email: String, password: String) async throws -> SessionState {
        guard let authService else {
            throw AuthServiceError.missingAccessToken
        }

        let accessToken = try await authService.signUp(email: email, password: password)
        try await tokenStore.saveAccessToken(accessToken)
        return await refreshSession()
    }

    public func selectMode(_ mode: AppMode, currentSession: SessionState) async throws -> SessionState {
        let nextState = try currentSession.selectingMode(mode)
        try await preferredModeStore.savePreferredMode(mode)
        return nextState
    }

    public func signOut() async throws -> SessionState {
        try await authService?.signOut()
        try await tokenStore.clearAccessToken()
        try await preferredModeStore.clearPreferredMode()
        return .signedOut
    }
}
```

- [ ] **Step 5: Run auth tests**

Run:

```bash
cd iphone && swift test --filter YavaaAuthTests.SessionControllerTests
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add iphone/Package.swift iphone/Sources/YavaaAuth/YavaaAuth.swift iphone/Tests/YavaaAuthTests/SessionControllerTests.swift
git commit -m "feat: add iphone auth session services"
```

---

### Task 5: Build Login And Sign-Up Views

**Files:**
- Create: `iphone/Sources/YavaaApp/Auth/LoginView.swift`
- Create: `iphone/Sources/YavaaApp/Auth/SignUpView.swift`
- Modify: `iphone/Sources/YavaaApp/YavaaApp.swift`

- [ ] **Step 1: Create login view**

Create `iphone/Sources/YavaaApp/Auth/LoginView.swift`:

```swift
import SwiftUI
import YavaaDesign

public struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    private let onSubmit: @Sendable (String, String) async throws -> Void

    public init(onSubmit: @escaping @Sendable (String, String) async throws -> Void) {
        self.onSubmit = onSubmit
    }

    public var body: some View {
        Form {
            Section {
                TextField("Email", text: $email)
                    .textContentType(.username)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)

                SecureField("Password", text: $password)
                    .textContentType(.password)
            }

            if let errorMessage {
                Section {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }

            Section {
                Button(isSubmitting ? "Ingresando..." : "Ingresar") {
                    Task {
                        await submit()
                    }
                }
                .disabled(isSubmitting || email.isEmpty || password.isEmpty)
            }
        }
        .navigationTitle("Ingresar")
    }

    private func submit() async {
        isSubmitting = true
        errorMessage = nil

        do {
            try await onSubmit(email, password)
        } catch {
            errorMessage = "No pudimos iniciar sesion con esos datos."
        }

        isSubmitting = false
    }
}
```

- [ ] **Step 2: Create sign-up view**

Create `iphone/Sources/YavaaApp/Auth/SignUpView.swift`:

```swift
import SwiftUI

public struct SignUpView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    private let onSubmit: @Sendable (String, String) async throws -> Void

    public init(onSubmit: @escaping @Sendable (String, String) async throws -> Void) {
        self.onSubmit = onSubmit
    }

    public var body: some View {
        Form {
            Section {
                TextField("Email", text: $email)
                    .textContentType(.newUsername)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)

                SecureField("Password", text: $password)
                    .textContentType(.newPassword)
            }

            if let errorMessage {
                Section {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }

            Section {
                Button(isSubmitting ? "Creando cuenta..." : "Crear cuenta") {
                    Task {
                        await submit()
                    }
                }
                .disabled(isSubmitting || email.isEmpty || password.count < 6)
            }
        }
        .navigationTitle("Crear cuenta")
    }

    private func submit() async {
        isSubmitting = true
        errorMessage = nil

        do {
            try await onSubmit(email, password)
        } catch {
            errorMessage = "No pudimos crear la cuenta."
        }

        isSubmitting = false
    }
}
```

- [ ] **Step 3: Wire auth actions into `AppContainer`**

Add to `AppContainer`:

```swift
public func signIn(email: String, password: String) async throws {
    sessionState = try await sessionController.signIn(email: email, password: password)
}

public func signUp(email: String, password: String) async throws {
    sessionState = try await sessionController.signUp(email: email, password: password)
}

public func signOut() async {
    do {
        sessionState = try await sessionController.signOut()
    } catch {
        sessionState = .signedOut
    }
}
```

- [ ] **Step 4: Replace unauthenticated root content**

In `YavaaRootView`, show auth tabs when `container.sessionState.isAuthenticated == false`:

```swift
TabView {
    LoginView { email, password in
        try await container.signIn(email: email, password: password)
    }
    .tabItem {
        Label("Ingresar", systemImage: "person.crop.circle")
    }

    SignUpView { email, password in
        try await container.signUp(email: email, password: password)
    }
    .tabItem {
        Label("Crear", systemImage: "person.badge.plus")
    }
}
```

- [ ] **Step 5: Run build**

Run:

```bash
cd iphone && swift build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add iphone/Sources/YavaaApp/YavaaApp.swift iphone/Sources/YavaaApp/Auth/LoginView.swift iphone/Sources/YavaaApp/Auth/SignUpView.swift
git commit -m "feat: add iphone auth screens"
```

---

### Task 6: Add Active Mode Switcher

**Files:**
- Create: `iphone/Sources/YavaaApp/Mode/ModePickerView.swift`
- Modify: `iphone/Sources/YavaaApp/YavaaApp.swift`

- [ ] **Step 1: Create mode picker view**

Create `iphone/Sources/YavaaApp/Mode/ModePickerView.swift`:

```swift
import SwiftUI
import YavaaCore

public struct ModePickerView: View {
    public let modes: [AppMode]
    @Binding public var selectedMode: AppMode?
    public let onSelect: @Sendable (AppMode) async -> Void

    public init(
        modes: [AppMode],
        selectedMode: Binding<AppMode?>,
        onSelect: @escaping @Sendable (AppMode) async -> Void
    ) {
        self.modes = modes
        self._selectedMode = selectedMode
        self.onSelect = onSelect
    }

    public var body: some View {
        Picker("Modo", selection: $selectedMode) {
            ForEach(modes, id: \.self) { mode in
                Text(title(for: mode)).tag(Optional(mode))
            }
        }
        .pickerStyle(.segmented)
        .onChange(of: selectedMode) { _, nextMode in
            guard let nextMode else {
                return
            }

            Task {
                await onSelect(nextMode)
            }
        }
    }

    private func title(for mode: AppMode) -> String {
        switch mode {
        case .client:
            return "Cliente"
        case .contractor:
            return "Contratista"
        }
    }
}
```

- [ ] **Step 2: Add mode selection to `AppContainer`**

Add:

```swift
public func selectMode(_ mode: AppMode) async {
    do {
        sessionState = try await sessionController.selectMode(mode, currentSession: sessionState)
    } catch {
        sessionState = await sessionController.refreshSession()
    }
}
```

- [ ] **Step 3: Render picker only for available modes**

In the authenticated root UI:

```swift
if let account = container.sessionState.account, account.availableModes.count > 1 {
    ModePickerView(
        modes: account.availableModes,
        selectedMode: Binding(
            get: { container.sessionState.mode },
            set: { nextMode in
                guard let nextMode else {
                    return
                }

                Task {
                    await container.selectMode(nextMode)
                }
            }
        )
    ) { mode in
        await container.selectMode(mode)
    }
}
```

- [ ] **Step 4: Run build**

Run:

```bash
cd iphone && swift build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add iphone/Sources/YavaaApp/YavaaApp.swift iphone/Sources/YavaaApp/Mode/ModePickerView.swift
git commit -m "feat: add iphone role mode switcher"
```

---

### Task 7: Add The Action Map Shell

**Files:**
- Create: `iphone/Sources/YavaaApp/Actions/MobileActionMap.swift`
- Create: `iphone/Sources/YavaaApp/Actions/ActionListView.swift`
- Create: `iphone/Tests/YavaaAppTests/MobileActionMapTests.swift`
- Modify: `iphone/Package.swift`
- Modify: `iphone/Sources/YavaaApp/YavaaApp.swift`

- [ ] **Step 1: Add app test target**

Update `iphone/Package.swift`:

```swift
.testTarget(name: "YavaaAppTests", dependencies: ["YavaaApp", "YavaaCore"]),
```

- [ ] **Step 2: Write failing action map tests**

Create `iphone/Tests/YavaaAppTests/MobileActionMapTests.swift`:

```swift
import XCTest
import YavaaCore
@testable import YavaaApp

final class MobileActionMapTests: XCTestCase {
    func testClientModeShowsClientActionsOnly() {
        let actions = MobileActionMap.actions(for: .client, accountStatus: .active)

        XCTAssertTrue(actions.contains(.searchServices))
        XCTAssertTrue(actions.contains(.createEmergencyRequest))
        XCTAssertFalse(actions.contains(.incomingBookingRequests))
    }

    func testContractorModeShowsContractorActionsOnly() {
        let actions = MobileActionMap.actions(for: .contractor, accountStatus: .active)

        XCTAssertTrue(actions.contains(.incomingBookingRequests))
        XCTAssertTrue(actions.contains(.respondToEmergencyRequests))
        XCTAssertFalse(actions.contains(.createScheduledBooking))
    }

    func testBlockedAccountShowsOnlySafeActions() {
        let actions = MobileActionMap.actions(for: .client, accountStatus: .blocked)

        XCTAssertEqual(actions, [.viewAccountStatus, .signOut])
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
cd iphone && swift test --filter YavaaAppTests.MobileActionMapTests
```

Expected: FAIL because `MobileActionMap` and mobile action cases do not exist.

- [ ] **Step 4: Implement action map**

Create `iphone/Sources/YavaaApp/Actions/MobileActionMap.swift`:

```swift
import YavaaCore

public enum MobileAction: String, CaseIterable, Equatable, Sendable {
    case searchServices
    case viewProviders
    case manageAddresses
    case createScheduledBooking
    case createEmergencyRequest
    case viewBookingStatus
    case viewBookingHistory
    case openBookingChat
    case uploadBookingFiles
    case confirmCompletion
    case reportProblem
    case editContractorProfile
    case manageServices
    case manageAvailability
    case incomingBookingRequests
    case respondToEmergencyRequests
    case markBookingProgress
    case viewAccountStatus
    case signOut

    public var title: String {
        switch self {
        case .searchServices:
            return "Buscar servicios"
        case .viewProviders:
            return "Ver proveedores"
        case .manageAddresses:
            return "Direcciones"
        case .createScheduledBooking:
            return "Reservar"
        case .createEmergencyRequest:
            return "Emergencia"
        case .viewBookingStatus:
            return "Estado de reservas"
        case .viewBookingHistory:
            return "Historial"
        case .openBookingChat:
            return "Chat"
        case .uploadBookingFiles:
            return "Archivos"
        case .confirmCompletion:
            return "Confirmar trabajo"
        case .reportProblem:
            return "Reportar problema"
        case .editContractorProfile:
            return "Perfil contratista"
        case .manageServices:
            return "Servicios"
        case .manageAvailability:
            return "Disponibilidad"
        case .incomingBookingRequests:
            return "Solicitudes"
        case .respondToEmergencyRequests:
            return "Urgencias"
        case .markBookingProgress:
            return "Avance del trabajo"
        case .viewAccountStatus:
            return "Estado de cuenta"
        case .signOut:
            return "Salir"
        }
    }
}

public enum MobileActionMap {
    public static func actions(for mode: AppMode, accountStatus: UserStatus) -> [MobileAction] {
        guard accountStatus == .active else {
            return [.viewAccountStatus, .signOut]
        }

        switch mode {
        case .client:
            return [
                .searchServices,
                .viewProviders,
                .manageAddresses,
                .createScheduledBooking,
                .createEmergencyRequest,
                .viewBookingStatus,
                .viewBookingHistory,
                .openBookingChat,
                .uploadBookingFiles,
                .confirmCompletion,
                .reportProblem,
                .viewAccountStatus,
                .signOut
            ]
        case .contractor:
            return [
                .editContractorProfile,
                .manageServices,
                .manageAvailability,
                .incomingBookingRequests,
                .respondToEmergencyRequests,
                .openBookingChat,
                .uploadBookingFiles,
                .markBookingProgress,
                .viewAccountStatus,
                .signOut
            ]
        }
    }
}
```

- [ ] **Step 5: Render action list**

Create `iphone/Sources/YavaaApp/Actions/ActionListView.swift`:

```swift
import SwiftUI

public struct ActionListView: View {
    public let actions: [MobileAction]
    public let onSelect: (MobileAction) -> Void

    public init(actions: [MobileAction], onSelect: @escaping (MobileAction) -> Void) {
        self.actions = actions
        self.onSelect = onSelect
    }

    public var body: some View {
        List(actions, id: \.self) { action in
            Button {
                onSelect(action)
            } label: {
                Text(action.title)
            }
        }
    }
}
```

In `YavaaRootView`, render:

```swift
if let mode = container.sessionState.mode,
   let account = container.sessionState.account {
    ActionListView(
        actions: MobileActionMap.actions(for: mode, accountStatus: account.status)
    ) { action in
        if action == .signOut {
            Task {
                await container.signOut()
            }
        }
    }
}
```

- [ ] **Step 6: Run app tests and build**

Run:

```bash
cd iphone && swift test --filter YavaaAppTests.MobileActionMapTests
cd iphone && swift build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add iphone/Package.swift iphone/Sources/YavaaApp iphone/Tests/YavaaAppTests/MobileActionMapTests.swift
git commit -m "feat: add iphone mobile action map shell"
```

---

### Task 8: Verify Contract And Permissions Assumptions

**Files:**
- Modify: `iphone/README.md`

- [ ] **Step 1: Update iPhone README with the first slice status**

Add this section below `## Estado actual`:

```markdown
## Primer corte funcional planificado

El primer corte funcional de iPhone cubre:

- login con Supabase Auth
- sesion persistente en Keychain
- resolucion de cuenta con `GET /api/me`
- derivacion local de modos mobile desde roles del servidor
- cambio entre cliente y contratista cuando ambos roles existen
- action map inicial por modo

El modo activo no otorga permisos. Solo decide la navegacion visible. Los endpoints del website siguen validando rol, estado, ownership y relaciones server-side.
```

- [ ] **Step 2: Run local verification**

Run:

```bash
cd iphone && swift build
cd iphone && swift test
npm run openapi:generate
npm run test -- tests/openapi.test.ts
```

Expected:

- `swift build` passes.
- `swift test` passes on a machine whose Swift/Xcode toolchain exposes XCTest to SwiftPM.
- `npm run openapi:generate` leaves `public/openapi.json` consistent with `src/lib/openapi.ts`.
- `npm run test -- tests/openapi.test.ts` passes.

- [ ] **Step 3: Commit**

```bash
git add iphone/README.md public/openapi.json
git commit -m "docs: record iphone auth action map status"
```

---

## Execution Notes

- Keep backend permissions unchanged unless an iPhone flow exposes a missing API contract.
- Do not add mobile-only permission assumptions.
- Do not expose admin or support workspaces in iPhone.
- Do not build full discovery, bookings, chat, or uploads inside this slice; this slice exposes their action entries and prepares navigation boundaries.
- If Supabase sign-up returns no session because email confirmation is enabled, keep the user in the guest auth flow and show a confirmation-required message instead of entering the app.

## Self-Review

- Spec coverage: Login, account creation, session persistence, `/api/me`, role-derived mode selection, client/contractor switching, blocked account behavior, and action-map shell are covered.
- Placeholder scan: The plan uses concrete file paths, commands, expected outcomes, and code snippets for every code-changing task.
- Type consistency: `AppMode`, `AppRole`, `UserStatus`, `AccountSummary`, `SessionState`, `WebsiteMeResponse`, and `MobileActionMap` are introduced before later tasks use them.
